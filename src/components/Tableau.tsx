import React from 'react';
import type { TableauPile } from '../types/game';
import { Card } from './Card';
import { cn } from '../lib/utils';

interface TableauProps {
  tableau: TableauPile[];
  selectedPileIndex: number | null;
  selectedCardIndex: number | null;
  hintSource?: { pileIndex: number, cardIndex: number };
  onCardClick: (pileIndex: number, cardIndex: number) => void;
  onCardDoubleClick?: (pileIndex: number, cardIndex: number) => void;
  onEmptyPileClick: (pileIndex: number) => void;
}

export const Tableau: React.FC<TableauProps> = ({ 
    tableau, 
    selectedPileIndex, 
    selectedCardIndex, 
    hintSource,
    onCardClick, 
    onCardDoubleClick,
    onEmptyPileClick 
}) => {
  return (
    <div className="flex justify-center gap-4 w-full px-4 overflow-x-auto pb-48">
      {tableau.map((pile, pileIndex) => {
        // Calculate card positions
        let currentTop = 0;
        const cardPositions = pile.cards.map(card => {
            const pos = currentTop;
            // Gap for the next card depends on current card state
            // If current card is face up, we need space to see it (35px)
            // If current card is face down, we need less space (10px - tight)
            currentTop += card.faceUp ? 35 : 10;
            return pos;
        });
        
        const totalHeight = pile.cards.length > 0 
            ? cardPositions[pile.cards.length - 1] + 144 + 20 // 144 is card height, 20 buffer
            : 150;

        return (
        <div 
            key={pile.id} 
            className={cn(
                "relative w-24 min-h-[150px] rounded-lg flex-shrink-0 transition-colors",
                pile.cards.length === 0 && "bg-black/20 border-2 border-dashed border-primary/30"
            )}
            style={{
                height: `${totalHeight}px`
            }}
            onClick={() => onEmptyPileClick(pileIndex)}
        >
          {pile.cards.map((card, cardIndex) => {
             const isSelected = selectedPileIndex === pileIndex && selectedCardIndex !== null && cardIndex >= selectedCardIndex;
             const isHinted = hintSource?.pileIndex === pileIndex && cardIndex >= hintSource.cardIndex;
             
             return (
                <Card
                    key={card.id}
                    card={card}
                    index={cardIndex}
                    pileIndex={pileIndex}
                    isSelected={isSelected}
                    isHinted={isHinted}
                    onClick={onCardClick}
                    onDoubleClick={onCardDoubleClick}
                    style={{ top: cardPositions[cardIndex] }}
                />
             );
          })}
        </div>
      )})}
    </div>
  );
};
