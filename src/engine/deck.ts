import type { BoardState, Card, Rank } from './types';

const seededRandom = (seed: string) => {
  let state = 0xdeadbeef;
  for (let index = 0; index < seed.length; index += 1) {
    state = Math.imul(state ^ seed.charCodeAt(index), 2654435761);
  }
  state = (state ^ (state >>> 16)) >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

function createDeck(): Card[] {
  return Array.from({ length: 8 }, (_, deckIndex) =>
    Array.from({ length: 13 }, (_, rankIndex) => ({
      id: `${rankIndex + 1}-${deckIndex}`,
      rank: (rankIndex + 1) as Rank,
      faceUp: false
    }))
  ).flat();
}

function shuffleDeck(deck: Card[], seed: string): Card[] {
  const next = seededRandom(seed);
  const shuffled = [...deck];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(next() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createInitialGameLayout(seed: string) {
  const deck = shuffleDeck(createDeck(), seed);
  const tableau: Card[][] = Array.from({ length: 10 }, () => []);

  let cardIndex = 0;

  for (let pileIndex = 0; pileIndex < 10; pileIndex += 1) {
    const cardCount = pileIndex < 4 ? 6 : 5;

    for (let index = 0; index < cardCount; index += 1) {
      const card = deck[cardIndex];
      cardIndex += 1;
      card.faceUp = index === cardCount - 1;
      tableau[pileIndex].push(card);
    }
  }

  return { tableau, stock: deck.slice(cardIndex) };
}

export function createBoardState(seed: string): BoardState {
  const { tableau, stock } = createInitialGameLayout(seed);
  return {
    tableau,
    stock,
    foundation: 0,
    score: 500,
    moves: 0,
    gameWon: false,
    history: []
  };
}
