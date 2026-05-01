import React from 'react';
import {
  CalendarClock,
  Crown,
  Flame,
  Gamepad2,
  Move,
  Percent,
  Shield,
  Timer,
  Trophy,
  X,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStatsStore } from '../store/statsStore';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameWon?: boolean;
  score?: number;
  moves?: number;
  time?: number;
  onPlayAgain?: () => void;
}

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}

const StatItem = ({ icon: Icon, label, value, color }: StatItemProps) => (
  <div
    className={cn(
      'flex h-full flex-col justify-between rounded-lg border-2 border-primary bg-popover p-3 text-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]',
      color
    )}
  >
    <Icon className="mb-1 h-6 w-6" />
    <span className="text-center text-[10px] font-bold uppercase opacity-80">{label}</span>
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
  onPlayAgain
}) => {
  const stats = useStatsStore();
  const refreshPeriods = useStatsStore((state) => state.refreshPeriods);

  React.useEffect(() => {
    if (isOpen) {
      refreshPeriods();
    }
  }, [isOpen, refreshPeriods]);

  if (!isOpen) return null;

  const formatTime = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border-4 border-primary bg-popover p-5 text-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,0.4)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex items-center justify-center rounded-full border-2 border-transparent p-2 text-primary transition-all hover:border-primary hover:bg-primary/20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-full min-h-0 flex-col gap-3 pt-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter drop-shadow-md">
            Local Stats
          </h2>

          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            {gameWon && (
              <div className="mb-4 border-b-2 border-primary/20 pb-4 text-center animate-in zoom-in duration-300">
                <h2 className="mb-3 text-4xl font-black text-primary drop-shadow-[3px_3px_0px_rgba(0,0,0,0.4)]">
                  YOU WON!
                </h2>
                <div className="mb-4 flex flex-wrap justify-center gap-3">
                  <div className="rounded-lg border-2 border-black bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
                    Score: {score}
                  </div>
                  <div className="rounded-lg border-2 border-black bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
                    Moves: {moves}
                  </div>
                  <div className="rounded-lg border-2 border-black bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)]">
                    Time: {time !== undefined ? formatTime(time) : '--:--'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onPlayAgain?.();
                    onClose();
                  }}
                  className="neo-button bg-primary px-6 py-2 text-sm text-primary-foreground"
                >
                  Play Again
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatItem icon={Gamepad2} label="Games Played" value={stats.gamesPlayed} color="bg-primary/10" />
              <StatItem icon={Trophy} label="Games Won" value={stats.gamesWon} color="bg-primary/20" />
              <StatItem
                icon={Percent}
                label="Win %"
                value={stats.gamesPlayed > 0 ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` : '0%'}
                color="bg-primary/10"
              />
              <StatItem icon={Crown} label="Best Score" value={stats.bestScore} color="bg-primary/20" />
              <StatItem icon={Timer} label="Best Time" value={formatTime(stats.bestTime)} color="bg-primary/10" />
              <StatItem icon={Move} label="Least Moves" value={stats.leastMoves || '-'} color="bg-primary/20" />
              <StatItem icon={Flame} label="Current Streak" value={stats.currentStreak} color="bg-primary/10" />
              <StatItem icon={Zap} label="Best Streak" value={stats.bestStreak} color="bg-primary/20" />
              <StatItem icon={CalendarClock} label="Today Wins" value={stats.daily.gamesWon} color="bg-primary/10" />
              <StatItem icon={Shield} label="Total Hints" value={stats.totalHints} color="bg-primary/20" />
              <StatItem icon={Shield} label="Total Undos" value={stats.totalUndos} color="bg-primary/10" />
              <StatItem icon={CalendarClock} label="Week Wins" value={stats.weekly.gamesWon} color="bg-primary/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
