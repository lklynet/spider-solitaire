import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createBoardState } from '@/engine/deck';
import { applyDealEvent, applyMoveEvent, applyUndoEvent } from '@/engine/replay';
import { pickAutoMoveTarget } from '@/engine/moves';
import type { BoardState, Card, GameHistory } from '@/engine/types';

export interface LastWinSummary {
  score: number;
  time: number;
  moves: number;
  previousBestTime: number | null;
  previousLeastMoves: number | null;
}

export const CARD_BACK_COUNT = 3;

const STORAGE_VERSION = 8;

const randomSeed = () => Math.random().toString(36).substring(7);

const normalizeTableau = (raw: unknown): Card[][] => {
  if (!Array.isArray(raw)) return Array.from({ length: 10 }, () => []);
  return raw.map((pile) => (Array.isArray(pile) ? structuredClone(pile as Card[]) : []));
};

interface GameSnapshot extends BoardState {
  timer: number;
  playingSince: number | null;
  isPlaying: boolean;
  isPaused: boolean;
  seed: string;
  cardBack: number;
  colorScheme: string;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  bestScore: number;
  bestTime: number | null;
  leastMoves: number | null;
  lastWinSummary: LastWinSummary | null;
}

interface GameStore extends GameSnapshot {
  getTimer: () => number;
  initializeGame: (seed?: string) => void;
  moveCards: (fromPileIndex: number, toPileIndex: number, cardIndex: number) => void;
  dealFromStock: () => void;
  undo: () => void;
  togglePause: () => void;
  restartGame: () => void;
  autoMoveCard: (fromPileIndex: number, cardIndex: number) => boolean;
  setCardBack: (id: number) => void;
  setColorScheme: (scheme: string) => void;
  recordLoss: () => void;
}

const uiDefaults = (): Omit<GameSnapshot, keyof BoardState | 'seed'> => ({
  timer: 0,
  playingSince: null,
  isPlaying: false,
  isPaused: false,
  cardBack: 1,
  colorScheme: 'default',
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestScore: 0,
  bestTime: null,
  leastMoves: null,
  lastWinSummary: null
});

const newGameSnapshot = (seed = randomSeed()): GameSnapshot => ({
  ...createBoardState(seed),
  ...uiDefaults(),
  seed
});

const elapsedSeconds = (state: GameSnapshot) => {
  if (state.playingSince && state.isPlaying && !state.isPaused && !state.gameWon) {
    return state.timer + Math.floor((Date.now() - state.playingSince) / 1000);
  }
  return state.timer;
};

const freezeTimer = (state: GameSnapshot): Pick<GameSnapshot, 'timer' | 'playingSince'> => {
  if (!state.playingSince) return { timer: state.timer, playingSince: null };
  return {
    timer: state.timer + Math.floor((Date.now() - state.playingSince) / 1000),
    playingSince: null
  };
};

type PreservedProgress = Pick<
  GameSnapshot,
  | 'cardBack'
  | 'colorScheme'
  | 'gamesPlayed'
  | 'gamesWon'
  | 'currentStreak'
  | 'bestStreak'
  | 'bestScore'
  | 'bestTime'
  | 'leastMoves'
  | 'lastWinSummary'
>;

const parseProgress = (raw: Record<string, unknown>): PreservedProgress => ({
  cardBack:
    typeof raw.cardBack === 'number' ? Math.min(Math.max(raw.cardBack, 1), CARD_BACK_COUNT) : 1,
  colorScheme: typeof raw.colorScheme === 'string' ? raw.colorScheme : 'default',
  gamesPlayed: typeof raw.gamesPlayed === 'number' ? raw.gamesPlayed : 0,
  gamesWon: typeof raw.gamesWon === 'number' ? raw.gamesWon : 0,
  currentStreak: typeof raw.currentStreak === 'number' ? raw.currentStreak : 0,
  bestStreak: typeof raw.bestStreak === 'number' ? raw.bestStreak : 0,
  bestScore: typeof raw.bestScore === 'number' ? raw.bestScore : 0,
  bestTime: typeof raw.bestTime === 'number' ? raw.bestTime : null,
  leastMoves: typeof raw.leastMoves === 'number' ? raw.leastMoves : null,
  lastWinSummary:
    raw.lastWinSummary && typeof raw.lastWinSummary === 'object'
      ? structuredClone(raw.lastWinSummary as LastWinSummary)
      : null
});

const preservedProgress = (state: GameSnapshot): PreservedProgress => ({
  cardBack: state.cardBack,
  colorScheme: state.colorScheme,
  gamesPlayed: state.gamesPlayed,
  gamesWon: state.gamesWon,
  currentStreak: state.currentStreak,
  bestStreak: state.bestStreak,
  bestScore: state.bestScore,
  bestTime: state.bestTime,
  leastMoves: state.leastMoves,
  lastWinSummary: state.lastWinSummary
});

