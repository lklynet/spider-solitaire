import { create } from 'zustand';
import { format, startOfWeek } from 'date-fns';

const LEGACY_STORAGE_KEY = 'spider-solitaire-stats';
const GUEST_STORAGE_KEY = 'spider-solitaire-stats:guest';
const getUserStorageKey = (userId: string) => `spider-solitaire-stats:user:${userId}`;
const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');
const getWeekKey = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  bestScore: number;
  bestTime: number | null;
  leastMoves: number | null;
  dailyChallengesCompleted: string[];
}

export interface DailyStats {
  date: string;
  gamesPlayed: number;
  gamesWon: number;
  moves: number;
  deals: number;
  hints: number;
  undos: number;
  bestTime: number | null;
  bestMoves: number | null;
}

export interface WeeklyStats {
  week: string;
  gamesPlayed: number;
  gamesWon: number;
  moves: number;
  deals: number;
  hints: number;
  undos: number;
  bestTime: number | null;
  bestMoves: number | null;
}

interface StatsStore extends GameStats {
  daily: DailyStats;
  weekly: WeeklyStats;
  totalMoves: number;
  totalDeals: number;
  totalHints: number;
  totalUndos: number;
  storageIdentity: string | null;
  setStorageIdentity: (userId: string | null) => void;
  recordGameStart: () => void;
  recordWin: (score: number, time: number, moves: number) => void;
  recordLoss: () => void;
  recordMove: () => void;
  recordDeal: () => void;
  recordHint: () => void;
  recordUndo: () => void;
  markDailyChallengeCompleted: (date: string) => void;
  refreshPeriods: () => void;
  resetStats: () => void;
}

type StatsData = Omit<
  StatsStore,
  | 'storageIdentity'
  | 'setStorageIdentity'
  | 'recordGameStart'
  | 'recordWin'
  | 'recordLoss'
  | 'recordMove'
  | 'recordDeal'
  | 'recordHint'
  | 'recordUndo'
  | 'markDailyChallengeCompleted'
  | 'refreshPeriods'
  | 'resetStats'
>;

const createDaily = (date: string): DailyStats => ({
  date,
  gamesPlayed: 0,
  gamesWon: 0,
  moves: 0,
  deals: 0,
  hints: 0,
  undos: 0,
  bestTime: null,
  bestMoves: null
});

const createWeekly = (week: string): WeeklyStats => ({
  week,
  gamesPlayed: 0,
  gamesWon: 0,
  moves: 0,
  deals: 0,
  hints: 0,
  undos: 0,
  bestTime: null,
  bestMoves: null
});

const baseState = (): StatsData => ({
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestScore: 0,
  bestTime: null,
  leastMoves: null,
  dailyChallengesCompleted: [],
  daily: createDaily(getTodayKey()),
  weekly: createWeekly(getWeekKey()),
  totalMoves: 0,
  totalDeals: 0,
  totalHints: 0,
  totalUndos: 0
});

const normalizePeriods = (state: StatsData) => {
  const today = getTodayKey();
  const week = getWeekKey();

  return {
    daily: state.daily.date === today ? state.daily : createDaily(today),
    weekly: state.weekly.week === week ? state.weekly : createWeekly(week)
  };
};

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getStorageKey = (userId: string | null) => (userId ? getUserStorageKey(userId) : GUEST_STORAGE_KEY);

const extractStatsData = (state: StatsStore | StatsData): StatsData => ({
  gamesPlayed: state.gamesPlayed,
  gamesWon: state.gamesWon,
  currentStreak: state.currentStreak,
  bestStreak: state.bestStreak,
  bestScore: state.bestScore,
  bestTime: state.bestTime,
  leastMoves: state.leastMoves,
  dailyChallengesCompleted: [...state.dailyChallengesCompleted],
  daily: { ...state.daily },
  weekly: { ...state.weekly },
  totalMoves: state.totalMoves,
  totalDeals: state.totalDeals,
  totalHints: state.totalHints,
  totalUndos: state.totalUndos
});

const readStoredStats = (userId: string | null): StatsData => {
  if (!canUseStorage()) {
    return baseState();
  }

  const key = getStorageKey(userId);
  const primary = window.localStorage.getItem(key);
  const legacy = !userId ? window.localStorage.getItem(LEGACY_STORAGE_KEY) : null;
  const raw = primary ?? legacy;

  if (!raw) {
    return baseState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const source: Partial<StatsData> =
      parsed &&
      typeof parsed === 'object' &&
      'state' in parsed &&
      parsed.state &&
      typeof parsed.state === 'object'
        ? (parsed.state as Partial<StatsData>)
        : ((parsed as Partial<StatsData>) ?? {});
    const merged = {
      ...baseState(),
      ...source,
      daily: {
        ...createDaily(getTodayKey()),
        ...(source.daily ?? {})
      },
      weekly: {
        ...createWeekly(getWeekKey()),
        ...(source.weekly ?? {})
      },
      dailyChallengesCompleted: Array.isArray(source.dailyChallengesCompleted)
        ? [...source.dailyChallengesCompleted]
        : []
    } satisfies StatsData;

    const normalized = {
      ...merged,
      ...normalizePeriods(merged)
    } satisfies StatsData;

    if (!primary && legacy && !userId) {
      window.localStorage.setItem(key, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    return baseState();
  }
};

const writeStoredStats = (userId: string | null, state: StatsData) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(extractStatsData(state)));
};

