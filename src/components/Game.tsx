import React, { useEffect, useState } from 'react';
import { BarChart2, Lightbulb, Palette, RefreshCw, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useGameStore } from '../store/gameStore';
import { useStatsStore } from '../store/statsStore';
import { Controls } from './Controls';
import { Foundation } from './Foundation';
import { SettingsModal } from './SettingsModal';
import { StatsModal } from './StatsModal';
import { Stock } from './Stock';
import { Tableau } from './Tableau';

export const Game: React.FC = () => {
  const store = useGameStore();
  const recordGameStart = useStatsStore((state) => state.recordGameStart);
  const recordWin = useStatsStore((state) => state.recordWin);
  const recordLoss = useStatsStore((state) => state.recordLoss);
  const [selectedPileIndex, setSelectedPileIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const recordedSeedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!store.seed) {
      store.initializeGame();
    }
  }, [store]);

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
    if (store.isPlaying && !store.gameWon) {
      interval = window.setInterval(() => {
        store.incrementTimer();
      }, 1000);
    }

    return () => {
      if (interval !== null) {
        window.clearInterval(interval);
      }
    };
  }, [store.gameWon, store.incrementTimer, store.isPlaying]);

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
    <main className="w-full px-3 py-4">
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
          <Foundation foundation={store.foundation} />
          <Stock stock={store.stock} onDeal={store.dealFromStock} isHinted={store.hintDeck} />
        </div>
      </div>
      <Tableau
        tableau={store.tableau}
        selectedPileIndex={selectedPileIndex}
        selectedCardIndex={selectedCardIndex}
        hintSource={store.hintSource}
        onCardClick={handleCardClick}
        onCardDoubleClick={handleCardDoubleClick}
        onEmptyPileClick={handleEmptyPileClick}
      />
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
