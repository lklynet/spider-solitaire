import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { enumerateMoves, pickHintMove } from '@/engine/moves';
import { useGameStore } from '../store/gameStore';
import { COLOR_THEMES } from './SettingsModal';
import { Controls } from './Controls';
import { Foundation } from './Foundation';
import { SettingsModal } from './SettingsModal';
import { StatsModal } from './StatsModal';
import { Stock } from './Stock';
import { Tableau } from './Tableau';

const autoMoveDoubleClickWindowMs = 420;
const themeBodyClasses = COLOR_THEMES.filter((theme) => theme.id !== 'default').map(
  (theme) => `theme-${theme.id}`
);

export function Game() {
  const store = useGameStore();
  const { seed, initializeGame, isPlaying, isPaused, gameWon, colorScheme, getTimer } = store;
  const recordLoss = useGameStore((state) => state.recordLoss);
  const [selectedPileIndex, setSelectedPileIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWinBanner, setShowWinBanner] = useState(false);
  const [hintSource, setHintSource] = useState<{ pileIndex: number; cardIndex: number } | undefined>();
  const [hintDeck, setHintDeck] = useState(false);
  const [hintNewGame, setHintNewGame] = useState(false);
  const [, setTimerTick] = useState(0);
  const lastCardClickRef = useRef<{
    pileIndex: number;
    cardIndex: number;
    timeStamp: number;
  } | null>(null);
  const hintPenaltyUsedRef = useRef(false);

  useLayoutEffect(() => {
    hintPenaltyUsedRef.current = false;
  }, [store.tableau, store.stock, store.foundation, store.history.length]);

  useEffect(() => {
    document.body.classList.remove(...themeBodyClasses);

    if (colorScheme !== 'default') {
      document.body.classList.add(`theme-${colorScheme}`);
    }
  }, [colorScheme]);

  useEffect(() => {
    if (!seed) {
      initializeGame();
    }
  }, [initializeGame, seed]);

  useEffect(() => {
    if (gameWon) {
      setShowWinBanner(true);
    }
  }, [gameWon]);

  useEffect(() => {
    setHintDeck(
      !gameWon &&
        !isPaused &&
        store.stock.length > 0 &&
        enumerateMoves(store.tableau).length === 0
    );
  }, [gameWon, hintDeck, isPaused, store.stock, store.tableau]);

  useEffect(() => {
    if (!isPlaying || isPaused || gameWon) return;
    const interval = window.setInterval(() => setTimerTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(interval);
  }, [gameWon, isPaused, isPlaying]);

  const clearSelection = () => {
    setSelectedPileIndex(null);
    setSelectedCardIndex(null);
  };

  const clearHints = () => {
    setHintSource(undefined);
    setHintDeck(false);
    setHintNewGame(false);
  };

  const chargeHintPenalty = () => {
    if (hintPenaltyUsedRef.current) return;
    const { moves, score } = useGameStore.getState();
    useGameStore.setState({ moves: moves + 1, score: score - 1 });
    hintPenaltyUsedRef.current = true;
  };

  const showHint = () => {
    const { tableau, stock } = useGameStore.getState();
    const bestMove = pickHintMove(tableau);

    if (bestMove) {
      setHintSource({ pileIndex: bestMove.fromPileIndex, cardIndex: bestMove.cardIndex });
      setHintDeck(false);
      setHintNewGame(false);
      chargeHintPenalty();
    } else if (stock.length > 0) {
      clearHints();
      setHintDeck(true);
    } else {
      clearHints();
      setHintNewGame(true);
      chargeHintPenalty();
    }

    window.setTimeout(clearHints, 2000);
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

  const handleCardClick = (pileIndex: number, cardIndex: number, timeStamp: number) => {
    const pile = store.tableau[pileIndex];
    const card = pile[cardIndex];

    if (!card.faceUp) return;

    const lastClick = lastCardClickRef.current;
    const isRepeatClick =
      lastClick &&
      lastClick.pileIndex === pileIndex &&
      lastClick.cardIndex === cardIndex &&
      timeStamp - lastClick.timeStamp <= autoMoveDoubleClickWindowMs;
    const isSelectedRunRepeatClick =
      lastClick &&
      selectedPileIndex === pileIndex &&
      selectedCardIndex !== null &&
      lastClick.pileIndex === pileIndex &&
      lastClick.cardIndex === selectedCardIndex &&
      cardIndex >= selectedCardIndex &&
      timeStamp - lastClick.timeStamp <= autoMoveDoubleClickWindowMs;

    if (isRepeatClick || isSelectedRunRepeatClick) {
      lastCardClickRef.current = null;
      const moveIndex = isSelectedRunRepeatClick ? selectedCardIndex! : cardIndex;
      if (store.autoMoveCard(pileIndex, moveIndex)) clearSelection();
      return;
    }

    lastCardClickRef.current = { pileIndex, cardIndex, timeStamp };

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

  const startPracticeGame = () => {
    if (store.isPlaying && !store.gameWon) {
      recordLoss();
    }

    store.initializeGame();
    setShowWinBanner(false);
    clearSelection();
    clearHints();
  };

  const handleNewGame = () => {
    confirmAction(() => startPracticeGame());
  };

  const handleRestart = () => {
    confirmAction(() => {
      store.restartGame();
      setShowWinBanner(false);
      clearSelection();
      clearHints();
    });
  };

  return (
    <div className="game">
      <StatsModal
        isOpen={showStats || showWinBanner}
        onClose={() => {
          setShowStats(false);
          setShowWinBanner(false);
        }}
        onPlayAgain={handleNewGame}
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <div className="game__shell">
        <header className="game__header">
          <div className="game__header-top">
            <h1 className="game__title">Spider Solitaire</h1>
            <div className="game__header-links">
              <button type="button" onClick={() => setShowStats(true)} className="btn-toolbar" title="Stats">
                Stats
              </button>
              <button type="button" onClick={() => setShowSettings(true)} className="btn-toolbar" title="Theme">
                Theme
              </button>
            </div>
          </div>
          <div className="game__header-actions">
            <button type="button" onClick={showHint} className="btn-neo btn-neo--hint">
              Hint
            </button>
            <button
              type="button"
              onClick={store.undo}
              disabled={store.history.length === 0}
              className="btn-neo btn-neo--undo"
            >
              Undo
            </button>
            <button type="button" onClick={handleRestart} className="btn-neo btn-neo--restart">
              Restart
            </button>
            <button
              type="button"
              onClick={handleNewGame}
              className={`btn-neo btn-neo--new${hintNewGame ? ' btn-neo--pulse' : ''}`}
            >
              New Game
            </button>
          </div>
        </header>

        <main className="game__main">
          <div className="game__hud-row">
            <Controls
              className="hud--board"
              score={store.score}
              moves={store.moves}
              timer={getTimer()}
              isPlaying={store.isPlaying}
              isPaused={store.isPaused}
              onTogglePause={store.togglePause}
            />
            <div className="game__board-meta">
              <Foundation foundation={store.foundation} />
              <Stock stock={store.stock} onDeal={store.dealFromStock} isHinted={hintDeck} />
            </div>
          </div>
          <Tableau
            tableau={store.tableau}
            selectedPileIndex={selectedPileIndex}
            selectedCardIndex={selectedCardIndex}
            hintSource={hintSource}
            onCardClick={handleCardClick}
            onEmptyPileClick={handleEmptyPileClick}
          />
        </main>
      </div>
    </div>
  );
}
