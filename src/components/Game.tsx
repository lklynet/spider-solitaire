import React, { useEffect, useLayoutEffect, useState } from 'react';
import { BarChart2, Lightbulb, Palette, RefreshCw, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useGameStore } from '../store/gameStore';
import { useStatsStore } from '../store/statsStore';
import type { Card as CardType } from '../types/game';
import { CardVisual } from './Card';
import { Controls } from './Controls';
import { Foundation } from './Foundation';
import { SettingsModal } from './SettingsModal';
import { StatsModal } from './StatsModal';
import { Stock } from './Stock';
import { Tableau } from './Tableau';

interface CardGhostAnimation {
  key: string;
  card: CardType;
  startRect: RectSnapshot;
  endRect: RectSnapshot;
  midRect?: RectSnapshot;
  duration: number;
  zIndex: number;
  foundationIndex?: number;
}

interface RectSnapshot {
  left: number;
  top: number;
  width: number;
  height: number;
}

const toRectSnapshot = (rect: DOMRect): RectSnapshot => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height
});

const moveCardDurationMs = 240;
const completeRunDurationMs = 700;

const AnimatedCardGhost: React.FC<{
  animation: CardGhostAnimation;
  cardBack: number;
  onComplete: (animation: CardGhostAnimation) => void;
}> = ({ animation, cardBack, onComplete }) => {
  const ghostRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ghostRef.current;
    if (!node) return;

    const { startRect, midRect, endRect, duration } = animation;
    const keyframes = midRect
      ? [
          {
            transform: 'translate3d(0px, 0px, 0px) scale(1)',
            opacity: 1,
            offset: 0
          },
          {
            transform: `translate3d(${midRect.left - startRect.left}px, ${midRect.top - startRect.top}px, 0px) scale(1)`,
            opacity: 1,
            offset: 0.58
          },
          {
            transform: `translate3d(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px, 0px) scale(0.72)`,
            opacity: 0.92,
            offset: 1
          }
        ]
      : [
          {
            transform: 'translate3d(0px, 0px, 0px)',
            opacity: 1
          },
          {
            transform: `translate3d(${endRect.left - startRect.left}px, ${endRect.top - startRect.top}px, 0px)`,
            opacity: 1
          }
        ];

    const motion = node.animate(keyframes, {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards'
    });

    motion.onfinish = () => onComplete(animation);
    motion.oncancel = () => onComplete(animation);

    return () => {
      motion.cancel();
    };
  }, [animation, onComplete]);

  return (
    <div
      ref={ghostRef}
      className="pointer-events-none fixed left-0 top-0"
      style={{
        left: animation.startRect.left,
        top: animation.startRect.top,
        width: animation.startRect.width,
        height: animation.startRect.height,
        zIndex: animation.zIndex
      }}
    >
      <CardVisual card={animation.card} cardBack={cardBack} />
    </div>
  );
};

