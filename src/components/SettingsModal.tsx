import { CARD_BACK_COUNT, useGameStore } from '../store/gameStore';

export const COLOR_THEMES = [
  { id: 'default', label: 'Classic Blue' },
  { id: 'red', label: 'Red' },
  { id: 'green', label: 'Green' },
  { id: 'purple', label: 'Purple' },
  { id: 'orange', label: 'Orange' },
  { id: 'dark', label: 'Dark Mode' }
] as const;

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { cardBack, setCardBack, colorScheme, setColorScheme } = useGameStore();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal--wide">
        <button type="button" onClick={onClose} className="modal__close">
          Close
        </button>

        <h2 className="modal__title modal__title--center">Color Theme</h2>
        <div className="picker picker--themes">
          {COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setColorScheme(theme.id)}
              className={
                colorScheme === theme.id ? 'picker__option picker__option--active' : 'picker__option'
              }
            >
              {theme.label}
            </button>
          ))}
        </div>

        <h2 className="modal__title modal__title--center">Card Designs</h2>

        <div className="picker picker--cards">
          {Array.from({ length: CARD_BACK_COUNT }, (_, index) => index + 1).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setCardBack(id)}
              className={
                cardBack === id
                  ? 'picker__option picker__option--card picker__option--active'
                  : 'picker__option picker__option--card'
              }
            >
              <div className={`picker__preview card-back-${id}`} />
              {cardBack === id && <div className="picker__selected">SELECTED</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