export const useStatsStore = create<StatsStore>((set) => {
  const updateAndPersist = (updater: (state: StatsStore) => Partial<StatsStore> | StatsStore) => {
    set((state) => {
      const nextPartial = updater(state);
      const nextState = {
        ...state,
        ...nextPartial
      };

      writeStoredStats(nextState.storageIdentity, extractStatsData(nextState));
      return nextPartial;
    });
  };

  return {
    ...readStoredStats(null),
    storageIdentity: null,

    setStorageIdentity: (userId) => {
      const nextData = readStoredStats(userId);
      set({
        ...nextData,
        storageIdentity: userId
      });
    },

    recordGameStart: () => {
      updateAndPersist((state) => {
        const current = extractStatsData(state);
        const { daily, weekly } = normalizePeriods(current);
        return {
          gamesPlayed: state.gamesPlayed + 1,
          daily: { ...daily, gamesPlayed: daily.gamesPlayed + 1 },
          weekly: { ...weekly, gamesPlayed: weekly.gamesPlayed + 1 }
        };
      });
    },

    recordWin: (score, time, moves) => {
      updateAndPersist((state) => {
        const current = extractStatsData(state);
        const { daily, weekly } = normalizePeriods(current);
        const nextStreak = state.currentStreak + 1;

        return {
          gamesWon: state.gamesWon + 1,
          currentStreak: nextStreak,
          bestStreak: Math.max(state.bestStreak, nextStreak),
          bestScore: Math.max(state.bestScore, score),
          bestTime: state.bestTime === null ? time : Math.min(state.bestTime, time),
          leastMoves: state.leastMoves === null ? moves : Math.min(state.leastMoves, moves),
          daily: {
            ...daily,
            gamesWon: daily.gamesWon + 1,
            bestTime: daily.bestTime === null ? time : Math.min(daily.bestTime, time),
            bestMoves: daily.bestMoves === null ? moves : Math.min(daily.bestMoves, moves)
          },
          weekly: {
            ...weekly,
            gamesWon: weekly.gamesWon + 1,
            bestTime: weekly.bestTime === null ? time : Math.min(weekly.bestTime, time),
            bestMoves: weekly.bestMoves === null ? moves : Math.min(weekly.bestMoves, moves)
          }
        };
      });
    },

    recordLoss: () => {
      updateAndPersist((state) => {
        const current = extractStatsData(state);
        const { daily, weekly } = normalizePeriods(current);
        return {
          currentStreak: 0,
          daily,
          weekly
        };
      });
    },

    recordMove: () => {
      updateAndPersist((state) => {
        const current = extractStatsData(state);
        const { daily, weekly } = normalizePeriods(current);
        return {
          totalMoves: state.totalMoves + 1,
          daily: { ...daily, moves: daily.moves + 1 },
          weekly: { ...weekly, moves: weekly.moves + 1 }
        };
      });
    },

    recordDeal: () => {
      updateAndPersist((state) => {
        const current = extractStatsData(state);
        const { daily, weekly } = normalizePeriods(current);
        return {
          totalDeals: state.totalDeals + 1,
          daily: { ...daily, deals: daily.deals + 1 },
          weekly: { ...weekly, deals: weekly.deals + 1 }
        };
      });
    },

    recordHint: () => {
      updateAndPersist((state) => {
        const current = extractStatsData(state);
        const { daily, weekly } = normalizePeriods(current);
        return {
          totalHints: state.totalHints + 1,
          daily: { ...daily, hints: daily.hints + 1 },
          weekly: { ...weekly, hints: weekly.hints + 1 }
        };
      });
    },

    recordUndo: () => {
      updateAndPersist((state) => {
        const current = extractStatsData(state);
        const { daily, weekly } = normalizePeriods(current);
        return {
          totalUndos: state.totalUndos + 1,
          daily: { ...daily, undos: daily.undos + 1 },
          weekly: { ...weekly, undos: weekly.undos + 1 }
        };
      });
    },

    markDailyChallengeCompleted: (date) => {
      updateAndPersist((state) => {
        if (state.dailyChallengesCompleted.includes(date)) {
          return state;
        }

        const current = extractStatsData(state);
        const { daily, weekly } = normalizePeriods(current);
        return {
          dailyChallengesCompleted: [...state.dailyChallengesCompleted, date],
          daily,
          weekly
        };
      });
    },

    refreshPeriods: () => {
      updateAndPersist((state) => {
        const current = extractStatsData(state);
        return normalizePeriods(current);
      });
    },

    resetStats: () => {
      updateAndPersist((state) => ({
        ...baseState(),
        storageIdentity: state.storageIdentity
      }));
    }
  };
});
