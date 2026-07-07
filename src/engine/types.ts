export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  rank: Rank;
  faceUp: boolean;
}

export interface GameHistory {
  tableau: Card[][];
  stock: Card[];
  foundation: number;
}

export interface BoardState {
  tableau: Card[][];
  stock: Card[];
  foundation: number;
  moves: number;
  score: number;
  gameWon: boolean;
  history: GameHistory[];
}

export interface Move {
  fromPileIndex: number;
  toPileIndex: number;
  cardIndex: number;
}
