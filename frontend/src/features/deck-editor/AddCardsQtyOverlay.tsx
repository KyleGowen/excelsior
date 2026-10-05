import type { MouseEvent } from 'react';
import { IconMinus, IconPlus } from '../../components/icons';

export interface AddCardsQtyOverlayProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  max?: number;
}

export function AddCardsQtyOverlay({
  value,
  onIncrement,
  onDecrement,
  max = 99,
}: AddCardsQtyOverlayProps) {
  const stop = (e: MouseEvent) => e.stopPropagation();

  if (value <= 0) {
    return (
      <button
        type="button"
        className="add-cards__add"
        aria-label="Add to deck"
        disabled={max <= 0}
        onClick={(e) => {
          stop(e);
          onIncrement();
        }}
      >
        <IconPlus />
      </button>
    );
  }

  return (
    <div className="add-cards__qty" onClick={stop}>
      <button
        type="button"
        className="add-cards__qty-btn"
        aria-label="Decrease"
        onClick={(e) => {
          stop(e);
          onDecrement();
        }}
      >
        <IconMinus />
      </button>
      <span className="add-cards__qty-value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="add-cards__qty-btn"
        aria-label="Increase"
        disabled={value >= max}
        onClick={(e) => {
          stop(e);
          onIncrement();
        }}
      >
        <IconPlus />
      </button>
    </div>
  );
}
