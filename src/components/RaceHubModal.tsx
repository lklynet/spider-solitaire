import React from 'react';
import { X } from 'lucide-react';
import { RaceHub } from './RaceHub';

interface RaceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RaceHubModal: React.FC<RaceHubModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border-4 border-primary bg-popover shadow-[12px_12px_0px_0px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between gap-3 border-b-4 border-primary/30 px-5 py-4">
          <div className="text-sm font-black uppercase tracking-[0.22em] text-primary">Race Hub</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-primary/30 bg-black/10 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-primary hover:border-primary"
          >
            <X className="mr-2 inline h-4 w-4" />
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <RaceHub />
        </div>
      </div>
    </div>
  );
};

