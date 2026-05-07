import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, GameState, TableauPile } from '../types/game';
import {
  checkCompletedRun,
  createInitialGameLayout,
  isValidMoveGroup
} from '@spider/game-engine';
import { useStatsStore } from './statsStore';

interface StoredBoardSnapshot extends GameState {
  playMode: 'casual';
}

interface CompletedRunAnimation {
  cards: Card[];
  pileIndex: number;
  foundationIndex: number;
  topOffsets: number[];
}

interface UiAnimation {
  id: number;
  movedCardIds?: string[];
  dealtCardIds?: string[];
  completedRuns?: CompletedRunAnimation[];
}

interface GameStore extends GameState {
  initializeGame: (seed?: string) => void;
  moveCards: (fromPileIndex: number, toPileIndex: number, cardIndex: number) => void;
  dealFromStock: () => void;
  undo: () => void;
  canUndo: () => boolean;
  toggleTimer: () => void;
  togglePause: () => void;
  incrementTimer: () => void;
  restartGame: () => void;
  showHint: () => void;
  autoMoveCard: (fromPileIndex: number, cardIndex: number) => boolean;
  cardBack: number;
  setCardBack: (id: number) => void;
  colorScheme: string;
  setColorScheme: (scheme: string) => void;
  setShowWinModal: (show: boolean) => void;
  playMode: 'casual';
  lastAnimation: UiAnimation | null;
}

const STORAGE_VERSION = 3;

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
  playMode: 'casual'
});

const cloneSnapshot = (snapshot: StoredBoardSnapshot): StoredBoardSnapshot =>
  JSON.parse(JSON.stringify(snapshot)) as StoredBoardSnapshot;

const getCardTopOffsets = (cards: Card[]): number[] => {
  let currentTop = 0;

  return cards.map((card) => {
    const top = currentTop;
    currentTop += card.faceUp ? 30 : 12;
    return top;
  });
};

const createCompletedRunAnimation = (
  cards: Card[],
  pileIndex: number,
  foundationIndex: number
): CompletedRunAnimation => {
  const topOffsets = getCardTopOffsets(cards);

  return {
    cards: JSON.parse(JSON.stringify(cards)),
    pileIndex,
    foundationIndex,
    topOffsets
  };
};

const createSnapshot = (seed = randomSeed()): StoredBoardSnapshot => {
  const { tableau, stock } = createInitialGameLayout(seed);

  return {
    ...createBaseSnapshot(),
    tableau,
    stock,
    seed
  };
};

const createLegacySnapshot = (rawState: Record<string, unknown>): StoredBoardSnapshot => {
  const candidate =
    rawState.practiceBoard && typeof rawState.practiceBoard === 'object'
      ? (rawState.practiceBoard as Record<string, unknown>)
      : rawState;

  if (
    !Array.isArray(candidate.tableau) ||
    !Array.isArray(candidate.stock) ||
    typeof candidate.seed !== 'string'
  ) {
    return createSnapshot();
  }

  return {
    ...createBaseSnapshot(),
    tableau: JSON.parse(JSON.stringify(candidate.tableau)),
    stock: JSON.parse(JSON.stringify(candidate.stock)),
    foundation: Array.isArray(candidate.foundation) ? [...candidate.foundation] : [],
    moves: typeof candidate.moves === 'number' ? candidate.moves : 0,
    score: typeof candidate.score === 'number' ? candidate.score : 500,
    timer: typeof candidate.timer === 'number' ? candidate.timer : 0,
    isPlaying: Boolean(candidate.isPlaying),
    isPaused: Boolean(candidate.isPaused),
    gameWon: Boolean(candidate.gameWon),
    showWinModal: Boolean(candidate.showWinModal),
    seed: candidate.seed,
    history: Array.isArray(candidate.history) ? JSON.parse(JSON.stringify(candidate.history)) : [],
    hintSource:
      candidate.hintSource && typeof candidate.hintSource === 'object'
        ? JSON.parse(JSON.stringify(candidate.hintSource))
        : undefined,
    hintDeck: Boolean(candidate.hintDeck),
    hintNewGame: Boolean(candidate.hintNewGame),
    playMode: 'casual'
  };
};

