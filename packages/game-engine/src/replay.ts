import type {
  GameHistory,
  InitialGameLayout,
  ReplayEvent,
  ReplaySummary,
  Suit,
  TableauPile
} from '@spider/shared-types';
import { createInitialGameLayout } from './deck.js';
import { checkCompletedRun, isValidMoveGroup } from './rules.js';

interface EngineState extends InitialGameLayout {
  foundation: Suit[];
  score: number;
  moves: number;
  gameWon: boolean;
  history: GameHistory[];
}

const cloneTableau = (tableau: TableauPile[]) => JSON.parse(JSON.stringify(tableau)) as TableauPile[];

const cloneStateForHistory = (state: EngineState): GameHistory => ({
  tableau: cloneTableau(state.tableau),
  stock: JSON.parse(JSON.stringify(state.stock)),
  foundation: [...state.foundation],
  score: state.score
});

export const createEngineState = (seed: string): EngineState => {
  const { tableau, stock } = createInitialGameLayout(seed);

  return {
    tableau,
    stock,
    foundation: [],
    score: 500,
    moves: 0,
    gameWon: false,
    history: []
  };
};

const applyCompletedRun = (tableau: TableauPile[], pileIndex: number, foundation: Suit[], score: number) => {
  const targetPile = tableau[pileIndex];
  if (!checkCompletedRun(targetPile.cards)) {
    return { foundation, score };
  }

  const completedSuit = targetPile.cards[targetPile.cards.length - 1].suit;
  targetPile.cards = targetPile.cards.slice(0, targetPile.cards.length - 13);
  foundation.push(completedSuit);

  if (targetPile.cards.length > 0) {
    const lastCard = targetPile.cards[targetPile.cards.length - 1];
    if (!lastCard.faceUp) {
      targetPile.cards[targetPile.cards.length - 1] = { ...lastCard, faceUp: true };
    }
  }

  return {
    foundation,
    score: score + 100
  };
};

export const applyMoveEvent = (state: EngineState, event: Extract<ReplayEvent, { type: 'move' }>) => {
  const fromPile = state.tableau[event.fromPileIndex];
  const toPile = state.tableau[event.toPileIndex];
  if (!fromPile || !toPile) return null;

  const cardsToMove = fromPile.cards.slice(event.cardIndex);
  if (cardsToMove.length === 0) return null;
  if (!cardsToMove[0].faceUp) return null;
  if (cardsToMove.some((card) => !card.faceUp)) return null;
  if (!isValidMoveGroup(cardsToMove)) return null;

  if (toPile.cards.length > 0) {
    const targetCard = toPile.cards[toPile.cards.length - 1];
    const movingCard = cardsToMove[0];
    if (targetCard.rank !== movingCard.rank + 1) return null;
  }

  const nextState: EngineState = {
    ...state,
    tableau: cloneTableau(state.tableau),
    history: [...state.history, cloneStateForHistory(state)]
  };

  nextState.tableau[event.fromPileIndex].cards = nextState.tableau[event.fromPileIndex].cards.slice(
    0,
    event.cardIndex
  );
  nextState.tableau[event.toPileIndex].cards = [
    ...nextState.tableau[event.toPileIndex].cards,
    ...JSON.parse(JSON.stringify(cardsToMove))
  ];

  if (nextState.tableau[event.fromPileIndex].cards.length > 0) {
    const lastCard =
      nextState.tableau[event.fromPileIndex].cards[nextState.tableau[event.fromPileIndex].cards.length - 1];
    if (!lastCard.faceUp) {
      nextState.tableau[event.fromPileIndex].cards[
        nextState.tableau[event.fromPileIndex].cards.length - 1
      ] = { ...lastCard, faceUp: true };
    }
  }

  const completion = applyCompletedRun(
    nextState.tableau,
    event.toPileIndex,
    [...state.foundation],
    state.score - 1
  );

  nextState.foundation = completion.foundation;
  nextState.score = completion.score;
  nextState.moves = state.moves + 1;
  nextState.gameWon = completion.foundation.length === 8;

  return nextState;
};

export const applyDealEvent = (state: EngineState) => {
  if (state.stock.length === 0) return null;

  const nextState: EngineState = {
    ...state,
    tableau: cloneTableau(state.tableau),
    stock: JSON.parse(JSON.stringify(state.stock)),
    history: [...state.history, cloneStateForHistory(state)],
    foundation: [...state.foundation],
    score: state.score
  };

  for (let pileIndex = 0; pileIndex < 10; pileIndex += 1) {
    if (nextState.stock.length === 0) break;
    const card = nextState.stock.pop();
    if (!card) return null;
    card.faceUp = true;
    nextState.tableau[pileIndex].cards.push(card);

    const completion = applyCompletedRun(
      nextState.tableau,
      pileIndex,
      nextState.foundation,
      nextState.score
    );
    nextState.foundation = completion.foundation;
    nextState.score = completion.score;
  }

  nextState.gameWon = nextState.foundation.length === 8;
  return nextState;
};

export const applyUndoEvent = (state: EngineState) => {
  if (state.history.length === 0) return null;

  const previous = state.history[state.history.length - 1];
  return {
    ...state,
    tableau: cloneTableau(previous.tableau),
    stock: JSON.parse(JSON.stringify(previous.stock)),
    foundation: [...previous.foundation],
    score: previous.score,
    history: state.history.slice(0, -1),
    moves: state.moves + 1,
    gameWon: false
  };
};

export const replayGame = (seed: string, events: ReplayEvent[]) => {
  let state = createEngineState(seed);
  let hintCount = 0;
  let undoCount = 0;
  let dealCount = 0;

  for (const event of events) {
    if (event.type === 'hint') {
      hintCount += 1;
      continue;
    }

    if (event.type === 'undo') {
      undoCount += 1;
      const nextState = applyUndoEvent(state);
      if (!nextState) {
        return { valid: false as const, reason: 'invalid_undo' };
      }
      state = nextState;
      continue;
    }

    if (event.type === 'deal') {
      dealCount += 1;
      const nextState = applyDealEvent(state);
      if (!nextState) {
        return { valid: false as const, reason: 'invalid_deal' };
      }
      state = nextState;
      continue;
    }

    const nextState = applyMoveEvent(state, event);
    if (!nextState) {
      return { valid: false as const, reason: 'invalid_move' };
    }
    state = nextState;
  }

  const summary: ReplaySummary = {
    isWin: state.gameWon,
    hintCount,
    undoCount,
    moveCount: state.moves,
    dealCount,
    finalScore: state.score,
    foundationCount: state.foundation.length
  };

  return {
    valid: true as const,
    summary
  };
};
