import { useEffect, useRef, useState } from 'react';
import { IconMinus, IconPlus } from '../icons';

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  size = 'md',
  ariaLabel = 'Quantity',
}: QuantityStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(String(value));
    }
  }, [value]);

  const commitDraft = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      onChange(min);
      setDraft(String(min));
      return;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed);
    onChange(next);
    setDraft(String(next));
  };

  const handleFocus = () => {
    focusedRef.current = true;
    setDraft(String(value));
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const handleBlur = () => {
    focusedRef.current = false;
    commitDraft(draft);
  };

  return (
    <div className={`qty-stepper qty-stepper--${size}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="qty-stepper__btn"
        onClick={() => {
          focusedRef.current = false;
          onChange(clamp(value - 1));
        }}
        disabled={value <= min}
        aria-label="Decrease"
      >
        <IconMinus />
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="qty-stepper__input"
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          if (next === '' || /^\d+$/.test(next)) {
            setDraft(next);
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitDraft(draft);
            focusedRef.current = false;
            inputRef.current?.blur();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            focusedRef.current = false;
            setDraft(String(value));
            inputRef.current?.blur();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        className="qty-stepper__btn"
        onClick={() => {
          focusedRef.current = false;
          onChange(clamp(value + 1));
        }}
        disabled={value >= max}
        aria-label="Increase"
      >
        <IconPlus />
      </button>
    </div>
  );
}
