interface ControlsProps {
  className?: string;
  score: number;
  moves: number;
  timer: number;
  isPlaying: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
}

const formatTime = (seconds: number) => {
  if (seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, '0')}`;
};

export function Controls({
  className,
  score,
  moves,
  timer,
  isPlaying,
  isPaused,
  onTogglePause
}: ControlsProps) {
  return (
    <div className={className ? `hud ${className}` : 'hud'}>
      <div className="hud__stats">
        <div className="hud__stat">
          <span className="hud__label">Score</span>
          <span className="hud__value">{score}</span>
        </div>
        <div className="hud__stat">
          <span className="hud__label">Moves</span>
          <span className="hud__value">{moves}</span>
        </div>
        <div className="hud__stat hud__stat--time">
          <span className="hud__label">Time</span>
          <div className="hud__time-row">
            <span className="hud__value">{formatTime(timer)}</span>
            <button
              type="button"
              onClick={onTogglePause}
              disabled={!isPlaying && timer === 0}
              className="hud__pause-btn"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? 'Play' : 'Pause'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
