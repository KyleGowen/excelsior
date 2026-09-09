import type { ReactNode } from 'react';
import { IconCheck } from '../icons';
import './Checkbox.css';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
  labelPosition?: 'start' | 'end';
  'aria-label'?: string;
  hideLabel?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  className,
  labelPosition = 'start',
  'aria-label': ariaLabel,
  hideLabel = false,
}: CheckboxProps) {
  const labelClass = [
    'checkbox',
    checked ? 'is-checked' : '',
    disabled ? 'is-disabled' : '',
    labelPosition === 'end' ? 'checkbox--label-end' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const control = (
    <>
      <input
        type="checkbox"
        className="sr-only checkbox__input"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      <span className="checkbox__control" aria-hidden="true">
        {checked ? <IconCheck className="checkbox__check" /> : null}
      </span>
    </>
  );

  const labelText = <span className={hideLabel ? 'sr-only' : 'checkbox__label'}>{label}</span>;

  return (
    <label className={labelClass}>
      {labelPosition === 'start' ? (
        <>
          {control}
          {labelText}
        </>
      ) : (
        <>
          {labelText}
          {control}
        </>
      )}
    </label>
  );
}
