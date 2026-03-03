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

export const Card: React.FC<CardProps> = ({ card, index, pileIndex, isSelected, isHinted, onClick, onDoubleClick, style }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const { cardBack } = useGameStore();

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "absolute w-24 h-36 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
          `card-back-${cardBack}`
        )}
        style={{ top: index * 20, ...style }} // Overlap for face down
      />
    );
  }

  return (
    <div
      className={cn(
        "absolute w-24 h-36 bg-white border-2 border-black rounded-lg cursor-pointer transition-transform select-none touch-none",
        "flex flex-col justify-between p-2",
        isSelected ? "ring-4 ring-yellow-400 -translate-y-2 z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1",
        isHinted && !isSelected && "ring-4 ring-blue-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1",
        isRed ? "text-red-600" : "text-black"
      )}
      style={{ 
          top: index * 30, 
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
      <div className="flex justify-between items-start">
        <div className="flex flex-col items-center leading-none">
          <span className="font-bold text-xl">{getRankString(card.rank)}</span>
          <SuitIcon suit={card.suit} className="w-4 h-4" />
        </div>
      </div>

      <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-20">
         <SuitIcon suit={card.suit} className="w-16 h-16" />
      </div>

      <div className="flex justify-between items-end rotate-180">
        <div className="flex flex-col items-center leading-none">
          <span className="font-bold text-xl">{getRankString(card.rank)}</span>
          <SuitIcon suit={card.suit} className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
