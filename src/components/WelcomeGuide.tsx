import React from 'react';
import { CalendarClock, Sparkles, Swords, X } from 'lucide-react';

const STORAGE_KEY = 'spider-solitaire-race-guide-dismissed';

export const WelcomeGuide: React.FC = () => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const close = () => {
    window.localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border-4 border-primary bg-popover shadow-[12px_12px_0px_0px_rgba(0,0,0,0.42)]">
        <div className="grid gap-0 md:grid-cols-[0.85fr_1.15fr]">
          <div className="border-b-4 border-primary/30 bg-[radial-gradient(circle_at_top_left,rgba(255,215,0,0.18),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.2))] p-6 md:border-b-0 md:border-r-4">
            <div className="text-[11px] font-black uppercase tracking-[0.34em] text-primary/60">
              Welcome
            </div>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-primary">
              Practice Mode
            </h2>
            <p className="mt-3 text-sm font-bold text-primary/75">
              Play random boards, track local stats, and restart freely while you work on streaks
              and faster clears.
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                  <Swords className="h-4 w-4" />
                  Practice
                </div>
                <div className="mt-2 text-sm font-bold text-primary/80">
                  Start fresh random boards, experiment freely, and restart whenever you want.
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                  <CalendarClock className="h-4 w-4" />
                  Local Stats
                </div>
                <div className="mt-2 text-sm font-bold text-primary/80">
                  Wins, streaks, best score, and daily or weekly totals are saved in the browser.
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                  <Sparkles className="h-4 w-4" />
                  Quick Tip
                </div>
                <div className="mt-2 text-sm font-bold text-primary/80">
                  Use the stats panel to compare streaks, best times, and recent performance.
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-2xl border-2 border-primary bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)]"
              >
                <X className="mr-2 inline h-4 w-4" />
                Got It
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