const loadSavedState = (raw: Record<string, unknown>): GameSnapshot => {
  if (!Array.isArray(raw.tableau) || !Array.isArray(raw.stock) || typeof raw.seed !== 'string') {
    return newGameSnapshot();
  }

  if (raw.gameWon) {
    return { ...newGameSnapshot(), ...parseProgress(raw) };
  }

  const loaded: GameSnapshot = {
    ...newGameSnapshot(raw.seed),
    tableau: normalizeTableau(raw.tableau),
    stock: structuredClone(raw.stock as Card[]),
    foundation: typeof raw.foundation === 'number' ? raw.foundation : 0,
    moves: typeof raw.moves === 'number' ? raw.moves : 0,
    score: typeof raw.score === 'number' ? raw.score : 500,
    timer: typeof raw.timer === 'number' ? raw.timer : 0,
    playingSince: null,
    isPlaying: Boolean(raw.isPlaying),
    isPaused: raw.isPlaying ? true : Boolean(raw.isPaused),
    history: Array.isArray(raw.history) ? structuredClone(raw.history as GameHistory[]) : [],
    ...parseProgress(raw)
  };

  if (loaded.isPlaying && !loaded.isPaused) {
    loaded.playingSince = Date.now();
  }

  return loaded;
};

const recordGameStart = (state: GameSnapshot): Partial<GameSnapshot> => ({
  gamesPlayed: state.gamesPlayed + 1,
  playingSince: state.playingSince ?? Date.now()
});

const recordWin = (state: GameSnapshot, score: number, time: number, moves: number): Partial<GameSnapshot> => {
  const nextStreak = state.currentStreak + 1;
  return {
    gamesWon: state.gamesWon + 1,
    currentStreak: nextStreak,
    bestStreak: Math.max(state.bestStreak, nextStreak),
    bestScore: Math.max(state.bestScore, score),
    bestTime: state.bestTime === null ? time : Math.min(state.bestTime, time),
    leastMoves: state.leastMoves === null ? moves : Math.min(state.leastMoves, moves),
    lastWinSummary: {
      score,
      time,
      moves,
      previousBestTime: state.bestTime,
      previousLeastMoves: state.leastMoves
    }
  };
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...newGameSnapshot(),

      getTimer: () => elapsedSeconds(get()),

      setCardBack: (id) => set({ cardBack: Math.min(Math.max(id, 1), CARD_BACK_COUNT) }),
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      recordLoss: () => set({ currentStreak: 0, lastWinSummary: null }),

      initializeGame: (seed) => {
        set({ ...newGameSnapshot(seed ?? randomSeed()), ...preservedProgress(get()) });
      },

      moveCards: (fromPileIndex, toPileIndex, cardIndex) => {
        const before = get();
        const next = applyMoveEvent(before, { fromPileIndex, toPileIndex, cardIndex });
        if (!next) return;

        const firstAction = before.moves === 0;
        const gameWon = next.gameWon;
        const timerState = gameWon ? freezeTimer(before) : {};

        set({
          ...next,
          isPlaying: true,
          isPaused: false,
          playingSince: gameWon ? null : before.playingSince ?? Date.now(),
          ...timerState,
          ...(firstAction ? recordGameStart(before) : {}),
          ...(gameWon ? recordWin({ ...before, ...timerState }, next.score, elapsedSeconds({ ...before, ...timerState }), next.moves) : {})
        });
      },

      dealFromStock: () => {
        const before = get();
        if (before.stock.length === 0) return;

        const next = applyDealEvent(before);
        if (!next) return;

        const firstAction = before.moves === 0;
        const gameWon = next.gameWon;
        const timerState = gameWon ? freezeTimer(before) : {};

        set({
          ...next,
          isPlaying: !gameWon,
          isPaused: false,
          playingSince: gameWon ? null : before.playingSince ?? Date.now(),
          ...timerState,
          ...(firstAction ? recordGameStart(before) : {}),
          ...(gameWon
            ? recordWin({ ...before, ...timerState }, next.score, elapsedSeconds({ ...before, ...timerState }), before.moves)
            : {})
        });
      },

      undo: () => {
        const next = applyUndoEvent(get());
        if (!next) return;

        set({
          ...next,
          isPaused: false,
          isPlaying: true,
          playingSince: get().playingSince ?? Date.now()
        });
      },

      togglePause: () =>
        set((state) => {
          if (state.isPaused) {
            return { isPaused: false, playingSince: Date.now() };
          }
          return { isPaused: true, ...freezeTimer(state) };
        }),

      restartGame: () => {
        get().initializeGame(get().seed);
      },

      autoMoveCard: (fromPileIndex, cardIndex) => {
        const { tableau } = get();
        const targetIndex = pickAutoMoveTarget(tableau, fromPileIndex, cardIndex);
        if (targetIndex === -1) return false;

        get().moveCards(fromPileIndex, targetIndex, cardIndex);
        return true;
      }
    }),
    {
      name: 'spider-solitaire-storage',
      version: STORAGE_VERSION,
      migrate: (persistedState) => (persistedState ?? {}) as Record<string, unknown>,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...loadSavedState((persistedState ?? {}) as Record<string, unknown>)
      }),
      partialize: (state) => ({
        tableau: state.tableau,
        stock: state.stock,
        foundation: state.foundation,
        moves: state.moves,
        score: state.score,
        timer: elapsedSeconds(state),
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
        gameWon: state.gameWon,
        seed: state.seed,
        history: state.history,
        cardBack: state.cardBack,
        colorScheme: state.colorScheme,
        gamesPlayed: state.gamesPlayed,
        gamesWon: state.gamesWon,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        bestScore: state.bestScore,
        bestTime: state.bestTime,
        leastMoves: state.leastMoves,
        lastWinSummary: state.lastWinSummary
      })
    }
  )
);
