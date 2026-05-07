import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { TableauPile } from '../types/game';
import { Card } from './Card';
import { cn } from '../lib/utils';

interface TableauProps {
  tableau: TableauPile[];
  selectedPileIndex: number | null;
  selectedCardIndex: number | null;
  hintSource?: { pileIndex: number, cardIndex: number };
  hiddenCardIds?: Set<string>;
  onCardClick: (pileIndex: number, cardIndex: number) => void;
  onCardDoubleClick?: (pileIndex: number, cardIndex: number) => void;
  onEmptyPileClick: (pileIndex: number) => void;
}

const FACE_UP_GAP = 30;
const FACE_DOWN_GAP = 12;
const MIN_FACE_UP_GAP = 18;
const MIN_FACE_DOWN_GAP = 8;
const CARD_HEIGHT = 144;
const PILE_BOTTOM_PADDING = 20;
const DEFAULT_PILE_HEIGHT = 150;
const VIEWPORT_BOTTOM_MARGIN = 32;

const getCardPositions = (pile: TableauPile, availableHeight: number) => {
  const gapBudget = Math.max(0, availableHeight - CARD_HEIGHT - PILE_BOTTOM_PADDING);
  const faceUpCount = pile.cards.filter((card) => card.faceUp).length;
  const faceDownCount = pile.cards.length - faceUpCount;
  const baseGapTotal =
    Math.max(0, faceUpCount - 1) * FACE_UP_GAP +
    Math.max(0, faceDownCount) * FACE_DOWN_GAP;
  const minGapTotal =
    Math.max(0, faceUpCount - 1) * MIN_FACE_UP_GAP +
    Math.max(0, faceDownCount) * MIN_FACE_DOWN_GAP;

  let faceUpGap = FACE_UP_GAP;
  let faceDownGap = FACE_DOWN_GAP;

  if (baseGapTotal > gapBudget) {
    if (minGapTotal >= gapBudget) {
      faceUpGap = MIN_FACE_UP_GAP;
      faceDownGap = MIN_FACE_DOWN_GAP;
    } else {
      const compressibleGap = baseGapTotal - minGapTotal;
      const overflow = baseGapTotal - gapBudget;
      const compressionRatio = overflow / compressibleGap;
      faceUpGap = FACE_UP_GAP - (FACE_UP_GAP - MIN_FACE_UP_GAP) * compressionRatio;
      faceDownGap = FACE_DOWN_GAP - (FACE_DOWN_GAP - MIN_FACE_DOWN_GAP) * compressionRatio;
    }
  }

  let currentTop = 0;
  const cardPositions = pile.cards.map((card, index) => {
    const pos = currentTop;
    if (index < pile.cards.length - 1) {
      currentTop += card.faceUp ? faceUpGap : faceDownGap;
    }
    return pos;
  });

  const totalHeight =
    pile.cards.length > 0
      ? cardPositions[pile.cards.length - 1] + CARD_HEIGHT + PILE_BOTTOM_PADDING
      : DEFAULT_PILE_HEIGHT;

  return {
    cardPositions,
    totalHeight
  };
};

export const Tableau: React.FC<TableauProps> = ({ 
    tableau, 
    selectedPileIndex, 
    selectedCardIndex, 
    hintSource,
    hiddenCardIds,
    onCardClick, 
    onCardDoubleClick,
    onEmptyPileClick 
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availablePileHeight, setAvailablePileHeight] = useState(720);

  useEffect(() => {
    const updateAvailableHeight = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      const viewportHeight = window.innerHeight;
      const nextHeight = Math.max(
        DEFAULT_PILE_HEIGHT,
        viewportHeight - top - VIEWPORT_BOTTOM_MARGIN
      );
      setAvailablePileHeight(nextHeight);
    };

    updateAvailableHeight();
    window.addEventListener('resize', updateAvailableHeight);

    return () => {
      window.removeEventListener('resize', updateAvailableHeight);
    };
  }, []);

  const pileLayouts = useMemo(
    () => tableau.map((pile) => getCardPositions(pile, availablePileHeight)),
    [availablePileHeight, tableau]
  );

  return (
    <div
      ref={containerRef}
      className="mx-auto flex w-full max-w-[1128px] justify-center gap-4 overflow-x-auto px-2 pb-48"
    >
      {tableau.map((pile, pileIndex) => {
        const { cardPositions, totalHeight } = pileLayouts[pileIndex];

        return (
        <div 
            key={pile.id} 
            data-pile-index={pileIndex}
            className={cn(
                "relative min-h-[150px] w-24 flex-shrink-0 rounded-lg transition-[height,colors] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
                    isHidden={hiddenCardIds?.has(card.id)}
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
