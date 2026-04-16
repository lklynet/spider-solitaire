import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, ReplayEvent, TableauPile } from '../types/game';
import {
  checkCompletedRun,
  createInitialGameLayout,
  isValidMoveGroup
} from '@spider/game-engine';
import { useStatsStore } from './statsStore';

type PracticeMode = 'casual' | 'daily';
type BoardSurface = 'practice' | 'official';

export interface OfficialSubmissionSnapshot {
  attemptId: string;
  challengeId: string;
  challengeDate: string | null;
  submittedAt: string;
  rawTimeMs: number;
  adjustedTimeMs: number;
  hintCount: number;
  undoCount: number;
  isWin: boolean;
  verificationStatus: string;
}

interface StoredBoardSnapshot extends GameState {
  playMode: 'casual' | 'daily' | 'official';
  officialChallengeId: string | null;
  officialAttemptId: string | null;
  officialChallengeDate: string | null;
  officialHintCount: number;
  officialUndoCount: number;
  officialReplay: ReplayEvent[];
  officialSubmission: OfficialSubmissionSnapshot | null;
}

interface GameStore extends GameState {
  initializeGame: (seed?: string, mode?: PracticeMode) => void;
  initializeOfficialGame: (
    seed: string,
    challengeId: string,
    attemptId: string,
    challengeDate: string,
    ownerId: string
  ) => void;
  moveCards: (fromPileIndex: number, toPileIndex: number, cardIndex: number) => void;
  dealFromStock: () => void;
  undo: () => void;
  canUndo: () => boolean;
  toggleTimer: () => void;
  togglePause: () => void;
  incrementTimer: () => void;
  restartGame: () => void;
  showHint: () => void;
  autoMoveCard: (fromPileIndex: number, cardIndex: number) => void;
  cardBack: number;
  setCardBack: (id: number) => void;
  colorScheme: string;
  setColorScheme: (scheme: string) => void;
  setShowWinModal: (show: boolean) => void;
  playMode: 'casual' | 'daily' | 'official';
  officialChallengeId: string | null;
  officialAttemptId: string | null;
  officialChallengeDate: string | null;
  officialHintCount: number;
  officialUndoCount: number;
  officialReplay: ReplayEvent[];
  officialSubmission: OfficialSubmissionSnapshot | null;
  currentSurface: BoardSurface;
  practiceBoard: StoredBoardSnapshot;
  officialBoard: StoredBoardSnapshot | null;
  officialBoardOwnerId: string | null;
  switchToPracticeBoard: () => void;
  switchToOfficialBoard: () => boolean;
  freezeOfficialSubmission: (submission: OfficialSubmissionSnapshot) => void;
  clearOfficialBoard: () => void;
}

const STORAGE_VERSION = 2;

const randomSeed = () => Math.random().toString(36).substring(7);

const createEmptyTableau = (): TableauPile[] =>
  Array.from({ length: 10 }, (_, id) => ({ id, cards: [] }));

const createBaseSnapshot = (): StoredBoardSnapshot => ({
  tableau: createEmptyTableau(),
  stock: [],
  foundation: [],
  moves: 0,
  score: 500,
  timer: 0,
  isPlaying: false,
  isPaused: false,
  gameWon: false,
  showWinModal: false,
  seed: '',
  history: [],
  hintSource: undefined,
  hintDeck: false,
  hintNewGame: false,
  playMode: 'casual',
  officialChallengeId: null,
  officialAttemptId: null,
  officialChallengeDate: null,
  officialHintCount: 0,
  officialUndoCount: 0,
  officialReplay: [],
  officialSubmission: null
});

const cloneSnapshot = (snapshot: StoredBoardSnapshot): StoredBoardSnapshot =>
  JSON.parse(JSON.stringify(snapshot)) as StoredBoardSnapshot;

const createPracticeSnapshot = (
  seed = randomSeed(),
  mode: PracticeMode = 'casual'
): StoredBoardSnapshot => {
  const { tableau, stock } = createInitialGameLayout(seed);
  return {
    ...createBaseSnapshot(),
    tableau,
    stock,
    seed,
    playMode: mode
  };
};

const createOfficialSnapshot = (
  seed: string,
  challengeId: string,
  attemptId: string,
  challengeDate: string
): StoredBoardSnapshot => {
  const { tableau, stock } = createInitialGameLayout(seed);
  return {
    ...createBaseSnapshot(),
    tableau,
    stock,
    seed,
    playMode: 'official',
    officialChallengeId: challengeId,
    officialAttemptId: attemptId,
    officialChallengeDate: challengeDate
  };
};

