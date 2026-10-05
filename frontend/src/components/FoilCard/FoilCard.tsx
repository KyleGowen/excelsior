import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  deriveFoilVars,
  deriveFoilStyle,
  hasFoilIntroPlayed,
  markFoilIntroPlayed,
} from '../../lib/visual/foilEffect';

export type FoilCardSize = 'thumb' | 'hero';

interface FoilCardProps {
  seed: string;
  size?: FoilCardSize;
  children: ReactNode;
  className?: string;
  /** When true, start intro on mount instead of waiting for intersection. */
  eagerIntro?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type FoilPhase = 'pending' | 'intro' | 'settled';

function initialPhase(seed: string, eagerIntro: boolean): FoilPhase {
  if (prefersReducedMotion()) return 'settled';
  if (eagerIntro) return 'settled';
  if (hasFoilIntroPlayed(seed)) return 'settled';
  return 'pending';
}

export function FoilCard({
  seed,
  size = 'thumb',
  children,
  className = '',
  eagerIntro = false,
}: FoilCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<FoilPhase>(() => initialPhase(seed, eagerIntro));

  // Hero / detail: replay intro whenever the seed changes (e.g. printing Apply).
  useEffect(() => {
    if (!eagerIntro) return undefined;
    if (prefersReducedMotion()) {
      setPhase('settled');
      return undefined;
    }

    setPhase('settled');
    const raf = window.requestAnimationFrame(() => {
      setPhase('intro');
    });
    return () => window.cancelAnimationFrame(raf);
  }, [seed, eagerIntro]);

  // Grid thumbs: wait for viewport, once per session per seed.
  useEffect(() => {
    if (eagerIntro || phase !== 'pending') return undefined;

    const el = wrapperRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPhase('intro');
          observer.disconnect();
        }
      },
      { rootMargin: '80px', threshold: 0.08 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [phase, eagerIntro]);

  // Non-eager seed change: respect session cache.
  useEffect(() => {
    if (eagerIntro) return undefined;
    if (prefersReducedMotion()) {
      setPhase('settled');
      return undefined;
    }
    if (hasFoilIntroPlayed(seed)) {
      setPhase('settled');
      return undefined;
    }
    setPhase('pending');
  }, [seed, eagerIntro]);

  useEffect(() => {
    if (phase !== 'intro') return undefined;

    const durationSec = deriveFoilVars(seed).introDuration;
    const timer = window.setTimeout(() => {
      if (!eagerIntro) markFoilIntroPlayed(seed);
      setPhase('settled');
    }, durationSec * 1000 + 60);

    return () => window.clearTimeout(timer);
  }, [phase, seed, eagerIntro]);

  const style = deriveFoilStyle(seed);
  const classNames = [
    'foil-card',
    size === 'hero' ? 'foil-card--hero' : 'foil-card--thumb',
    phase === 'intro' ? 'foil-card--intro' : '',
    phase === 'settled' ? 'foil-card--settled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={wrapperRef} className={classNames} style={style}>
      {children}
      <div className="foil-card__stack" aria-hidden="true">
        <div className="foil-card__luster" />
        <div className="foil-card__prism" />
        <div className="foil-card__facets" />
        <div className="foil-card__sheen" />
        <div className="foil-card__hotspots" />
        <div className="foil-card__intro-glint" />
      </div>
    </div>
  );
}
