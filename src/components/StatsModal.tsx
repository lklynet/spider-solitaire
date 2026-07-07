import { useGameStore } from '../store/gameStore';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain?: () => void;
}

const formatTime = (seconds: number | null | undefined) => {
  if (seconds == null || seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, '0')}`;
};

function Stat({
  label,
  value,
  variant = 'summary'
}: {
  label: string;
  value: string | number;
  variant?: 'summary' | 'row';
}) {
  return (
    <div className={variant === 'row' ? 'stat stat--row' : 'stat stat--summary'}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}

export function StatsModal({ isOpen, onClose, onPlayAgain }: StatsModalProps) {
  const {
    gameWon,
    score,
    moves,
    getTimer,
    gamesPlayed,
    gamesWon,
    currentStreak,
    bestStreak,
    bestScore,
    bestTime,
    leastMoves,
    lastWinSummary
  } = useGameStore();

  if (!isOpen) return null;

  const winRate = gamesPlayed > 0 ? `${Math.round((gamesWon / gamesPlayed) * 100)}%` : '0%';
  const beatBestTime =
    lastWinSummary &&
    (lastWinSummary.previousBestTime === null || lastWinSummary.time < lastWinSummary.previousBestTime);
  const beatLeastMoves =
    lastWinSummary &&
    (lastWinSummary.previousLeastMoves === null || lastWinSummary.moves < lastWinSummary.previousLeastMoves);

  return (
    <div className="modal-overlay">
      <div className="modal modal--stats">
        <button type="button" onClick={onClose} className="modal__close">
          Close
        </button>

        <div className="modal__content">
          <h2 className="modal__title">Stats</h2>

          <div className="modal__scroll">
            {gameWon && (
              <div className="win-banner">
                <h2 className="win-banner__title">YOU WON!</h2>
                <div className="win-banner__stats">
                  <div className="win-banner__pill">Score: {score}</div>
                  <div className="win-banner__pill">Moves: {moves}</div>
                  <div className="win-banner__pill">Time: {formatTime(getTimer())}</div>
                </div>
                {(beatBestTime || beatLeastMoves) && lastWinSummary && (
                  <div className="win-banner__records">
                    {beatBestTime && (
                      <div className="record-card">
                        <div className="record-card__label">New Best Time</div>
                        <div className="record-card__row">
                          <span className="record-card__prev">
                            Prev {formatTime(lastWinSummary.previousBestTime)}
                          </span>
                          <span className="record-card__value">{formatTime(lastWinSummary.time)}</span>
                        </div>
                      </div>
                    )}
                    {beatLeastMoves && (
                      <div className="record-card">
                        <div className="record-card__label">New Least Moves</div>
                        <div className="record-card__row">
                          <span className="record-card__prev">
                            Prev {lastWinSummary.previousLeastMoves ?? '-'}
                          </span>
                          <span className="record-card__value">{lastWinSummary.moves}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onPlayAgain?.();
                    onClose();
                  }}
                  className="btn-neo"
                >
                  Play Again
                </button>
              </div>
            )}

            <div className="stats-sections">
              <section>
                <div className="stats-section__title">Overview</div>
                <div className="stats-grid stats-grid--3">
                  <Stat label="Games Played" value={gamesPlayed} />
                  <Stat label="Games Won" value={gamesWon} />
                  <Stat label="Win Rate" value={winRate} />
                </div>
              </section>

              <section>
                <div className="stats-section__title">Personal Bests</div>
                <div className="stats-grid stats-grid--3">
                  <Stat label="Best Score" value={bestScore} />
                  <Stat label="Best Time" value={formatTime(bestTime)} />
                  <Stat label="Least Moves" value={leastMoves || '-'} />
                </div>
              </section>

              <section>
                <div className="stats-section__title">Streaks</div>
                <div className="stats-grid stats-grid--2">
                  <Stat label="Current Streak" value={currentStreak} variant="row" />
                  <Stat label="Best Streak" value={bestStreak} variant="row" />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
