import type { FastifyInstance } from 'fastify';
import { getProfileByUsername } from '../lib/leaderboards.js';
import { getSessionFromRequest } from '../lib/sessions.js';

export const registerProfileRoutes = async (app: FastifyInstance) => {
  app.get('/profiles/me', async (request, reply) => {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return reply.status(401).send({ error: 'authentication_required' });
    }

    const profile = await getProfileByUsername(session.user.username);
    if (!profile) {
      return reply.status(404).send({ error: 'profile_not_found' });
    }

    return profile;
  });

  app.get('/profiles/:username', async (request, reply) => {
    const { username } = request.params as { username: string };
    const profile = await getProfileByUsername(username);

    if (!profile) {
      return reply.status(404).send({ error: 'profile_not_found' });
    }

    return profile;
  });
};