const initialSnapshot = createSnapshot();

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...cloneSnapshot(initialSnapshot),
      cardBack: 1,
      setCardBack: (id) => set({ cardBack: id }),
      colorScheme: 'default',
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
      setShowWinModal: (show) => set({ showWinModal: show }),
      lastAnimation: null,

      initializeGame: (seed) => {
        set({ ...cloneSnapshot(createSnapshot(seed ?? randomSeed())), lastAnimation: null });
      },

      moveCards: (fromPileIndex, toPileIndex, cardIndex) => {
        const { tableau, history, moves, score, foundation } = get();
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
        const completedRuns: CompletedRunAnimation[] = [];

        const targetPile = newTableau[toPileIndex];
        if (checkCompletedRun(targetPile.cards)) {
          const completedCards = targetPile.cards.slice(targetPile.cards.length - 13);
          const completedSuit = targetPile.cards[targetPile.cards.length - 1].suit;
          completedRuns.push(
            createCompletedRunAnimation(completedCards, toPileIndex, newFoundation.length)
          );

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
          lastAnimation: {
            id: Date.now() + Math.random(),
            movedCardIds: cardsToMove.map((card) => card.id),
            completedRuns
          }
        });

        useStatsStore.getState().recordMove();
      },

      dealFromStock: () => {
        const { stock, tableau, history, foundation, score } = get();
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
        const dealtCardIds: string[] = [];
        const completedRuns: CompletedRunAnimation[] = [];

        for (let i = 0; i < 10; i += 1) {
          if (newStock.length === 0) break;

          const card = newStock.pop()!;
          card.faceUp = true;
          dealtCardIds.push(card.id);
          newTableau[i] = {
            ...newTableau[i],
            cards: [...newTableau[i].cards, card]
          };

          if (checkCompletedRun(newTableau[i].cards)) {
            const completedCards = newTableau[i].cards.slice(newTableau[i].cards.length - 13);
            const completedSuit = newTableau[i].cards[newTableau[i].cards.length - 1].suit;
            completedRuns.push(
              createCompletedRunAnimation(completedCards, i, newFoundation.length)
            );

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
          lastAnimation: {
            id: Date.now() + Math.random(),
            dealtCardIds,
            completedRuns
          }
        });

        useStatsStore.getState().recordDeal();
      },

      undo: () => {
        const { history, moves } = get();
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
          lastAnimation: null
        });

        useStatsStore.getState().recordUndo();
      },

      canUndo: () => get().history.length > 0,

      toggleTimer: () =>
        set((state) => ({ isPlaying: !state.gameWon && !state.isPlaying })),

      togglePause: () =>
        set((state) => ({ isPaused: !state.isPaused })),

      incrementTimer: () =>
        set((state) => ({
          timer:
            state.isPlaying && !state.isPaused && !state.gameWon ? state.timer + 1 : state.timer
        })),

      restartGame: () => {
        const { seed } = get();
        get().initializeGame(seed);
      },

      showHint: () => {
        const { tableau, stock, moves } = get();
        useStatsStore.getState().recordHint();

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
          moves: newMoves
        });

        setTimeout(() => {
          set({ hintSource: undefined, hintDeck: false, hintNewGame: false });
        }, 2000);
      },

      autoMoveCard: (fromPileIndex, cardIndex) => {
        const { tableau } = get();
        const fromPile = tableau[fromPileIndex];
        if (!fromPile || cardIndex >= fromPile.cards.length) return false;

        const cardsToMove = fromPile.cards.slice(cardIndex);
        if (!isValidMoveGroup(cardsToMove)) return false;

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

        if (bestTargetIndex === -1) return false;

        get().moveCards(fromPileIndex, bestTargetIndex, cardIndex);
        return true;
      }
    }),
    {
      name: 'spider-solitaire-storage',
      version: STORAGE_VERSION,
      migrate: (persistedState) => {
        const raw = (persistedState ?? {}) as Record<string, unknown>;
        const migrated = createLegacySnapshot(raw);

        return {
          ...migrated,
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
        cardBack: state.cardBack,
        colorScheme: state.colorScheme
      })
    }
  )
);
