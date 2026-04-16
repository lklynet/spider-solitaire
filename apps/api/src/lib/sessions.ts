import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';
import { pool } from '../db.js';
import { createId, createSessionToken, hashValue } from './security.js';

interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: Date;
  user: SessionUser;
}

const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production'
};

export const setSessionCookie = (reply: FastifyReply, rawToken: string, expiresAt: Date) => {
  reply.setCookie(config.sessionCookieName, rawToken, {
    ...sessionCookieOptions,
    expires: expiresAt,
    maxAge: config.sessionMaxAgeSeconds
  });
};

export const clearSessionCookie = (reply: FastifyReply) => {
  reply.clearCookie(config.sessionCookieName, sessionCookieOptions);
};

export const createSession = async (input: {
  userId: string;
  userAgent?: string;
  ip?: string;
}) => {
  const rawToken = createSessionToken();
  const expiresAt = new Date(Date.now() + config.sessionMaxAgeSeconds * 1000);

  await pool.query('delete from user_sessions where expires_at <= now() or user_id = $1', [input.userId]);

  await pool.query(
    `insert into user_sessions (id, user_id, token_hash, expires_at, user_agent, ip_hash)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      createId(),
      input.userId,
      hashValue(rawToken),
      expiresAt,
      input.userAgent ?? null,
      input.ip ? hashValue(input.ip) : null
    ]
  );

  return { rawToken, expiresAt };
};

export const destroySession = async (rawToken?: string) => {
  if (!rawToken) return;

  await pool.query('delete from user_sessions where token_hash = $1', [hashValue(rawToken)]);
};

export const getSession = async (rawToken?: string): Promise<SessionRecord | null> => {
  if (!rawToken) return null;

  const result = await pool.query(
    `select
       s.id,
       s.user_id,
       s.expires_at,
       u.id as user_id_value,
       u.username,
       u.display_name,
       u.role
     from user_sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1`,
    [hashValue(rawToken)]
  );

  const row = result.rows[0];
  if (!row) return null;

  const expiresAt = new Date(row.expires_at);
  if (expiresAt <= new Date()) {
    await destroySession(rawToken);
    return null;
  }

  await pool.query('update user_sessions set last_seen_at = now() where id = $1', [row.id]);

  return {
    id: row.id,
    userId: row.user_id,
    expiresAt,
    user: {
      id: row.user_id_value,
      username: row.username,
      displayName: row.display_name,
      role: row.role
    }
  };
};

export const getSessionFromRequest = async (request: FastifyRequest) =>
  getSession(request.cookies[config.sessionCookieName]);

export const requireAdminSession = async (request: FastifyRequest) => {
  const session = await getSessionFromRequest(request);
  if (!session) return null;

  if (session.user.role === 'admin') {
    return session;
  }

  return null;
};
