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
    <div className="mx-auto flex w-full max-w-[1128px] justify-center gap-4 overflow-x-auto px-2 pb-48">
      {tableau.map((pile, pileIndex) => {
        // Calculate card positions
        let currentTop = 0;
        const cardPositions = pile.cards.map(card => {
            const pos = currentTop;
            currentTop += card.faceUp ? 30 : 12;
            return pos;
        });
        
        const totalHeight = pile.cards.length > 0 
            ? cardPositions[pile.cards.length - 1] + 144 + 20
            : 150;

        return (
        <div 
            key={pile.id} 
            className={cn(
                "relative min-h-[150px] w-24 flex-shrink-0 rounded-lg transition-colors",
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
