export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface TableauPile {
  id: number;
  cards: Card[];
}

export interface GameHistory {
  tableau: TableauPile[];
  stock: Card[];
  foundation: Suit[];
  score: number;
}

export interface GameState {
  tableau: TableauPile[];
  stock: Card[];
  foundation: Suit[];
  moves: number;
  score: number;
  timer: number;
  isPlaying: boolean;
  isPaused: boolean;
  gameWon: boolean;
  showWinModal: boolean;
  seed: string;
  history: GameHistory[];
  hintSource?: { pileIndex: number; cardIndex: number };
  hintDeck?: boolean;
  hintNewGame?: boolean;
}

export type ReplayEvent =
  | {
      type: 'move';
      fromPileIndex: number;
      toPileIndex: number;
      cardIndex: number;
    }
  | {
      type: 'deal';
    }
  | {
      type: 'undo';
    }
  | {
      type: 'hint';
    };

export interface ReplaySummary {
  isWin: boolean;
  hintCount: number;
  undoCount: number;
  moveCount: number;
  dealCount: number;
  finalScore: number;
  foundationCount: number;
}

export interface MoveAction {
  fromPileIndex: number;
  toPileIndex: number;
  cardIndex: number;
}

export interface InitialGameLayout {
  tableau: TableauPile[];
  stock: Card[];
}