const snapshotFromState = (state: GameStore): StoredBoardSnapshot => ({
  tableau: JSON.parse(JSON.stringify(state.tableau)),
  stock: JSON.parse(JSON.stringify(state.stock)),
  foundation: [...state.foundation],
  moves: state.moves,
  score: state.score,
  timer: state.timer,
  isPlaying: state.isPlaying,
  isPaused: state.isPaused,
  gameWon: state.gameWon,
  showWinModal: state.showWinModal,
  seed: state.seed,
  history: JSON.parse(JSON.stringify(state.history)),
  hintSource: state.hintSource ? { ...state.hintSource } : undefined,
  hintDeck: state.hintDeck,
  hintNewGame: state.hintNewGame,
  playMode: state.playMode,
  officialChallengeId: state.officialChallengeId,
  officialAttemptId: state.officialAttemptId,
  officialChallengeDate: state.officialChallengeDate,
  officialHintCount: state.officialHintCount,
  officialUndoCount: state.officialUndoCount,
  officialReplay: JSON.parse(JSON.stringify(state.officialReplay)),
  officialSubmission: state.officialSubmission ? { ...state.officialSubmission } : null
});

const applySnapshot = (snapshot: StoredBoardSnapshot) => {
  const next = cloneSnapshot(snapshot);
  return {
    tableau: next.tableau,
    stock: next.stock,
    foundation: next.foundation,
    moves: next.moves,
    score: next.score,
    timer: next.timer,
    isPlaying: next.isPlaying,
    isPaused: next.isPaused,
    gameWon: next.gameWon,
    showWinModal: next.showWinModal,
    seed: next.seed,
    history: next.history,
    hintSource: next.hintSource,
    hintDeck: next.hintDeck,
    hintNewGame: next.hintNewGame,
    playMode: next.playMode,
    officialChallengeId: next.officialChallengeId,
    officialAttemptId: next.officialAttemptId,
    officialChallengeDate: next.officialChallengeDate,
    officialHintCount: next.officialHintCount,
    officialUndoCount: next.officialUndoCount,
    officialReplay: next.officialReplay,
    officialSubmission: next.officialSubmission
  } satisfies Partial<GameStore>;
};

const createLegacySnapshot = (state: Record<string, unknown>): StoredBoardSnapshot => {
  if (!Array.isArray(state.tableau) || !Array.isArray(state.stock) || typeof state.seed !== 'string') {
    return createPracticeSnapshot();
  }

  return {
    ...createBaseSnapshot(),
    tableau: JSON.parse(JSON.stringify(state.tableau)),
    stock: JSON.parse(JSON.stringify(state.stock)),
    foundation: Array.isArray(state.foundation) ? [...state.foundation] : [],
    moves: typeof state.moves === 'number' ? state.moves : 0,
    score: typeof state.score === 'number' ? state.score : 500,
    timer: typeof state.timer === 'number' ? state.timer : 0,
    isPlaying: Boolean(state.isPlaying),
    isPaused: Boolean(state.isPaused),
    gameWon: Boolean(state.gameWon),
    showWinModal: Boolean(state.showWinModal),
    seed: String(state.seed),
    history: Array.isArray(state.history) ? JSON.parse(JSON.stringify(state.history)) : [],
    hintSource:
      state.hintSource && typeof state.hintSource === 'object'
        ? JSON.parse(JSON.stringify(state.hintSource))
        : undefined,
    hintDeck: Boolean(state.hintDeck),
    hintNewGame: Boolean(state.hintNewGame),
    playMode:
      state.playMode === 'daily' || state.playMode === 'official' ? state.playMode : 'casual',
    officialChallengeId:
      typeof state.officialChallengeId === 'string' ? state.officialChallengeId : null,
    officialAttemptId: typeof state.officialAttemptId === 'string' ? state.officialAttemptId : null,
    officialChallengeDate:
      typeof state.officialChallengeDate === 'string' ? state.officialChallengeDate : null,
    officialHintCount: typeof state.officialHintCount === 'number' ? state.officialHintCount : 0,
    officialUndoCount: typeof state.officialUndoCount === 'number' ? state.officialUndoCount : 0,
    officialReplay: Array.isArray(state.officialReplay)
      ? JSON.parse(JSON.stringify(state.officialReplay))
      : [],
    officialSubmission: null
  };
};

