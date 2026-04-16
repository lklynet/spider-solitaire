/// <reference types="node" />

import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineState, replayGame } from '../src/replay.ts';

const findFirstLegalTopMove = (seed: string) => {
  const state = createEngineState(seed);

  for (let fromPileIndex = 0; fromPileIndex < state.tableau.length; fromPileIndex += 1) {
    const fromPile = state.tableau[fromPileIndex];
    if (fromPile.cards.length === 0) continue;

    const cardIndex = fromPile.cards.length - 1;
    const movingCard = fromPile.cards[cardIndex];
    if (!movingCard.faceUp) continue;

    for (let toPileIndex = 0; toPileIndex < state.tableau.length; toPileIndex += 1) {
      if (toPileIndex === fromPileIndex) continue;

      const toPile = state.tableau[toPileIndex];
      if (toPile.cards.length === 0) {
        return { fromPileIndex, toPileIndex, cardIndex };
      }

      const targetCard = toPile.cards[toPile.cards.length - 1];
      if (targetCard.rank === movingCard.rank + 1) {
        return { fromPileIndex, toPileIndex, cardIndex };
      }
    }
  }

  throw new Error('No legal top move found for seed');
};

test('replay rejects a move that starts on a face-down card', () => {
  const result = replayGame('qa-hidden-card-seed', [
    {
      type: 'move',
      fromPileIndex: 0,
      toPileIndex: 1,
      cardIndex: 0
    }
  ]);

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, 'invalid_move');
  }
});

test('replay accepts a legal top-card move from the seeded layout', () => {
  const move = findFirstLegalTopMove('qa-legal-move-seed');
  const result = replayGame('qa-legal-move-seed', [
    {
      type: 'move',
      ...move
    }
  ]);

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.summary.moveCount, 1);
  }
});

test('replay rejects undo before any reversible action exists', () => {
  const result = replayGame('qa-invalid-undo-seed', [{ type: 'undo' }]);

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.reason, 'invalid_undo');
  }
});

test('replay counts hint events without mutating board legality', () => {
  const result = replayGame('qa-hint-seed', [{ type: 'hint' }]);

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.summary.hintCount, 1);
    assert.equal(result.summary.undoCount, 0);
    assert.equal(result.summary.moveCount, 0);
  }
});
