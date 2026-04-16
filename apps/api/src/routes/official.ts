import type { ReplayEvent } from '@spider/shared-types';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../config.js';
import {
  createAttempt,
  getAttemptById,
  getChallengeById,
  getCurrentOfficialChallenge,
  getUserChallengeAttempt,
  submitAttempt,
  syncChallengeSchedule
} from '../lib/challenges.js';
import { getSessionFromRequest } from '../lib/sessions.js';

const submitAttemptSchema = z.object({
  isWin: z.boolean(),
  replayEvents: z.array(
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('move'),
        fromPileIndex: z.number().int().min(0).max(9),
        toPileIndex: z.number().int().min(0).max(9),
        cardIndex: z.number().int().min(0)
      }),
      z.object({
        type: z.literal('deal')
      }),
      z.object({
        type: z.literal('undo')
      }),
      z.object({
        type: z.literal('hint')
      })
    ])
  ).min(1).max(config.officialReplayEventLimit)
});

const getChallengeConfig = () => ({
  timeZone: config.officialTimezone,
  openHour: config.officialOpenHour,
  durationHours: config.officialDurationHours,
  rulesVersion: config.officialRulesVersion
});

export const registerOfficialRoutes = async (app: FastifyInstance) => {
  app.get('/official/current', async (request) => {
    const [challenge, session] = await Promise.all([
      getCurrentOfficialChallenge(getChallengeConfig()),
      getSessionFromRequest(request)
    ]);

    const attempt =
      challenge && session
        ? await getUserChallengeAttempt(challenge.id, session.user.id)
        : null;

    return {
      serverTime: new Date().toISOString(),
      challenge,
      user: session
        ? {
            id: session.user.id,
            username: session.user.username,
            displayName: session.user.displayName,
            role: session.user.role
          }
        : null,
      officialEntry: challenge
        ? {
            hasAttempt: Boolean(attempt),
            canStart: challenge.status === 'open' && !attempt && Boolean(session),
            attempt
          }
        : null
    };
  });

  app.post('/official/attempts', async (request, reply) => {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return reply.status(401).send({ error: 'authentication_required' });
    }

    const challenge = await getCurrentOfficialChallenge(getChallengeConfig());
    if (!challenge) {
      return reply.status(404).send({ error: 'challenge_not_found' });
    }

    if (challenge.status !== 'open') {
      return reply.status(409).send({ error: 'challenge_not_open', challenge });
    }

    const result = await createAttempt({
      challengeId: challenge.id,
      userId: session.user.id
    });

    return reply.status(result.created ? 201 : 200).send({
      challenge,
      attempt: result.attempt
    });
  });

  app.get('/official/attempts/:attemptId', async (request, reply) => {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return reply.status(401).send({ error: 'authentication_required' });
    }

    const attempt = await getAttemptById((request.params as { attemptId: string }).attemptId);
    if (!attempt || attempt.userId !== session.user.id) {
      return reply.status(404).send({ error: 'attempt_not_found' });
    }

    const challenge = await getChallengeById(attempt.challengeId);
    return {
      challenge,
      attempt
    };
  });

  app.post('/official/attempts/:attemptId/submit', async (request, reply) => {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return reply.status(401).send({ error: 'authentication_required' });
    }

    const parsed = submitAttemptSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        issues: z.flattenError(parsed.error)
      });
    }

    await syncChallengeSchedule(getChallengeConfig());

    const attemptId = (request.params as { attemptId: string }).attemptId;
    const attempt = await getAttemptById(attemptId);
    if (!attempt || attempt.userId !== session.user.id) {
      return reply.status(404).send({ error: 'attempt_not_found' });
    }

    const challenge = await getChallengeById(attempt.challengeId);
    if (!challenge) {
      return reply.status(404).send({ error: 'challenge_not_found' });
    }

    if (challenge.status !== 'open') {
      return reply.status(409).send({ error: 'challenge_not_open', challenge });
    }

    try {
      const result = await submitAttempt({
        attemptId,
        userId: session.user.id,
        isWin: parsed.data.isWin,
        replayEvents: parsed.data.replayEvents as ReplayEvent[]
      });

      return {
        challenge,
        attempt: result.attempt,
        result: result.result
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'attempt_already_submitted') {
          return reply.status(409).send({ error: error.message });
        }
        if (error.message === 'attempt_forbidden') {
          return reply.status(403).send({ error: error.message });
        }
        if (error.message === 'attempt_not_found') {
          return reply.status(404).send({ error: error.message });
        }
      }

      throw error;
    }
  });
};
