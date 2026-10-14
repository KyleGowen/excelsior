import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface DeferredHomeSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onActivate?: (active: boolean) => void;
  variant?: 'stats';
}

/** Mount once near the viewport; scrolling away must preserve loaded state. */
export function DeferredHomeSection({ title, icon, children, onActivate, variant }: DeferredHomeSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const activate = useCallback(() => {
    setActive(true);
    onActivate?.(true);
  }, [onActivate]);

  useEffect(() => {
    if (active) return;
    if (typeof IntersectionObserver === 'undefined') {
      activate();
      return;
    }
    const element = ref.current;
    if (!element) return;
    let disposed = false;
    const observer = new IntersectionObserver((entries) => {
      if (!disposed && entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        activate();
      }
    }, { rootMargin: '120px' });
    observer.observe(element);
    return () => { disposed = true; observer.disconnect(); };
  }, [active, activate]);

  return (
    <div ref={ref} className={`home__deferred${variant === 'stats' ? ' home__deferred--stats' : ''}`}
      data-home-section={title} data-active={active}>
      {active ? children : (
        <section className="home__section home__deferred-placeholder">
          <header className="home__section-head">
            <h2 className="home__section-title"><span className="home__section-icon">{icon}</span>{title}</h2>
          </header>
          <p className="home__deferred-message">Loads as you scroll.</p>
          <button className="btn btn-ghost" type="button" onClick={activate}>Load {title}</button>
        </section>
      )}
    </div>
  );
}
