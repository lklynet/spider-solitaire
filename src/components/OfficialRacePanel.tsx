import React from 'react';
import { CalendarClock, Flag, Lock, LogOut, Rocket, ShieldAlert, Timer, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';
import { useOfficialStore } from '../store/officialStore';

interface OfficialRacePanelProps {
  isOfficialMode: boolean;
  liveTimeSeconds: number;
  hintCount: number;
  undoCount: number;
  onStartOfficialRun: () => void;
  onAbandonOfficialRun: () => void;
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

export const OfficialRacePanel: React.FC<OfficialRacePanelProps> = ({
  isOfficialMode,
  liveTimeSeconds,
  hintCount,
  undoCount,
  onStartOfficialRun,
  onAbandonOfficialRun
}) => {
  const {
    challenge,
    sessionUser,
    officialEntry,
    leaderboard,
    weeklyLeaderboard,
    monthlyLeaderboard,
    globalLeaderboard,
    profile,
    currentLoading,
    authLoading,
    actionLoading,
    error,
    lastSubmission,
    login,
    logout,
    register
  } = useOfficialStore();
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
  const [username, setUsername] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [countdown, setCountdown] = React.useState('');
  const [boardTab, setBoardTab] = React.useState<'daily' | 'weekly' | 'monthly' | 'global' | 'profile'>('daily');

  React.useEffect(() => {
    if (!challenge) {
      setCountdown('');
      return;
    }

    const tick = () => {
      const target = new Date(challenge.status === 'open' ? challenge.closesAt : challenge.opensAt);
      const diffSeconds = Math.floor((target.getTime() - Date.now()) / 1000);
      setCountdown(formatDuration(diffSeconds));
    };

    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [challenge]);

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (authMode === 'login') {
      await login(username, password);
      return;
    }

    await register(username, displayName, password);
  };

  const activeBoard =
    boardTab === 'daily'
      ? leaderboard
      : boardTab === 'weekly'
        ? weeklyLeaderboard
        : boardTab === 'monthly'
          ? monthlyLeaderboard
          : globalLeaderboard;

  return (
    <section className="w-full max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-[28px] border-4 border-primary bg-popover shadow-[10px_10px_0px_0px_rgba(0,0,0,0.38)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,215,0,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(0,153,255,0.14),transparent_35%)]" />
        <div className="relative grid gap-4 p-5 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/70">
                  Official Daily Race
                </div>
                <div className="mt-1 flex items-center gap-2 text-2xl font-black text-primary">
                  <Rocket className="h-6 w-6" />
                  One Shot. One Seed. One Board.
                </div>
              </div>
              <div
                className={cn(
                  'rounded-full border-2 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em]',
                  challenge?.status === 'open'
                    ? 'border-green-400 bg-green-500/15 text-green-200'
                    : 'border-yellow-300 bg-yellow-400/15 text-yellow-100'
                )}
              >
                {challenge ? challenge.status : currentLoading ? 'loading' : 'offline'}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border-2 border-primary/30 bg-black/15 p-4">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">
                  <CalendarClock className="h-4 w-4" />
                  Challenge Date
                </div>
                <div className="text-xl font-black text-primary">
                  {challenge?.challengeDate ?? '--'}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/30 bg-black/15 p-4">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">
                  <Timer className="h-4 w-4" />
                  {challenge?.status === 'open' ? 'Closes In' : 'Opens In'}
                </div>
                <div className="text-xl font-black text-primary">{countdown || '--:--'}</div>
              </div>
              <div className="rounded-2xl border-2 border-primary/30 bg-black/15 p-4">
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">
                  <Flag className="h-4 w-4" />
                  Attempt Rule
                </div>
                <div className="text-xl font-black text-primary">Single Entry</div>
              </div>
            </div>

            <div className="rounded-[24px] border-2 border-primary/40 bg-primary/10 p-4">
              {sessionUser ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/70">
                        Signed In
                      </div>
                      <div className="text-lg font-black text-primary">{sessionUser.displayName}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-primary/60">
                        @{sessionUser.username}
                      </div>
                    </div>
                    <button
                      onClick={() => void logout()}
                      disabled={authLoading}
                      className="rounded-xl border-2 border-primary/30 bg-popover px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary transition hover:border-primary disabled:opacity-50"
                    >
                      <LogOut className="mr-2 inline h-4 w-4" />
                      Logout
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border-2 border-primary/20 bg-black/10 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/60">
                        Entry Status
                      </div>
                      <div className="mt-2 text-lg font-black text-primary">
                        {isOfficialMode
                          ? 'Run Live'
                          : officialEntry?.hasAttempt
                            ? 'Used'
                            : 'Ready'}
                      </div>
                    </div>
                    <div className="rounded-2xl border-2 border-primary/20 bg-black/10 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/60">
                        Penalty Preview
                      </div>
                      <div className="mt-2 text-lg font-black text-primary">
                        +{hintCount * 15 + undoCount * 10}s
                      </div>
                    </div>
                    <div className="rounded-2xl border-2 border-primary/20 bg-black/10 p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/60">
                        Live Time
                      </div>
                      <div className="mt-2 text-lg font-black text-primary">
                        {formatDuration(liveTimeSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={onStartOfficialRun}
                      disabled={
                        actionLoading ||
                        !challenge ||
                        challenge.status !== 'open' ||
                        Boolean(officialEntry?.hasAttempt) ||
                        isOfficialMode
                      }
                      className="rounded-2xl border-2 border-primary bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)] transition hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                    >
                      <Trophy className="mr-2 inline h-4 w-4" />
                      Start Official Run
                    </button>
                    <button
                      onClick={onAbandonOfficialRun}
                      disabled={!isOfficialMode || actionLoading}
                      className="rounded-2xl border-2 border-red-500/60 bg-red-900/30 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-red-100 transition hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ShieldAlert className="mr-2 inline h-4 w-4" />
                      Abandon And Burn Entry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="grid gap-4 lg:grid-cols-[0.34fr_1fr]">
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={cn(
                        'rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-[0.24em] transition',
                        authMode === 'login'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-primary/30 bg-popover text-primary'
                      )}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className={cn(
                        'rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-[0.24em] transition',
                        authMode === 'register'
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-primary/30 bg-popover text-primary'
                      )}
                    >
                      Register
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">
                        Username
                      </span>
                      <input
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="rounded-xl border-2 border-primary/30 bg-black/10 px-3 py-2 font-bold text-primary outline-none focus:border-primary"
                        placeholder="racehandle"
                      />
                    </label>
                    {authMode === 'register' && (
                      <label className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">
                          Display Name
                        </span>
                        <input
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          className="rounded-xl border-2 border-primary/30 bg-black/10 px-3 py-2 font-bold text-primary outline-none focus:border-primary"
                          placeholder="Card Crusher"
                        />
                      </label>
                    )}
                    <label className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/70">
                        Password
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="rounded-xl border-2 border-primary/30 bg-black/10 px-3 py-2 font-bold text-primary outline-none focus:border-primary"
                        placeholder="minimum 8 characters"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full rounded-xl border-2 border-primary bg-primary px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)] transition disabled:opacity-50 disabled:shadow-none"
                      >
                        <Lock className="mr-2 inline h-4 w-4" />
                        {authMode === 'login' ? 'Enter Race' : 'Create Racer'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border-2 border-red-500/60 bg-red-900/30 px-4 py-3 text-sm font-bold text-red-100">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-[26px] border-2 border-primary/40 bg-black/20 p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.34em] text-primary/60">
              Race Control
            </div>
            <div className="mt-3 space-y-3">
              <div className="rounded-2xl border-2 border-primary/25 bg-popover/60 p-4">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-primary/60">
                  Official Rules
                </div>
                <ul className="mt-3 space-y-2 text-sm font-bold text-primary/85">
                  <li>One official attempt each day</li>
                  <li>Pause is disabled in race mode</li>
                  <li>Hints add 15 seconds</li>
                  <li>Undos add 10 seconds</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-primary/25 bg-popover/60 p-4">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-primary/60">
                  Current Run
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-primary/20 bg-black/10 px-2 py-3">
                    <div className="text-[9px] uppercase tracking-[0.24em] text-primary/60">Time</div>
                    <div className="mt-1 text-lg font-black text-primary">{formatDuration(liveTimeSeconds)}</div>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-black/10 px-2 py-3">
                    <div className="text-[9px] uppercase tracking-[0.24em] text-primary/60">Hints</div>
                    <div className="mt-1 text-lg font-black text-primary">{hintCount}</div>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-black/10 px-2 py-3">
                    <div className="text-[9px] uppercase tracking-[0.24em] text-primary/60">Undos</div>
                    <div className="mt-1 text-lg font-black text-primary">{undoCount}</div>
                  </div>
                </div>
              </div>
              {lastSubmission && (
                <div className="rounded-2xl border-2 border-green-400/40 bg-green-500/10 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.24em] text-green-100/80">
                    Last Submission
                  </div>
                  <div className="mt-2 text-lg font-black text-green-50">
                    {(lastSubmission.adjustedTimeMs / 1000).toFixed(0)}s adjusted
                  </div>
                  <div className="text-xs uppercase tracking-[0.16em] text-green-100/70">
                    Verification {lastSubmission.verificationStatus}
                  </div>
                </div>
              )}
              <div className="rounded-2xl border-2 border-primary/25 bg-popover/60 p-4">
                <div className="text-xs font-black uppercase tracking-[0.24em] text-primary/60">
                  Standings
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['daily', 'weekly', 'monthly', 'global', 'profile'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setBoardTab(tab)}
                      disabled={tab === 'profile' && !profile}
                      className={cn(
                        'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] transition',
                        boardTab === tab
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-primary/25 bg-black/10 text-primary/70',
                        tab === 'profile' && !profile && 'cursor-not-allowed opacity-40'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  {boardTab === 'profile' ? (
                    profile ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-primary/20 bg-black/10 px-3 py-3">
                          <div className="text-lg font-black text-primary">{profile.user.displayName}</div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-primary/60">
                            @{profile.user.username}
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="rounded-lg border border-primary/15 bg-black/10 px-2 py-2 text-center">
                              <div className="text-[9px] uppercase tracking-[0.2em] text-primary/55">Points</div>
                              <div className="text-base font-black text-primary">{profile.badges.totalPoints}</div>
                            </div>
                            <div className="rounded-lg border border-primary/15 bg-black/10 px-2 py-2 text-center">
                              <div className="text-[9px] uppercase tracking-[0.2em] text-primary/55">Wins</div>
                              <div className="text-base font-black text-primary">{profile.badges.wins1st}</div>
                            </div>
                            <div className="rounded-lg border border-primary/15 bg-black/10 px-2 py-2 text-center">
                              <div className="text-[9px] uppercase tracking-[0.2em] text-primary/55">Top 10</div>
                              <div className="text-base font-black text-primary">{profile.badges.finishesTop10}</div>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-xl border border-primary/20 bg-black/10 px-3 py-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                            Recent Finishes
                          </div>
                          <div className="mt-2 space-y-2">
                            {profile.recentFinishes.length === 0 ? (
                              <div className="text-sm font-bold text-primary/70">No finalized finishes yet.</div>
                            ) : (
                              profile.recentFinishes.map((finish) => (
                                <div key={finish.challengeDate} className="flex items-center justify-between">
                                  <div className="text-sm font-black text-primary">{finish.challengeDate}</div>
                                  <div className="text-sm font-bold text-primary/80">
                                    #{finish.rank} · {finish.pointsAwarded} pts
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-primary/20 bg-black/10 px-3 py-4 text-sm font-bold text-primary/70">
                        Sign in to view your race profile.
                      </div>
                    )
                  ) : activeBoard.length === 0 ? (
                    <div className="rounded-xl border border-primary/20 bg-black/10 px-3 py-4 text-sm font-bold text-primary/70">
                      No standings have finalized yet.
                    </div>
                  ) : (
                    activeBoard.slice(0, 5).map((entry) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between rounded-xl border border-primary/20 bg-black/10 px-3 py-2"
                      >
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/55">
                            #{entry.rank}
                          </div>
                          <div className="text-sm font-black text-primary">{entry.displayName}</div>
                        </div>
                        <div className="text-right">
                          {'adjustedTimeMs' in entry ? (
                            <>
                              <div className="text-sm font-black text-primary">
                                {(entry.adjustedTimeMs / 1000).toFixed(0)}s
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.18em] text-primary/55">
                                {entry.pointsAwarded} pts
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm font-black text-primary">{entry.points} pts</div>
                              <div className="text-[10px] uppercase tracking-[0.18em] text-primary/55">
                                {entry.wins} wins · {entry.top3} top 3
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
