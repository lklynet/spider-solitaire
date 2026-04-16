import type { Card } from '@spider/shared-types';

export function isValidMoveGroup(cards: Card[]): boolean {
  for (let index = 0; index < cards.length - 1; index += 1) {
    if (cards[index].suit !== cards[index + 1].suit) return false;
    if (cards[index].rank !== cards[index + 1].rank + 1) return false;
  }

  return true;
}

export function checkCompletedRun(pile: Card[]): boolean {
  if (pile.length < 13) return false;

  const lastThirteen = pile.slice(-13);
  if (lastThirteen[0].rank !== 13) return false;

  return isValidMoveGroup(lastThirteen);
}
