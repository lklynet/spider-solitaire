import { create } from 'zustand';
import { apiRequest } from '../lib/api';
import type { ReplayEvent } from '../types/game';

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role?: string;
}

export interface OfficialChallenge {
  id: string;
  challengeDate: string;
  timezone: string;
  opensAt: string;
  closesAt: string;
  seed: string;
  rulesVersion: string;
  status: 'scheduled' | 'open' | 'closed' | 'finalized';
}

export interface OfficialAttempt {
  id: string;
  challengeId: string;
  userId: string;
  status: 'started' | 'submitted' | 'expired' | 'invalid';
  startedAt: string;
  submittedAt: string | null;
}

interface OfficialCurrentResponse {
  serverTime: string;
  challenge: OfficialChallenge | null;
  user: SessionUser | null;
  officialEntry: {
    hasAttempt: boolean;
    canStart: boolean;
    attempt: OfficialAttempt | null;
  } | null;
}

interface AuthResponse {
  user: SessionUser;
}

interface StartAttemptResponse {
  challenge: OfficialChallenge;
  attempt: OfficialAttempt;
}

interface SubmitAttemptResponse {
  challenge: OfficialChallenge;
  attempt: OfficialAttempt | null;
  result: {
    id: string;
    challengeId: string;
    challengeStatus: string;
    rawTimeMs: number;
    hintCount: number;
    undoCount: number;
    adjustedTimeMs: number;
    isWin: boolean;
    verificationStatus: string;
  };
}

interface DailyLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  adjustedTimeMs: number;
  rawTimeMs: number;
  hintCount: number;
  undoCount: number;
  verificationStatus: string;
  pointsAwarded: number;
}

interface DailyLeaderboardResponse {
  challengeDate: string | null;
  entries: DailyLeaderboardEntry[];
}

interface PointsLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  points: number;
  wins: number;
  top3: number;
}

interface PointsLeaderboardResponse {
  entries: PointsLeaderboardEntry[];
}

interface ProfileResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarSeed: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  badges: {
    wins1st: number;
    finishesTop3: number;
    finishesTop5: number;
    finishesTop10: number;
    daysPlayed: number;
    daysSubmitted: number;
    totalPoints: number;
    bestRank: number | null;
    verifiedSubmissions: number;
  };
  recentFinishes: Array<{
    challengeDate: string;
    rank: number;
    pointsAwarded: number;
  }>;
}

interface RaceHistoryEntry {
  challengeDate: string;
  winner: {
    username: string;
    displayName: string;
    rank: number;
    pointsAwarded: number;
    adjustedTimeMs: number;
  } | null;
  podium: Array<{
    username: string;
    displayName: string;
    rank: number;
    pointsAwarded: number;
    adjustedTimeMs: number;
  }>;
  totalRankedPlayers: number;
}

interface RaceHistoryResponse {
  entries: RaceHistoryEntry[];
}

interface AdminSubmissionEntry {
  attemptId: string;
  username: string;
  displayName: string;
  challengeDate: string;
  startedAt: string | null;
  submittedAt: string | null;
  rawTimeMs: number | null;
  adjustedTimeMs: number | null;
  isWin: boolean | null;
  verificationStatus: string;
  eventCount: number;
}

interface AdminTelemetryResponse {
  entries: AdminSubmissionEntry[];
}

interface OfficialStore {
  serverTime: string | null;
  challenge: OfficialChallenge | null;
  sessionUser: SessionUser | null;
  officialEntry: OfficialCurrentResponse['officialEntry'];
  currentLoading: boolean;
  authLoading: boolean;
  actionLoading: boolean;
  error: string | null;
  lastSubmission: SubmitAttemptResponse['result'] | null;
  leaderboard: DailyLeaderboardEntry[];
  weeklyLeaderboard: PointsLeaderboardEntry[];
  monthlyLeaderboard: PointsLeaderboardEntry[];
  globalLeaderboard: PointsLeaderboardEntry[];
  profile: ProfileResponse | null;
  history: RaceHistoryEntry[];
  adminRecentSubmissions: AdminSubmissionEntry[];
  refreshCurrent: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  startAttempt: () => Promise<StartAttemptResponse>;
  submitAttempt: (
    attemptId: string,
    payload: {
      isWin: boolean;
      replayEvents: ReplayEvent[];
    }
  ) => Promise<SubmitAttemptResponse>;
}

