import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createDeck, shuffleDeck } from '@spider/game-engine';
import type { Rank } from '../types/game';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { createDeck, shuffleDeck };

export function getRankString(rank: Rank): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return rank.toString();
  }
}
