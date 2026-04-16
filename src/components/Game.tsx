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

const formatOfficialTime = (milliseconds: number) => `${Math.round(milliseconds / 1000)}s`;

export const Game: React.FC = () => {
  const store = useGameStore();
  const recordGameStart = useStatsStore((state) => state.recordGameStart);
  const recordWin = useStatsStore((state) => state.recordWin);
  const recordLoss = useStatsStore((state) => state.recordLoss);
  const markDailyChallengeCompleted = useStatsStore((state) => state.markDailyChallengeCompleted);
  const setStatsStorageIdentity = useStatsStore((state) => state.setStorageIdentity);
  const [selectedPileIndex, setSelectedPileIndex] = useState<number | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1440 : false
  );
  const [selectedMode, setSelectedMode] = useState<'practice' | 'official'>(() =>
    store.currentSurface === 'official' && store.officialBoard ? 'official' : 'practice'
  );
  const recordedSeedRef = React.useRef<string | null>(null);
  const officialSubmissionRef = React.useRef<string | null>(null);
  const isPlaying = store.isPlaying;
  const gameWon = store.gameWon;
  const incrementTimer = store.incrementTimer;
  const isOfficialMode = store.playMode === 'official' && store.currentSurface === 'official';
  const playMode = store.playMode;
  const officialAttemptId = store.officialAttemptId;
  const officialReplay = store.officialReplay;
  const refreshOfficial = useOfficialStore((state) => state.refreshCurrent);
  const startOfficialAttempt = useOfficialStore((state) => state.startAttempt);
  const submitOfficialAttempt = useOfficialStore((state) => state.submitAttempt);
  const officialEntry = useOfficialStore((state) => state.officialEntry);
  const officialChallenge = useOfficialStore((state) => state.challenge);
  const sessionUser = useOfficialStore((state) => state.sessionUser);
  const logout = useOfficialStore((state) => state.logout);
  const currentLoading = useOfficialStore((state) => state.currentLoading);

  const hasOfficialBoardForViewer =
    Boolean(store.officialBoard) &&
    (!store.officialBoardOwnerId || store.officialBoardOwnerId === (sessionUser?.id ?? null));
  const officialSubmission =
    store.currentSurface === 'official'
      ? store.officialSubmission
      : hasOfficialBoardForViewer
        ? store.officialBoard?.officialSubmission ?? null
        : null;
  const isFrozenOfficialBoard =
    selectedMode === 'official' && hasOfficialBoardForViewer && Boolean(officialSubmission);
  const showOfficialPlaceholder = selectedMode === 'official' && !hasOfficialBoardForViewer;
  const lockBoardInteractions =
    selectedMode === 'official' && (!isOfficialMode || isFrozenOfficialBoard);

  useEffect(() => {
    if (!store.seed) {
      store.initializeGame();
    }
  }, [store]);

  useEffect(() => {
    setStatsStorageIdentity(sessionUser?.id ?? null);
  }, [sessionUser?.id, setStatsStorageIdentity]);

  useEffect(() => {
    void refreshOfficial();
    const intervalId = window.setInterval(() => {
      void refreshOfficial();
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [refreshOfficial]);

  useEffect(() => {
    if (currentLoading || !store.officialBoard) {
      return;
    }

    const ownerMismatch =
      Boolean(store.officialBoardOwnerId) && store.officialBoardOwnerId !== (sessionUser?.id ?? null);
    const staleChallenge =
      Boolean(officialChallenge?.challengeDate) &&
      Boolean(store.officialBoard.officialChallengeDate) &&
      store.officialBoard.officialChallengeDate !== officialChallenge?.challengeDate;

    if (!ownerMismatch && !staleChallenge) {
      return;
    }

    store.clearOfficialBoard();
    setSelectedMode('practice');
    setSelectedPileIndex(null);
    setSelectedCardIndex(null);
  }, [
    currentLoading,
    officialChallenge?.challengeDate,
    sessionUser?.id,
    store
  ]);

  useEffect(() => {
    if (playMode !== 'official' && store.history.length > 0 && recordedSeedRef.current !== store.seed) {
      recordGameStart();
      recordedSeedRef.current = store.seed;
    }
  }, [playMode, recordGameStart, store.history.length, store.seed]);

  const freezeOfficialResult = React.useCallback(
    (response: Awaited<ReturnType<typeof submitOfficialAttempt>>) => {
      store.freezeOfficialSubmission({
        attemptId: response.attempt?.id ?? store.officialAttemptId ?? '',
        challengeId: response.result.challengeId,
        challengeDate: officialChallenge?.challengeDate ?? store.officialChallengeDate,
        submittedAt: response.attempt?.submittedAt ?? new Date().toISOString(),
        rawTimeMs: response.result.rawTimeMs,
        adjustedTimeMs: response.result.adjustedTimeMs,
        hintCount: response.result.hintCount,
        undoCount: response.result.undoCount,
        isWin: response.result.isWin,
        verificationStatus: response.result.verificationStatus
      });
    },
    [officialChallenge?.challengeDate, store, submitOfficialAttempt]
  );

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
        })
          .then((response) => {
            freezeOfficialResult(response);
            void refreshOfficial();
          })
          .catch(() => {
            officialSubmissionRef.current = null;
          });
      }
    }
  }, [
    freezeOfficialResult,
    gameWon,
    markDailyChallengeCompleted,
    officialAttemptId,
    officialReplay,
    playMode,
    recordWin,
    refreshOfficial,
    store,
    submitOfficialAttempt
  ]);

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
    if (lockBoardInteractions) return;

    const pile = store.tableau[pileIndex];
    const card = pile.cards[cardIndex];

    if (!card.faceUp) return;

    if (selectedPileIndex === null) {
      setSelectedPileIndex(pileIndex);
      setSelectedCardIndex(cardIndex);
    } else if (selectedPileIndex === pileIndex) {
      if (selectedCardIndex === cardIndex) {
        setSelectedPileIndex(null);
        setSelectedCardIndex(null);
      } else {
        setSelectedCardIndex(cardIndex);
      }
    } else {
      store.moveCards(selectedPileIndex, pileIndex, selectedCardIndex!);
      setSelectedPileIndex(null);
      setSelectedCardIndex(null);
    }
  };

  const handleEmptyPileClick = (pileIndex: number) => {
    if (lockBoardInteractions) return;

    if (selectedPileIndex !== null) {
      store.moveCards(selectedPileIndex, pileIndex, selectedCardIndex!);
      setSelectedPileIndex(null);
      setSelectedCardIndex(null);
    }
  };

  const handleCardDoubleClick = (pileIndex: number, cardIndex: number) => {
    if (lockBoardInteractions) return;

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
      if (officialSubmission) {
        window.alert('Your official daily attempt has already been submitted.');
        return;
      }
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
    if (selectedMode === 'official') {
      window.alert('Restart is disabled during the global daily.');
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

    if (!sessionUser) {
      setShowAuthModal(true);
      return;
    }

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
      store.initializeOfficialGame(
        response.challenge.seed,
        response.challenge.id,
        response.attempt.id,
        response.challenge.challengeDate,
        sessionUser.id
      );
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
    const response = await submitOfficialAttempt(store.officialAttemptId, {
      isWin: false,
      replayEvents: store.officialReplay
    });
    freezeOfficialResult(response);
    store.switchToPracticeBoard();
    setSelectedPileIndex(null);
    setSelectedCardIndex(null);
    setSelectedMode('practice');
    void refreshOfficial();
    return true;
  };

  const handleSelectMode = async (mode: 'practice' | 'official') => {
    if (mode === selectedMode) return;

    if (mode === 'official') {
      setSelectedMode('official');
      if (hasOfficialBoardForViewer) {
        store.switchToOfficialBoard();
        setSelectedPileIndex(null);
        setSelectedCardIndex(null);
      }
      return;
    }

    if (isOfficialMode) {
      const abandoned = await handleAbandonOfficialRun();
      if (!abandoned) return;
      return;
    }

    if (store.currentSurface === 'official') {
      store.switchToPracticeBoard();
      setSelectedPileIndex(null);
      setSelectedCardIndex(null);
    }

    setSelectedMode('practice');
  };

  const primaryActionLabel = isOfficialMode
    ? 'Official Run Live'
    : selectedMode === 'official'
      ? officialSubmission
        ? 'Entry Submitted'
        : !sessionUser
          ? 'Sign In for Daily'
          : officialEntry?.hasAttempt
            ? 'Entry Used'
            : officialChallenge?.status === 'open'
              ? 'Start Official Run'
              : 'Race Closed'
      : 'New Game';

  const disablePrimaryAction =
    isOfficialMode ||
    (selectedMode === 'official' &&
      (!sessionUser || Boolean(officialEntry?.hasAttempt) || officialChallenge?.status !== 'open'));

  const displayedScore = showOfficialPlaceholder ? 0 : store.score;
  const displayedMoves = showOfficialPlaceholder ? 0 : store.moves;
  const displayedTimer = showOfficialPlaceholder ? 0 : store.timer;
  const displayedIsPlaying = showOfficialPlaceholder ? false : store.isPlaying;
  const displayedIsPaused = selectedMode === 'official' ? false : store.isPaused;

  const controlsPanel = (
    <Controls
      score={displayedScore}
      moves={displayedMoves}
      timer={displayedTimer}
      isPlaying={displayedIsPlaying}
      isPaused={displayedIsPaused}
      canUndo={!lockBoardInteractions && store.canUndo()}
      canPause={selectedMode !== 'official'}
      disableHint={lockBoardInteractions}
      disableRestart={selectedMode === 'official'}
      disableNewGame={disablePrimaryAction}
      newGameLabel={primaryActionLabel}
      showScoreAndMoves={selectedMode !== 'official'}
      hintPenaltyText={selectedMode === 'official' ? '(+15s)' : null}
      undoPenaltyText={selectedMode === 'official' ? '(+10s)' : null}
      onUndo={store.undo}
      onRestart={handleRestart}
      onNewGame={handleNewGame}
      onToggleTimer={store.toggleTimer}
      onTogglePause={store.togglePause}
      onHint={store.showHint}
      isNewGameHinted={!showOfficialPlaceholder && store.hintNewGame}
    />
  );

  const boardPanel = (
    <main className="w-full rounded-[24px] border-4 border-primary bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.08))] px-3 py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.35)]">
      {showOfficialPlaceholder ? (
        <div className="grid min-h-[540px] place-items-center px-4 py-10">
          <div className="w-full max-w-2xl rounded-[28px] border-4 border-primary/25 bg-popover/70 p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,0.25)]">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary/65">
              Global Daily
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-primary">
              Separate From Practice
            </h2>
            <div className="mt-4 space-y-3 text-sm font-bold text-primary/80">
              {!sessionUser && (
                <p>Sign in to start your one official daily run and lock it to your account.</p>
              )}
              {sessionUser && !officialEntry?.hasAttempt && officialChallenge?.status === 'open' && (
                <p>Today&apos;s official board stays isolated from your practice board. Start it when you are ready.</p>
              )}
              {sessionUser && officialEntry?.hasAttempt && (
                <p>
                  Today&apos;s official entry is already used for this account. If the run was submitted in this
                  browser, the frozen final board will appear here.
                </p>
              )}
              {officialChallenge?.status && officialChallenge.status !== 'open' && !officialEntry?.hasAttempt && (
                <p>The official daily is not open right now. Practice boards remain available.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-start justify-between gap-4">
            <Foundation foundation={store.foundation} />
            <Stock
              stock={store.stock}
              onDeal={lockBoardInteractions ? () => undefined : store.dealFromStock}
              isHinted={!lockBoardInteractions && store.hintDeck}
            />
          </div>
          <Tableau
            tableau={store.tableau}
            selectedPileIndex={selectedPileIndex}
            selectedCardIndex={selectedCardIndex}
            hintSource={!lockBoardInteractions ? store.hintSource : undefined}
            onCardClick={handleCardClick}
            onCardDoubleClick={handleCardDoubleClick}
            onEmptyPileClick={handleEmptyPileClick}
          />
          {isFrozenOfficialBoard && officialSubmission && (
            <div className="mt-5 rounded-[20px] border-2 border-primary/30 bg-popover px-4 py-4 text-sm font-bold text-primary/80">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                Submitted Official Result
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-primary/20 bg-black/10 px-3 py-3">
                  Raw Time: {formatOfficialTime(officialSubmission.rawTimeMs)}
                </div>
                <div className="rounded-xl border border-primary/20 bg-black/10 px-3 py-3">
                  Adjusted: {formatOfficialTime(officialSubmission.adjustedTimeMs)}
                </div>
                <div className="rounded-xl border border-primary/20 bg-black/10 px-3 py-3">
                  Hints / Undos: {officialSubmission.hintCount} / {officialSubmission.undoCount}
                </div>
                <div className="rounded-xl border border-primary/20 bg-black/10 px-3 py-3">
                  Result: {officialSubmission.isWin ? 'Win' : 'Loss'}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('spider-solitaire-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('spider-solitaire-sidebar-collapsed');
    if (stored !== null) {
      setSidebarCollapsed(stored === 'true');
    }
  }, []);

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
                  'rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all',
                  selectedMode === 'practice'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-primary/30 bg-black/10 text-primary'
                )}
              >
                Practice
              </button>
              <button
                type="button"
                onClick={() => void handleSelectMode('official')}
                className={cn(
                  'rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all',
                  selectedMode === 'official'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-primary/30 bg-black/10 text-primary'
                )}
              >
                Global Daily
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="rounded border-2 border-primary bg-popover p-2 text-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,0.4)] transition-all hover:bg-popover/80 active:translate-y-[2px] active:shadow-none"
                title="Profile & Stats"
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
          {sidebarCollapsed ? (
            <>
              <div className="min-w-0">
                {controlsPanel}
              </div>
              <RaceSidebar
                selectedMode={selectedMode}
                collapsed
                onToggleCollapse={() => setSidebarCollapsed(false)}
              />
              <div className="min-w-0 xl:col-span-2">
                {boardPanel}
              </div>
            </>
          ) : (
            <>
              <div className="min-w-0 space-y-5">
                {controlsPanel}
                {boardPanel}
              </div>
              <RaceSidebar
                selectedMode={selectedMode}
                onToggleCollapse={() => setSidebarCollapsed(true)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
