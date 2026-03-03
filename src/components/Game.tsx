import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useStatsStore } from '../store/statsStore';
import { Tableau } from './Tableau';
import { Stock } from './Stock';
import { Foundation } from './Foundation';
import { Controls } from './Controls';
import { StatsModal } from './StatsModal';
import { SettingsModal } from './SettingsModal';
import { BarChart2, Calendar, Check, AlertTriangle, Palette, Trophy } from 'lucide-react';
import { format } from 'date-fns';

export const Game: React.FC = () => {
  const store = useGameStore();
  const recordGameStart = useStatsStore(state => state.recordGameStart);
  const recordWin = useStatsStore(state => state.recordWin);
  const recordLoss = useStatsStore(state => state.recordLoss);
  const markDailyChallengeCompleted = useStatsStore(state => state.markDailyChallengeCompleted);
  const dailyChallengesCompleted = useStatsStore(state => state.dailyChallengesCompleted);
  const [selectedPileIndex, setSelectedPileIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [statsTab, setStatsTab] = useState<'stats' | 'achievements'>('stats');
  const [showSettings, setShowSettings] = useState(false);
  const recordedSeedRef = React.useRef<string | null>(null);
  const isPlaying = store.isPlaying;
  const gameWon = store.gameWon;
  const incrementTimer = store.incrementTimer;

  useEffect(() => {
    if (!store.seed) {
      store.initializeGame();
    }
  }, [store, store.seed]);

  // Record game start only after first move/action
  useEffect(() => {
    if (store.history.length > 0 && recordedSeedRef.current !== store.seed) {
        recordGameStart();
        recordedSeedRef.current = store.seed;
    }
  }, [recordGameStart, store.history.length, store.seed]);

  useEffect(() => {
    if (store.gameWon) {
        console.log('Game Won detected in Game.tsx');
        recordWin(store.score, store.timer, store.moves);
        
        // Check if this was today's daily challenge
        const today = format(new Date(), 'yyyy-MM-dd');
        if (store.seed === today) {
            markDailyChallengeCompleted(today);
        }
    }
  }, [markDailyChallengeCompleted, recordWin, store.gameWon, store.moves, store.score, store.seed, store.timer]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !gameWon) {
      interval = setInterval(() => {
        incrementTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameWon, incrementTimer, isPlaying]);

  const handleCardClick = (pileIndex: number, cardIndex: number) => {
    const pile = store.tableau[pileIndex];
    const card = pile.cards[cardIndex];

    if (!card.faceUp) return;

    if (selectedPileIndex === null) {
      setSelectedPileIndex(pileIndex);
      setSelectedCardIndex(cardIndex);
    } else {
      if (selectedPileIndex === pileIndex) {
        if (selectedCardIndex === cardIndex) {
            // Deselect if clicking same card
            setSelectedPileIndex(null);
            setSelectedCardIndex(null);
        } else {
            // Select new card in same pile
            setSelectedCardIndex(cardIndex);
        }
      } else {
        // Attempt move
        store.moveCards(selectedPileIndex, pileIndex, selectedCardIndex!);
        setSelectedPileIndex(null);
        setSelectedCardIndex(null);
      }
    }
  };

  const handleEmptyPileClick = (pileIndex: number) => {
    if (selectedPileIndex !== null) {
      store.moveCards(selectedPileIndex, pileIndex, selectedCardIndex!);
      setSelectedPileIndex(null);
      setSelectedCardIndex(null);
    }
  };

  const handleCardDoubleClick = (pileIndex: number, cardIndex: number) => {
    store.autoMoveCard(pileIndex, cardIndex);
    setSelectedPileIndex(null);
    setSelectedCardIndex(null);
  };

  const confirmAction = (callback: () => void) => {
    if (store.moves > 0 && !store.gameWon) {
        if (window.confirm('Are you sure? Current game progress will be lost.')) {
            callback();
        }
    } else {
        callback();
    }
  };

  const handleNewGame = () => {
      confirmAction(() => {
        // Record loss if game was in progress and not won? 
        // Simplified: Just start new game
        if (store.isPlaying && !store.gameWon) {
            recordLoss();
        }
        
        store.initializeGame();
        setSelectedPileIndex(null);
        setSelectedCardIndex(null);
      });
  };

  const handleDailyGame = () => {
      confirmAction(() => {
        if (store.isPlaying && !store.gameWon) {
            recordLoss();
        }

        const todaySeed = format(new Date(), 'yyyy-MM-dd');
        store.initializeGame(todaySeed);
        setSelectedPileIndex(null);
        setSelectedCardIndex(null);
      });
  };

  const handleRestart = () => {
      confirmAction(() => {
          store.restartGame();
          setSelectedPileIndex(null);
          setSelectedCardIndex(null);
      });
  };


  const today = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const isDailyCompleted = React.useMemo(() => {
    return dailyChallengesCompleted.includes(today);
  }, [dailyChallengesCompleted, today]);
  const isDailyActive = store.seed === today && !store.gameWon;

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col gap-6">
      <StatsModal 
        isOpen={showStats} 
        onClose={() => setShowStats(false)} 
        gameWon={store.gameWon}
        score={store.score}
        moves={store.moves}
        time={store.timer}
        onPlayAgain={handleNewGame}
        defaultTab={statsTab}
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter border-b-4 border-primary text-primary pb-2 drop-shadow-lg">
                Spider Solitaire
            </h1>
            <div className="flex gap-2">
                <button 
                    onClick={() => {
                      setStatsTab('stats');
                      setShowStats(true);
                    }}
                    className="p-2 border-2 border-primary rounded bg-popover text-primary hover:bg-popover/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[2px] active:shadow-none transition-all"
                    title="Statistics"
                >
                    <BarChart2 className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => {
                      setStatsTab('achievements');
                      setShowStats(true);
                    }}
                    className="p-2 border-2 border-primary rounded bg-popover text-primary hover:bg-popover/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[2px] active:shadow-none transition-all"
                    title="Achievements"
                >
                    <Trophy className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 border-2 border-primary rounded bg-popover text-primary hover:bg-popover/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[2px] active:shadow-none transition-all"
                    title="Card Designs"
                >
                    <Palette className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleDailyGame}
                    className="relative p-2 border-2 border-primary rounded bg-popover text-primary hover:bg-popover/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[2px] active:shadow-none transition-all"
                    title="Daily Challenge"
                >
                    <Calendar className="w-6 h-6" />
                    {isDailyCompleted ? (
                        <div className="absolute -top-2 -right-2 bg-green-600 rounded-full p-0.5 border border-green-300 z-10">
                            <Check className="w-3 h-3 text-white" />
                        </div>
                    ) : isDailyActive ? (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-0.5 border border-yellow-200 z-10">
                            <AlertTriangle className="w-3 h-3 text-yellow-900" />
                        </div>
                    ) : (
                        <div className="absolute -top-2 -right-2 bg-red-900 rounded-full p-0.5 border border-red-500 z-10">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                        </div>
                    )}
                </button>
            </div>
        </div>
        <div className="flex gap-4">
             {/* Foundation Piles */}
             <Foundation foundation={store.foundation} />
             {/* Stock */}
             <Stock stock={store.stock} onDeal={store.dealFromStock} isHinted={store.hintDeck} />
        </div>
      </header>

      <Controls 
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
      />

      <main className="flex-1 w-full max-w-7xl mx-auto">
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

      {/* Game Won Modal removed - consolidated into StatsModal */}
    </div>
  );
};
