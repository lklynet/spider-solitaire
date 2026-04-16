import React from 'react';
import { CalendarClock, Flag, Sparkles, Swords, X } from 'lucide-react';

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
              Two Ways To Play
            </h2>
            <p className="mt-3 text-sm font-bold text-primary/75">
              Spider Solitaire now has a split identity: local practice for experimenting, and an
              official race for the global board.
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                  <Swords className="h-4 w-4" />
                  Casual / Practice
                </div>
                <div className="mt-2 text-sm font-bold text-primary/80">
                  Play random boards or the daily practice seed, keep local stats, and restart as
                  often as you want.
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                  <Flag className="h-4 w-4" />
                  Official Daily Race
                </div>
                <div className="mt-2 text-sm font-bold text-primary/80">
                  One official attempt on the daily seed. No pause. Hints and undos add time. Only
                  verified wins rank.
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                  <CalendarClock className="h-4 w-4" />
                  Race Hub
                </div>
                <div className="mt-2 text-sm font-bold text-primary/80">
                  Use the Race Hub to browse daily, weekly, monthly, global, profile, and race
                  history views.
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary/25 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">
                  <Sparkles className="h-4 w-4" />
                  Quick Tip
                </div>
                <div className="mt-2 text-sm font-bold text-primary/80">
                  Sign in before starting the official run so your result can be verified and
                  tracked on the leaderboards.
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
