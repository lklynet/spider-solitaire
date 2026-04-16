import { randomUUID } from 'node:crypto';
import { pool } from './db.js';

interface TimeZoneParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface ChallengeWindowConfig {
  timeZone: string;
  openHour: number;
  durationHours: number;
  rulesVersion: string;
}

const placementPoints = [100, 80, 65, 54, 46, 40, 35, 30, 26, 22, 18, 15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 2, 1, 1, 1];

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string) => {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    );
  }

  return formatterCache.get(timeZone)!;
};

const getTimeZoneParts = (date: Date, timeZone: string): TimeZoneParts => {
  const parts = getFormatter(timeZone).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second')
  };
};

const toUtcFromTimeZoneParts = (parts: TimeZoneParts, timeZone: string) => {
  let timestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  for (let index = 0; index < 3; index += 1) {
    const actual = getTimeZoneParts(new Date(timestamp), timeZone);
    const expectedTimestamp = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    const actualTimestamp = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    timestamp += expectedTimestamp - actualTimestamp;
  }

  return new Date(timestamp);
};

const formatDateKey = (parts: Pick<TimeZoneParts, 'year' | 'month' | 'day'>) =>
  `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;

const addDays = (dateKey: string, days: number) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateKey({
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate()
  });
};

const createWindowForDate = (dateKey: string, config: ChallengeWindowConfig) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const opensAt = toUtcFromTimeZoneParts(
    {
      year,
      month,
      day,
      hour: config.openHour,
      minute: 0,
      second: 0
    },
    config.timeZone
  );

  return {
    opensAt,
    closesAt: new Date(opensAt.getTime() + config.durationHours * 60 * 60 * 1000)
  };
};

const getDerivedStatus = (window: { opensAt: Date; closesAt: Date }, now = new Date()) => {
  if (now < window.opensAt) return 'scheduled';
  if (now < window.closesAt) return 'open';
  return 'closed';
};

const ensureChallengeForDate = async (dateKey: string, config: ChallengeWindowConfig) => {
  const window = createWindowForDate(dateKey, config);
  const status = getDerivedStatus(window);

  await pool.query(
    `insert into daily_challenges
      (id, challenge_date, timezone, opens_at, closes_at, seed, rules_version, status)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (challenge_date) do update
     set timezone = excluded.timezone,
         opens_at = excluded.opens_at,
         closes_at = excluded.closes_at,
         seed = excluded.seed,
         rules_version = excluded.rules_version,
         status = case
           when daily_challenges.status = 'finalized' then daily_challenges.status
           else excluded.status
         end,
         updated_at = now()`,
    [
      randomUUID(),
      dateKey,
      config.timeZone,
      window.opensAt,
      window.closesAt,
      dateKey,
      config.rulesVersion,
      status
    ]
  );
};

export const syncChallengeSchedule = async (config: ChallengeWindowConfig) => {
  const now = new Date();
  const today = formatDateKey(getTimeZoneParts(now, config.timeZone));
  const tomorrow = addDays(today, 1);

  await ensureChallengeForDate(today, config);
  await ensureChallengeForDate(tomorrow, config);

  const result = await pool.query(
    `update daily_challenges
     set status = case
       when status = 'finalized' then status
       when now() < opens_at then 'scheduled'
       when now() >= opens_at and now() < closes_at then 'open'
       else 'closed'
     end,
     updated_at = now()
     where status <> 'finalized'
     returning challenge_date, status`
  );

  return result.rows;
};

const getPointsForRank = (rank: number) => placementPoints[rank - 1] ?? 0;

const recomputeBadgeCounters = async () => {
  await pool.query('delete from badge_counters');

  await pool.query(
    `insert into badge_counters
      (user_id, wins_1st, finishes_top3, finishes_top5, finishes_top10, days_played, days_submitted, total_points, updated_at)
     select
       u.id,
       coalesce(sum(case when dr.rank = 1 then 1 else 0 end), 0) as wins_1st,
       coalesce(sum(case when dr.rank between 1 and 3 then 1 else 0 end), 0) as finishes_top3,
       coalesce(sum(case when dr.rank between 1 and 5 then 1 else 0 end), 0) as finishes_top5,
       coalesce(sum(case when dr.rank between 1 and 10 then 1 else 0 end), 0) as finishes_top10,
       coalesce(played.days_played, 0) as days_played,
       coalesce(submitted.days_submitted, 0) as days_submitted,
       coalesce(sum(dr.points_awarded), 0) as total_points,
       now()
     from users u
     left join daily_rankings dr on dr.user_id = u.id and dr.finalized_at is not null
     left join (
       select user_id, count(*) as days_played
       from challenge_attempts
       group by user_id
     ) played on played.user_id = u.id
     left join (
       select user_id, count(*) as days_submitted
       from challenge_attempts
       where status = 'submitted'
       group by user_id
     ) submitted on submitted.user_id = u.id
     group by u.id, played.days_played, submitted.days_submitted`
  );
};

export const finalizeClosedChallenges = async () => {
  const closedChallenges = await pool.query(
    `select id
     from daily_challenges
     where status = 'closed'
     order by closes_at asc`
  );

  for (const challenge of closedChallenges.rows) {
    const challengeId = String(challenge.id);
    const standings = await pool.query(
      `select
         dr.user_id,
         dr.best_attempt_result_id,
         ar.adjusted_time_ms,
         ar.created_at
       from daily_rankings dr
       join attempt_results ar on ar.id = dr.best_attempt_result_id
       where dr.challenge_id = $1
         and ar.is_win = true
         and ar.verification_status = 'verified'
       order by ar.adjusted_time_ms asc, ar.created_at asc`,
      [challengeId]
    );

    const client = await pool.connect();

    try {
      await client.query('begin');

      for (let index = 0; index < standings.rows.length; index += 1) {
        const row = standings.rows[index];
        const rank = index + 1;
        const points = getPointsForRank(rank);

        await client.query(
          `update daily_rankings
           set rank = $1,
               points_awarded = $2,
               finalized_at = now()
           where challenge_id = $3 and user_id = $4`,
          [rank, points, challengeId, String(row.user_id)]
        );
      }

      await client.query(
        `update daily_challenges
         set status = 'finalized',
             updated_at = now()
         where id = $1`,
        [challengeId]
      );

      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  await recomputeBadgeCounters();
};
