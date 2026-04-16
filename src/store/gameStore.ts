import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, ReplayEvent } from '../types/game';
import {
  checkCompletedRun,
  createInitialGameLayout,
  isValidMoveGroup
} from '@spider/game-engine';
import { useStatsStore } from './statsStore';

interface GameStore extends GameState {
  initializeGame: (seed?: string, mode?: 'casual' | 'daily') => void;
  initializeOfficialGame: (seed: string, challengeId: string, attemptId: string) => void;
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
  officialHintCount: number;
  officialUndoCount: number;
  officialReplay: ReplayEvent[];
  clearOfficialMode: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
  tableau: [],
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
  playMode: 'casual',
  officialChallengeId: null,
  officialAttemptId: null,
  officialHintCount: 0,
  officialUndoCount: 0,
  officialReplay: [],
  cardBack: 1,
  setCardBack: (id) => set({ cardBack: id }),
  colorScheme: 'default',
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
  setShowWinModal: (show) => set({ showWinModal: show }),

  initializeGame: (seed, mode = 'casual') => {
    const finalSeed = seed || Math.random().toString(36).substring(7);
    const { tableau, stock } = createInitialGameLayout(finalSeed);

    set({
      tableau,
      stock,
      foundation: [],
      moves: 0,
      score: 500,
      timer: 0,
      isPlaying: false, 
      isPaused: false,
      gameWon: false,
      showWinModal: false,
      seed: finalSeed,
      history: [],
      playMode: mode,
      officialChallengeId: null,
      officialAttemptId: null,
      officialHintCount: 0,
      officialUndoCount: 0,
      officialReplay: []
    });
  },

  initializeOfficialGame: (seed, challengeId, attemptId) => {
    const { tableau, stock } = createInitialGameLayout(seed);

    set({
      tableau,
      stock,
      foundation: [],
      moves: 0,
      score: 500,
      timer: 0,
      isPlaying: false,
      isPaused: false,
      gameWon: false,
      showWinModal: false,
      seed,
      history: [],
      playMode: 'official',
      officialChallengeId: challengeId,
      officialAttemptId: attemptId,
      officialHintCount: 0,
      officialUndoCount: 0,
      officialReplay: []
    });
  },

