import React from 'react';
import type { Card as CardType } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { cn, getRankString } from '../lib/utils';
import { Heart, Diamond, Club, Spade } from 'lucide-react';

interface CardProps {
  card: CardType;
  index: number;
  pileIndex: number;
  isSelected: boolean;
  isHinted?: boolean;
  isHidden?: boolean;
  onClick: (pileIndex: number, cardIndex: number) => void;
  onDoubleClick?: (pileIndex: number, cardIndex: number) => void;
  style?: React.CSSProperties;
}

const SuitIcon = ({ suit, className }: { suit: string; className?: string }) => {
  switch (suit) {
    case 'hearts': return <Heart className={cn("fill-current", className)} />;
    case 'diamonds': return <Diamond className={cn("fill-current", className)} />;
    case 'clubs': return <Club className={cn("fill-current", className)} />;
    case 'spades': return <Spade className={cn("fill-current", className)} />;
    default: return null;
  }
};

export const CardVisual: React.FC<{
  card: CardType;
  isSelected?: boolean;
  isHinted?: boolean;
  isHidden?: boolean;
  cardBack: number;
}> = ({ card, isSelected = false, isHinted = false, isHidden = false, cardBack }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "h-36 w-24 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-opacity duration-150",
          isHidden && "opacity-0",
          `card-back-${cardBack}`
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "h-36 w-24 cursor-pointer select-none touch-none rounded-lg border-2 border-black bg-white transition-[transform,opacity] duration-150",
        "flex flex-col justify-between p-2",
        isHidden && "opacity-0",
        isSelected ? "ring-4 ring-yellow-400 -translate-y-2 z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1",
        isHinted && !isSelected && "ring-4 ring-blue-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1",
        isRed ? "text-red-600" : "text-black"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col items-center leading-none">
          <span className="text-xl font-bold">{getRankString(card.rank)}</span>
          <SuitIcon suit={card.suit} className="h-4 w-4" />
        </div>
      </div>

      <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-20">
         <SuitIcon suit={card.suit} className="h-16 w-16" />
      </div>

      <div className="flex justify-between items-end rotate-180">
        <div className="flex flex-col items-center leading-none">
          <span className="text-xl font-bold">{getRankString(card.rank)}</span>
          <SuitIcon suit={card.suit} className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

export const Card: React.FC<CardProps> = ({
  card,
  index,
  pileIndex,
  isSelected,
  isHinted,
  isHidden,
  onClick,
  onDoubleClick,
  style
}) => {
  const { cardBack } = useGameStore();

  return (
    <div
      data-card-id={card.id}
      className="absolute"
      style={{
        top: card.faceUp ? index * 30 : index * 12,
        zIndex: index,
        ...style
      }}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        if (e.detail >= 2) {
          onDoubleClick?.(pileIndex, index);
          return;
        }
        onClick(pileIndex, index);
      }}
    >
      <CardVisual
        card={card}
        isSelected={isSelected}
        isHinted={isHinted}
        isHidden={isHidden}
        cardBack={cardBack}
      />
    </div>
  );
};
