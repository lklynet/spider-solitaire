import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, startOfWeek } from 'date-fns';

export type AchievementType = 'all-time' | 'daily' | 'weekly';
export type AchievementComparison = 'gte' | 'lte' | 'eq';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type AchievementMetric =
  | 'gamesPlayed'
  | 'gamesWon'
  | 'bestStreak'
  | 'bestScore'
  | 'bestTime'
  | 'leastMoves'
  | 'totalMoves'
  | 'totalDeals'
  | 'dailyChallengesCompleted'
  | 'daily.gamesPlayed'
  | 'daily.gamesWon'
  | 'daily.bestTime'
  | 'daily.bestMoves'
  | 'daily.deals'
  | 'daily.moves'
  | 'daily.challengeCompleted'
  | 'weekly.gamesPlayed'
  | 'weekly.gamesWon'
  | 'weekly.bestTime'
  | 'weekly.bestMoves'
  | 'weekly.deals'
  | 'weekly.moves';

export interface AchievementTierDefinition {
  target: number;
  points: number;
  tier: AchievementTier;
}

export interface AchievementChainDefinition {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  metric: AchievementMetric;
  comparison: AchievementComparison;
  tiers: AchievementTierDefinition[];
}

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');
const getWeekKey = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

export const allTimeAchievementChains: AchievementChainDefinition[] = [
  {
    id: 'games-played',
    title: 'Table Regular',
    description: 'Play more games to advance',
    type: 'all-time',
    metric: 'gamesPlayed',
    comparison: 'gte',
    tiers: [
      { target: 1, points: 50, tier: 'bronze' },
      { target: 10, points: 80, tier: 'bronze' },
      { target: 50, points: 140, tier: 'silver' },
      { target: 200, points: 260, tier: 'gold' }
    ]
  },
  {
    id: 'games-won',
    title: 'House Favorite',
    description: 'Keep racking up wins',
    type: 'all-time',
    metric: 'gamesWon',
    comparison: 'gte',
    tiers: [
      { target: 1, points: 80, tier: 'bronze' },
      { target: 10, points: 140, tier: 'silver' },
      { target: 50, points: 280, tier: 'gold' }
    ]
  },
  {
    id: 'win-streak',
    title: 'Streak Crusher',
    description: 'Build longer win streaks',
    type: 'all-time',
    metric: 'bestStreak',
    comparison: 'gte',
    tiers: [
      { target: 3, points: 90, tier: 'bronze' },
      { target: 7, points: 170, tier: 'silver' },
      { target: 14, points: 320, tier: 'gold' }
    ]
  },
  {
    id: 'best-time',
    title: 'Speedy Finish',
    description: 'Win faster to climb tiers',
    type: 'all-time',
    metric: 'bestTime',
    comparison: 'lte',
    tiers: [
      { target: 900, points: 120, tier: 'silver' },
      { target: 600, points: 200, tier: 'gold' },
      { target: 360, points: 320, tier: 'platinum' }
    ]
  },
  {
    id: 'least-moves',
    title: 'Perfect Table',
    description: 'Win with fewer moves',
    type: 'all-time',
    metric: 'leastMoves',
    comparison: 'lte',
    tiers: [
      { target: 200, points: 120, tier: 'silver' },
      { target: 160, points: 200, tier: 'gold' },
      { target: 130, points: 320, tier: 'platinum' }
    ]
  },
  {
    id: 'best-score',
    title: 'Score Hunter',
    description: 'Push your best score higher',
    type: 'all-time',
    metric: 'bestScore',
    comparison: 'gte',
    tiers: [
      { target: 1200, points: 120, tier: 'silver' },
      { target: 1600, points: 220, tier: 'gold' },
      { target: 2000, points: 360, tier: 'platinum' }
    ]
  },
  {
    id: 'total-moves',
    title: 'Marathon Mover',
    description: 'Stack up total moves',
    type: 'all-time',
    metric: 'totalMoves',
    comparison: 'gte',
    tiers: [
      { target: 2000, points: 140, tier: 'silver' },
      { target: 10000, points: 300, tier: 'gold' }
    ]
  },
  {
    id: 'total-deals',
    title: 'High Stakes Dealer',
    description: 'Deal from stock consistently',
    type: 'all-time',
    metric: 'totalDeals',
    comparison: 'gte',
    tiers: [
      { target: 50, points: 140, tier: 'silver' },
      { target: 200, points: 320, tier: 'gold' }
    ]
  },
  {
    id: 'daily-challenges',
    title: 'Daily Royalty',
    description: 'Complete daily challenges over time',
    type: 'all-time',
    metric: 'dailyChallengesCompleted',
    comparison: 'gte',
    tiers: [
      { target: 1, points: 80, tier: 'bronze' },
      { target: 10, points: 200, tier: 'gold' },
      { target: 30, points: 360, tier: 'platinum' }
    ]
  }
];

