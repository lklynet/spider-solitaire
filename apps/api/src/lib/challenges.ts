import { replayGame } from '@spider/game-engine';
import type { ReplayEvent } from '@spider/shared-types';
import { pool } from '../db.js';
import { createId } from './security.js';

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

interface CreateAttemptInput {
  challengeId: string;
  userId: string;
}

interface SubmitAttemptInput {
  attemptId: string;
  userId: string;
  isWin: boolean;
  replayEvents: ReplayEvent[];
}

export interface OfficialChallengeRecord {
  id: string;
  challengeDate: string;
  timezone: string;
  opensAt: string;
  closesAt: string;
  seed: string;
  rulesVersion: string;
  status: string;
}

export interface OfficialAttemptRecord {
  id: string;
  challengeId: string;
  userId: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
}

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
  const closesAt = new Date(opensAt.getTime() + config.durationHours * 60 * 60 * 1000);

  return { opensAt, closesAt };
};

const getDerivedStatus = (window: { opensAt: Date; closesAt: Date }, now = new Date()) => {
  if (now < window.opensAt) return 'scheduled';
  if (now < window.closesAt) return 'open';
  return 'closed';
};

const formatDateOnly = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value);
};

const mapChallengeRow = (row: Record<string, unknown>): OfficialChallengeRecord => ({
  id: String(row.id),
  challengeDate: formatDateOnly(row.challenge_date),
  timezone: String(row.timezone),
  opensAt: new Date(String(row.opens_at)).toISOString(),
  closesAt: new Date(String(row.closes_at)).toISOString(),
  seed: String(row.seed),
  rulesVersion: String(row.rules_version),
  status: String(row.status)
});

export const ensureChallengeForDate = async (
  dateKey: string,
  config: ChallengeWindowConfig
) => {
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
      createId(),
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

  await pool.query(
    `update daily_challenges
     set status = case
       when status = 'finalized' then status
       when now() < opens_at then 'scheduled'
       when now() >= opens_at and now() < closes_at then 'open'
       else 'closed'
     end,
     updated_at = now()
     where status <> 'finalized'`
  );
};

export const getCurrentOfficialChallenge = async (config: ChallengeWindowConfig) => {
  await syncChallengeSchedule(config);

  const result = await pool.query(
    `select *
     from daily_challenges
     where status in ('open', 'scheduled')
     order by
       case when status = 'open' then 0 else 1 end,
       opens_at asc
     limit 1`
  );

  const row = result.rows[0];
  return row ? mapChallengeRow(row) : null;
};

export const getUserChallengeAttempt = async (challengeId: string, userId: string) => {
  const result = await pool.query(
    `select id, status, started_at, submitted_at
     from challenge_attempts
     where challenge_id = $1 and user_id = $2`,
    [challengeId, userId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    challengeId,
    userId,
    status: String(row.status),
    startedAt: new Date(String(row.started_at)).toISOString(),
    submittedAt: row.submitted_at ? new Date(String(row.submitted_at)).toISOString() : null
  };
};

export const getChallengeById = async (challengeId: string) => {
  const result = await pool.query('select * from daily_challenges where id = $1', [challengeId]);
  const row = result.rows[0];
  return row ? mapChallengeRow(row) : null;
};

export const getAttemptById = async (attemptId: string): Promise<OfficialAttemptRecord | null> => {
  const result = await pool.query(
    `select id, challenge_id, user_id, status, started_at, submitted_at
     from challenge_attempts
     where id = $1`,
    [attemptId]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: String(row.id),
    challengeId: String(row.challenge_id),
    userId: String(row.user_id),
    status: String(row.status),
    startedAt: new Date(String(row.started_at)).toISOString(),
    submittedAt: row.submitted_at ? new Date(String(row.submitted_at)).toISOString() : null
  };
};

export const createAttempt = async ({ challengeId, userId }: CreateAttemptInput) => {
  const existing = await getUserChallengeAttempt(challengeId, userId);
  if (existing) {
    return { attempt: existing, created: false as const };
  }

  const attemptId = createId();
  await pool.query(
    `insert into challenge_attempts
      (id, challenge_id, user_id, attempt_number, started_at, status)
     values ($1, $2, $3, 1, now(), 'started')`,
    [attemptId, challengeId, userId]
  );

  const created = await getAttemptById(attemptId);
  if (!created) {
    throw new Error('failed_to_create_attempt');
  }

  return { attempt: created, created: true as const };
};

export const submitAttempt = async ({
  attemptId,
  userId,
  isWin,
  replayEvents
}: SubmitAttemptInput) => {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const attemptResult = await client.query(
      `select
         a.id,
         a.challenge_id,
         a.user_id,
         a.status,
         a.started_at,
         c.status as challenge_status,
         c.seed
       from challenge_attempts a
       join daily_challenges c on c.id = a.challenge_id
       where a.id = $1
       for update`,
      [attemptId]
    );

    const attempt = attemptResult.rows[0];
    if (!attempt) {
      throw new Error('attempt_not_found');
    }

    if (String(attempt.user_id) !== userId) {
      throw new Error('attempt_forbidden');
    }

    if (String(attempt.status) !== 'started') {
      throw new Error('attempt_already_submitted');
    }

    const resultId = createId();
    const replayId = createId();
    const submittedAt = new Date();
    const rawTimeMs = Math.max(
      1,
      submittedAt.getTime() - new Date(String(attempt.started_at)).getTime()
    );
    const replayResult = replayGame(String(attempt.seed), replayEvents);
    const hintPenaltyMs = Number(process.env.HINT_PENALTY_MS ?? 15000);
    const undoPenaltyMs = Number(process.env.UNDO_PENALTY_MS ?? 10000);
    const verified =
      replayResult.valid &&
      replayResult.summary.isWin === isWin;
    const hintCount = replayResult.valid ? replayResult.summary.hintCount : 0;
    const undoCount = replayResult.valid ? replayResult.summary.undoCount : 0;
    const adjustedTimeMs = rawTimeMs + hintCount * hintPenaltyMs + undoCount * undoPenaltyMs;
    const verificationStatus = verified ? 'verified' : 'rejected';

    await client.query(
      `update challenge_attempts
       set status = 'submitted',
           submitted_at = now()
       where id = $1`,
      [attemptId]
    );

    await client.query(
      `insert into attempt_results
        (id, attempt_id, raw_time_ms, hint_count, undo_count, adjusted_time_ms, is_win, verification_status)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [resultId, attemptId, rawTimeMs, hintCount, undoCount, adjustedTimeMs, isWin, verificationStatus]
    );

    await client.query(
      `insert into attempt_replays (id, attempt_id, event_count, replay_payload)
       values ($1, $2, $3, $4::jsonb)`,
      [replayId, attemptId, replayEvents.length, JSON.stringify(replayEvents)]
    );

    if (isWin && verified) {
      await client.query(
        `insert into daily_rankings (challenge_id, user_id, best_attempt_result_id)
         values ($1, $2, $3)
         on conflict (challenge_id, user_id) do update
         set best_attempt_result_id = excluded.best_attempt_result_id`,
        [String(attempt.challenge_id), userId, resultId]
      );
    }

    await client.query('commit');

    const submittedAttempt = await getAttemptById(attemptId);
    return {
      attempt: submittedAttempt,
      result: {
        id: resultId,
        challengeId: String(attempt.challenge_id),
        challengeStatus: String(attempt.challenge_status),
        rawTimeMs,
        hintCount,
        undoCount,
        adjustedTimeMs,
        isWin,
        verificationStatus
      }
    };
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};
