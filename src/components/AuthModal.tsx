import React from 'react';
import { Lock, LogIn, UserPlus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useOfficialStore } from '../store/officialStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { authLoading, error, login, register } = useOfficialStore();
  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [username, setUsername] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'login') {
      await login(username, password);
      onClose();
      return;
    }

    await register(username, displayName, password);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[28px] border-4 border-primary bg-popover shadow-[10px_10px_0px_0px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b-4 border-primary/20 px-5 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-primary/60">Account</div>
            <div className="mt-1 text-xl font-black text-primary">
              {mode === 'login' ? 'Login' : 'Create Profile'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-primary/25 bg-black/10 p-2 text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 flex gap-2">
            {(['login', 'register'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  'flex-1 rounded-xl border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em]',
                  mode === value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-primary/25 bg-black/10 text-primary'
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-primary/25 bg-black/10 px-3 py-2 font-bold text-primary outline-none focus:border-primary"
                placeholder="racehandle"
              />
            </label>

            {mode === 'register' && (
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">
                  Display Name
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-1 w-full rounded-xl border-2 border-primary/25 bg-black/10 px-3 py-2 font-bold text-primary outline-none focus:border-primary"
                  placeholder="Card Crusher"
                />
              </label>
            )}

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/60">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-primary/25 bg-black/10 px-3 py-2 font-bold text-primary outline-none focus:border-primary"
                placeholder="minimum 8 characters"
              />
            </label>

            {error && (
              <div className="rounded-xl border-2 border-red-500/60 bg-red-900/30 px-3 py-2 text-sm font-bold text-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-2xl border-2 border-primary bg-primary px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.35)] disabled:opacity-50 disabled:shadow-none"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="mr-2 inline h-4 w-4" />
                  Login
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 inline h-4 w-4" />
                  Create Profile
                </>
              )}
            </button>
          </form>

          <div className="mt-4 rounded-2xl border-2 border-primary/20 bg-black/10 px-4 py-3 text-sm font-bold text-primary/75">
            <Lock className="mr-2 inline h-4 w-4" />
            Log in to enter the official daily race and save your verified results.
          </div>
        </div>
      </div>
    </div>
  );
};

