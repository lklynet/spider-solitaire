import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, startOfWeek } from 'date-fns';

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

const normalizePeriods = (state: StatsStore) => {
  const today = getTodayKey();
  const week = getWeekKey();

  return {
    daily: state.daily.date === today ? state.daily : createDaily(today),
    weekly: state.weekly.week === week ? state.weekly : createWeekly(week)
  };
};

const baseState = (): Omit<
  StatsStore,
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
> => ({
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

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      ...baseState(),

      recordGameStart: () => {
        set((state) => {
          const { daily, weekly } = normalizePeriods(state);
          return {
            gamesPlayed: state.gamesPlayed + 1,
            daily: { ...daily, gamesPlayed: daily.gamesPlayed + 1 },
            weekly: { ...weekly, gamesPlayed: weekly.gamesPlayed + 1 }
          };
        });
      },

      recordWin: (score, time, moves) => {
        set((state) => {
          const { daily, weekly } = normalizePeriods(state);
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
        set((state) => {
          const { daily, weekly } = normalizePeriods(state);
          return {
            currentStreak: 0,
            daily,
            weekly
          };
        });
      },

      recordMove: () => {
        set((state) => {
          const { daily, weekly } = normalizePeriods(state);
          return {
            totalMoves: state.totalMoves + 1,
            daily: { ...daily, moves: daily.moves + 1 },
            weekly: { ...weekly, moves: weekly.moves + 1 }
          };
        });
      },

      recordDeal: () => {
        set((state) => {
          const { daily, weekly } = normalizePeriods(state);
          return {
            totalDeals: state.totalDeals + 1,
            daily: { ...daily, deals: daily.deals + 1 },
            weekly: { ...weekly, deals: weekly.deals + 1 }
          };
        });
      },

      recordHint: () => {
        set((state) => {
          const { daily, weekly } = normalizePeriods(state);
          return {
            totalHints: state.totalHints + 1,
            daily: { ...daily, hints: daily.hints + 1 },
            weekly: { ...weekly, hints: weekly.hints + 1 }
          };
        });
      },

      recordUndo: () => {
        set((state) => {
          const { daily, weekly } = normalizePeriods(state);
          return {
            totalUndos: state.totalUndos + 1,
            daily: { ...daily, undos: daily.undos + 1 },
            weekly: { ...weekly, undos: weekly.undos + 1 }
          };
        });
      },

      markDailyChallengeCompleted: (date) => {
        set((state) => {
          if (state.dailyChallengesCompleted.includes(date)) {
            return state;
          }

          const { daily, weekly } = normalizePeriods(state);
          return {
            dailyChallengesCompleted: [...state.dailyChallengesCompleted, date],
            daily,
            weekly
          };
        });
      },

      refreshPeriods: () => {
        set((state) => normalizePeriods(state));
      },

      resetStats: () => {
        set(baseState());
      }
    }),
    {
      name: 'spider-solitaire-stats'
    }
  )
);
