import { useImageAssets } from '../../lib/images/useImageAssets';
import './AppBackground.css';

export type AppBackgroundVariant = 'hero' | 'subtle';

interface AppBackgroundProps {
  variant?: AppBackgroundVariant;
  className?: string;
}

export function AppBackground({ variant = 'subtle', className }: AppBackgroundProps) {
  const { assetUrl } = useImageAssets();
  const classes = ['app-bg', `app-bg--${variant}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-hidden="true">
      <img
        className="app-bg__image"
        src={assetUrl('/src/resources/images/login/login-bg.png')}
        alt=""
        loading={variant === 'hero' ? 'eager' : 'lazy'}
        draggable={false}
      />
      <div className="app-bg__veil" />
    </div>
  );
}
