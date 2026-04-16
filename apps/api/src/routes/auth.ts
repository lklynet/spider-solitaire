import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import { pool } from '../db.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import {
  clearSessionCookie,
  createSession,
  destroySession,
  getSessionFromRequest,
  setSessionCookie
} from '../lib/sessions.js';
import { createId } from '../lib/security.js';

const authSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128)
});

const registerSchema = authSchema.extend({
  displayName: z.string().trim().min(2).max(32)
});

const toPublicUser = (row: Record<string, unknown>) => ({
  id: String(row.id),
  username: String(row.username),
  displayName: String(row.display_name),
  role: String(row.role)
});

const normalizeUsername = (username: string) => username.trim().toLowerCase();
const getUserAgent = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value : undefined;
const getUserRole = (username: string) =>
  config.adminUsernames.includes(username) ? 'admin' : 'player';

export const registerAuthRoutes = async (app: FastifyInstance) => {
  app.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        issues: z.flattenError(parsed.error)
      });
    }

    const username = normalizeUsername(parsed.data.username);
    const existing = await pool.query('select id from users where username = $1', [username]);
    if (existing.rowCount) {
      return reply.status(409).send({ error: 'username_taken' });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const userId = createId();
    const role = getUserRole(username);

    const result = await pool.query(
      `insert into users (id, username, display_name, password_hash, role)
       values ($1, $2, $3, $4, $5)
       returning id, username, display_name, role`,
      [userId, username, parsed.data.displayName.trim(), passwordHash, role]
    );

    await destroySession(request.cookies[config.sessionCookieName]);

    await pool.query(
      `insert into player_profiles (user_id, avatar_seed)
       values ($1, $2)
       on conflict (user_id) do nothing`,
      [userId, username]
    );

    const session = await createSession({
      userId,
      userAgent: getUserAgent(request.headers['user-agent']),
      ip: request.ip
    });

    setSessionCookie(reply, session.rawToken, session.expiresAt);

    return reply.status(201).send({
      user: toPublicUser(result.rows[0])
    });
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = authSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        issues: z.flattenError(parsed.error)
      });
    }

    const username = normalizeUsername(parsed.data.username);
    const result = await pool.query(
      `select id, username, display_name, password_hash, role
       from users
       where username = $1`,
      [username]
    );

    const row = result.rows[0];
    if (!row) {
      return reply.status(401).send({ error: 'invalid_credentials' });
    }

    const passwordValid = await verifyPassword(parsed.data.password, String(row.password_hash));
    if (!passwordValid) {
      return reply.status(401).send({ error: 'invalid_credentials' });
    }

    await pool.query('update users set last_login_at = now() where id = $1', [row.id]);
    await destroySession(request.cookies[config.sessionCookieName]);

    const session = await createSession({
      userId: String(row.id),
      userAgent: getUserAgent(request.headers['user-agent']),
      ip: request.ip
    });

    setSessionCookie(reply, session.rawToken, session.expiresAt);

    return reply.send({
      user: toPublicUser(row)
    });
  });

  app.post('/auth/logout', async (request, reply) => {
    await destroySession(request.cookies[config.sessionCookieName]);
    clearSessionCookie(reply);

    return reply.status(204).send();
  });

  app.get('/auth/session', async (request) => {
    const session = await getSessionFromRequest(request);

    return {
      authenticated: Boolean(session),
      user: session?.user ?? null
    };
  });
};
