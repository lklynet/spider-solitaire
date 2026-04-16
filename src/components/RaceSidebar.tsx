import React from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Globe,
  Info,
  Move,
  Sparkles,
  Timer
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useGameStore } from '../store/gameStore';
import { useOfficialStore } from '../store/officialStore';
import { useStatsStore } from '../store/statsStore';

interface RaceSidebarProps {
  selectedMode: 'practice' | 'official';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const formatDuration = (totalSeconds: number) => {
  const safeValue = Math.max(totalSeconds, 0);
  const hours = Math.floor(safeValue / 3600);
  const minutes = Math.floor((safeValue % 3600) / 60);
  const seconds = safeValue % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const RaceSidebar: React.FC<RaceSidebarProps> = ({
  selectedMode,
  collapsed = false,
  onToggleCollapse
}) => {
  const { challenge, leaderboard, globalLeaderboard } = useOfficialStore();
  const officialSubmission = useGameStore((state) => state.officialBoard?.officialSubmission ?? null);
  const stats = useStatsStore();
  const [leaderboardTab, setLeaderboardTab] = React.useState<'current' | 'global'>('current');
  const [endsCountdown, setEndsCountdown] = React.useState('');
  const [showRules, setShowRules] = React.useState(false);

  React.useEffect(() => {
    if (!challenge) {
      setEndsCountdown('');
      return;
    }

    const tick = () => {
      const target = new Date(challenge.closesAt);
      const diffSeconds = Math.floor((target.getTime() - Date.now()) / 1000);
      setEndsCountdown(formatDuration(diffSeconds));
    };

    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [challenge]);

  const sidebarBoard = leaderboardTab === 'current' ? leaderboard : globalLeaderboard;
  const formatMilliseconds = (value: number) => `${Math.round(value / 1000)}s`;

  const collapseButton = onToggleCollapse ? (
    <button
      type="button"
      onClick={onToggleCollapse}
      className="rounded-xl border-2 border-primary/25 bg-black/10 p-2 text-primary transition hover:border-primary hover:bg-black/15"
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </button>
  ) : null;

  const rulesModal =
    showRules && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[220] grid place-items-center bg-black/55 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-[28px] border-4 border-primary bg-popover shadow-[10px_10px_0px_0px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between border-b-4 border-primary/20 px-5 py-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/60">
                    Global Daily Race
                  </div>
                  <div className="mt-1 text-xl font-black text-primary">Rules</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRules(false)}
                  className="rounded-xl border-2 border-primary/25 bg-black/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-primary"
                >
                  Close
                </button>
              </div>
              <div className="space-y-3 p-5 text-sm font-bold text-primary/80">
                <div className="rounded-2xl border border-primary/20 bg-black/10 px-4 py-3">
                  One verified official attempt per day.
                </div>
                <div className="rounded-2xl border border-primary/20 bg-black/10 px-4 py-3">
                  Pause is disabled in race mode.
                </div>
                <div className="rounded-2xl border border-primary/20 bg-black/10 px-4 py-3">
                  Hints add 15 seconds.
                </div>
                <div className="rounded-2xl border border-primary/20 bg-black/10 px-4 py-3">
                  Undos add 10 seconds.
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  if (collapsed) {
    return (
      <>
        <section className="neo-box h-full min-h-0 rounded-xl p-3">
          <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-3 overflow-hidden">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border-2 border-primary/25 bg-black/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div className="min-w-0 overflow-hidden">
                <div className="truncate text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">
                  {selectedMode === 'official' ? 'Global Daily' : 'Practice + Daily'}
                </div>
                <div className="truncate text-sm font-black text-primary">Daily Race</div>
                <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-[11px] font-black text-primary/75">
                  <span className="truncate">{challenge?.challengeDate ?? '--'}</span>
                  <span className="flex-shrink-0 text-primary/40">•</span>
                  <span className="flex-shrink-0">Ends {endsCountdown || '--:--'}</span>
                  <span className="flex-shrink-0 rounded-full border border-primary/20 bg-black/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-primary">
                    {challenge?.status ?? 'loading'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="rounded-xl border-2 border-primary/25 bg-black/10 p-2 text-primary transition hover:border-primary"
                title="Daily Race Rules"
              >
                <Info className="h-4 w-4" />
              </button>
              {collapseButton}
            </div>
          </div>
        </section>
        {rulesModal}
      </>
    );
  }

  return (
    <>
      <aside className="w-full lg:sticky lg:top-4">
        <div className="overflow-hidden rounded-[28px] border-4 border-primary bg-popover shadow-[10px_10px_0px_0px_rgba(0,0,0,0.38)]">
          <div className="border-b-4 border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(255,215,0,0.18),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.12))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/65">Global</div>
                <div className="mt-1 flex items-center gap-2 text-xl font-black text-primary">
                  <Globe className="h-5 w-5" />
                  Daily Race
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full border-2 border-primary/25 bg-black/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {challenge?.status ?? 'loading'}
                </div>
                {collapseButton}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-stretch gap-2">
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 px-3 py-2">
                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary/55">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Date
                </div>
                <div className="mt-1 text-sm font-black text-primary">{challenge?.challengeDate ?? '--'}</div>
              </div>
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 px-3 py-2">
                <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary/55">
                  <Timer className="h-3.5 w-3.5" />
                  Ends
                </div>
                <div className="mt-1 text-sm font-black text-primary">{endsCountdown || '--:--'}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowRules(true)}
                className="grid place-items-center rounded-2xl border-2 border-primary/25 bg-black/10 px-3 py-2 text-primary hover:border-primary"
                title="Daily Race Rules"
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4">
            {selectedMode === 'practice' && (
              <>
                <div className="rounded-[22px] border-2 border-primary/25 bg-black/10 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                    Practice Stats
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-primary/20 bg-popover px-3 py-3">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-primary/55">Games</div>
                      <div className="mt-1 text-sm font-black text-primary">{stats.gamesPlayed}</div>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-popover px-3 py-3">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-primary/55">Wins</div>
                      <div className="mt-1 text-sm font-black text-primary">{stats.gamesWon}</div>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-popover px-3 py-3">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-primary/55">Best Time</div>
                      <div className="mt-1 text-sm font-black text-primary">
                        {stats.bestTime ? formatDuration(stats.bestTime) : '--'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-popover px-3 py-3">
                      <div className="text-[9px] uppercase tracking-[0.18em] text-primary/55">Best Streak</div>
                      <div className="mt-1 text-sm font-black text-primary">{stats.bestStreak}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border-2 border-primary/25 bg-black/10 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                    Practice Snapshot
                  </div>
                  <div className="mt-3 space-y-2 text-sm font-bold text-primary/80">
                    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-popover px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Move className="h-4 w-4 text-primary/60" />
                        Total Moves
                      </span>
                      <span>{stats.totalMoves}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-popover px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary/60" />
                        Daily Practice Seeds
                      </span>
                      <span>{stats.dailyChallengesCompleted.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-popover px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-primary/60" />
                        This Week Wins
                      </span>
                      <span>{stats.weekly.gamesWon}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedMode === 'official' && (
              <>
                {officialSubmission && (
                  <div className="rounded-[22px] border-2 border-primary/25 bg-black/10 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                      Submitted Run
                    </div>
                    <div className="mt-3 grid gap-2 text-sm font-bold text-primary/80">
                      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-popover px-3 py-3">
                        <span>Raw Time</span>
                        <span>{formatMilliseconds(officialSubmission.rawTimeMs)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-popover px-3 py-3">
                        <span>Adjusted Time</span>
                        <span>{formatMilliseconds(officialSubmission.adjustedTimeMs)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-popover px-3 py-3">
                        <span>Hints / Undos</span>
                        <span>
                          {officialSubmission.hintCount} / {officialSubmission.undoCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-popover px-3 py-3">
                        <span>Verification</span>
                        <span>{officialSubmission.verificationStatus}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-[22px] border-2 border-primary/25 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                      Leaderboard
                    </div>
                    <div className="flex gap-2">
                      {(['current', 'global'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setLeaderboardTab(tab)}
                          className={cn(
                            'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]',
                            leaderboardTab === tab
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-primary/25 bg-popover text-primary'
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {sidebarBoard.length === 0 ? (
                      <div className="rounded-xl border border-primary/20 bg-popover px-3 py-4 text-sm font-bold text-primary/70">
                        No standings yet.
                      </div>
                    ) : (
                      sidebarBoard.slice(0, 6).map((entry, index) => (
                        <div
                          key={`${leaderboardTab}-${entry.userId}`}
                          className={cn(
                            'flex items-center justify-between rounded-xl border bg-popover px-3 py-2',
                            index === 0 ? 'border-yellow-300/60 bg-yellow-400/10' : 'border-primary/20'
                          )}
                        >
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/55">
                              #{entry.rank}
                            </div>
                            <div className="text-sm font-black text-primary">{entry.displayName}</div>
                          </div>
                          <div className="text-right text-sm font-bold text-primary/80">
                            {'adjustedTimeMs' in entry
                              ? `${Math.round(entry.adjustedTimeMs / 1000)}s`
                              : `${entry.points} pts`}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
      {rulesModal}
    </>
  );
};
