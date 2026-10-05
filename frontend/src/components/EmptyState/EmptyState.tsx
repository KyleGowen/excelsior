import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'error';
  className?: string;
}

export function EmptyState({
  title,
  message,
  icon,
  action,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state empty-state--${variant} ${className}`} role="status">
      {icon ? <div className="empty-state__icon" aria-hidden="true">{icon}</div> : null}
      <h3 className="empty-state__title">{title}</h3>
      {message ? <p className="empty-state__message">{message}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