export const Game: React.FC = () => {
  const store = useGameStore();
  const { seed, initializeGame, incrementTimer, isPlaying, gameWon } = store;
  const recordGameStart = useStatsStore((state) => state.recordGameStart);
  const recordWin = useStatsStore((state) => state.recordWin);
  const recordLoss = useStatsStore((state) => state.recordLoss);
  const [selectedPileIndex, setSelectedPileIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [ghosts, setGhosts] = useState<CardGhostAnimation[]>([]);
  const [hiddenCardIds, setHiddenCardIds] = useState<Set<string>>(new Set());
  const [hiddenFoundationSlots, setHiddenFoundationSlots] = useState<Set<number>>(new Set());
  const recordedSeedRef = React.useRef<string | null>(null);
  const boardRef = React.useRef<HTMLDivElement | null>(null);
  const stockRef = React.useRef<HTMLDivElement | null>(null);
  const foundationSlotRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const previousRectsRef = React.useRef<Map<string, RectSnapshot>>(new Map());
  const lastAnimatedActionRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (!seed) {
      initializeGame();
    }
  }, [initializeGame, seed]);

  useEffect(() => {
    if (store.history.length > 0 && recordedSeedRef.current !== store.seed) {
      recordGameStart();
      recordedSeedRef.current = store.seed;
    }
  }, [recordGameStart, store.history.length, store.seed]);

  useEffect(() => {
    if (!store.gameWon) return;

    recordWin(store.score, store.timer, store.moves);
  }, [recordWin, store.gameWon, store.moves, store.score, store.timer]);

  useEffect(() => {
    let interval: number | null = null;
    if (isPlaying && !gameWon) {
      interval = window.setInterval(() => {
        incrementTimer();
      }, 1000);
    }

    return () => {
      if (interval !== null) {
        window.clearInterval(interval);
      }
    };
  }, [gameWon, incrementTimer, isPlaying]);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const cardElements = Array.from(board.querySelectorAll<HTMLElement>('[data-card-id]'));
    const currentRects = new Map<string, RectSnapshot>();
    cardElements.forEach((element) => {
      const cardId = element.dataset.cardId;
      if (!cardId) return;
      currentRects.set(cardId, toRectSnapshot(element.getBoundingClientRect()));
    });

    const previousRects = previousRectsRef.current;

    cardElements.forEach((element) => {
      const cardId = element.dataset.cardId;
      if (!cardId) return;

      const previousRect = previousRects.get(cardId);
      const currentRect = currentRects.get(cardId);
      if (!previousRect || !currentRect) return;

      const deltaX = previousRect.left - currentRect.left;
      const deltaY = previousRect.top - currentRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      element.animate(
        [
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0px)` },
          { transform: 'translate3d(0px, 0px, 0px)' }
        ],
        {
          duration: moveCardDurationMs,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        }
      );
    });

    const animation = store.lastAnimation;
    if (animation && lastAnimatedActionRef.current !== animation.id) {
      const completedCardIds = new Set(
        animation.completedRuns?.flatMap((run) => run.cards.map((card) => card.id)) ?? []
      );
      const nextGhosts: CardGhostAnimation[] = [];
      const nextHiddenCardIds = new Set<string>();
      const stockRect = stockRef.current?.getBoundingClientRect();

      const buildStockStartRect = (index: number): RectSnapshot | null => {
        if (!stockRect) return null;

        return {
          left: stockRect.left + Math.min(index, 2) * 2,
          top: stockRect.top + Math.min(index, 2) * 2,
          width: 96,
          height: 144
        };
      };

      const movedCardIds = animation.movedCardIds ?? [];
      movedCardIds.forEach((cardId) => {
        if (completedCardIds.has(cardId)) return;

        const startRect = previousRects.get(cardId);
        const endRect = currentRects.get(cardId);
        const ghostIndex = nextGhosts.length;
        const card = store.tableau.flatMap((pile) => pile.cards).find((candidate) => candidate.id === cardId);
        if (!startRect || !endRect || !card) return;

        nextGhosts.push({
          key: `${animation.id}-${cardId}-move`,
          card,
          startRect,
          endRect,
          duration: moveCardDurationMs,
          zIndex: 400 + ghostIndex
        });
        nextHiddenCardIds.add(cardId);
      });

      const dealtCardIds = animation.dealtCardIds ?? [];
      dealtCardIds.forEach((cardId, index) => {
        if (completedCardIds.has(cardId)) return;

        const startRect = buildStockStartRect(index);
        const endRect = currentRects.get(cardId);
        const ghostIndex = nextGhosts.length;
        const card = store.tableau.flatMap((pile) => pile.cards).find((candidate) => candidate.id === cardId);
        if (!startRect || !endRect || !card) return;

        nextGhosts.push({
          key: `${animation.id}-${cardId}-deal`,
          card,
          startRect,
          endRect,
          duration: moveCardDurationMs + 60,
          zIndex: 400 + ghostIndex
        });
        nextHiddenCardIds.add(cardId);
      });

      const nextHiddenFoundationSlots = new Set<number>();
      animation.completedRuns?.forEach((run) => {
        const pileElement = board.querySelector<HTMLElement>(`[data-pile-index="${run.pileIndex}"]`);
        const foundationSlot = foundationSlotRefs.current[run.foundationIndex];
        if (!pileElement || !foundationSlot) return;

        nextHiddenFoundationSlots.add(run.foundationIndex);
        const pileRect = pileElement.getBoundingClientRect();
        const foundationRect = foundationSlot.getBoundingClientRect();

        run.cards.forEach((card, index) => {
          const previousRect = previousRects.get(card.id);
          const stockStartRect = dealtCardIds.includes(card.id)
            ? buildStockStartRect(dealtCardIds.indexOf(card.id))
            : null;
          const startRect = stockStartRect ?? previousRect ?? {
            left: pileRect.left,
            top: pileRect.top + run.topOffsets[index],
            width: 96,
            height: 144
          };
          const midRect = {
            left: pileRect.left,
            top: pileRect.top + run.topOffsets[index],
            width: 96,
            height: 144
          };
          const endRect = {
            left: foundationRect.left,
            top: foundationRect.top,
            width: foundationRect.width,
            height: foundationRect.height
          };

          nextGhosts.push({
            key: `${animation.id}-${card.id}-complete`,
            card,
            startRect,
            midRect,
            endRect,
            duration: completeRunDurationMs,
            zIndex: 800 + index,
            foundationIndex: run.foundationIndex
          });
        });
      });

      requestAnimationFrame(() => {
        setGhosts((current) => [...current, ...nextGhosts]);
        setHiddenCardIds(nextHiddenCardIds);
        if (nextHiddenFoundationSlots.size > 0) {
          setHiddenFoundationSlots((current) => {
            const next = new Set(current);
            nextHiddenFoundationSlots.forEach((slotIndex) => next.add(slotIndex));
            return next;
          });
        }
      });
      lastAnimatedActionRef.current = animation.id;
    }

    previousRectsRef.current = currentRects;
  }, [store.foundation, store.lastAnimation, store.tableau]);

  const handleGhostComplete = React.useCallback((finishedGhost: CardGhostAnimation) => {
    setGhosts((current) => {
      const nextGhosts = current.filter((ghost) => ghost.key !== finishedGhost.key);
      if (nextGhosts.length === 0) {
        setHiddenCardIds(new Set());
      }

       if (finishedGhost.foundationIndex !== undefined) {
        const hasMoreForFoundation = nextGhosts.some(
          (ghost) => ghost.foundationIndex === finishedGhost.foundationIndex
        );
        if (!hasMoreForFoundation) {
          setHiddenFoundationSlots((currentSlots) => {
            const nextSlots = new Set(currentSlots);
            nextSlots.delete(finishedGhost.foundationIndex!);
            return nextSlots;
          });
        }
      }

      return nextGhosts;
    });
  }, []);

  const clearSelection = () => {
    setSelectedPileIndex(null);
    setSelectedCardIndex(null);
  };

  const confirmAction = (callback: () => void) => {
    if (store.moves > 0 && !store.gameWon) {
      if (window.confirm('Are you sure? Current game progress will be lost.')) {
        callback();
      }
      return;
    }

    callback();
  };

  const handleCardClick = (pileIndex: number, cardIndex: number) => {
    const pile = store.tableau[pileIndex];
    const card = pile.cards[cardIndex];

    if (!card.faceUp) return;

    if (selectedPileIndex === null) {
      setSelectedPileIndex(pileIndex);
      setSelectedCardIndex(cardIndex);
    } else if (selectedPileIndex === pileIndex) {
      if (selectedCardIndex === cardIndex) {
        clearSelection();
      } else {
        setSelectedCardIndex(cardIndex);
      }
    } else {
      store.moveCards(selectedPileIndex, pileIndex, selectedCardIndex!);
      clearSelection();
    }
  };

  const handleEmptyPileClick = (pileIndex: number) => {
    if (selectedPileIndex !== null) {
      store.moveCards(selectedPileIndex, pileIndex, selectedCardIndex!);
      clearSelection();
    }
  };

  const handleCardDoubleClick = (pileIndex: number, cardIndex: number) => {
    store.autoMoveCard(pileIndex, cardIndex);
    clearSelection();
  };

  const startPracticeGame = () => {
    if (store.isPlaying && !store.gameWon) {
      recordLoss();
    }

    store.initializeGame();
    clearSelection();
  };

  const handleNewGame = () => {
    confirmAction(() => startPracticeGame());
  };

  const handleRestart = () => {
    confirmAction(() => {
      store.restartGame();
      clearSelection();
    });
  };

  const board = (
    <main ref={boardRef} className="relative w-full px-3 py-4">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <Controls
          className="w-full lg:w-auto lg:min-w-[360px]"
          score={store.score}
          moves={store.moves}
          timer={store.timer}
          isPlaying={store.isPlaying}
          isPaused={store.isPaused}
          canUndo={store.canUndo()}
          onUndo={store.undo}
          onRestart={handleRestart}
          onNewGame={handleNewGame}
          onToggleTimer={store.toggleTimer}
          onTogglePause={store.togglePause}
          onHint={store.showHint}
          isNewGameHinted={store.hintNewGame}
          showActionButtons={false}
        />
        <div className="flex flex-wrap items-start justify-end gap-4 lg:ml-auto">
          <Foundation
            foundation={store.foundation}
            hiddenSlots={hiddenFoundationSlots}
            slotRefs={foundationSlotRefs}
          />
          <Stock
            stock={store.stock}
            onDeal={store.dealFromStock}
            isHinted={store.hintDeck}
            stockRef={stockRef}
          />
        </div>
      </div>
      <Tableau
        tableau={store.tableau}
        selectedPileIndex={selectedPileIndex}
        selectedCardIndex={selectedCardIndex}
        hintSource={store.hintSource}
        hiddenCardIds={hiddenCardIds}
        onCardClick={handleCardClick}
        onCardDoubleClick={handleCardDoubleClick}
        onEmptyPileClick={handleEmptyPileClick}
      />
      {ghosts.map((ghost) => (
        <AnimatedCardGhost
          key={ghost.key}
          animation={ghost}
          cardBack={store.cardBack}
          onComplete={handleGhostComplete}
        />
      ))}
    </main>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <StatsModal
        isOpen={showStats || store.showWinModal}
        onClose={() => {
          setShowStats(false);
          store.setShowWinModal(false);
        }}
        gameWon={store.gameWon}
        score={store.score}
        moves={store.moves}
        time={store.timer}
        onPlayAgain={handleNewGame}
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 2xl:px-4">
        <header className="flex flex-col gap-4 rounded-[24px] border-4 border-primary bg-popover px-4 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.35)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="border-b-4 border-primary pb-2 text-3xl font-black uppercase tracking-tighter text-primary drop-shadow-lg lg:text-4xl">
              Spider Solitaire
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowStats(true)}
                className="rounded border-2 border-primary bg-popover p-2 text-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] transition-all hover:bg-popover/80 active:translate-y-[2px] active:shadow-none"
                title="Stats"
              >
                <BarChart2 className="h-6 w-6" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="rounded border-2 border-primary bg-popover p-2 text-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] transition-all hover:bg-popover/80 active:translate-y-[2px] active:shadow-none"
                title="Theme"
              >
                <Palette className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              onClick={store.showHint}
              className="neo-button border-primary bg-blue-600 text-white"
            >
              <Lightbulb className="mr-2 inline h-4 w-4" />
              Hint
            </button>
            <button
              onClick={store.undo}
              disabled={!store.canUndo()}
              className="neo-button border-primary bg-yellow-600 text-white disabled:translate-x-[4px] disabled:translate-y-[4px] disabled:opacity-50 disabled:shadow-none"
            >
              <RotateCcw className="mr-2 inline h-4 w-4" />
              Undo
            </button>
            <button
              onClick={handleRestart}
              className="neo-button border-primary bg-orange-600 text-white"
            >
              <RefreshCw className="mr-2 inline h-4 w-4" />
              Restart
            </button>
            <button
              onClick={handleNewGame}
              className={cn(
                'neo-button border-primary bg-green-600 text-white transition-all duration-300',
                store.hintNewGame && 'scale-105 ring-4 ring-primary shadow-[0_0_15px_rgba(255,215,0,0.5)]'
              )}
            >
              New Game
            </button>
          </div>
        </header>

        <div className="min-w-0">{board}</div>
      </div>
    </div>
  );
};