export const dailyAchievementChains: AchievementChainDefinition[] = [
  {
    id: 'daily-plays',
    title: 'Daily Grinder',
    description: 'Play games today',
    type: 'daily',
    metric: 'daily.gamesPlayed',
    comparison: 'gte',
    tiers: [
      { target: 1, points: 25, tier: 'bronze' },
      { target: 3, points: 45, tier: 'silver' },
      { target: 5, points: 70, tier: 'gold' }
    ]
  },
  {
    id: 'daily-wins',
    title: 'Daily Victor',
    description: 'Win games today',
    type: 'daily',
    metric: 'daily.gamesWon',
    comparison: 'gte',
    tiers: [
      { target: 1, points: 40, tier: 'silver' },
      { target: 2, points: 70, tier: 'gold' },
      { target: 3, points: 110, tier: 'platinum' }
    ]
  },
  {
    id: 'daily-speed',
    title: 'Daily Speedrun',
    description: 'Win fast today',
    type: 'daily',
    metric: 'daily.bestTime',
    comparison: 'lte',
    tiers: [
      { target: 900, points: 60, tier: 'silver' },
      { target: 600, points: 90, tier: 'gold' }
    ]
  },
  {
    id: 'daily-precision',
    title: 'Daily Precision',
    description: 'Win in fewer moves today',
    type: 'daily',
    metric: 'daily.bestMoves',
    comparison: 'lte',
    tiers: [
      { target: 170, points: 70, tier: 'gold' },
      { target: 150, points: 110, tier: 'platinum' }
    ]
  },
  {
    id: 'daily-deals',
    title: 'Daily Dealer',
    description: 'Deal from stock today',
    type: 'daily',
    metric: 'daily.deals',
    comparison: 'gte',
    tiers: [
      { target: 5, points: 35, tier: 'bronze' },
      { target: 10, points: 60, tier: 'silver' }
    ]
  },
  {
    id: 'daily-moves',
    title: 'Daily Marathon',
    description: 'Make moves today',
    type: 'daily',
    metric: 'daily.moves',
    comparison: 'gte',
    tiers: [
      { target: 400, points: 55, tier: 'silver' },
      { target: 700, points: 90, tier: 'gold' }
    ]
  },
  {
    id: 'daily-challenge',
    title: 'Daily Challenge',
    description: 'Complete today’s daily seed',
    type: 'daily',
    metric: 'daily.challengeCompleted',
    comparison: 'gte',
    tiers: [
      { target: 1, points: 80, tier: 'gold' }
    ]
  }
];

