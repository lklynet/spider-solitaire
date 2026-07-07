import type { Card as CardType } from '@/engine/types';
import { useGameStore } from '../store/gameStore';

interface StockProps {
  stock: CardType[];
  onDeal: () => void;
  isHinted?: boolean;
}

export function Stock({ stock, onDeal, isHinted }: StockProps) {
  const { cardBack } = useGameStore();

  if (stock.length === 0) {
    return <div className="stock stock--empty">Empty</div>;
  }

  const stockClass = isHinted ? 'stock stock--hinted' : 'stock';

  return (
    <div className={stockClass} onDoubleClick={onDeal}>
      {stock.slice(0, 3).map((_, index) => (
        <div
          key={index}
          className={`stock__layer card-back-${cardBack}`}
          style={{ top: index * 2, left: index * 2 }}
        />
      ))}
      <div className="stock__count-wrap">
        <span className="stock__count">{Math.ceil(stock.length / 10)}</span>
      </div>
    </div>
  );
}
