import type { BoardState, Card, GameHistory, Move } from './types';
import { isValidMoveGroup } from './moves';

function checkCompletedRun(pile: Card[]): boolean {
  if (pile.length < 13) return false;

  const lastThirteen = pile.slice(-13);
  if (lastThirteen[0].rank !== 13) return false;

  return isValidMoveGroup(lastThirteen);
}

const cloneStateForHistory = (state: BoardState): GameHistory => ({
  tableau: structuredClone(state.tableau),
  stock: structuredClone(state.stock),
  foundation: state.foundation,
  score: state.score
});

const applyCompletedRun = (tableau: Card[][], pileIndex: number, foundation: number, score: number) => {
  const pile = tableau[pileIndex];
  if (!checkCompletedRun(pile)) return { foundation, score };

  tableau[pileIndex] = pile.slice(0, pile.length - 13);
  const remaining = tableau[pileIndex];

  if (remaining.length > 0) {
    const lastCard = remaining[remaining.length - 1];
    if (!lastCard.faceUp) {
      remaining[remaining.length - 1] = { ...lastCard, faceUp: true };
    }
  }

  return { foundation: foundation + 1, score: score + 100 };
};

export const applyMoveEvent = (state: BoardState, event: Move): BoardState | null => {
  const fromPile = state.tableau[event.fromPileIndex];
  const toPile = state.tableau[event.toPileIndex];
  if (!fromPile || !toPile) return null;

  const cardsToMove = fromPile.slice(event.cardIndex);
  if (cardsToMove.length === 0) return null;
  if (!cardsToMove[0].faceUp) return null;
  if (cardsToMove.some((card) => !card.faceUp)) return null;
  if (!isValidMoveGroup(cardsToMove)) return null;

  if (toPile.length > 0 && toPile[toPile.length - 1].rank !== cardsToMove[0].rank + 1) {
    return null;
  }

  const nextState: BoardState = {
    ...state,
    tableau: structuredClone(state.tableau),
    history: [...state.history, cloneStateForHistory(state)]
  };

  nextState.tableau[event.fromPileIndex] = nextState.tableau[event.fromPileIndex].slice(0, event.cardIndex);
  nextState.tableau[event.toPileIndex] = [
    ...nextState.tableau[event.toPileIndex],
    ...structuredClone(cardsToMove)
  ];

  const fromRemaining = nextState.tableau[event.fromPileIndex];
  if (fromRemaining.length > 0) {
    const lastCard = fromRemaining[fromRemaining.length - 1];
    if (!lastCard.faceUp) {
      fromRemaining[fromRemaining.length - 1] = { ...lastCard, faceUp: true };
    }
  }

  const completion = applyCompletedRun(
    nextState.tableau,
    event.toPileIndex,
    state.foundation,
    state.score - 1
  );

  return {
    ...nextState,
    foundation: completion.foundation,
    score: completion.score,
    moves: state.moves + 1,
    gameWon: completion.foundation === 8
  };
};

export const applyDealEvent = (state: BoardState): BoardState | null => {
  if (state.stock.length === 0) return null;

  const nextState: BoardState = {
    ...state,
    tableau: structuredClone(state.tableau),
    stock: structuredClone(state.stock),
    history: [...state.history, cloneStateForHistory(state)]
  };

  for (let pileIndex = 0; pileIndex < 10; pileIndex += 1) {
    if (nextState.stock.length === 0) break;
    const card = nextState.stock.pop();
    if (!card) return null;
    card.faceUp = true;
    nextState.tableau[pileIndex].push(card);

    const completion = applyCompletedRun(
      nextState.tableau,
      pileIndex,
      nextState.foundation,
      nextState.score
    );
    nextState.foundation = completion.foundation;
    nextState.score = completion.score;
  }

  return { ...nextState, gameWon: nextState.foundation === 8 };
};

export const applyUndoEvent = (state: BoardState): BoardState | null => {
  if (state.history.length === 0) return null;

  const previous = state.history[state.history.length - 1];
  return {
    ...state,
    tableau: structuredClone(previous.tableau),
    stock: structuredClone(previous.stock),
    foundation: previous.foundation,
    score: previous.score,
    history: state.history.slice(0, -1),
    moves: state.moves + 1,
    gameWon: false
  };
};