export const weeklyAchievementChains: AchievementChainDefinition[] = [
  {
    id: 'weekly-plays',
    title: 'Weekly Regular',
    description: 'Play games this week',
    type: 'weekly',
    metric: 'weekly.gamesPlayed',
    comparison: 'gte',
    tiers: [
      { target: 5, points: 70, tier: 'bronze' },
      { target: 12, points: 110, tier: 'silver' },
      { target: 20, points: 180, tier: 'gold' }
    ]
  },
  {
    id: 'weekly-wins',
    title: 'Weekly Champion',
    description: 'Win games this week',
    type: 'weekly',
    metric: 'weekly.gamesWon',
    comparison: 'gte',
    tiers: [
      { target: 3, points: 120, tier: 'silver' },
      { target: 7, points: 200, tier: 'gold' },
      { target: 12, points: 320, tier: 'platinum' }
    ]
  },
  {
    id: 'weekly-speed',
    title: 'Weekly Speed',
    description: 'Win fast this week',
    type: 'weekly',
    metric: 'weekly.bestTime',
    comparison: 'lte',
    tiers: [
      { target: 600, points: 140, tier: 'gold' },
      { target: 480, points: 220, tier: 'platinum' }
    ]
  },
  {
    id: 'weekly-precision',
    title: 'Weekly Precision',
    description: 'Win in fewer moves this week',
    type: 'weekly',
    metric: 'weekly.bestMoves',
    comparison: 'lte',
    tiers: [
      { target: 160, points: 160, tier: 'gold' },
      { target: 140, points: 240, tier: 'platinum' }
    ]
  },
  {
    id: 'weekly-deals',
    title: 'Weekly Dealer',
    description: 'Deal from stock this week',
    type: 'weekly',
    metric: 'weekly.deals',
    comparison: 'gte',
    tiers: [
      { target: 20, points: 90, tier: 'silver' },
      { target: 40, points: 150, tier: 'gold' }
    ]
  },
  {
    id: 'weekly-moves',
    title: 'Weekly Marathon',
    description: 'Make moves this week',
    type: 'weekly',
    metric: 'weekly.moves',
    comparison: 'gte',
    tiers: [
      { target: 2000, points: 150, tier: 'gold' },
      { target: 3500, points: 240, tier: 'platinum' }
    ]
  }
];

export const achievementChains = [
  ...allTimeAchievementChains,
  ...dailyAchievementChains,
  ...weeklyAchievementChains
];

export const rankLevels = [
  { name: 'Bronze I', minPoints: 0 },
  { name: 'Bronze II', minPoints: 150 },
  { name: 'Silver I', minPoints: 350 },
  { name: 'Silver II', minPoints: 700 },
  { name: 'Gold I', minPoints: 1200 },
  { name: 'Gold II', minPoints: 1800 },
  { name: 'Platinum', minPoints: 2600 },
  { name: 'Diamond', minPoints: 3600 },
  { name: 'Mythic', minPoints: 4800 },
  { name: 'Ascendant', minPoints: 6200 }
];

export const getRankInfo = (points: number) => {
  const currentIndex = rankLevels.findIndex((level, index) => {
    const next = rankLevels[index + 1];
    if (!next) return true;
    return points >= level.minPoints && points < next.minPoints;
  });
  const current = rankLevels[Math.max(0, currentIndex)];
  const next = rankLevels[currentIndex + 1];
  const progress = next
    ? Math.min(1, (points - current.minPoints) / (next.minPoints - current.minPoints))
    : 1;
  return { current, next, progress };
};

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

export interface AchievementToast {
  id: string;
  chainId: string;
  title: string;
  tier: AchievementTier;
  points: number;
  type: AchievementType;
}

