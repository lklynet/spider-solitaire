import { pool } from '../db.js';

const formatDateOnly = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value);
};

const mapTimeEntry = (row: Record<string, unknown>, index: number) => ({
  rank: index + 1,
  userId: String(row.user_id),
  username: String(row.username),
  displayName: String(row.display_name),
  adjustedTimeMs: Number(row.adjusted_time_ms),
  rawTimeMs: Number(row.raw_time_ms),
  hintCount: Number(row.hint_count),
  undoCount: Number(row.undo_count),
  verificationStatus: String(row.verification_status),
  pointsAwarded: Number(row.points_awarded ?? 0)
});

const mapPointsEntry = (row: Record<string, unknown>, index: number) => ({
  rank: index + 1,
  userId: String(row.user_id),
  username: String(row.username),
  displayName: String(row.display_name),
  points: Number(row.points),
  wins: Number(row.wins),
  top3: Number(row.top3)
});

export const getCurrentChallengeDate = async () => {
  const result = await pool.query(
    `select challenge_date
     from daily_challenges
     where status in ('open', 'scheduled', 'closed', 'finalized')
     order by
       case when status = 'open' then 0 else 1 end,
       opens_at asc
     limit 1`
  );

  return result.rows[0]?.challenge_date ? formatDateOnly(result.rows[0].challenge_date) : null;
};

export const getDailyLeaderboard = async (challengeDate: string) => {
  const result = await pool.query(
    `select
       r.user_id,
       u.username,
       u.display_name,
       ar.adjusted_time_ms,
       ar.raw_time_ms,
       ar.hint_count,
       ar.undo_count,
       ar.verification_status,
       r.points_awarded
     from daily_rankings r
     join daily_challenges dc on dc.id = r.challenge_id
     join users u on u.id = r.user_id
     join attempt_results ar on ar.id = r.best_attempt_result_id
     where dc.challenge_date = $1
     order by ar.adjusted_time_ms asc, ar.created_at asc
     limit 25`,
    [challengeDate]
  );

  return result.rows.map(mapTimeEntry);
};

export const getWeeklyLeaderboard = async (weekKey?: string) => {
  const result = await pool.query(
    `with ranked as (
       select
         dc.challenge_date,
         dr.user_id,
         dr.points_awarded,
         dr.rank
       from daily_rankings dr
       join daily_challenges dc on dc.id = dr.challenge_id
       where dr.finalized_at is not null
         and date_trunc('week', dc.challenge_date::timestamp)::date =
           coalesce($1::date, date_trunc('week', now())::date)
     )
     select
       u.id as user_id,
       u.username,
       u.display_name,
       coalesce(sum(r.points_awarded), 0) as points,
       coalesce(sum(case when r.rank = 1 then 1 else 0 end), 0) as wins,
       coalesce(sum(case when r.rank between 1 and 3 then 1 else 0 end), 0) as top3
     from ranked r
     join users u on u.id = r.user_id
     group by u.id, u.username, u.display_name
     order by points desc, wins desc, u.display_name asc
     limit 25`,
    [weekKey ?? null]
  );

  return result.rows.map(mapPointsEntry);
};

export const getMonthlyLeaderboard = async (monthKey?: string) => {
  const result = await pool.query(
    `with ranked as (
       select
         dc.challenge_date,
         dr.user_id,
         dr.points_awarded,
         dr.rank
       from daily_rankings dr
       join daily_challenges dc on dc.id = dr.challenge_id
       where dr.finalized_at is not null
         and date_trunc('month', dc.challenge_date::timestamp)::date =
           coalesce($1::date, date_trunc('month', now())::date)
     )
     select
       u.id as user_id,
       u.username,
       u.display_name,
       coalesce(sum(r.points_awarded), 0) as points,
       coalesce(sum(case when r.rank = 1 then 1 else 0 end), 0) as wins,
       coalesce(sum(case when r.rank between 1 and 3 then 1 else 0 end), 0) as top3
     from ranked r
     join users u on u.id = r.user_id
     group by u.id, u.username, u.display_name
     order by points desc, wins desc, u.display_name asc
     limit 25`,
    [monthKey ?? null]
  );

  return result.rows.map(mapPointsEntry);
};

export const getGlobalLeaderboard = async () => {
  const result = await pool.query(
    `select
       u.id as user_id,
       u.username,
       u.display_name,
       coalesce(sum(dr.points_awarded), 0) as points,
       coalesce(sum(case when dr.rank = 1 then 1 else 0 end), 0) as wins,
       coalesce(sum(case when dr.rank between 1 and 3 then 1 else 0 end), 0) as top3
     from daily_rankings dr
     join users u on u.id = dr.user_id
     where dr.finalized_at is not null
     group by u.id, u.username, u.display_name
     order by points desc, wins desc, u.display_name asc
     limit 25`
  );

  return result.rows.map(mapPointsEntry);
};

