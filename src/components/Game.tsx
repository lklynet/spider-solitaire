import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useStatsStore } from '../store/statsStore';
import { Tableau } from './Tableau';
import { Stock } from './Stock';
import { Foundation } from './Foundation';
import { Controls } from './Controls';
import { StatsModal } from './StatsModal';
import { AuthModal } from './AuthModal';
import { SettingsModal } from './SettingsModal';
import { RaceSidebar } from './RaceSidebar';
import { WelcomeGuide } from './WelcomeGuide';
import { BarChart2, LogIn, LogOut, Palette, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useOfficialStore } from '../store/officialStore';

export const Game: React.FC = () => {
  const store = useGameStore();
  const recordGameStart = useStatsStore(state => state.recordGameStart);
  const recordWin = useStatsStore(state => state.recordWin);
  const recordLoss = useStatsStore(state => state.recordLoss);
  const markDailyChallengeCompleted = useStatsStore(state => state.markDailyChallengeCompleted);
  const [selectedPileIndex, setSelectedPileIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'practice' | 'official'>('practice');
  const recordedSeedRef = React.useRef<string | null>(null);
  const officialSubmissionRef = React.useRef<string | null>(null);
  const isPlaying = store.isPlaying;
  const gameWon = store.gameWon;
  const incrementTimer = store.incrementTimer;
  const isOfficialMode = store.playMode === 'official';
  const playMode = store.playMode;
  const officialAttemptId = store.officialAttemptId;
  const officialReplay = store.officialReplay;
  const clearOfficialMode = store.clearOfficialMode;
  const refreshOfficial = useOfficialStore(state => state.refreshCurrent);
  const startOfficialAttempt = useOfficialStore(state => state.startAttempt);
  const submitOfficialAttempt = useOfficialStore(state => state.submitAttempt);
  const officialEntry = useOfficialStore(state => state.officialEntry);
  const officialChallenge = useOfficialStore(state => state.challenge);
  const sessionUser = useOfficialStore(state => state.sessionUser);
  const logout = useOfficialStore(state => state.logout);

  useEffect(() => {
    if (!store.seed) {
      store.initializeGame();
    }
  }, [store, store.seed]);

  useEffect(() => {
    void refreshOfficial();
    const intervalId = window.setInterval(() => {
      void refreshOfficial();
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [refreshOfficial]);

  // Record game start only after first move/action
  useEffect(() => {
    if (playMode !== 'official' && store.history.length > 0 && recordedSeedRef.current !== store.seed) {
        recordGameStart();
        recordedSeedRef.current = store.seed;
    }
  }, [playMode, recordGameStart, store.history.length, store.seed]);

  useEffect(() => {
    if (store.gameWon) {
        if (playMode !== 'official') {
            recordWin(store.score, store.timer, store.moves);
        }

        if (playMode === 'daily') {
            const today = format(new Date(), 'yyyy-MM-dd');
            if (store.seed === today) {
                markDailyChallengeCompleted(today);
            }
        }

        if (playMode === 'official' && officialAttemptId && officialSubmissionRef.current !== officialAttemptId) {
            officialSubmissionRef.current = officialAttemptId;
            void submitOfficialAttempt(officialAttemptId, {
                isWin: true,
                replayEvents: officialReplay
            }).finally(() => {
                clearOfficialMode();
                void refreshOfficial();
            });
        }
    }
  }, [clearOfficialMode, gameWon, markDailyChallengeCompleted, officialAttemptId, officialReplay, playMode, recordWin, refreshOfficial, store.moves, store.score, store.seed, submitOfficialAttempt]);


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
      if (selectedMode === 'official') {
        void handleStartOfficialRun();
        return;
      }
      confirmAction(() => {
        if (store.isPlaying && !store.gameWon) {
            recordLoss();
        }
        
        store.initializeGame();
        setSelectedPileIndex(null);
        setSelectedCardIndex(null);
      });
  };

  const handleRestart = () => {
      if (isOfficialMode) {
        window.alert('Restart is disabled during the official daily race.');
        return;
      }
      confirmAction(() => {
          store.restartGame();
          setSelectedPileIndex(null);
          setSelectedCardIndex(null);
      });
  };

  const handleStartOfficialRun = async () => {
      if (isOfficialMode) return;
      if (officialEntry?.hasAttempt) {
        window.alert('Your official entry has already been used for today.');
        return;
      }
      if (officialChallenge && officialChallenge.status !== 'open') {
        window.alert('The official daily race is not open yet.');
        return;
      }

      const startRun = async () => {
        if (store.isPlaying && !store.gameWon) {
          recordLoss();
        }

        const response = await startOfficialAttempt();
        officialSubmissionRef.current = null;
        setSelectedMode('official');
        store.initializeOfficialGame(response.challenge.seed, response.challenge.id, response.attempt.id);
        setSelectedPileIndex(null);
        setSelectedCardIndex(null);
      };

      if (store.moves > 0 && !store.gameWon) {
        if (window.confirm('Starting the official run will discard your current board. Continue?')) {
          await startRun();
        }
        return;
      }

      await startRun();
  };

  const handleAbandonOfficialRun = async () => {
      if (!isOfficialMode || !store.officialAttemptId) return false;

      const confirmed = window.confirm(
        'Abandoning the official run will submit a losing result and consume your entry for today. Continue?'
      );
      if (!confirmed) return false;

      officialSubmissionRef.current = store.officialAttemptId;
      await submitOfficialAttempt(store.officialAttemptId, {
        isWin: false,
        replayEvents: store.officialReplay
      });
      clearOfficialMode();
      store.initializeGame();
      setSelectedPileIndex(null);
      setSelectedCardIndex(null);
      void refreshOfficial();
      return true;
  };

  const handleSelectMode = async (mode: 'practice' | 'official') => {
      if (mode === selectedMode) return;

      if (mode === 'official' && !isOfficialMode) {
        setSelectedMode('official');
        return;
      }

      if (mode === 'practice' && isOfficialMode) {
        const abandoned = await handleAbandonOfficialRun();
        if (!abandoned) return;
      }

      setSelectedMode(mode);
  };

  const primaryActionLabel = isOfficialMode
    ? 'Official Run Live'
    : selectedMode === 'official'
      ? officialEntry?.hasAttempt
        ? 'Entry Used'
        : officialChallenge?.status === 'open'
          ? 'Start Official Run'
          : 'Race Closed'
      : 'New Game';

  const disablePrimaryAction =
    isOfficialMode ||
    (selectedMode === 'official' &&
      (Boolean(officialEntry?.hasAttempt) || officialChallenge?.status !== 'open'));

  return (
    <div className="min-h-screen bg-background p-4">
      <WelcomeGuide />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
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
        defaultTab="stats"
      />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 2xl:px-4">
        <header className="flex flex-col justify-between gap-4 rounded-[24px] border-4 border-primary bg-popover px-4 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.35)] xl:flex-row xl:items-center">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="border-b-4 border-primary pb-2 text-3xl font-black uppercase tracking-tighter text-primary drop-shadow-lg xl:text-4xl">
                Spider Solitaire
            </h1>
            <div className="flex flex-wrap gap-2">
                <button 
                    type="button"
                    onClick={() => void handleSelectMode('practice')}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all",
                      selectedMode === 'practice'
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/30 bg-black/10 text-primary"
                    )}
                >
                    Practice
                </button>
                <button 
                    type="button"
                    onClick={() => void handleSelectMode('official')}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all",
                      selectedMode === 'official'
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-primary/30 bg-black/10 text-primary"
                    )}
                >
                    Global Daily
                </button>
                <button 
                    onClick={() => setShowStats(true)}
                    className="p-2 border-2 border-primary rounded bg-popover text-primary hover:bg-popover/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[2px] active:shadow-none transition-all"
                    title="Profile & Stats"
                >
                    <BarChart2 className="w-6 h-6" />
                </button>
                <button 
                    onClick={() => setShowSettings(true)}
                    className="p-2 border-2 border-primary rounded bg-popover text-primary hover:bg-popover/80 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-[2px] active:shadow-none transition-all"
                    title="Theme"
                >
                    <Palette className="w-6 h-6" />
                </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sessionUser ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowStats(true)}
                  className="rounded-xl border-2 border-primary/30 bg-black/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary"
                >
                  <UserRound className="mr-2 inline h-4 w-4" />
                  {sessionUser.displayName}
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-xl border-2 border-primary/30 bg-black/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-primary"
                >
                  <LogOut className="mr-2 inline h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="rounded-xl border-2 border-primary bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)]"
              >
                <LogIn className="mr-2 inline h-4 w-4" />
                Login / Register
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0 space-y-5">
            <Controls 
              score={store.score}
              moves={store.moves}
              timer={store.timer}
              isPlaying={store.isPlaying}
              isPaused={store.isPaused}
              canUndo={store.canUndo()}
              canPause={!isOfficialMode}
              disableRestart={isOfficialMode}
              disableNewGame={disablePrimaryAction}
              newGameLabel={primaryActionLabel}
              showScoreAndMoves={!isOfficialMode}
              hintPenaltyText={isOfficialMode ? '(+15s)' : null}
              undoPenaltyText={isOfficialMode ? '(+10s)' : null}
              onUndo={store.undo}
              onRestart={handleRestart}
              onNewGame={handleNewGame}
              onToggleTimer={store.toggleTimer}
              onTogglePause={store.togglePause}
              onHint={store.showHint}
              isNewGameHinted={store.hintNewGame}
            />

            <main className="w-full rounded-[24px] border-4 border-primary bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.08))] px-3 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <Foundation foundation={store.foundation} />
                <Stock stock={store.stock} onDeal={store.dealFromStock} isHinted={store.hintDeck} />
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
          </div>

          <RaceSidebar
            selectedMode={selectedMode}
          />
        </div>
      </div>

      {/* Game Won Modal removed - consolidated into StatsModal */}
    </div>
  );
};
