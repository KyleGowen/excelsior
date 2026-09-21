import { useEffect, useRef } from 'react';

export type ContributionChoice = '3' | '5' | '10' | 'other';

interface MonthlyContributionInputProps {
  choice: ContributionChoice;
  customValue: string;
  error: string | null;
  disabled?: boolean;
  onChoiceChange: (choice: ContributionChoice) => void;
  onCustomValueChange: (value: string) => void;
}

const OPTIONS: Array<{ value: ContributionChoice; label: string }> = [
  { value: '3', label: '$3' },
  { value: '5', label: '$5' },
  { value: '10', label: '$10' },
  { value: 'other', label: 'Other' },
];

export function MonthlyContributionInput({
  choice,
  customValue,
  error,
  disabled = false,
  onChoiceChange,
  onCustomValueChange,
}: MonthlyContributionInputProps) {
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (choice === 'other') customInputRef.current?.focus();
  }, [choice]);

  return (
    <fieldset className="supporter-flow__amount-fieldset" disabled={disabled}>
      <legend>Choose an amount</legend>
      <span className="supporter-flow__amount-helper">Monthly · $3 minimum</span>
      <div className="supporter-flow__amount-options">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`supporter-flow__amount-option${choice === option.value ? ' is-selected' : ''}`}
          >
            <input
              type="radio"
              name="supporter-monthly-contribution"
              value={option.value}
              checked={choice === option.value}
              onChange={() => onChoiceChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {choice === 'other' ? (
        <label className="supporter-flow__custom-field" htmlFor="supporter-custom-amount">
          <span className="supporter-flow__custom-label">Custom monthly support</span>
          <span className={`supporter-flow__custom-control${error ? ' has-error' : ''}`}>
            <span aria-hidden="true">$</span>
            <input
              ref={customInputRef}
              id="supporter-custom-amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={customValue}
              onChange={(event) => onCustomValueChange(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'supporter-custom-error' : undefined}
            />
            <span aria-hidden="true">/month</span>
          </span>
        </label>
      ) : null}
      {error ? (
        <span id="supporter-custom-error" className="supporter-flow__error" role="alert">
          {error}
        </span>
      ) : null}
    </fieldset>
  );
}
