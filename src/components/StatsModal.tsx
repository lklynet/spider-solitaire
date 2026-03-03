import React from 'react';
import { useStatsStore, allTimeAchievementChains, dailyAchievementChains, weeklyAchievementChains, getAchievementChainProgressRatio, getAchievementChainStatus, getRankInfo } from '../store/statsStore';
import type { AchievementChainDefinition } from '../store/statsStore';
import { X, Trophy, Flame, Timer, Move, Trash2, Gamepad2, Percent, Crown, Zap, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameWon?: boolean;
  score?: number;
  moves?: number;
  time?: number;
  onPlayAgain?: () => void;
  defaultTab?: 'stats' | 'achievements';
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
  const refreshPeriods = useStatsStore(state => state.refreshPeriods);
  const [tab, setTab] = React.useState<'stats' | 'achievements'>(defaultTab);

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

  const rankInfo = getRankInfo(stats.rankPoints);
  const allTimeCompleted = allTimeAchievementChains.reduce((sum, chain) => sum + (stats.allTimeAchievementProgress[chain.id] ?? 0), 0);
  const allTimeTotal = allTimeAchievementChains.reduce((sum, chain) => sum + chain.tiers.length, 0);

  const getTierLabel = (chain: AchievementChainDefinition, target: number) => {
    if (chain.metric.includes('bestTime')) return formatTime(target);
    if (chain.comparison === 'lte') return `≤ ${target}`;
    return `${target}`;
  };

  const getProgressLabel = (chain: AchievementChainDefinition) => {
    const status = getAchievementChainStatus(stats, chain);
    if (status.isComplete) return 'Max tier completed';
    if (chain.metric === 'daily.challengeCompleted') {
      return status.value ? 'Completed' : 'Not yet';
    }
    if (chain.metric.includes('bestTime')) {
      return `Best ${formatTime(status.value)} / ${formatTime(status.nextTier.target)}`;
    }
    if (chain.comparison === 'lte') {
      return `Best ${status.value || '-'} / ${status.nextTier.target}`;
    }
    return `${Math.min(status.value, status.nextTier.target)}/${status.nextTier.target}`;
  };

  const tierStyles: Record<string, string> = {
    bronze: 'border-amber-400/60 bg-amber-900/20',
    silver: 'border-slate-300/60 bg-slate-700/20',
    gold: 'border-yellow-300/70 bg-yellow-900/20',
    platinum: 'border-cyan-300/70 bg-cyan-900/20',
    diamond: 'border-fuchsia-300/70 bg-fuchsia-900/20'
  };

  const renderAchievement = (achievement: AchievementChainDefinition) => {
    const status = getAchievementChainStatus(stats, achievement);
    const complete = status.isComplete;
    const progress = getAchievementChainProgressRatio(stats, achievement);
    const tierStyle = tierStyles[status.nextTier.tier];
    return (
      <div
        key={achievement.id}
        className={cn(
          "border-2 rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] flex flex-col gap-2",
          tierStyle,
          complete ? "bg-primary/20 border-primary" : "bg-popover"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-black tracking-tight">{achievement.title}</div>
            <div className="text-[10px] uppercase opacity-70">{achievement.description}</div>
          </div>
          <div className={cn(
            "text-[10px] font-black px-2 py-1 rounded-md border-2 uppercase tracking-wider whitespace-nowrap",
            complete ? "bg-primary text-primary-foreground border-primary" : "border-primary/40 text-primary/80"
          )}>
            {complete ? 'MAXED' : `+${status.nextTier.points} XP`}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {achievement.tiers.map((tier, index) => (
            <div
              key={`${achievement.id}-${tier.target}`}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide",
                index < status.completedCount
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-primary/40 text-primary/60"
              )}
            >
              {index < status.completedCount ? <Check className="w-3 h-3" /> : <span className="w-3 h-3" />}
              {getTierLabel(achievement, tier.target)}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="h-2 rounded-full border-2 border-primary/40 bg-black/10 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase opacity-80">{getProgressLabel(achievement)}</div>
          </div>
          <div className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center",
            complete ? "bg-primary text-primary-foreground border-primary" : "border-primary/40 text-primary/60"
          )}>
            <Check className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  };

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
              {tab === 'stats' ? 'Statistics' : 'Achievements'}
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
                onClick={() => setTab('achievements')}
                className={cn(
                  "px-3 py-2 rounded-lg border-2 font-black uppercase tracking-wider transition-all text-sm",
                  tab === 'achievements'
                    ? "bg-primary text-primary-foreground border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]"
                    : "border-primary/30 text-primary/70 hover:text-primary hover:border-primary"
                )}
              >
                Achievements
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
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="border-2 border-primary rounded-xl p-4 bg-primary/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold opacity-70">Current Rank</div>
                      <div className="text-2xl font-black">{rankInfo.current.name}</div>
                      <div className="text-[10px] uppercase tracking-wider opacity-70">XP {stats.rankPoints}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold opacity-70">Next Rank</div>
                      <div className="text-sm font-black">{rankInfo.next ? rankInfo.next.name : 'Max Rank'}</div>
                      <div className="text-[10px] uppercase opacity-70">
                        {rankInfo.next ? `${rankInfo.next.minPoints} XP` : 'Complete'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full border-2 border-primary/40 bg-black/10 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.round(rankInfo.progress * 100)}%` }} />
                  </div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-wider opacity-80">
                    All-Time: {allTimeCompleted}/{allTimeTotal} milestones
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-black">All-Time Achievements</div>
                    <div className="text-[10px] uppercase opacity-70">Progress never resets</div>
                  </div>
                  <div className="text-[10px] uppercase font-bold opacity-70">Milestones {allTimeCompleted}/{allTimeTotal}</div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {allTimeAchievementChains.map(renderAchievement)}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-black">Daily Achievements</div>
                    <div className="text-[10px] uppercase opacity-70">Resets {stats.daily.date}</div>
                  </div>
                  <div className="text-[10px] uppercase font-bold opacity-70">{dailyAchievementChains.length} quests</div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {dailyAchievementChains.map(renderAchievement)}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-black">Weekly Achievements</div>
                    <div className="text-[10px] uppercase opacity-70">Week of {stats.weekly.week}</div>
                  </div>
                  <div className="text-[10px] uppercase font-bold opacity-70">{weeklyAchievementChains.length} quests</div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {weeklyAchievementChains.map(renderAchievement)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
