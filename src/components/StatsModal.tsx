import React from 'react';
import { Crown, Flame, Gamepad2, Move, Percent, Timer, Trophy, X, Zap } from 'lucide-react';
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

interface SummaryStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

interface DetailStatProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

interface StatSectionProps {
  title: string;
  children: React.ReactNode;
  columns?: string;
}

const SummaryStat = ({ icon: Icon, label, value }: SummaryStatProps) => (
  <div className="rounded-2xl border-2 border-primary/20 bg-black/10 p-4 text-primary">
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-primary/20 bg-popover text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">{label}</div>
        <div className="mt-1 text-3xl font-black leading-none text-primary">{value}</div>
      </div>
    </div>
  </div>
);

const DetailStat = ({ icon: Icon, label, value }: DetailStatProps) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-popover px-4 py-3 text-primary">
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg border border-primary/20 bg-black/10 text-primary/80">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-black uppercase tracking-[0.1em] text-primary/75">{label}</span>
    </div>
    <span className="text-lg font-black text-primary">{value}</span>
  </div>
);

const StatSection = ({ title, children, columns = 'md:grid-cols-2' }: StatSectionProps) => (
  <section>
    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-primary/55">
      {title}
    </div>
    <div className={`grid gap-3 ${columns}`}>{children}</div>
  </section>
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
  const lastWinSummary = useStatsStore((state) => state.lastWinSummary);

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

  const winRate = stats.gamesPlayed > 0 ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%` : '0%';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border-4 border-primary bg-popover p-5 text-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,0.4)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex items-center justify-center rounded-full border-2 border-transparent p-2 text-primary transition-all hover:border-primary hover:bg-primary/20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-full min-h-0 flex-col gap-5 pt-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter drop-shadow-md">Stats</h2>

          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            {gameWon && (
              <div className="mb-5 rounded-2xl border-2 border-primary/25 bg-black/10 p-5 text-center animate-in zoom-in duration-300">
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
                {(lastWinSummary?.beatBestTime || lastWinSummary?.beatLeastMoves) && (
                  <div className="mb-4 grid gap-3 md:grid-cols-2">
                    {lastWinSummary.beatBestTime && (
                      <div className="rounded-xl border-2 border-primary/25 bg-popover px-4 py-3 text-left text-primary">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">
                          New Best Time
                        </div>
                        <div className="mt-2 flex items-baseline justify-between gap-4">
                          <span className="text-sm font-bold text-primary/65">
                            Prev {formatTime(lastWinSummary.previousBestTime)}
                          </span>
                          <span className="text-2xl font-black text-primary">
                            {formatTime(lastWinSummary.time)}
                          </span>
                        </div>
                      </div>
                    )}
                    {lastWinSummary.beatLeastMoves && (
                      <div className="rounded-xl border-2 border-primary/25 bg-popover px-4 py-3 text-left text-primary">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/60">
                          New Least Moves
                        </div>
                        <div className="mt-2 flex items-baseline justify-between gap-4">
                          <span className="text-sm font-bold text-primary/65">
                            Prev {lastWinSummary.previousLeastMoves ?? '-'}
                          </span>
                          <span className="text-2xl font-black text-primary">
                            {lastWinSummary.moves}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

            <div className="space-y-5">
              <StatSection title="Overview" columns="md:grid-cols-3">
                <SummaryStat icon={Gamepad2} label="Games Played" value={stats.gamesPlayed} />
                <SummaryStat icon={Trophy} label="Games Won" value={stats.gamesWon} />
                <SummaryStat icon={Percent} label="Win Rate" value={winRate} />
              </StatSection>

              <StatSection title="Personal Bests" columns="md:grid-cols-3">
                <SummaryStat icon={Crown} label="Best Score" value={stats.bestScore} />
                <SummaryStat icon={Timer} label="Best Time" value={formatTime(stats.bestTime)} />
                <SummaryStat icon={Move} label="Least Moves" value={stats.leastMoves || '-'} />
              </StatSection>

              <StatSection title="Streaks">
                <DetailStat icon={Flame} label="Current Streak" value={stats.currentStreak} />
                <DetailStat icon={Zap} label="Best Streak" value={stats.bestStreak} />
              </StatSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
