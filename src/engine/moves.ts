import type { Card, Move } from './types';

export function isValidMoveGroup(cards: Card[]): boolean {
  for (let index = 0; index < cards.length - 1; index += 1) {
    if (cards[index].rank !== cards[index + 1].rank + 1) return false;
  }

  return true;
}

export function enumerateMoves(tableau: Card[][]): Move[] {
  const moves: Move[] = [];

  for (let fromPileIndex = 0; fromPileIndex < tableau.length; fromPileIndex += 1) {
    const fromPile = tableau[fromPileIndex];

    for (let cardIndex = 0; cardIndex < fromPile.length; cardIndex += 1) {
      if (!fromPile[cardIndex].faceUp) continue;

      const cardsToMove = fromPile.slice(cardIndex);
      if (!isValidMoveGroup(cardsToMove)) continue;

      const movingCard = cardsToMove[0];

      for (let toPileIndex = 0; toPileIndex < tableau.length; toPileIndex += 1) {
        if (toPileIndex === fromPileIndex) continue;

        const toPile = tableau[toPileIndex];
        if (toPile.length === 0) {
          if (cardIndex > 0) moves.push({ fromPileIndex, toPileIndex, cardIndex });
        } else if (toPile[toPile.length - 1].rank === movingCard.rank + 1) {
          moves.push({ fromPileIndex, toPileIndex, cardIndex });
        }
      }
    }
  }

  return moves;
}

function scoreHintMove(tableau: Card[][], move: Move) {
  const fromPile = tableau[move.fromPileIndex];
  const cardAbove = move.cardIndex > 0 ? fromPile[move.cardIndex - 1] : null;
  const toPile = tableau[move.toPileIndex];
  let score = 0;

  if (toPile.length === 0) {
    if (move.cardIndex === 0) return -1;
    if (cardAbove?.faceUp) return -1;
    score = 10;
  } else {
    const targetCard = toPile[toPile.length - 1];
    if (cardAbove?.faceUp && cardAbove.rank === targetCard.rank) return -1;
    score = 60;
  }

  if (cardAbove && !cardAbove.faceUp) score += 60;
  if (move.cardIndex === 0 && fromPile.length > 0) score += 15;

  return score;
}

function targetRunLength(pile: Card[]) {
  let runLength = 1;
  for (let index = pile.length - 2; index >= 0; index -= 1) {
    if (pile[index].rank === pile[index + 1].rank + 1) runLength += 1;
    else break;
  }
  return runLength;
}

export function pickHintMove(tableau: Card[][]): Move | null {
  let bestMove: Move | null = null;
  let bestScore = -1;

  for (const move of enumerateMoves(tableau)) {
    const score = scoreHintMove(tableau, move);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export function pickAutoMoveTarget(tableau: Card[][], fromPileIndex: number, cardIndex: number) {
  const candidates = enumerateMoves(tableau).filter(
    (move) => move.fromPileIndex === fromPileIndex && move.cardIndex === cardIndex
  );
  if (candidates.length === 0) return -1;

  let bestTargetIndex = -1;
  let bestScore = -1;

  for (const move of candidates) {
    const pile = tableau[move.toPileIndex];
    const score = pile.length === 0 ? 0 : 1000 + targetRunLength(pile);

    if (score > bestScore) {
      bestScore = score;
      bestTargetIndex = move.toPileIndex;
    }
  }

  return bestTargetIndex;
}