const mapError = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
};

export const useOfficialStore = create<OfficialStore>((set) => ({
  serverTime: null,
  challenge: null,
  sessionUser: null,
  officialEntry: null,
  currentLoading: false,
  authLoading: false,
  actionLoading: false,
  error: null,
  lastSubmission: null,
  leaderboard: [],
  weeklyLeaderboard: [],
  monthlyLeaderboard: [],
  globalLeaderboard: [],
  profile: null,
  history: [],
  adminRecentSubmissions: [],

  refreshCurrent: async () => {
    set({ currentLoading: true, error: null });

    try {
      const response = await apiRequest<OfficialCurrentResponse>('/official/current');
      const [leaderboard, weekly, monthly, global, history, profile, adminTelemetry] = await Promise.all([
        apiRequest<DailyLeaderboardResponse>('/leaderboards/daily/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/weekly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/monthly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/global'),
        apiRequest<RaceHistoryResponse>('/leaderboards/history'),
        response.user
          ? apiRequest<ProfileResponse>('/profiles/me').catch(() => null)
          : Promise.resolve(null),
        response.user?.role === 'admin'
          ? apiRequest<AdminTelemetryResponse>('/admin/submissions/recent').catch(() => ({ entries: [] }))
          : Promise.resolve({ entries: [] })
      ]);
      set({
        serverTime: response.serverTime,
        challenge: response.challenge,
        sessionUser: response.user,
        officialEntry: response.officialEntry,
        leaderboard: leaderboard.entries,
        weeklyLeaderboard: weekly.entries,
        monthlyLeaderboard: monthly.entries,
        globalLeaderboard: global.entries,
        history: history.entries,
        profile,
        adminRecentSubmissions: adminTelemetry.entries,
        currentLoading: false
      });
    } catch (error) {
      set({
        error: mapError(error),
        currentLoading: false
      });
    }
  },

  login: async (username, password) => {
    set({ authLoading: true, error: null });

    try {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { username, password }
      });

      const current = await apiRequest<OfficialCurrentResponse>('/official/current');
      const [leaderboard, weekly, monthly, global, history, profile, adminTelemetry] = await Promise.all([
        apiRequest<DailyLeaderboardResponse>('/leaderboards/daily/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/weekly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/monthly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/global'),
        apiRequest<RaceHistoryResponse>('/leaderboards/history'),
        apiRequest<ProfileResponse>('/profiles/me').catch(() => null),
        response.user.role === 'admin'
          ? apiRequest<AdminTelemetryResponse>('/admin/submissions/recent').catch(() => ({ entries: [] }))
          : Promise.resolve({ entries: [] })
      ]);
      set({
        sessionUser: response.user,
        challenge: current.challenge,
        serverTime: current.serverTime,
        officialEntry: current.officialEntry,
        leaderboard: leaderboard.entries,
        weeklyLeaderboard: weekly.entries,
        monthlyLeaderboard: monthly.entries,
        globalLeaderboard: global.entries,
        history: history.entries,
        profile,
        adminRecentSubmissions: adminTelemetry.entries,
        authLoading: false
      });
    } catch (error) {
      set({ authLoading: false, error: mapError(error) });
      throw error;
    }
  },

  register: async (username, displayName, password) => {
    set({ authLoading: true, error: null });

    try {
      const response = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { username, displayName, password }
      });

      const current = await apiRequest<OfficialCurrentResponse>('/official/current');
      const [leaderboard, weekly, monthly, global, history, profile, adminTelemetry] = await Promise.all([
        apiRequest<DailyLeaderboardResponse>('/leaderboards/daily/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/weekly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/monthly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/global'),
        apiRequest<RaceHistoryResponse>('/leaderboards/history'),
        apiRequest<ProfileResponse>('/profiles/me').catch(() => null),
        response.user.role === 'admin'
          ? apiRequest<AdminTelemetryResponse>('/admin/submissions/recent').catch(() => ({ entries: [] }))
          : Promise.resolve({ entries: [] })
      ]);
      set({
        sessionUser: response.user,
        challenge: current.challenge,
        serverTime: current.serverTime,
        officialEntry: current.officialEntry,
        leaderboard: leaderboard.entries,
        weeklyLeaderboard: weekly.entries,
        monthlyLeaderboard: monthly.entries,
        globalLeaderboard: global.entries,
        history: history.entries,
        profile,
        adminRecentSubmissions: adminTelemetry.entries,
        authLoading: false
      });
    } catch (error) {
      set({ authLoading: false, error: mapError(error) });
      throw error;
    }
  },

  logout: async () => {
    set({ authLoading: true, error: null });

    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      const current = await apiRequest<OfficialCurrentResponse>('/official/current');
      const [leaderboard, weekly, monthly, global, history] = await Promise.all([
        apiRequest<DailyLeaderboardResponse>('/leaderboards/daily/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/weekly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/monthly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/global'),
        apiRequest<RaceHistoryResponse>('/leaderboards/history')
      ]);
      set({
        sessionUser: null,
        challenge: current.challenge,
        serverTime: current.serverTime,
        officialEntry: current.officialEntry,
        leaderboard: leaderboard.entries,
        weeklyLeaderboard: weekly.entries,
        monthlyLeaderboard: monthly.entries,
        globalLeaderboard: global.entries,
        history: history.entries,
        authLoading: false,
        lastSubmission: null,
        profile: null,
        adminRecentSubmissions: []
      });
    } catch (error) {
      set({ authLoading: false, error: mapError(error) });
      throw error;
    }
  },

  startAttempt: async () => {
    set({ actionLoading: true, error: null });

    try {
      const response = await apiRequest<StartAttemptResponse>('/official/attempts', {
        method: 'POST'
      });
      const current = await apiRequest<OfficialCurrentResponse>('/official/current');
      const [leaderboard, weekly, monthly, global, history, profile, adminTelemetry] = await Promise.all([
        apiRequest<DailyLeaderboardResponse>('/leaderboards/daily/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/weekly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/monthly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/global'),
        apiRequest<RaceHistoryResponse>('/leaderboards/history'),
        current.user
          ? apiRequest<ProfileResponse>('/profiles/me').catch(() => null)
          : Promise.resolve(null),
        current.user?.role === 'admin'
          ? apiRequest<AdminTelemetryResponse>('/admin/submissions/recent').catch(() => ({ entries: [] }))
          : Promise.resolve({ entries: [] })
      ]);
      set({
        challenge: current.challenge,
        serverTime: current.serverTime,
        officialEntry: current.officialEntry,
        leaderboard: leaderboard.entries,
        weeklyLeaderboard: weekly.entries,
        monthlyLeaderboard: monthly.entries,
        globalLeaderboard: global.entries,
        history: history.entries,
        profile,
        adminRecentSubmissions: adminTelemetry.entries,
        actionLoading: false
      });
      return response;
    } catch (error) {
      set({ actionLoading: false, error: mapError(error) });
      throw error;
    }
  },

  submitAttempt: async (attemptId, payload) => {
    set({ actionLoading: true, error: null });

    try {
      const response = await apiRequest<SubmitAttemptResponse>(
        `/official/attempts/${attemptId}/submit`,
        {
          method: 'POST',
          body: payload
        }
      );
      const current = await apiRequest<OfficialCurrentResponse>('/official/current');
      const [leaderboard, weekly, monthly, global, history, profile, adminTelemetry] = await Promise.all([
        apiRequest<DailyLeaderboardResponse>('/leaderboards/daily/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/weekly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/monthly/current'),
        apiRequest<PointsLeaderboardResponse>('/leaderboards/global'),
        apiRequest<RaceHistoryResponse>('/leaderboards/history'),
        current.user
          ? apiRequest<ProfileResponse>('/profiles/me').catch(() => null)
          : Promise.resolve(null),
        current.user?.role === 'admin'
          ? apiRequest<AdminTelemetryResponse>('/admin/submissions/recent').catch(() => ({ entries: [] }))
          : Promise.resolve({ entries: [] })
      ]);
      set({
        challenge: current.challenge,
        serverTime: current.serverTime,
        officialEntry: current.officialEntry,
        leaderboard: leaderboard.entries,
        weeklyLeaderboard: weekly.entries,
        monthlyLeaderboard: monthly.entries,
        globalLeaderboard: global.entries,
        history: history.entries,
        profile,
        adminRecentSubmissions: adminTelemetry.entries,
        actionLoading: false,
        lastSubmission: response.result
      });
      return response;
    } catch (error) {
      set({ actionLoading: false, error: mapError(error) });
      throw error;
    }
  }
}));