const initialPracticeBoard = createPracticeSnapshot();

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...applySnapshot(initialPracticeBoard),
      currentSurface: 'practice',
      practiceBoard: initialPracticeBoard,
      officialBoard: null,
      officialBoardOwnerId: null,
      cardBack: 1,
      setCardBack: (id) => set({ cardBack: id }),
      colorScheme: 'default',
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      setShowWinModal: (show) => set({ showWinModal: show }),

      switchToPracticeBoard: () =>
        set((state) => {
          const currentSnapshot = snapshotFromState(state);
          const practiceBoard =
            state.currentSurface === 'practice' ? currentSnapshot : cloneSnapshot(state.practiceBoard);
          const officialBoard =
            state.currentSurface === 'official' ? currentSnapshot : state.officialBoard;

          return {
            practiceBoard,
            officialBoard,
            currentSurface: 'practice',
            ...applySnapshot(practiceBoard)
          };
        }),

      switchToOfficialBoard: () => {
        const state = get();
        if (!state.officialBoard) {
          return false;
        }

        set(() => {
          const current = get();
          const currentSnapshot = snapshotFromState(current);
          const practiceBoard =
            current.currentSurface === 'practice'
              ? currentSnapshot
              : cloneSnapshot(current.practiceBoard);
          const officialBoard =
            current.currentSurface === 'official'
              ? currentSnapshot
              : cloneSnapshot(current.officialBoard!);

          return {
            practiceBoard,
            officialBoard,
            currentSurface: 'official',
            ...applySnapshot(officialBoard)
          };
        });

        return true;
      },

      initializeGame: (seed, mode = 'casual') => {
        const practiceBoard = createPracticeSnapshot(seed ?? randomSeed(), mode);

        set((state) => ({
          practiceBoard: cloneSnapshot(practiceBoard),
          ...(state.currentSurface === 'practice' ? applySnapshot(practiceBoard) : {})
        }));
      },

      initializeOfficialGame: (seed, challengeId, attemptId, challengeDate, ownerId) => {
        const state = get();
        const practiceBoard =
          state.currentSurface === 'practice'
            ? snapshotFromState(state)
            : cloneSnapshot(state.practiceBoard);
        const officialBoard = createOfficialSnapshot(seed, challengeId, attemptId, challengeDate);

        set({
          practiceBoard,
          officialBoard: cloneSnapshot(officialBoard),
          officialBoardOwnerId: ownerId,
          currentSurface: 'official',
          ...applySnapshot(officialBoard)
        });
      },

      moveCards: (fromPileIndex, toPileIndex, cardIndex) => {
        const { tableau, history, moves, score, foundation, playMode } = get();
        const fromPile = tableau[fromPileIndex];
        const toPile = tableau[toPileIndex];

        const cardsToMove = fromPile.cards.slice(cardIndex);

        if (!isValidMoveGroup(cardsToMove)) return;

        if (toPile.cards.length > 0) {
          const targetCard = toPile.cards[toPile.cards.length - 1];
          const movingCard = cardsToMove[0];
          if (targetCard.rank !== movingCard.rank + 1) return;
        }

        const newHistory = [
          ...history,
          {
            tableau: JSON.parse(JSON.stringify(tableau)),
            stock: JSON.parse(JSON.stringify(get().stock)),
            foundation: [...foundation],
            score
          }
        ];

        const newTableau = [...tableau];

        newTableau[fromPileIndex] = {
          ...fromPile,
          cards: fromPile.cards.slice(0, cardIndex)
        };

        newTableau[toPileIndex] = {
          ...toPile,
          cards: [...toPile.cards, ...cardsToMove]
        };

        if (newTableau[fromPileIndex].cards.length > 0) {
          const lastCard =
            newTableau[fromPileIndex].cards[newTableau[fromPileIndex].cards.length - 1];
          if (!lastCard.faceUp) {
            const newCards = [...newTableau[fromPileIndex].cards];
            newCards[newCards.length - 1] = { ...lastCard, faceUp: true };
            newTableau[fromPileIndex].cards = newCards;
          }
        }

        const newFoundation = [...foundation];
        let newScore = score - 1;

        const targetPile = newTableau[toPileIndex];
        if (checkCompletedRun(targetPile.cards)) {
          const completedSuit = targetPile.cards[targetPile.cards.length - 1].suit;

          newTableau[toPileIndex] = {
            ...targetPile,
            cards: targetPile.cards.slice(0, targetPile.cards.length - 13)
          };
          newFoundation.push(completedSuit);
          newScore += 100;

          if (newTableau[toPileIndex].cards.length > 0) {
            const lastCard =
              newTableau[toPileIndex].cards[newTableau[toPileIndex].cards.length - 1];
            if (!lastCard.faceUp) {
              const newCards = [...newTableau[toPileIndex].cards];
              newCards[newCards.length - 1] = { ...lastCard, faceUp: true };
              newTableau[toPileIndex].cards = newCards;
            }
          }
        }

        const gameWon = newFoundation.length === 8;

        set({
          tableau: newTableau,
          history: newHistory,
          moves: moves + 1,
          score: newScore,
          foundation: newFoundation,
          gameWon,
          showWinModal: gameWon,
          isPlaying: true,
          isPaused: false,
          officialReplay:
            playMode === 'official'
              ? [...get().officialReplay, { type: 'move', fromPileIndex, toPileIndex, cardIndex }]
              : get().officialReplay
        });

        if (playMode !== 'official') {
          useStatsStore.getState().recordMove();
        }
      },

      dealFromStock: () => {
        const { stock, tableau, history, foundation, score, playMode } = get();
        if (stock.length === 0) return;

        const newHistory = [
          ...history,
          {
            tableau: JSON.parse(JSON.stringify(tableau)),
            stock: JSON.parse(JSON.stringify(stock)),
            foundation: [...foundation],
            score
          }
        ];

        const newStock = [...stock];
        const newTableau = [...tableau];

        const newFoundation = [...foundation];
        let newScore = score;

        for (let i = 0; i < 10; i += 1) {
          if (newStock.length > 0) {
            const card = newStock.pop()!;
            card.faceUp = true;
            newTableau[i] = {
              ...newTableau[i],
              cards: [...newTableau[i].cards, card]
            };

            if (checkCompletedRun(newTableau[i].cards)) {
              const completedSuit = newTableau[i].cards[newTableau[i].cards.length - 1].suit;

              newTableau[i].cards = newTableau[i].cards.slice(0, newTableau[i].cards.length - 13);
              newFoundation.push(completedSuit);
              newScore += 100;

              if (newTableau[i].cards.length > 0) {
                const lastCard = newTableau[i].cards[newTableau[i].cards.length - 1];
                if (!lastCard.faceUp) {
                  const newCards = [...newTableau[i].cards];
                  newCards[newCards.length - 1] = { ...lastCard, faceUp: true };
                  newTableau[i].cards = newCards;
                }
              }
            }
          }
        }

        const gameWon = newFoundation.length === 8;

        set({
          stock: newStock,
          tableau: newTableau,
          history: newHistory,
          foundation: newFoundation,
          score: newScore,
          gameWon,
          showWinModal: gameWon,
          isPlaying: !gameWon,
          isPaused: false,
          officialReplay:
            playMode === 'official' ? [...get().officialReplay, { type: 'deal' }] : get().officialReplay
        });

        if (playMode !== 'official') {
          useStatsStore.getState().recordDeal();
        }
      },

      undo: () => {
        const { history, moves, playMode } = get();
        if (history.length === 0) return;

        const previousState = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        set({
          ...previousState,
          history: newHistory,
          moves: moves + 1,
          isPaused: false,
          gameWon: false,
          showWinModal: false,
          isPlaying: true,
          officialHintCount: get().officialHintCount,
          officialUndoCount: get().officialUndoCount + 1,
          officialReplay: [...get().officialReplay, { type: 'undo' }],
          playMode: get().playMode,
          officialChallengeId: get().officialChallengeId,
          officialAttemptId: get().officialAttemptId,
          officialChallengeDate: get().officialChallengeDate,
          officialSubmission: get().officialSubmission
        });

        if (playMode !== 'official') {
          useStatsStore.getState().recordUndo();
        }
      },

      canUndo: () => get().history.length > 0,

      toggleTimer: () =>
        set((state) => ({ isPlaying: !state.gameWon && !state.isPlaying })),

      togglePause: () =>
        set((state) => {
          if (state.playMode === 'official') return state;
          return { isPaused: !state.isPaused };
        }),

      incrementTimer: () =>
        set((state) => ({
          timer:
            state.isPlaying && !state.isPaused && !state.gameWon ? state.timer + 1 : state.timer
        })),

      restartGame: () => {
        const { currentSurface, seed, playMode, officialChallengeId, officialAttemptId, officialChallengeDate } =
          get();

        if (currentSurface === 'official' && playMode === 'official') {
          return;
        }

        get().initializeGame(seed, playMode === 'daily' ? 'daily' : 'casual');

        if (
          currentSurface === 'official' &&
          playMode === 'official' &&
          officialChallengeId &&
          officialAttemptId &&
          officialChallengeDate
        ) {
          get().initializeOfficialGame(
            seed,
            officialChallengeId,
            officialAttemptId,
            officialChallengeDate,
            get().officialBoardOwnerId ?? ''
          );
        }
      },

      showHint: () => {
        const { tableau, stock, moves, playMode } = get();
        if (playMode !== 'official') {
          useStatsStore.getState().recordHint();
        }
        const currentOfficialHintCount = get().officialHintCount;

        let bestMove:
          | { source: { pileIndex: number; cardIndex: number }; target: { pileIndex: number } }
          | null = null;
        let bestScore = -1;

        for (let fromPileIndex = 0; fromPileIndex < 10; fromPileIndex += 1) {
          const fromPile = tableau[fromPileIndex];
          if (fromPile.cards.length === 0) continue;

          for (let i = 0; i < fromPile.cards.length; i += 1) {
            const card = fromPile.cards[i];
            if (!card.faceUp) continue;

            const cardsToMove = fromPile.cards.slice(i);
            if (!isValidMoveGroup(cardsToMove)) continue;

            const cardAbove = i > 0 ? fromPile.cards[i - 1] : null;

            for (let toPileIndex = 0; toPileIndex < 10; toPileIndex += 1) {
              if (fromPileIndex === toPileIndex) continue;

              const toPile = tableau[toPileIndex];
              let score = 0;

              if (toPile.cards.length === 0) {
                if (i === 0) continue;
                if (cardAbove && cardAbove.faceUp && cardAbove.suit === card.suit) continue;
                score = 10;
              } else {
                const targetCard = toPile.cards[toPile.cards.length - 1];

                if (targetCard.rank !== card.rank + 1) continue;

                if (cardAbove && cardAbove.faceUp && cardAbove.rank === targetCard.rank) {
                  const isCurrentSuitMatch = cardAbove.suit === card.suit;
                  const isTargetSuitMatch = targetCard.suit === card.suit;

                  if (isCurrentSuitMatch) continue;
                  if (!isTargetSuitMatch) continue;

                  score += 100;
                }

                score += 20;

                if (targetCard.suit === card.suit) {
                  score += 40;
                }
              }

              if (cardAbove && !cardAbove.faceUp) {
                score += 60;
              }

              if (i === 0 && fromPile.cards.length > 0) {
                score += 15;
              }

              if (score > bestScore) {
                bestScore = score;
                bestMove = {
                  source: { pileIndex: fromPileIndex, cardIndex: i },
                  target: { pileIndex: toPileIndex }
                };
              }
            }
          }
        }

        let newMoves = moves;
        let hintDeck = false;
        let hintNewGame = false;
        let hintSource: { pileIndex: number; cardIndex: number } | undefined;

        if (bestMove) {
          hintSource = bestMove.source;
          newMoves = moves + 1;
        } else if (stock.length > 0) {
          hintDeck = true;
        } else {
          hintNewGame = true;
          newMoves = moves + 1;
        }

        set({
          hintSource,
          hintDeck,
          hintNewGame,
          moves: newMoves,
          officialHintCount:
            get().playMode === 'official' ? currentOfficialHintCount + 1 : currentOfficialHintCount,
          officialReplay:
            get().playMode === 'official'
              ? [...get().officialReplay, { type: 'hint' }]
              : get().officialReplay
        });

        setTimeout(() => {
          set({ hintSource: undefined, hintDeck: false, hintNewGame: false });
        }, 2000);
      },

      autoMoveCard: (fromPileIndex, cardIndex) => {
        const { tableau } = get();
        const fromPile = tableau[fromPileIndex];
        if (!fromPile || cardIndex >= fromPile.cards.length) return;

        const cardsToMove = fromPile.cards.slice(cardIndex);

        if (!isValidMoveGroup(cardsToMove)) return;

        const movingCard = cardsToMove[0];

        let bestTargetIndex = -1;
        let bestScore = -1;

        for (let i = 0; i < 10; i += 1) {
          if (i === fromPileIndex) continue;

          const pile = tableau[i];
          let score = -1;

          if (pile.cards.length === 0) {
            score = 0;
          } else {
            const targetCard = pile.cards[pile.cards.length - 1];

            if (targetCard.rank === movingCard.rank + 1) {
              let runLength = 0;
              for (let j = pile.cards.length - 1; j >= 0; j -= 1) {
                const current = pile.cards[j];
                if (j === pile.cards.length - 1) {
                  runLength = 1;
                  continue;
                }
                const next = pile.cards[j + 1];
                if (current.suit === next.suit && current.rank === next.rank + 1) {
                  runLength += 1;
                } else {
                  break;
                }
              }

              score = 1000 + runLength;
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestTargetIndex = i;
          }
        }

        if (bestTargetIndex !== -1) {
          get().moveCards(fromPileIndex, bestTargetIndex, cardIndex);
        }
      },

      freezeOfficialSubmission: (submission) =>
        set((state) => {
          const officialBoard = {
            ...snapshotFromState(state),
            isPlaying: false,
            isPaused: false,
            showWinModal: false,
            hintSource: undefined,
            hintDeck: false,
            hintNewGame: false,
            officialSubmission: { ...submission }
          } satisfies StoredBoardSnapshot;

          return {
            officialBoard: cloneSnapshot(officialBoard),
            currentSurface: 'official',
            ...applySnapshot(officialBoard)
          };
        }),

      clearOfficialBoard: () =>
        set((state) => {
          const practiceBoard =
            state.currentSurface === 'practice'
              ? snapshotFromState(state)
              : cloneSnapshot(state.practiceBoard);

          if (state.currentSurface === 'official') {
            return {
              practiceBoard,
              officialBoard: null,
              officialBoardOwnerId: null,
              currentSurface: 'practice',
              ...applySnapshot(practiceBoard)
            };
          }

          return {
            practiceBoard,
            officialBoard: null,
            officialBoardOwnerId: null
          };
        })
    }),
    {
      name: 'spider-solitaire-storage',
      version: STORAGE_VERSION,
      migrate: (persistedState, version) => {
        const raw = (persistedState ?? {}) as Record<string, unknown>;

        if (version >= STORAGE_VERSION) {
          return raw;
        }

        const migratedCurrent = createLegacySnapshot(raw);
        const currentSurface = migratedCurrent.playMode === 'official' ? 'official' : 'practice';
        const practiceBoard =
          currentSurface === 'practice' ? migratedCurrent : createPracticeSnapshot();
        const officialBoard = currentSurface === 'official' ? migratedCurrent : null;

        return {
          ...raw,
          ...applySnapshot(migratedCurrent),
          currentSurface,
          practiceBoard,
          officialBoard,
          officialBoardOwnerId: null,
          officialSubmission: null,
          cardBack: typeof raw.cardBack === 'number' ? raw.cardBack : 1,
          colorScheme: typeof raw.colorScheme === 'string' ? raw.colorScheme : 'default'
        };
      },
      partialize: (state) => ({
        tableau: state.tableau,
        stock: state.stock,
        foundation: state.foundation,
        moves: state.moves,
        score: state.score,
        timer: state.timer,
        isPlaying: state.isPlaying,
        isPaused: state.isPaused,
        gameWon: state.gameWon,
        showWinModal: state.showWinModal,
        seed: state.seed,
        history: state.history,
        hintSource: state.hintSource,
        hintDeck: state.hintDeck,
        hintNewGame: state.hintNewGame,
        playMode: state.playMode,
        officialChallengeId: state.officialChallengeId,
        officialAttemptId: state.officialAttemptId,
        officialChallengeDate: state.officialChallengeDate,
        officialHintCount: state.officialHintCount,
        officialUndoCount: state.officialUndoCount,
        officialReplay: state.officialReplay,
        officialSubmission: state.officialSubmission,
        currentSurface: state.currentSurface,
        practiceBoard: state.practiceBoard,
        officialBoard: state.officialBoard,
        officialBoardOwnerId: state.officialBoardOwnerId,
        cardBack: state.cardBack,
        colorScheme: state.colorScheme
      })
    }
  )
);
