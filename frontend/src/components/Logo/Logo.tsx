import { useImageAssets } from '../../lib/images/useImageAssets';
import './Logo.css';

const LOGO_PATHS = {
  wordmark: '/src/resources/images/logo/logo5.png',
  emblem: '/src/resources/images/logo/logo6.png',
} as const;

type LogoVariant = keyof typeof LOGO_PATHS;

interface LogoProps {
  /** `wordmark` = EXCELSIOR crest text; `emblem` = symbol-only triangle mark. */
  variant?: LogoVariant;
  className?: string;
  /** Rendered height in px (width auto). */
  height?: number;
  alt?: string;
}

/** Excelsior logo (wordmark or emblem), served via CDN in prod. */
export function Logo({
  variant = 'wordmark',
  className = '',
  height = 34,
  alt = 'Excelsior',
}: LogoProps) {
  const { assetUrl } = useImageAssets();
  return (
    <img
      className={`app-logo ${className}`}
      src={assetUrl(LOGO_PATHS[variant])}
      alt={alt}
      height={height}
      style={{ height }}
      draggable={false}
    />
  );
}
