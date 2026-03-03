import React from 'react';
import type { Card as CardType } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';

interface StockProps {
  stock: CardType[];
  onDeal: () => void;
  isHinted?: boolean;
}

export const Stock: React.FC<StockProps> = ({ stock, onDeal, isHinted }) => {
  const { cardBack } = useGameStore();

  if (stock.length === 0) {
    return (
        <div className="w-24 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">Empty</span>
        </div>
    );
  }

  // Calculate how many deals left (10 cards per deal usually, but stock size / 10)
  // Actually standard spider is 50 cards in stock. 5 deals.
  
  return (
    <div 
        className={cn(
            "relative w-24 h-36 cursor-pointer group transition-all duration-300 select-none",
            isHinted && "ring-4 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
        )}
        onDoubleClick={onDeal}
    >
        {/* Render a few cards to show stack effect */}
        {stock.slice(0, 3).map((_, i) => (
            <div
                key={i}
                className={cn(
                    "absolute w-full h-full border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform",
                    "group-hover:translate-x-1 group-hover:translate-y-1",
                    `card-back-${cardBack}`
                )}
                style={{ top: i * 2, left: i * 2 }}
            />
        ))}
        <div className="absolute -bottom-6 w-full text-center font-bold select-none">
            {Math.ceil(stock.length / 10)} Deals
        </div>
    </div>
  );
};
