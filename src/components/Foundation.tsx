import React from 'react';
import type { Suit } from '../types/game';
import { Heart, Diamond, Club, Spade } from 'lucide-react';
import { cn } from '../lib/utils';

interface FoundationProps {
  foundation: Suit[];
  hiddenSlots?: Set<number>;
  slotRefs?: React.MutableRefObject<Array<HTMLDivElement | null>>;
}

const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case 'hearts': return <Heart className={cn("fill-current", className)} />;
    case 'diamonds': return <Diamond className={cn("fill-current", className)} />;
    case 'clubs': return <Club className={cn("fill-current", className)} />;
    case 'spades': return <Spade className={cn("fill-current", className)} />;
    default: return null;
  }
};

export const Foundation: React.FC<FoundationProps> = ({ foundation, hiddenSlots, slotRefs }) => {
  // Always display 8 slots
  const slots = Array.from({ length: 8 }, (_, i) => foundation[i] || null);

  return (
    <div className="flex gap-2">
      {slots.map((suit, index) => {
        const isHidden = hiddenSlots?.has(index) ?? false;
        const visibleSuit = isHidden ? null : suit;

        return (
        <div 
            key={index} 
            ref={(node) => {
              if (slotRefs) {
                slotRefs.current[index] = node;
              }
            }}
            className={cn(
                "flex h-24 w-16 items-center justify-center rounded-lg transition-all",
                visibleSuit 
                    ? "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                    : "border-2 border-dashed border-white/35 bg-white/12"
            )}
        >
            {visibleSuit ? (
                <div className={cn(
                    "flex flex-col items-center",
                    (visibleSuit === 'hearts' || visibleSuit === 'diamonds') ? "text-red-600" : "text-black"
                )}>
                    <span className="text-xl font-bold">K</span>
                    <SuitIcon suit={visibleSuit} className="h-6 w-6" />
                </div>
            ) : (
                <div className="text-base font-bold text-white/35">{index + 1}</div>
            )}
        </div>
        );
      })}
    </div>
  );
};
