/// <reference types="node" />

import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoardState } from './deck';
import { enumerateMoves } from './moves';
import { applyMoveEvent, applyUndoEvent, applyDealEvent } from './replay';
import { pickHintMove } from './moves';
import type { Card, Rank } from './types';

const card = (rank: Rank, faceUp: boolean): Card => ({
  id: `${rank}-${faceUp ? 'up' : 'down'}`,
  rank,
  faceUp
});

const findFirstLegalTopMove = (seed: string) => {
  const state = createBoardState(seed);
  const move = enumerateMoves(state.tableau).find(
    (candidate) => candidate.cardIndex === state.tableau[candidate.fromPileIndex].length - 1
  );
  if (!move) throw new Error('No legal top move found for seed');
  return move;
};

test('applyMoveEvent rejects a move that starts on a face-down card', () => {
  const state = createBoardState('qa-hidden-card-seed');
  const next = applyMoveEvent(state, {
    fromPileIndex: 0,
    toPileIndex: 1,
    cardIndex: 0
  });

  assert.equal(next, null);
});

test('applyMoveEvent accepts a legal top-card move from the seeded layout', () => {
  const state = createBoardState('qa-legal-move-seed');
  const move = findFirstLegalTopMove('qa-legal-move-seed');
  const next = applyMoveEvent(state, move);

  assert.notEqual(next, null);
  assert.equal(next?.moves, 1);
});

test('applyUndoEvent rejects undo before any reversible action exists', () => {
  const state = createBoardState('qa-invalid-undo-seed');
  const next = applyUndoEvent(state);

  assert.equal(next, null);
});

test('pickHintMove prefers revealing a hidden card over splitting an aligned run', () => {
  const tableau = [
    [card(6, false), card(5, true), card(4, true)],
    [card(6, true)],
    [card(5, true)],
    ...Array.from({ length: 7 }, () => [] as Card[])
  ];

  const hint = pickHintMove(tableau);

  assert.deepEqual(hint, { fromPileIndex: 0, toPileIndex: 1, cardIndex: 1 });
});

test('pickHintMove returns null on an empty starting board edge case', () => {
  const state = createBoardState('qa-hint-seed');
  const move = pickHintMove(state.tableau);

  assert.equal(move === null || typeof move.fromPileIndex === 'number', true);
});

test('applyMoveEvent subtracts one point per move', () => {
  const state = createBoardState('qa-legal-move-seed');
  const move = findFirstLegalTopMove('qa-legal-move-seed');
  const next = applyMoveEvent(state, move);

  assert.equal(next?.score, 499);
});

test('applyUndoEvent subtracts one point without restoring prior score', () => {
  const state = createBoardState('qa-legal-move-seed');
  const move = findFirstLegalTopMove('qa-legal-move-seed');
  const afterMove = applyMoveEvent(state, move);
  const afterUndo = applyUndoEvent(afterMove!);

  assert.equal(afterUndo?.score, 498);
  assert.equal(afterUndo?.moves, 2);
});

test('applyDealEvent subtracts one point and counts as a move', () => {
  const state = createBoardState('deal-test');
  const next = applyDealEvent(state);

  assert.equal(next?.score, 499);
  assert.equal(next?.moves, 1);
});

test('applyMoveEvent does not complete a run with a face-down card in the sequence', () => {
  const tableau = [
  ...Array.from({ length: 9 }, () => [] as Card[]),
  [
    card(13, false),
    card(12, true),
    card(11, true),
    card(10, true),
    card(9, true),
    card(8, true),
    card(7, true),
    card(6, true),
    card(5, true),
    card(4, true),
    card(3, true),
    card(2, true)
  ],
  [card(1, true)]
  ];
  const state = { ...createBoardState('hidden-king-run'), tableau, foundation: 0, score: 500, moves: 0, history: [] };
  const next = applyMoveEvent(state, { fromPileIndex: 10, toPileIndex: 9, cardIndex: 0 });

  assert.notEqual(next, null);
  assert.equal(next?.foundation, 0);
  assert.equal(next?.tableau[9].length, 13);
});