export const getRaceHistory = async (limit = 14) => {
  const result = await pool.query(
    `with ranked as (
       select
         dc.challenge_date,
         u.username,
         u.display_name,
         dr.rank,
         dr.points_awarded,
         ar.adjusted_time_ms
       from daily_rankings dr
       join daily_challenges dc on dc.id = dr.challenge_id
       join users u on u.id = dr.user_id
       join attempt_results ar on ar.id = dr.best_attempt_result_id
       where dr.finalized_at is not null
         and ar.verification_status = 'verified'
     )
     select *
     from ranked
     where challenge_date in (
       select distinct challenge_date
       from ranked
       order by challenge_date desc
       limit $1
     )
     order by challenge_date desc, rank asc`,
    [limit]
  );

  const grouped = new Map<
    string,
    Array<{
      username: string;
      displayName: string;
      rank: number;
      pointsAwarded: number;
      adjustedTimeMs: number;
    }>
  >();

  for (const row of result.rows) {
    const challengeDate = formatDateOnly(row.challenge_date);
    if (!grouped.has(challengeDate)) {
      grouped.set(challengeDate, []);
    }
    grouped.get(challengeDate)?.push({
      username: String(row.username),
      displayName: String(row.display_name),
      rank: Number(row.rank),
      pointsAwarded: Number(row.points_awarded),
      adjustedTimeMs: Number(row.adjusted_time_ms)
    });
  }

  return Array.from(grouped.entries()).map(([challengeDate, entries]) => ({
    challengeDate,
    winner: entries.find((entry) => entry.rank === 1) ?? null,
    podium: entries.slice(0, 3),
    totalRankedPlayers: entries.length
  }));
};

export const getProfileByUsername = async (username: string) => {
  const profileResult = await pool.query(
    `select
       u.id,
       u.username,
       u.display_name,
       p.avatar_seed,
       p.avatar_url,
       p.bio,
       b.wins_1st,
       b.finishes_top3,
       b.finishes_top5,
       b.finishes_top10,
       b.days_played,
       b.days_submitted,
      b.total_points,
      coalesce(best.best_rank, null) as best_rank,
      coalesce(verified.verified_submissions, 0) as verified_submissions
     from users u
     left join player_profiles p on p.user_id = u.id
     left join badge_counters b on b.user_id = u.id
     left join (
       select user_id, min(rank) as best_rank
       from daily_rankings
       where finalized_at is not null
       group by user_id
     ) best on best.user_id = u.id
     left join (
       select a.user_id, count(*) as verified_submissions
       from challenge_attempts a
       join attempt_results ar on ar.attempt_id = a.id
       where ar.verification_status = 'verified'
       group by a.user_id
     ) verified on verified.user_id = u.id
     where u.username = $1`,
    [username]
  );

  const row = profileResult.rows[0];
  if (!row) return null;

  const recentResult = await pool.query(
    `select
       dc.challenge_date,
       dr.rank,
       dr.points_awarded
     from daily_rankings dr
     join daily_challenges dc on dc.id = dr.challenge_id
     where dr.user_id = $1
       and dr.finalized_at is not null
     order by dc.challenge_date desc
     limit 5`,
    [row.id]
  );

  return {
    user: {
      id: String(row.id),
      username: String(row.username),
      displayName: String(row.display_name),
      avatarSeed: row.avatar_seed ? String(row.avatar_seed) : null,
      avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
      bio: row.bio ? String(row.bio) : null
    },
    badges: {
      wins1st: Number(row.wins_1st ?? 0),
      finishesTop3: Number(row.finishes_top3 ?? 0),
      finishesTop5: Number(row.finishes_top5 ?? 0),
      finishesTop10: Number(row.finishes_top10 ?? 0),
      daysPlayed: Number(row.days_played ?? 0),
      daysSubmitted: Number(row.days_submitted ?? 0),
      totalPoints: Number(row.total_points ?? 0),
      bestRank: row.best_rank === null ? null : Number(row.best_rank),
      verifiedSubmissions: Number(row.verified_submissions ?? 0)
    },
    recentFinishes: recentResult.rows.map((finish) => ({
      challengeDate: formatDateOnly(finish.challenge_date),
      rank: Number(finish.rank),
      pointsAwarded: Number(finish.points_awarded)
    }))
  };
};
