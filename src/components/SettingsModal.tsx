import React from 'react';
import { useGameStore } from '../store/gameStore';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { cardBack, setCardBack, colorScheme, setColorScheme } = useGameStore();

  const themes = [
    { id: 'default', label: 'Classic Blue' },
    { id: 'red', label: 'Red' },
    { id: 'green', label: 'Green' },
    { id: 'purple', label: 'Purple' },
    { id: 'orange', label: 'Orange' },
    { id: 'dark', label: 'Dark Mode' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-popover w-full max-w-4xl p-8 border-4 border-primary shadow-[8px_8px_0px_0px_rgba(0,0,0,0.4)] rounded-xl relative text-primary max-h-[90vh] overflow-y-auto">
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-3 z-10 flex items-center justify-center hover:bg-primary/20 rounded-full border-2 border-transparent hover:border-primary transition-all text-primary"
        >
            <X className="w-6 h-6" />
        </button>

        <h2 className="text-4xl font-black mb-6 text-center uppercase tracking-tighter drop-shadow-md">Color Theme</h2>
        <div className="flex flex-wrap justify-center gap-4 mb-12">
            {themes.map((theme) => (
                <button
                    key={theme.id}
                    onClick={() => setColorScheme(theme.id)}
                    className={`
                        px-6 py-3 rounded-xl border-4 font-bold uppercase tracking-wider transition-all
                        ${colorScheme === theme.id
                            ? 'border-primary bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]'
                            : 'border-primary/20 bg-background text-primary/60 hover:border-primary hover:text-primary hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]'
                        }
                    `}
                >
                    {theme.label}
                </button>
            ))}
        </div>

        <h2 className="text-4xl font-black mb-8 text-center uppercase tracking-tighter drop-shadow-md">Card Designs</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 17 }, (_, i) => i + 1).map((id) => (
                <button
                    key={id}
                    onClick={() => setCardBack(id)}
                    className={`
                        relative w-full aspect-[2.5/3.5] rounded-lg border-2 transition-all overflow-hidden
                        ${cardBack === id 
                            ? 'border-primary ring-4 ring-primary/30 scale-105 shadow-xl' 
                            : 'border-primary/20 hover:border-primary/60 hover:scale-105'
                        }
                    `}
                >
                    <div className={`w-full h-full card-back-${id}`} />
                    {cardBack === id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20 font-bold text-white drop-shadow-md">
                            SELECTED
                        </div>
                    )}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};
