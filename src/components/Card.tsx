import type { CSSProperties, MouseEvent } from 'react';
import type { Card as CardType } from '@/engine/types';
import { useGameStore } from '../store/gameStore';

const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

interface CardProps {
  card: CardType;
  pileIndex: number;
  isSelected: boolean;
  isHinted?: boolean;
  hoverLift: number;
  top: number;
  onClick: (pileIndex: number, cardIndex: number, timeStamp: number) => void;
}

export function Card({
  card,
  index,
  pileIndex,
  isSelected,
  isHinted,
  hoverLift,
  top,
  onClick
}: CardProps & { index: number }) {
  const { cardBack } = useGameStore();
  const cardStyle = {
    '--card-raise': `${hoverLift}px`,
    '--card-selected-raise': `${hoverLift}px`
  } as CSSProperties;
  const rank = RANKS[card.rank] ?? String(card.rank);

  const visual = !card.faceUp ? (
    <div className={`card-back-visual card-back-${cardBack}`} />
  ) : (
    <div
      className={[
        'card-face',
        isSelected ? 'card-face--selected' : '',
        isHinted && !isSelected ? 'card-face--hinted' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      style={cardStyle}
    >
      <div className="card-face__top">
        <div className="card-face__corner">
          <span className="card-face__rank">{rank}</span>
          <span className="card-face__suit">♠</span>
        </div>
      </div>
      <div className="card-face__watermark">♠</div>
      <div className="card-face__bottom">
        <div className="card-face__corner">
          <span className="card-face__rank">{rank}</span>
          <span className="card-face__suit">♠</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="card-slot"
      style={{ top, zIndex: index }}
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        onClick(pileIndex, index, e.timeStamp);
      }}
    >
      {visual}
    </div>
  );
}
