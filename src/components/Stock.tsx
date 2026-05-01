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
        <div className="flex h-36 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
            <span className="text-gray-400">Empty</span>
        </div>
    );
  }

  return (
    <div 
        className={cn(
            "group relative h-36 w-24 cursor-pointer select-none transition-all duration-300",
            isHinted && "ring-4 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
        )}
        onDoubleClick={onDeal}
    >
        {/* Render a few cards to show stack effect */}
        {stock.slice(0, 3).map((_, i) => (
            <div
                key={i}
                className={cn(
                    "absolute h-full w-full rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform",
                    "group-hover:translate-x-1 group-hover:translate-y-1",
                    `card-back-${cardBack}`
                )}
                style={{ top: i * 2, left: i * 2 }}
            />
        ))}
        <div className="absolute right-0.5 top-2.5 z-10">
            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-black/40 px-2 text-xl font-black text-white shadow-[0_2px_0_rgba(0,0,0,0.35)]">
                {Math.ceil(stock.length / 10)}
            </span>
        </div>
    </div>
  );
};
