import type { FastifyInstance } from 'fastify';
import {
  getCurrentChallengeDate,
  getDailyLeaderboard,
  getGlobalLeaderboard,
  getMonthlyLeaderboard,
  getRaceHistory,
  getWeeklyLeaderboard
} from '../lib/leaderboards.js';

export const registerLeaderboardRoutes = async (app: FastifyInstance) => {
  app.get('/leaderboards/daily/:date', async (request) => {
    const { date } = request.params as { date: string };
    const challengeDate = date === 'current' ? await getCurrentChallengeDate() : date;

    if (!challengeDate) {
      return {
        challengeDate: null,
        entries: []
      };
    }

    return {
      challengeDate: String(challengeDate),
      entries: await getDailyLeaderboard(String(challengeDate))
    };
  });

  app.get('/leaderboards/weekly/:weekKey', async (request) => {
    const { weekKey } = request.params as { weekKey: string };

    return {
      weekKey: weekKey === 'current' ? null : weekKey,
      entries: await getWeeklyLeaderboard(weekKey === 'current' ? undefined : weekKey)
    };
  });

  app.get('/leaderboards/monthly/:monthKey', async (request) => {
    const { monthKey } = request.params as { monthKey: string };

    return {
      monthKey: monthKey === 'current' ? null : monthKey,
      entries: await getMonthlyLeaderboard(monthKey === 'current' ? undefined : monthKey)
    };
  });

  app.get('/leaderboards/global', async () => {
    return {
      entries: await getGlobalLeaderboard()
    };
  });

  app.get('/leaderboards/history', async () => {
    return {
      entries: await getRaceHistory()
    };
  });
};
