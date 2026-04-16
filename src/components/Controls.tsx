import React from 'react';
import { RotateCcw, RefreshCw, Lightbulb, Pause, Play } from 'lucide-react';

import { cn } from '../lib/utils';

interface ControlsProps {
  score: number;
  moves: number;
  timer: number;
  isPlaying: boolean;
  isPaused: boolean;
  canUndo: boolean;
  canPause?: boolean;
  disableHint?: boolean;
  disableRestart?: boolean;
  disableNewGame?: boolean;
  newGameLabel?: string;
  showScoreAndMoves?: boolean;
  hintPenaltyText?: string | null;
  undoPenaltyText?: string | null;
  onUndo: () => void;
  onRestart: () => void;
  onNewGame: () => void;
  onToggleTimer: () => void;
  onTogglePause: () => void;
  onHint: () => void;
  isNewGameHinted?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
    score,
    moves,
    timer,
    isPlaying,
    isPaused,
    canUndo,
    canPause = true,
    disableHint = false,
    disableRestart = false,
    disableNewGame = false,
    newGameLabel = 'New Game',
    showScoreAndMoves = true,
    hintPenaltyText = null,
    undoPenaltyText = null,
    onUndo,
    onRestart,
    onNewGame,
    onTogglePause,
    onHint,
    isNewGameHinted
}) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="neo-box flex w-full flex-wrap items-center justify-between gap-4 rounded-xl p-4">
            <div className="flex gap-6">
                {showScoreAndMoves && (
                  <>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-primary/70">Score</span>
                        <span className="text-xl font-black text-primary">{score}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase text-primary/70">Moves</span>
                        <span className="text-xl font-black text-primary">{moves}</span>
                    </div>
                  </>
                )}
                <div className="flex flex-col min-w-[80px]">
                    <span className="text-xs font-bold uppercase text-primary/70">Time</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-primary">{formatTime(timer)}</span>
                        <button 
                            onClick={onTogglePause}
                            disabled={!canPause || (!isPlaying && timer === 0)}
                            className="p-1 hover:bg-primary/20 text-primary rounded-full transition-colors disabled:opacity-50"
                            title={canPause ? (isPaused ? "Resume" : "Pause") : "Pause disabled in official mode"}
                        >
                            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                 <button
                    onClick={onHint}
                    disabled={disableHint}
                    className="neo-button bg-blue-600 text-white border-primary disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px]"
                 >
                    <Lightbulb className="w-4 h-4 mr-2 inline" /> Hint
                    {hintPenaltyText ? <span className="ml-2 text-[10px] font-black">{hintPenaltyText}</span> : null}
                 </button>
                 <button 
                    onClick={onUndo} 
                    disabled={!canUndo}
                    className="neo-button bg-yellow-600 text-white border-primary disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px]"
                 >
                    <RotateCcw className="w-4 h-4 mr-2 inline" /> Undo
                    {undoPenaltyText ? <span className="ml-2 text-[10px] font-black">{undoPenaltyText}</span> : null}
                 </button>
                 <button
                    onClick={onRestart}
                    disabled={disableRestart}
                    className="neo-button bg-orange-600 text-white border-primary disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px]"
                 >
                    <RefreshCw className="w-4 h-4 mr-2 inline" /> Restart
                 </button>
                 <button 
                    onClick={onNewGame} 
                    disabled={disableNewGame}
                    className={cn(
                        "neo-button bg-green-600 text-white border-primary transition-all duration-300 disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px]",
                        isNewGameHinted && "ring-4 ring-primary shadow-[0_0_15px_rgba(255,215,0,0.5)] scale-105"
                    )}
                >
                    {newGameLabel}
                 </button>
            </div>
        </div>
    );
}
