import { useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthProvider';
import { AppShell } from '../../components/AppShell';
import {
  IconBookOpen,
  IconBookmark,
  IconCards,
  IconCheck,
  IconClose,
  IconLeaf,
  IconSparkles,
} from '../../components/icons';
import { LoadingState } from '../../components/LoadingState';
import { Logo } from '../../components/Logo';
import savedViewsPreview from './assets/saved-views-supporter.png';
import savedViewsFoilMultiPowerPreview from './assets/saved-views-foil-multi-power.png';
import savedViewsSkyboundEnergyTeamworksPreview from './assets/saved-views-skybound-energy-teamworks.png';
import drawHandPreview from './assets/draw-hand-supporter.png';
import drawHandVenture20Preview from './assets/draw-hand-venture-20-duplicate-1.png';
import drawHandVenture35Preview from './assets/draw-hand-venture-35-duplicates-2.png';
import { useSupporterFlow } from '../supporter-flow';
import './SupporterPage.css';

type FeatureId = 'saved-views' | 'draw-hand';
type FeatureTabId = FeatureId | 'future-tools';
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface SupporterFeature {
  id: FeatureId;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  previews: Array<{
    image: string;
    imageAlt: string;
    imageClassName?: string;
  }>;
  icon: IconComponent;
  points: string[];
}

const SUPPORTER_FEATURES: SupporterFeature[] = [
  {
    id: 'saved-views',
    shortLabel: 'Saved database views',
    eyebrow: 'Spend less time rebuilding searches',
    title: 'Pick up every search right where you left it.',
    description: 'Name, pin, and reopen the database filters you use most.',
    previews: [
      {
        image: savedViewsSkyboundEnergyTeamworksPreview,
        imageAlt:
          'Excelsior database filtered to Skybound Energy Teamwork cards with the Saved views panel open.',
      },
      {
        image: savedViewsFoilMultiPowerPreview,
        imageAlt:
          'Excelsior database filtered to foil Multi Power cards with the Saved views panel open.',
      },
      {
        image: savedViewsPreview,
        imageAlt:
          'Excelsior database filtered to Brute Force and Intelligence characters with the Saved views panel open.',
      },
    ],
    icon: IconBookmark,
    points: [
      'Save a filtered database view with a useful name.',
      'Pin the view you search for most often.',
      'Return to the same filters without recreating them.',
    ],
  },
  {
    id: 'draw-hand',
    shortLabel: 'Enhanced Draw Hand',
    eyebrow: 'Quick data analytics with every drawn hand.',
    title: 'See Venture total and duplicate card draws at a glance.',
    description:
      'The Draw Hand tool adds a compact analysis of the cards you pulled, helping you spot risky combinations while you tune a deck.',
    previews: [
      {
        image: drawHandPreview,
        imageAlt:
          'Excelsior Draw Hand view showing a Venture total of 12 and one duplicate warning for a simulated hand.',
      },
      {
        image: drawHandVenture20Preview,
        imageAlt:
          'Excelsior Draw Hand view showing a Venture total of 20 and one duplicate warning for a simulated hand.',
      },
      {
        image: drawHandVenture35Preview,
        imageAlt:
          'Excelsior Draw Hand view showing a Venture total of 35 and two duplicate warnings for a simulated hand.',
        imageClassName: 'supporter-page__preview-frame--raise-1',
      },
    ],
    icon: IconCards,
    points: [
      'Calculates the hand’s Venture total after duplicate rules have been applied.',
      'Card highlighting helps quickly identify duplicates.',
      'More Hand analytics coming in the near future.\u00a0 Use the feedback button if you’ve got ideas.',
    ],
  },
];

export default function SupporterPage() {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return <LoadingState fullscreen label="Loading Excelsior Supporter..." />;
  }

  const content = <SupporterPageContent isAdmin={isAdmin} />;

  if (user) {
    return <AppShell>{content}</AppShell>;
  }

  return (
    <div className="supporter-page-shell supporter-page-shell--public">
      <header className="supporter-page-public-nav">
        <Link to="/login" className="supporter-page-public-nav__brand" aria-label="Excelsior login">
          <Logo variant="emblem" height={30} />
          <span>Excelsior</span>
        </Link>
        <Link to="/login" className="btn btn-secondary supporter-page-public-nav__login">
          Log in
        </Link>
      </header>
      {content}
    </div>
  );
}

interface SupporterPageContentProps {
  isAdmin: boolean;
}