  moveCards: (fromPileIndex, toPileIndex, cardIndex) => {
    const { tableau, history, moves, score, foundation, playMode } = get();
    const fromPile = tableau[fromPileIndex];
    const toPile = tableau[toPileIndex];
    
    const cardsToMove = fromPile.cards.slice(cardIndex);
    
    // Validation 1: Are cards to move a valid group?
    if (!isValidMoveGroup(cardsToMove)) return;

    // Validation 2: Can we place them on the target pile?
    if (toPile.cards.length > 0) {
        const targetCard = toPile.cards[toPile.cards.length - 1];
        const movingCard = cardsToMove[0];
        
        // Target must be rank + 1
        if (targetCard.rank !== movingCard.rank + 1) return;
    } 
    // If toPile is empty, any move is valid

    // Save state for undo
    const newHistory = [...history, {
        tableau: JSON.parse(JSON.stringify(tableau)),
        stock: JSON.parse(JSON.stringify(get().stock)),
        foundation: [...foundation],
        score
    }];

    // Perform move
    const newTableau = [...tableau];
    
    // Remove from source
    newTableau[fromPileIndex] = {
        ...fromPile,
        cards: fromPile.cards.slice(0, cardIndex)
    };

    // Add to target
    newTableau[toPileIndex] = {
        ...toPile,
        cards: [...toPile.cards, ...cardsToMove]
    };

    // Reveal new top card of source if hidden
    if (newTableau[fromPileIndex].cards.length > 0) {
        const lastCard = newTableau[fromPileIndex].cards[newTableau[fromPileIndex].cards.length - 1];
        if (!lastCard.faceUp) {
            const newCards = [...newTableau[fromPileIndex].cards];
            newCards[newCards.length - 1] = { ...lastCard, faceUp: true };
            newTableau[fromPileIndex].cards = newCards;
        }
    }

    const newFoundation = [...foundation];
    let newScore = score - 1; 

    // Check for completed runs in the target pile
    const targetPile = newTableau[toPileIndex];
    if (checkCompletedRun(targetPile.cards)) {
        // Get suit before removing
        const completedSuit = targetPile.cards[targetPile.cards.length - 1].suit;
        
        // Remove the run
        newTableau[toPileIndex] = {
            ...targetPile,
            cards: targetPile.cards.slice(0, targetPile.cards.length - 13)
        };
        newFoundation.push(completedSuit);
        newScore += 100;
        
        // Reveal new top if needed
        if (newTableau[toPileIndex].cards.length > 0) {
             const lastCard = newTableau[toPileIndex].cards[newTableau[toPileIndex].cards.length - 1];
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

      const newHistory = [...history, {
          tableau: JSON.parse(JSON.stringify(tableau)),
          stock: JSON.parse(JSON.stringify(stock)),
          foundation: [...foundation],
          score
      }];

      const newStock = [...stock];
      const newTableau = [...tableau];
      
      const newFoundation = [...foundation];
      let newScore = score; 

      // Deal 1 card to each pile
      for (let i = 0; i < 10; i++) {
          if (newStock.length > 0) {
              const card = newStock.pop()!;
              card.faceUp = true;
              newTableau[i] = {
                  ...newTableau[i],
                  cards: [...newTableau[i].cards, card]
              };
              
              // Check for completed runs after deal
              if (checkCompletedRun(newTableau[i].cards)) {
                   const completedSuit = newTableau[i].cards[newTableau[i].cards.length - 1].suit;
                   
                   newTableau[i].cards = newTableau[i].cards.slice(0, newTableau[i].cards.length - 13);
                   newFoundation.push(completedSuit);
                   newScore += 100;
                   // Reveal logic
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
          officialAttemptId: get().officialAttemptId
      });
      if (playMode !== 'official') {
        useStatsStore.getState().recordUndo();
      }
  },

  canUndo: () => get().history.length > 0,

  toggleTimer: () => set(state => ({ isPlaying: !state.gameWon && !state.isPlaying })),

  togglePause: () =>
    set(state => {
      if (state.playMode === 'official') return state;
      return { isPaused: !state.isPaused };
    }),
  
  incrementTimer: () => set(state => ({ timer: state.isPlaying && !state.isPaused && !state.gameWon ? state.timer + 1 : state.timer })),
  
  restartGame: () => {
      const { seed, playMode } = get();
      get().initializeGame(seed, playMode === 'daily' ? 'daily' : 'casual');
  },

  showHint: () => {
      const { tableau, stock, moves, playMode } = get();
      if (playMode !== 'official') {
        useStatsStore.getState().recordHint();
      }
      const currentOfficialHintCount = get().officialHintCount;
      
      let bestMove: { source: { pileIndex: number, cardIndex: number }, target: { pileIndex: number } } | null = null;
      let bestScore = -1;

      for (let fromPileIndex = 0; fromPileIndex < 10; fromPileIndex++) {
          const fromPile = tableau[fromPileIndex];
          if (fromPile.cards.length === 0) continue;

          // Check all possible movable stacks from this pile
          for (let i = 0; i < fromPile.cards.length; i++) {
              const card = fromPile.cards[i];
              if (!card.faceUp) continue;

              const cardsToMove = fromPile.cards.slice(i);
              if (!isValidMoveGroup(cardsToMove)) continue;

              const cardAbove = i > 0 ? fromPile.cards[i - 1] : null;

              // Try to move to any other pile
              for (let toPileIndex = 0; toPileIndex < 10; toPileIndex++) {
                  if (fromPileIndex === toPileIndex) continue;
                  
                  const toPile = tableau[toPileIndex];
                  let score = 0;
                  
                  // Case 1: Target is Empty Pile
                  if (toPile.cards.length === 0) {
                      // Prevent moving entire pile to empty pile (useless move)
                      if (i === 0) continue;

                      // Prevent breaking a same-suit run just to move to an empty pile
                      if (cardAbove && cardAbove.faceUp && cardAbove.suit === card.suit) continue;

                      // Moving to empty pile is valid but low priority unless it helps reveal/sort
                      score = 10;
                  } else {
                      const targetCard = toPile.cards[toPile.cards.length - 1];
                      
                      // Check Rank
                      if (targetCard.rank !== card.rank + 1) continue;

                      // Check Redundancy/Lateral Move (The user's specific request)
                      if (cardAbove && cardAbove.faceUp && cardAbove.rank === targetCard.rank) {
                          const isCurrentSuitMatch = cardAbove.suit === card.suit;
                          const isTargetSuitMatch = targetCard.suit === card.suit;
                          
                          // If we are already well-placed (same suit), don't move to worse or equal
                          if (isCurrentSuitMatch) continue; 
                          
                          // If we are poorly placed (diff suit), only move if it improves to same suit
                          if (!isTargetSuitMatch) continue;
                          
                          // If we get here, it's a significant improvement (Unmatched -> Matched)
                          score += 100; 
                      }

                      // Base score for valid move onto a card
                      score += 20;

                      // Bonus for same suit connection
                      if (targetCard.suit === card.suit) {
                          score += 40;
                      }
                  }

                  // Bonus for revealing a face-down card
                  if (cardAbove && !cardAbove.faceUp) {
                      score += 60; 
                  }

                  // Bonus for clearing a pile (leaving it empty)
                  if (i === 0 && fromPile.cards.length > 0) {
                      score += 15;
                  }
                  
                  // Update best move if this one is better
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
      let hintSource: { pileIndex: number; cardIndex: number; } | undefined = undefined;

      if (bestMove) {
          hintSource = bestMove.source;
          newMoves = moves + 1;
      } else {
          // No moves found on tableau
          if (stock.length > 0) {
              hintDeck = true;
              // Dealing is available and is the last option (since no moves on tableau)
              // Do NOT increment moves
          } else {
              hintNewGame = true;
              newMoves = moves + 1;
          }
      }

      set({ 
        hintSource, 
        hintDeck, 
        hintNewGame,
        moves: newMoves,
        officialHintCount: get().playMode === 'official' ? currentOfficialHintCount + 1 : currentOfficialHintCount,
        officialReplay:
          get().playMode === 'official' ? [...get().officialReplay, { type: 'hint' }] : get().officialReplay
      });
      
      // Auto-clear hint after 2 seconds
      setTimeout(() => {
          set({ hintSource: undefined, hintDeck: false, hintNewGame: false });
      }, 2000);
  },

  autoMoveCard: (fromPileIndex, cardIndex) => {
      const { tableau } = get();
      const fromPile = tableau[fromPileIndex];
      if (!fromPile || cardIndex >= fromPile.cards.length) return;

      const cardsToMove = fromPile.cards.slice(cardIndex);
      
      // Must be a valid group to move
      if (!isValidMoveGroup(cardsToMove)) return;

      const movingCard = cardsToMove[0];
      
      let bestTargetIndex = -1;
      let bestScore = -1;

      for (let i = 0; i < 10; i++) {
          if (i === fromPileIndex) continue;
          
          const pile = tableau[i];
          let score = -1;
          
          if (pile.cards.length === 0) {
              // Empty pile is a valid target but lowest priority
              score = 0; 
          } else {
              const targetCard = pile.cards[pile.cards.length - 1];
              
              // Check if move is valid (Rank + 1)
              if (targetCard.rank === movingCard.rank + 1) {
                  // Calculate run length of target pile to break ties
                  // We want to attach to the longest existing chain
                  let runLength = 0;
                  for (let j = pile.cards.length - 1; j >= 0; j--) {
                      const current = pile.cards[j];
                      if (j === pile.cards.length - 1) {
                          runLength = 1;
                          continue;
                      }
                      const next = pile.cards[j + 1];
                      if (current.suit === next.suit && current.rank === next.rank + 1) {
                          runLength++;
                      } else {
                          break;
                      }
                  }

                  // Priority (High) -> Base 1000 + Run Length
                  score = 1000 + runLength;
              }
          }

          // Update best if this move is better
          if (score > bestScore) {
              bestScore = score;
              bestTargetIndex = i;
          }
      }

      if (bestTargetIndex !== -1) {
          get().moveCards(fromPileIndex, bestTargetIndex, cardIndex);
      }
  },

  clearOfficialMode: () =>
      set({
        playMode: 'casual',
        officialChallengeId: null,
        officialAttemptId: null,
        officialHintCount: 0,
        officialUndoCount: 0,
        officialReplay: []
      }),
    }),
    {
      name: 'spider-solitaire-storage',
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
        seed: state.seed,
        history: state.history,
        playMode: state.playMode,
        officialChallengeId: state.officialChallengeId,
        officialAttemptId: state.officialAttemptId,
        officialHintCount: state.officialHintCount,
        officialUndoCount: state.officialUndoCount,
        officialReplay: state.officialReplay,
        hintSource: state.hintSource,
        hintDeck: state.hintDeck,
        hintNewGame: state.hintNewGame,
        cardBack: state.cardBack,
        colorScheme: state.colorScheme
      }),
    }
  )
);
