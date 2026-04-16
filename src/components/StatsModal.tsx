import React from 'react';
import { useStatsStore } from '../store/statsStore';
import { useOfficialStore } from '../store/officialStore';
import { X, Trophy, Flame, Timer, Move, Trash2, Gamepad2, Percent, Crown, Zap, Shield, Medal, CalendarClock } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameWon?: boolean;
  score?: number;
  moves?: number;
  time?: number;
  onPlayAgain?: () => void;
  defaultTab?: 'stats' | 'race';
}

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}

const StatItem = ({ icon: Icon, label, value, color }: StatItemProps) => (
  <div className={cn("flex flex-col items-center p-3 border-2 border-primary rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] bg-popover text-primary h-full justify-between", color)}>
     <Icon className="w-6 h-6 mb-1" />
     <span className="text-[10px] font-bold uppercase opacity-80 text-center">{label}</span>
     <span className="text-xl font-black">{value}</span>
  </div>
);

export const StatsModal: React.FC<StatsModalProps> = ({ 
    isOpen, 
    onClose, 
    gameWon, 
    score, 
    moves, 
    time, 
    onPlayAgain,
    defaultTab = 'stats'
}) => {
  const stats = useStatsStore();
  const profile = useOfficialStore(state => state.profile);
  const leaderboard = useOfficialStore(state => state.leaderboard);
  const weeklyLeaderboard = useOfficialStore(state => state.weeklyLeaderboard);
  const monthlyLeaderboard = useOfficialStore(state => state.monthlyLeaderboard);
  const globalLeaderboard = useOfficialStore(state => state.globalLeaderboard);
  const refreshPeriods = useStatsStore(state => state.refreshPeriods);
  const [tab, setTab] = React.useState<'stats' | 'race'>(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      refreshPeriods();
      setTab(defaultTab);
    }
  }, [defaultTab, isOpen, refreshPeriods]);

  if (!isOpen) return null;

  const formatTime = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all your statistics? This cannot be undone.')) {
        stats.resetStats();
    }
  };

  const raceHighlights = [
    { icon: Trophy, label: 'Total Points', value: profile?.badges.totalPoints ?? 0 },
    { icon: Crown, label: 'Daily Wins', value: profile?.badges.wins1st ?? 0 },
    { icon: Medal, label: 'Top 3', value: profile?.badges.finishesTop3 ?? 0 },
    { icon: Shield, label: 'Top 10', value: profile?.badges.finishesTop10 ?? 0 }
  ];

  const boardSections = [
    { title: 'Daily', entries: leaderboard, mode: 'time' as const },
    { title: 'Weekly', entries: weeklyLeaderboard, mode: 'points' as const },
    { title: 'Monthly', entries: monthlyLeaderboard, mode: 'points' as const },
    { title: 'Global', entries: globalLeaderboard, mode: 'points' as const }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-popover w-full max-w-3xl h-[90vh] p-5 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,0.4)] rounded-xl relative text-primary overflow-hidden">
        <button 
            onClick={handleReset}
            className="absolute top-4 left-4 p-2 z-10 flex items-center justify-center hover:bg-red-900/50 rounded-full border-2 border-transparent hover:border-red-500 text-red-500 transition-all"
            title="Reset Statistics"
        >
            <Trash2 className="w-5 h-5" />
        </button>

        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 z-10 flex items-center justify-center hover:bg-primary/20 rounded-full border-2 border-transparent hover:border-primary transition-all text-primary"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-3 h-full min-h-0 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl font-black uppercase tracking-tighter drop-shadow-md">
              {tab === 'stats' ? 'Casual Stats' : 'Race Summary'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setTab('stats')}
                className={cn(
                  "px-3 py-2 rounded-lg border-2 font-black uppercase tracking-wider transition-all text-sm",
                  tab === 'stats'
                    ? "bg-primary text-primary-foreground border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]"
                    : "border-primary/30 text-primary/70 hover:text-primary hover:border-primary"
                )}
              >
                Stats
              </button>
              <button
                onClick={() => setTab('race')}
                className={cn(
                  "px-3 py-2 rounded-lg border-2 font-black uppercase tracking-wider transition-all text-sm",
                  tab === 'race'
                    ? "bg-primary text-primary-foreground border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]"
                    : "border-primary/30 text-primary/70 hover:text-primary hover:border-primary"
                )}
              >
                Race
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2">
            {gameWon && (
                <div className="mb-4 pb-4 border-b-2 border-primary/20 text-center animate-in zoom-in duration-300">
                    <h2 className="text-4xl font-black mb-3 text-primary drop-shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">YOU WON!</h2>
                    <div className="flex flex-wrap justify-center gap-3 mb-4">
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
                            Score: {score}
                        </div>
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
                            Moves: {moves}
                        </div>
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
                            Time: {time !== undefined ? formatTime(time) : '--:--'}
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            onPlayAgain?.();
                            onClose();
                        }}
                        className="neo-button bg-primary text-primary-foreground text-sm px-6 py-2"
                    >
                        Play Again
                    </button>
                </div>
            )}

            {tab === 'stats' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatItem icon={Gamepad2} label="Total Games Played" value={stats.gamesPlayed} color="bg-primary/10" />
                <StatItem icon={Trophy} label="Games Won" value={stats.gamesWon} color="bg-primary/20" />
                <StatItem icon={Percent} label="Win %" value={stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) + '%' : '0%'} color="bg-primary/10" />
                <StatItem icon={Crown} label="Best Score" value={stats.bestScore} color="bg-primary/20" />
                <StatItem icon={Timer} label="Best Time" value={stats.bestTime ? `${Math.floor(stats.bestTime / 60)}:${(stats.bestTime % 60).toString().padStart(2, '0')}` : '--:--'} color="bg-primary/10" />
                <StatItem icon={Move} label="Least Moves" value={stats.leastMoves || '-'} color="bg-primary/20" />
                <StatItem icon={Flame} label="Current Streak" value={stats.currentStreak} color="bg-primary/10" />
                <StatItem icon={Zap} label="Best Streak" value={stats.bestStreak} color="bg-primary/20" />
                <StatItem icon={CalendarClock} label="Practice Seeds" value={stats.dailyChallengesCompleted.length} color="bg-primary/10" />
                <StatItem icon={Shield} label="Total Hints" value={stats.totalHints} color="bg-primary/20" />
                <StatItem icon={Shield} label="Total Undos" value={stats.totalUndos} color="bg-primary/10" />
                <StatItem icon={CalendarClock} label="This Week Wins" value={stats.weekly.gamesWon} color="bg-primary/20" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {raceHighlights.map(({ icon, label, value }, index) => (
                    <StatItem
                      key={label}
                      icon={icon}
                      label={label}
                      value={value}
                      color={index % 2 === 0 ? 'bg-primary/10' : 'bg-primary/20'}
                    />
                  ))}
                </div>

                <div className="border-2 border-primary rounded-xl p-4 bg-primary/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
                  <div className="text-[10px] uppercase font-bold opacity-70">Race Profile</div>
                  {profile ? (
                    <>
                      <div className="mt-1 text-2xl font-black">{profile.user.displayName}</div>
                      <div className="text-[10px] uppercase tracking-wider opacity-70">@{profile.user.username}</div>
                      <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm font-bold">
                        <div className="rounded-lg border-2 border-primary/30 p-3 bg-popover">
                          Practice Days: {profile.badges.daysPlayed}
                        </div>
                        <div className="rounded-lg border-2 border-primary/30 p-3 bg-popover">
                          Official Submissions: {profile.badges.daysSubmitted}
                        </div>
                        <div className="rounded-lg border-2 border-primary/30 p-3 bg-popover">
                          Top 5 Finishes: {profile.badges.finishesTop5}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-3 text-sm font-bold opacity-80">
                      Sign in to see your official race profile and badge totals.
                    </div>
                  )}
                </div>

                <div className="grid lg:grid-cols-2 gap-3">
                  {boardSections.map((section) => (
                    <div
                      key={section.title}
                      className="border-2 border-primary/30 rounded-xl p-4 bg-popover shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-lg font-black">{section.title}</div>
                        <div className="text-[10px] uppercase opacity-70">
                          {section.mode === 'time' ? 'Adjusted time' : 'Points'}
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {section.entries.length === 0 ? (
                          <div className="text-sm font-bold opacity-70">No data yet.</div>
                        ) : (
                          section.entries.slice(0, 5).map((entry) => (
                            <div
                              key={`${section.title}-${entry.userId}`}
                              className="flex items-center justify-between rounded-lg border border-primary/20 px-3 py-2 bg-black/10"
                            >
                              <div>
                                <div className="text-[10px] uppercase opacity-60">#{entry.rank}</div>
                                <div className="font-black">{entry.displayName}</div>
                              </div>
                              <div className="text-right text-sm font-bold">
                                {'adjustedTimeMs' in entry
                                  ? `${Math.round(entry.adjustedTimeMs / 1000)}s`
                                  : `${entry.points} pts`}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