function SupporterPageContent({ isAdmin }: SupporterPageContentProps) {
  const { billingPanel, statusResolved } = useSupporterFlow();
  const [activeFeatureId, setActiveFeatureId] = useState<FeatureTabId>('saved-views');
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [decodedFeatures, setDecodedFeatures] = useState<Partial<Record<FeatureId, boolean>>>({});
  const [expandedImage, setExpandedImage] = useState(false);
  const activeFeature = SUPPORTER_FEATURES.find((feature) => feature.id === activeFeatureId);
  const activePreview = activeFeature
    ? activeFeature.previews[activePreviewIndex % activeFeature.previews.length]
    : undefined;
  const ActiveFeatureIcon = activeFeature?.icon ?? IconSparkles;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Support Excelsior — Supporter Features';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const requestedFeature = window.location.hash.slice(1);
    if (
      requestedFeature === 'saved-views'
      || requestedFeature === 'draw-hand'
      || requestedFeature === 'future-tools'
    ) {
      setActiveFeatureId(requestedFeature);
    }
  }, []);

  useEffect(() => {
    setActivePreviewIndex(0);
  }, [activeFeatureId]);

  useEffect(() => {
    if (!activeFeature || decodedFeatures[activeFeature.id]) return undefined;

    let cancelled = false;
    const decodes = activeFeature.previews.map((preview) => {
      const image = new Image();
      image.src = preview.image;
      return image.decode().catch(() => undefined);
    });

    void Promise.all(decodes).then(() => {
      if (!cancelled) {
        setDecodedFeatures((features) => ({
          ...features,
          [activeFeature.id]: true,
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeFeature, decodedFeatures]);

  useEffect(() => {
    if (
      !activeFeature
      || expandedImage
      || !decodedFeatures[activeFeature.id]
      || activeFeature.previews.length < 2
    ) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let intervalId: number | undefined;

    const stopCycling = () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const syncCycling = () => {
      stopCycling();
      if (reducedMotion.matches || document.visibilityState !== 'visible') return;

      intervalId = window.setInterval(() => {
        setActivePreviewIndex((index) => (
          (index + 1) % activeFeature.previews.length
        ));
      }, 3000);
    };

    syncCycling();
    document.addEventListener('visibilitychange', syncCycling);
    reducedMotion.addEventListener('change', syncCycling);

    return () => {
      stopCycling();
      document.removeEventListener('visibilitychange', syncCycling);
      reducedMotion.removeEventListener('change', syncCycling);
    };
  }, [activeFeature, decodedFeatures, expandedImage]);

  useEffect(() => {
    if (!expandedImage) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedImage(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expandedImage]);

  return (
    <main className="supporter-page">
      <section className="supporter-page__hero">
        <div className="supporter-page__hero-copy">
          <span className="supporter-page__eyebrow">EXCELSIOR SUPPORTER</span>
          <h1>Keep Excelsior free.&nbsp; Support its ongoing development.</h1>
          <div className="supporter-page__lead">
            <p>Excelsior is independently developed and operated by a single developer, me, Kyle.</p>
            <p>I'm just a dude who loves the OverPower CCG and building decks.</p>
            <p>
              Excelsior started as a convenience tool for myself but quickly found a home in the OverPower
              community.&nbsp; Now I spend my nights and weekends creating new features for everyone and fighting
              back bugs.
            </p>
            <p>
              Costs for hosting an application and its database do start to add up quickly.&nbsp; Monthly support
              helps cover those service costs, and keeps Excelsior ad free.
            </p>
            <p>Think of it like you're buying me a coffee.. or half a pack of cards.</p>
          </div>
        </div>

        <aside className="supporter-page__support-card" aria-label="Monthly Supporter contribution">
          {isAdmin ? (
            <div className="supporter-page__admin-note">Administrator preview — no support action is shown.</div>
          ) : statusResolved ? billingPanel : (
            <div className="supporter-page__admin-note" aria-live="polite">Loading monthly support…</div>
          )}
          <div
            className="supporter-page__climate supporter-page__climate--card"
            aria-label="Stripe Climate contribution"
          >
            <IconLeaf aria-hidden="true" />
            <span>
              Excelsior contributes 1% of Supporter revenue to fund climate initiatives through{' '}
              <a href="https://stripe.com/climate" target="_blank" rel="noreferrer">
                Stripe Climate
              </a>
              .
            </span>
          </div>
        </aside>
      </section>

      <section className="supporter-page__section" id="feature-preview">
        <div className="supporter-page__section-heading">
          <span className="supporter-page__eyebrow">SUPPORTER FEATURES</span>
          <h2>Thank you for your support.</h2>
          <p>
            As a thank-you, Supporters receive quality-of-life features that make Excelsior more
            convenient to use.&nbsp; Choose a feature to see it working in a real local Supporter account.
          </p>
        </div>

        <div className="supporter-page__public-promise supporter-page__public-promise--features">
          <IconBookOpen aria-hidden="true" />
          <span>
            <strong>Game knowledge and data will never be gated.</strong>&nbsp; Supporter features
            focus on convenience, personalization, and smoother workflows.
          </span>
        </div>

        <div className="supporter-page__feature-shell">
          <div className="supporter-page__feature-tabs" role="tablist" aria-label="Supporter feature previews">
            {SUPPORTER_FEATURES.map((feature) => {
              const FeatureIcon = feature.icon;
              const selected = feature.id === activeFeatureId;
              return (
                <button
                  key={feature.id}
                  id={feature.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="supporter-feature-panel"
                  className={`supporter-page__feature-tab${selected ? ' is-active' : ''}`}
                  onClick={() => {
                    setActiveFeatureId(feature.id);
                    window.history.replaceState(null, '', `#${feature.id}`);
                  }}
                >
                  <FeatureIcon aria-hidden="true" />
                  <span>{feature.shortLabel}</span>
                </button>
              );
            })}
            <button
              id="future-tools"
              type="button"
              role="tab"
              aria-selected={activeFeatureId === 'future-tools'}
              aria-controls="supporter-feature-panel"
              className={`supporter-page__feature-tab${activeFeatureId === 'future-tools' ? ' is-active' : ''}`}
              onClick={() => {
                setActiveFeatureId('future-tools');
                window.history.replaceState(null, '', '#future-tools');
              }}
            >
              <IconSparkles aria-hidden="true" />
              <span>More personal tools ahead</span>
            </button>
          </div>

          <div
            className="supporter-page__feature-panel"
            id="supporter-feature-panel"
            role="tabpanel"
            tabIndex={0}
          >
            {activeFeature && activePreview ? (
              <>
                <button
                  type="button"
                  className="supporter-page__feature-image-button"
                  onClick={() => setExpandedImage(true)}
                  aria-label={`Open a larger preview of ${activeFeature.shortLabel}`}
                >
                  <span className="supporter-page__browser-bar" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <span>LOCAL SUPPORTER ACCOUNT</span>
                  </span>
                  <span className="supporter-page__preview-stack">
                    {activeFeature.previews.map((preview) => {
                      const selected = preview.image === activePreview.image;
                      return (
                        <img
                          key={preview.image}
                          className={[
                            selected ? 'is-active' : '',
                            preview.imageClassName ?? '',
                          ].filter(Boolean).join(' ')}
                          src={preview.image}
                          alt={selected ? preview.imageAlt : ''}
                          aria-hidden={!selected}
                        />
                      );
                    })}
                  </span>
                </button>

                <div className="supporter-page__feature-copy">
                  <span className="supporter-page__feature-eyebrow">
                    <ActiveFeatureIcon aria-hidden="true" />
                    {activeFeature.eyebrow}
                  </span>
                  <h3>{activeFeature.title}</h3>
                  <p>{activeFeature.description}</p>
                  <ul>
                    {activeFeature.points.map((point) => (
                      <li key={point}>
                        <IconCheck aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="supporter-page__future-panel">
                <span className="supporter-page__future-icon" aria-hidden="true">
                  <IconSparkles />
                </span>
                <span className="supporter-page__eyebrow">WHAT COMES NEXT</span>
                <h3>More personal tools ahead.</h3>
                <p>
                  Future Supporter features will continue to focus on convenience, personalization,
                  and smoother workflows.&nbsp; When the next feature is ready, this page will be updated
                  with a real preview.
                </p>
                <p>
                  Have an idea for what you’d like to see?&nbsp; Open Help &amp; Feedback from the profile
                  menu, then choose Request a feature or change to send it my way.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {expandedImage && activeFeature && activePreview ? (
        <div
          className="supporter-page__modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeFeature.shortLabel} full preview`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExpandedImage(false);
          }}
        >
          <div className="supporter-page__image-modal">
            <div className="supporter-page__modal-heading">
              <div>
                <span>REAL FEATURE CAPTURE</span>
                <strong>{activeFeature.shortLabel}</strong>
              </div>
              <button
                type="button"
                className="supporter-page__modal-close"
                onClick={() => setExpandedImage(false)}
                aria-label="Close full preview"
                autoFocus
              >
                <IconClose aria-hidden="true" />
              </button>
            </div>
            <img src={activePreview.image} alt={activePreview.imageAlt} />
          </div>
        </div>
      ) : null}

    </main>
  );
}
