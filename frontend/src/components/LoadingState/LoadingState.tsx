
interface LoadingStateProps {
  label?: string;
  fullscreen?: boolean;
  className?: string;
}

export function LoadingState({ label, fullscreen = false, className = '' }: LoadingStateProps) {
  return (
    <div
      className={`loading-state ${fullscreen ? 'loading-state--fullscreen' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-state__spinner" aria-hidden="true" />
      {label ? <span className="loading-state__label">{label}</span> : null}
    </div>
  );
}