interface StatsStore extends GameStats {
  daily: DailyStats;
  weekly: WeeklyStats;
  totalMoves: number;
  totalDeals: number;
  totalHints: number;
  totalUndos: number;
  rankPoints: number;
  allTimeAchievementProgress: Record<string, number>;
  dailyAchievementProgress: Record<string, number>;
  weeklyAchievementProgress: Record<string, number>;
  achievementToasts: AchievementToast[];
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
  dismissAchievementToast: (id: string) => void;
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

const getMetricValue = (state: StatsStore, metric: AchievementMetric) => {
  switch (metric) {
    case 'gamesPlayed':
      return state.gamesPlayed;
    case 'gamesWon':
      return state.gamesWon;
    case 'bestStreak':
      return state.bestStreak;
    case 'bestScore':
      return state.bestScore;
    case 'bestTime':
      return state.bestTime ?? 0;
    case 'leastMoves':
      return state.leastMoves ?? 0;
    case 'totalMoves':
      return state.totalMoves;
    case 'totalDeals':
      return state.totalDeals;
    case 'dailyChallengesCompleted':
      return state.dailyChallengesCompleted.length;
    case 'daily.gamesPlayed':
      return state.daily.gamesPlayed;
    case 'daily.gamesWon':
      return state.daily.gamesWon;
    case 'daily.bestTime':
      return state.daily.bestTime ?? 0;
    case 'daily.bestMoves':
      return state.daily.bestMoves ?? 0;
    case 'daily.deals':
      return state.daily.deals;
    case 'daily.moves':
      return state.daily.moves;
    case 'daily.challengeCompleted':
      return state.dailyChallengesCompleted.includes(state.daily.date) ? 1 : 0;
    case 'weekly.gamesPlayed':
      return state.weekly.gamesPlayed;
    case 'weekly.gamesWon':
      return state.weekly.gamesWon;
    case 'weekly.bestTime':
      return state.weekly.bestTime ?? 0;
    case 'weekly.bestMoves':
      return state.weekly.bestMoves ?? 0;
    case 'weekly.deals':
      return state.weekly.deals;
    case 'weekly.moves':
      return state.weekly.moves;
    default:
      return 0;
  }
};

const getCompletedTierCount = (
  value: number,
  comparison: AchievementComparison,
  tiers: AchievementTierDefinition[]
) => {
  let completed = 0;
  for (let i = 0; i < tiers.length; i += 1) {
    const target = tiers[i].target;
    if (comparison === 'lte') {
      if (value > 0 && value <= target) completed += 1;
    } else if (comparison === 'eq') {
      if (value === target) completed += 1;
    } else if (value >= target) {
      completed += 1;
    }
  }
  return completed;
};

export const getAchievementChainStatus = (state: StatsStore, chain: AchievementChainDefinition) => {
  const value = getMetricValue(state, chain.metric);
  const completedCount = getCompletedTierCount(value, chain.comparison, chain.tiers);
  const nextTier = chain.tiers[Math.min(completedCount, chain.tiers.length - 1)];
  return {
    value,
    completedCount,
    nextTier,
    isComplete: completedCount >= chain.tiers.length
  };
};

export const getAchievementChainProgressRatio = (state: StatsStore, chain: AchievementChainDefinition) => {
  const status = getAchievementChainStatus(state, chain);
  if (status.isComplete) return 1;
  const target = status.nextTier.target;
  if (chain.comparison === 'lte') {
    if (!status.value) return 0;
    return Math.min(1, target / status.value);
  }
  if (chain.comparison === 'eq') {
    return status.value === target ? 1 : 0;
  }
  return Math.min(1, status.value / target);
};

const applyAchievementUpdates = (state: StatsStore, emitToasts = true) => {
  const allTimeProgress = { ...state.allTimeAchievementProgress };
  const dailyProgress = { ...state.dailyAchievementProgress };
  const weeklyProgress = { ...state.weeklyAchievementProgress };
  let rankPoints = state.rankPoints;
  const unlockedAchievements: AchievementToast[] = [];

  for (const chain of achievementChains) {
    const value = getMetricValue(state, chain.metric);
    const completedCount = getCompletedTierCount(value, chain.comparison, chain.tiers);
    if (chain.type === 'all-time') {
      const previousCount = allTimeProgress[chain.id] ?? 0;
      if (completedCount > previousCount) {
        if (emitToasts) {
          for (const tier of chain.tiers.slice(previousCount, completedCount)) {
            unlockedAchievements.push({
              id: `${chain.id}-${tier.tier}-${tier.target}-${Date.now()}-${Math.random()}`,
              chainId: chain.id,
              title: chain.title,
              tier: tier.tier,
              points: tier.points,
              type: chain.type
            });
          }
        }
        const earned = chain.tiers.slice(previousCount, completedCount).reduce((sum, tier) => sum + tier.points, 0);
        rankPoints += earned;
        allTimeProgress[chain.id] = completedCount;
      }
      continue;
    }
    if (chain.type === 'daily') {
      const previousCount = dailyProgress[chain.id] ?? 0;
      if (completedCount > previousCount) {
        if (emitToasts) {
          for (const tier of chain.tiers.slice(previousCount, completedCount)) {
            unlockedAchievements.push({
              id: `${chain.id}-${tier.tier}-${tier.target}-${Date.now()}-${Math.random()}`,
              chainId: chain.id,
              title: chain.title,
              tier: tier.tier,
              points: tier.points,
              type: chain.type
            });
          }
        }
        const earned = chain.tiers.slice(previousCount, completedCount).reduce((sum, tier) => sum + tier.points, 0);
        rankPoints += earned;
        dailyProgress[chain.id] = completedCount;
      }
      continue;
    }
    if (chain.type === 'weekly') {
      const previousCount = weeklyProgress[chain.id] ?? 0;
      if (completedCount > previousCount) {
        if (emitToasts) {
          for (const tier of chain.tiers.slice(previousCount, completedCount)) {
            unlockedAchievements.push({
              id: `${chain.id}-${tier.tier}-${tier.target}-${Date.now()}-${Math.random()}`,
              chainId: chain.id,
              title: chain.title,
              tier: tier.tier,
              points: tier.points,
              type: chain.type
            });
          }
        }
        const earned = chain.tiers.slice(previousCount, completedCount).reduce((sum, tier) => sum + tier.points, 0);
        rankPoints += earned;
        weeklyProgress[chain.id] = completedCount;
      }
    }
  }

  return {
    rankPoints,
    allTimeAchievementProgress: allTimeProgress,
    dailyAchievementProgress: dailyProgress,
    weeklyAchievementProgress: weeklyProgress,
    unlockedAchievements
  };
};

const normalizePeriods = (state: StatsStore) => {
  const today = getTodayKey();
  const week = getWeekKey();
  const dailyReset = state.daily.date !== today;
  const weeklyReset = state.weekly.week !== week;
  return {
    daily: dailyReset ? createDaily(today) : state.daily,
    weekly: weeklyReset ? createWeekly(week) : state.weekly,
    dailyAchievementProgress: dailyReset ? {} : state.dailyAchievementProgress,
    weeklyAchievementProgress: weeklyReset ? {} : state.weeklyAchievementProgress
  };
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
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
      totalUndos: 0,
      rankPoints: 0,
      allTimeAchievementProgress: {},
      dailyAchievementProgress: {},
      weeklyAchievementProgress: {},
      achievementToasts: [],

      recordGameStart: () => {
        set(state => {
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          const nextDaily = { ...daily, gamesPlayed: daily.gamesPlayed + 1 };
          const nextWeekly = { ...weekly, gamesPlayed: weekly.gamesPlayed + 1 };
          const nextState = {
            ...state,
            gamesPlayed: state.gamesPlayed + 1,
            daily: nextDaily,
            weekly: nextWeekly,
            dailyAchievementProgress,
            weeklyAchievementProgress
          };
          const achievementUpdates = applyAchievementUpdates(nextState);
          return {
            gamesPlayed: nextState.gamesPlayed,
            daily: nextDaily,
            weekly: nextWeekly,
            rankPoints: achievementUpdates.rankPoints,
            allTimeAchievementProgress: achievementUpdates.allTimeAchievementProgress,
            dailyAchievementProgress: achievementUpdates.dailyAchievementProgress,
            weeklyAchievementProgress: achievementUpdates.weeklyAchievementProgress,
            achievementToasts: [
              ...state.achievementToasts,
              ...achievementUpdates.unlockedAchievements
            ]
          };
        });
      },

      recordWin: (score, time, moves) => {
        set(state => {
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          const newStreak = state.currentStreak + 1;
          const nextDaily = {
            ...daily,
            gamesWon: daily.gamesWon + 1,
            bestTime: daily.bestTime === null ? time : Math.min(daily.bestTime, time),
            bestMoves: daily.bestMoves === null ? moves : Math.min(daily.bestMoves, moves)
          };
          const nextWeekly = {
            ...weekly,
            gamesWon: weekly.gamesWon + 1,
            bestTime: weekly.bestTime === null ? time : Math.min(weekly.bestTime, time),
            bestMoves: weekly.bestMoves === null ? moves : Math.min(weekly.bestMoves, moves)
          };
          const nextState = {
            ...state,
            gamesWon: state.gamesWon + 1,
            currentStreak: newStreak,
            bestStreak: Math.max(state.bestStreak, newStreak),
            bestScore: Math.max(state.bestScore, score),
            bestTime: state.bestTime === null ? time : Math.min(state.bestTime, time),
            leastMoves: state.leastMoves === null ? moves : Math.min(state.leastMoves, moves),
            daily: nextDaily,
            weekly: nextWeekly,
            dailyAchievementProgress,
            weeklyAchievementProgress
          };
          const achievementUpdates = applyAchievementUpdates(nextState);
          return {
            gamesWon: nextState.gamesWon,
            currentStreak: nextState.currentStreak,
            bestStreak: nextState.bestStreak,
            bestScore: nextState.bestScore,
            bestTime: nextState.bestTime,
            leastMoves: nextState.leastMoves,
            daily: nextDaily,
            weekly: nextWeekly,
            rankPoints: achievementUpdates.rankPoints,
            allTimeAchievementProgress: achievementUpdates.allTimeAchievementProgress,
            dailyAchievementProgress: achievementUpdates.dailyAchievementProgress,
            weeklyAchievementProgress: achievementUpdates.weeklyAchievementProgress,
            achievementToasts: [
              ...state.achievementToasts,
              ...achievementUpdates.unlockedAchievements
            ]
          };
        });
      },

      recordLoss: () => {
        set(state => {
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          return { currentStreak: 0, daily, weekly, dailyAchievementProgress, weeklyAchievementProgress };
        });
      },

      recordMove: () => {
        set(state => {
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          const nextDaily = { ...daily, moves: daily.moves + 1 };
          const nextWeekly = { ...weekly, moves: weekly.moves + 1 };
          const nextState = {
            ...state,
            totalMoves: state.totalMoves + 1,
            daily: nextDaily,
            weekly: nextWeekly,
            dailyAchievementProgress,
            weeklyAchievementProgress
          };
          const achievementUpdates = applyAchievementUpdates(nextState);
          return {
            totalMoves: nextState.totalMoves,
            daily: nextDaily,
            weekly: nextWeekly,
            rankPoints: achievementUpdates.rankPoints,
            allTimeAchievementProgress: achievementUpdates.allTimeAchievementProgress,
            dailyAchievementProgress: achievementUpdates.dailyAchievementProgress,
            weeklyAchievementProgress: achievementUpdates.weeklyAchievementProgress,
            achievementToasts: [
              ...state.achievementToasts,
              ...achievementUpdates.unlockedAchievements
            ]
          };
        });
      },

      recordDeal: () => {
        set(state => {
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          const nextDaily = { ...daily, deals: daily.deals + 1 };
          const nextWeekly = { ...weekly, deals: weekly.deals + 1 };
          const nextState = {
            ...state,
            totalDeals: state.totalDeals + 1,
            daily: nextDaily,
            weekly: nextWeekly,
            dailyAchievementProgress,
            weeklyAchievementProgress
          };
          const achievementUpdates = applyAchievementUpdates(nextState);
          return {
            totalDeals: nextState.totalDeals,
            daily: nextDaily,
            weekly: nextWeekly,
            rankPoints: achievementUpdates.rankPoints,
            allTimeAchievementProgress: achievementUpdates.allTimeAchievementProgress,
            dailyAchievementProgress: achievementUpdates.dailyAchievementProgress,
            weeklyAchievementProgress: achievementUpdates.weeklyAchievementProgress,
            achievementToasts: [
              ...state.achievementToasts,
              ...achievementUpdates.unlockedAchievements
            ]
          };
        });
      },

      recordHint: () => {
        set(state => {
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          const nextDaily = { ...daily, hints: daily.hints + 1 };
          const nextWeekly = { ...weekly, hints: weekly.hints + 1 };
          const nextState = {
            ...state,
            totalHints: state.totalHints + 1,
            daily: nextDaily,
            weekly: nextWeekly,
            dailyAchievementProgress,
            weeklyAchievementProgress
          };
          const achievementUpdates = applyAchievementUpdates(nextState);
          return {
            totalHints: state.totalHints + 1,
            daily: nextDaily,
            weekly: nextWeekly,
            dailyAchievementProgress: achievementUpdates.dailyAchievementProgress,
            weeklyAchievementProgress: achievementUpdates.weeklyAchievementProgress,
            allTimeAchievementProgress: achievementUpdates.allTimeAchievementProgress,
            rankPoints: achievementUpdates.rankPoints,
            achievementToasts: [
              ...state.achievementToasts,
              ...achievementUpdates.unlockedAchievements
            ]
          };
        });
      },

      recordUndo: () => {
        set(state => {
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          const nextDaily = { ...daily, undos: daily.undos + 1 };
          const nextWeekly = { ...weekly, undos: weekly.undos + 1 };
          const nextState = {
            ...state,
            totalUndos: state.totalUndos + 1,
            daily: nextDaily,
            weekly: nextWeekly,
            dailyAchievementProgress,
            weeklyAchievementProgress
          };
          const achievementUpdates = applyAchievementUpdates(nextState);
          return {
            totalUndos: state.totalUndos + 1,
            daily: nextDaily,
            weekly: nextWeekly,
            dailyAchievementProgress: achievementUpdates.dailyAchievementProgress,
            weeklyAchievementProgress: achievementUpdates.weeklyAchievementProgress,
            allTimeAchievementProgress: achievementUpdates.allTimeAchievementProgress,
            rankPoints: achievementUpdates.rankPoints,
            achievementToasts: [
              ...state.achievementToasts,
              ...achievementUpdates.unlockedAchievements
            ]
          };
        });
      },

      markDailyChallengeCompleted: (date: string) => {
        set(state => {
          if (state.dailyChallengesCompleted.includes(date)) return {};
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          const nextState = {
            ...state,
            dailyChallengesCompleted: [...state.dailyChallengesCompleted, date],
            daily,
            weekly,
            dailyAchievementProgress,
            weeklyAchievementProgress
          };
          const achievementUpdates = applyAchievementUpdates(nextState);
          return {
            dailyChallengesCompleted: nextState.dailyChallengesCompleted,
            daily,
            weekly,
            rankPoints: achievementUpdates.rankPoints,
            allTimeAchievementProgress: achievementUpdates.allTimeAchievementProgress,
            dailyAchievementProgress: achievementUpdates.dailyAchievementProgress,
            weeklyAchievementProgress: achievementUpdates.weeklyAchievementProgress,
            achievementToasts: [
              ...state.achievementToasts,
              ...achievementUpdates.unlockedAchievements
            ]
          };
        });
      },

      refreshPeriods: () => {
        set(state => {
          const { daily, weekly, dailyAchievementProgress, weeklyAchievementProgress } = normalizePeriods(state);
          const nextState = {
            ...state,
            daily,
            weekly,
            dailyAchievementProgress,
            weeklyAchievementProgress
          };
          const achievementUpdates = applyAchievementUpdates(nextState, false);
          return {
            daily,
            weekly,
            rankPoints: achievementUpdates.rankPoints,
            allTimeAchievementProgress: achievementUpdates.allTimeAchievementProgress,
            dailyAchievementProgress: achievementUpdates.dailyAchievementProgress,
            weeklyAchievementProgress: achievementUpdates.weeklyAchievementProgress
          };
        });
      },

      resetStats: () => {
        set({
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
          totalUndos: 0,
          rankPoints: 0,
          allTimeAchievementProgress: {},
          dailyAchievementProgress: {},
          weeklyAchievementProgress: {},
          achievementToasts: []
        });
      },

      dismissAchievementToast: (id: string) => {
        set(state => ({
          achievementToasts: state.achievementToasts.filter(toast => toast.id !== id)
        }));
      }
    }),
    {
      name: 'spider-solitaire-stats'
    }
  )
);
