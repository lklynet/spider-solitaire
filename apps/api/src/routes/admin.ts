import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';
import { requireAdminSession } from '../lib/sessions.js';

export const registerAdminRoutes = async (app: FastifyInstance) => {
  app.get('/admin/submissions/recent', async (request, reply) => {
    const session = await requireAdminSession(request);
    if (!session) {
      return reply.status(403).send({ error: 'admin_required' });
    }

    const result = await pool.query(
      `select
         a.id as attempt_id,
         a.started_at,
         a.submitted_at,
         u.username,
         u.display_name,
         dc.challenge_date,
         ar.raw_time_ms,
         ar.adjusted_time_ms,
         ar.is_win,
         ar.verification_status,
         coalesce(r.event_count, 0) as event_count
       from challenge_attempts a
       join users u on u.id = a.user_id
       join daily_challenges dc on dc.id = a.challenge_id
       left join attempt_results ar on ar.attempt_id = a.id
       left join attempt_replays r on r.attempt_id = a.id
       where a.status = 'submitted'
       order by a.submitted_at desc nulls last
       limit 50`
    );

    return {
      entries: result.rows.map((row) => ({
        attemptId: String(row.attempt_id),
        username: String(row.username),
        displayName: String(row.display_name),
        challengeDate: String(row.challenge_date),
        startedAt: row.started_at ? new Date(String(row.started_at)).toISOString() : null,
        submittedAt: row.submitted_at ? new Date(String(row.submitted_at)).toISOString() : null,
        rawTimeMs: row.raw_time_ms ? Number(row.raw_time_ms) : null,
        adjustedTimeMs: row.adjusted_time_ms ? Number(row.adjusted_time_ms) : null,
        isWin: row.is_win === null ? null : Boolean(row.is_win),
        verificationStatus: row.verification_status ? String(row.verification_status) : 'missing',
        eventCount: Number(row.event_count)
      }))
    };
  });

  app.get('/admin/submissions/export.csv', async (request, reply) => {
    const session = await requireAdminSession(request);
    if (!session) {
      return reply.status(403).send({ error: 'admin_required' });
    }

    const result = await pool.query(
      `select
         a.id as attempt_id,
         u.username,
         u.display_name,
         dc.challenge_date,
         a.started_at,
         a.submitted_at,
         ar.raw_time_ms,
         ar.adjusted_time_ms,
         ar.is_win,
         ar.verification_status,
         coalesce(r.event_count, 0) as event_count
       from challenge_attempts a
       join users u on u.id = a.user_id
       join daily_challenges dc on dc.id = a.challenge_id
       left join attempt_results ar on ar.attempt_id = a.id
       left join attempt_replays r on r.attempt_id = a.id
       where a.status = 'submitted'
       order by a.submitted_at desc nulls last
       limit 500`
    );

    const header = [
      'attempt_id',
      'username',
      'display_name',
      'challenge_date',
      'started_at',
      'submitted_at',
      'raw_time_ms',
      'adjusted_time_ms',
      'is_win',
      'verification_status',
      'event_count'
    ];
    const rows = result.rows.map((row) =>
      [
        row.attempt_id,
        row.username,
        row.display_name,
        row.challenge_date,
        row.started_at,
        row.submitted_at,
        row.raw_time_ms,
        row.adjusted_time_ms,
        row.is_win,
        row.verification_status,
        row.event_count
      ]
        .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="recent-submissions.csv"');
    return [header.join(','), ...rows].join('\n');
  });
};
