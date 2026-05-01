import React from 'react';
import type { Suit } from '../types/game';
import { Heart, Diamond, Club, Spade } from 'lucide-react';
import { cn } from '../lib/utils';

interface FoundationProps {
  foundation: Suit[];
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

export const Foundation: React.FC<FoundationProps> = ({ foundation }) => {
  // Always display 8 slots
  const slots = Array.from({ length: 8 }, (_, i) => foundation[i] || null);

  return (
    <div className="flex gap-2">
      {slots.map((suit, index) => (
        <div 
            key={index} 
            className={cn(
                "flex h-24 w-16 items-center justify-center rounded-lg transition-all",
                suit 
                    ? "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                    : "border-2 border-dashed border-white/35 bg-white/12"
            )}
        >
            {suit ? (
                <div className={cn(
                    "flex flex-col items-center",
                    (suit === 'hearts' || suit === 'diamonds') ? "text-red-600" : "text-black"
                )}>
                    <span className="text-xl font-bold">K</span>
                    <SuitIcon suit={suit} className="h-6 w-6" />
                </div>
            ) : (
                <div className="text-base font-bold text-white/35">{index + 1}</div>
            )}
        </div>
      ))}
    </div>
  );
};
