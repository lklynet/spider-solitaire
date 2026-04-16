import type { Card, InitialGameLayout, Rank, Suit, TableauPile } from '@spider/shared-types';
import { SeededRandom } from './random.js';

export const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suitsToUse: Suit[] = [];

  for (let index = 0; index < 8; index += 1) {
    suitsToUse.push('spades');
  }

  suitsToUse.forEach((suit, suitIndex) => {
    for (let rank = 1; rank <= 13; rank += 1) {
      deck.push({
        id: `${suit}-${rank}-${suitIndex}`,
        suit,
        rank: rank as Rank,
        faceUp: false
      });
    }
  });

  return deck;
}

export function shuffleDeck(deck: Card[], seed: string): Card[] {
  const rng = new SeededRandom(seed);
  const shuffled = [...deck];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng.next() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createInitialGameLayout(seed: string): InitialGameLayout {
  const deck = shuffleDeck(createDeck(), seed);
  const tableau: TableauPile[] = Array.from({ length: 10 }, (_, index) => ({
    id: index,
    cards: []
  }));

  let cardIndex = 0;

  for (let pileIndex = 0; pileIndex < 10; pileIndex += 1) {
    const cardCount = pileIndex < 4 ? 6 : 5;

    for (let index = 0; index < cardCount; index += 1) {
      const card = deck[cardIndex];
      cardIndex += 1;
      card.faceUp = index === cardCount - 1;
      tableau[pileIndex].cards.push(card);
    }
  }

  return {
    tableau,
    stock: deck.slice(cardIndex)
  };
}
