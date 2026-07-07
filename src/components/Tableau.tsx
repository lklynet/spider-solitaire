import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card as CardType } from '@/engine/types';
import { Card } from './Card';

const FACE_UP_GAP = 30;
const FACE_DOWN_GAP = 12;

interface TableauProps {
  tableau: CardType[][];
  selectedPileIndex: number | null;
  selectedCardIndex: number | null;
  hintSource?: { pileIndex: number; cardIndex: number };
  onCardClick: (pileIndex: number, cardIndex: number, timeStamp: number) => void;
  onEmptyPileClick: (pileIndex: number) => void;
}

const MIN_FACE_UP_GAP = 18;
const MIN_FACE_DOWN_GAP = 8;
const CARD_HEIGHT = 144;
const PILE_BOTTOM_PADDING = 20;
const DEFAULT_PILE_HEIGHT = 150;
const VIEWPORT_BOTTOM_MARGIN = 32;
const BASE_CARD_HOVER_LIFT = 4;
const MAX_CARD_HOVER_LIFT = 22;

const getCardPositions = (pile: CardType[], availableHeight: number) => {
  const gapBudget = Math.max(0, availableHeight - CARD_HEIGHT - PILE_BOTTOM_PADDING);
  const faceUpCount = pile.filter((card) => card.faceUp).length;
  const faceDownCount = pile.length - faceUpCount;
  const baseGapTotal =
    Math.max(0, faceUpCount - 1) * FACE_UP_GAP + Math.max(0, faceDownCount) * FACE_DOWN_GAP;
  const minGapTotal =
    Math.max(0, faceUpCount - 1) * MIN_FACE_UP_GAP + Math.max(0, faceDownCount) * MIN_FACE_DOWN_GAP;

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
  const cardPositions = pile.map((card, index) => {
    const pos = currentTop;
    if (index < pile.length - 1) {
      currentTop += card.faceUp ? faceUpGap : faceDownGap;
    }
    return pos;
  });

  const totalHeight =
    pile.length > 0 ? cardPositions[pile.length - 1] + CARD_HEIGHT + PILE_BOTTOM_PADDING : DEFAULT_PILE_HEIGHT;

  return { cardPositions, faceUpGap, totalHeight };
};

const getCardHoverLift = (card: CardType, faceUpGap: number) => {
  if (!card.faceUp) return BASE_CARD_HOVER_LIFT;
  const compression = Math.max(0, FACE_UP_GAP - faceUpGap);
  return Math.min(MAX_CARD_HOVER_LIFT, BASE_CARD_HOVER_LIFT + compression * 1.5);
};

export function Tableau({
  tableau,
  selectedPileIndex,
  selectedCardIndex,
  hintSource,
  onCardClick,
  onEmptyPileClick
}: TableauProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availablePileHeight, setAvailablePileHeight] = useState(720);

  useEffect(() => {
    const updateAvailableHeight = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      const nextHeight = Math.max(DEFAULT_PILE_HEIGHT, window.innerHeight - top - VIEWPORT_BOTTOM_MARGIN);
      setAvailablePileHeight(nextHeight);
    };

    updateAvailableHeight();
    window.addEventListener('resize', updateAvailableHeight);
    return () => window.removeEventListener('resize', updateAvailableHeight);
  }, []);

  const pileLayouts = useMemo(
    () => tableau.map((pile) => getCardPositions(pile, availablePileHeight)),
    [availablePileHeight, tableau]
  );

  return (
    <div ref={containerRef} className="tableau">
      {tableau.map((pile, pileIndex) => {
        const { cardPositions, faceUpGap, totalHeight } = pileLayouts[pileIndex];
        const pileClass = pile.length === 0 ? 'tableau__pile tableau__pile--empty' : 'tableau__pile';

        return (
          <div
            key={pileIndex}
            data-pile-index={pileIndex}
            className={pileClass}
            style={{ height: `${totalHeight}px` }}
            onClick={() => onEmptyPileClick(pileIndex)}
          >
            {pile.map((card, cardIndex) => {
              const isSelected =
                selectedPileIndex === pileIndex &&
                selectedCardIndex !== null &&
                cardIndex >= selectedCardIndex;
              const isHinted =
                hintSource?.pileIndex === pileIndex && cardIndex >= hintSource.cardIndex;

              return (
                <Card
                  key={card.id}
                  card={card}
                  index={cardIndex}
                  pileIndex={pileIndex}
                  isSelected={isSelected}
                  isHinted={isHinted}
                  hoverLift={getCardHoverLift(card, faceUpGap)}
                  top={cardPositions[cardIndex]}
                  onClick={onCardClick}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
