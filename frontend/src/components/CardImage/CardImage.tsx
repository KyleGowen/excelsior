import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { CatalogType } from '../../lib/api/types';
import { FoilCard, type FoilCardSize } from '../FoilCard';
import {
  catalogTypeUsesPortraitThumb,
  isLandscapeCatalogType,
} from '../../lib/catalog/catalogTypeMap';
import {
  canProgressiveLoad,
  imageElementMatchesUrl,
  resolveImageUrl,
  resolveThumbUrl,
  placeholderImageUrl,
  reverseImagePathForImagePath,
} from '../../lib/images/cardImages';
import {
  isFullResRevealed,
  preloadAndRevealFullRes,
  shouldSkipFullResUpgrade,
  type ProgressiveImageSessionScope,
} from '../../lib/images/progressiveImageLoad';
import './CardImage.css';

interface CardImageProps {
  /** Raw card path (card.image_path / card.image). */
  imagePath?: string | null;
  /** Optional second face. When present, an in-art control swaps the displayed image. */
  reverseImagePath?: string | null;
  /** Suppress the in-art flip button when the image is already inside another interactive control. */
  showFlipControl?: boolean;
  alt: string;
  /** Use the thumbnail variant (lists, tiles, ribbons). Default true. */
  useThumbnail?: boolean;
  /**
   * Thumbnail-first, then fade in full-res on a second layer (database grid).
   * Falls back to single-layer when thumb and full paths are identical.
   */
  progressive?: boolean;
  /** Database grid catalog tab — gates portrait vs landscape progressive thumb. */
  catalogType?: CatalogType;
  className?: string;
  style?: CSSProperties;
  /** Native loading hint; defaults to lazy for perf. */
  loading?: 'lazy' | 'eager';
  /** Fired when thumb + full-res both fail (single-layer mode only). */
  onImageFailed?: () => void;
  /** Session cache scope for progressive full-res reveal (e.g. deck editor tab switches). */
  progressiveSessionScope?: ProgressiveImageSessionScope;
  /** When true, wraps the image in the v2 Prismatic Laminate foil overlay. */
  isFoil?: boolean;
  /** When false, suppresses the foil overlay even if isFoil is true (browse-only screens). Default true. */
  showFoilEffect?: boolean;
  /** Seed for per-card foil uniqueness; defaults to imagePath. */
  foilSeed?: string;
  foilSize?: FoilCardSize;
  /** Start foil intro on mount (detail hero) instead of waiting for intersection. */
  foilEagerIntro?: boolean;
}

function wrapWithFoil(
  node: ReactNode,
  opts: {
    isFoil?: boolean;
    showFoilEffect?: boolean;
    foilSeed?: string;
    imagePath?: string | null;
    foilSize?: FoilCardSize;
    foilEagerIntro?: boolean;
  },
): ReactNode {
  if (!opts.isFoil || opts.showFoilEffect === false) return node;
  const seed = opts.foilSeed ?? opts.imagePath ?? 'foil-default';
  return (
    <FoilCard seed={seed} size={opts.foilSize ?? 'thumb'} eagerIntro={opts.foilEagerIntro}>
      {node}
    </FoilCard>
  );
}

function catalogTypeSupportsProgressiveThumb(type?: CatalogType): boolean {
  if (!type) return true;
  return isLandscapeCatalogType(type) || catalogTypeUsesPortraitThumb(type);
}

function useInView(rootMargin = '200px', eager = false): [RefObject<HTMLSpanElement | null>, boolean] {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(eager);

  useEffect(() => {
    if (eager) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  return [ref, inView];
}

function syncImageLoaded(img: HTMLImageElement | null): boolean {
  return Boolean(img?.complete && img.naturalWidth > 0);
}

export function CardImage({
  imagePath,
  reverseImagePath,
  showFlipControl = true,
  alt,
  useThumbnail = true,
  progressive = false,
  catalogType,
  className = '',
  style,
  loading = 'lazy',
  onImageFailed,
  progressiveSessionScope = 'database',
  isFoil,
  showFoilEffect = true,
  foilSeed,
  foilSize,
  foilEagerIntro,
}: CardImageProps) {
  const [showReverse, setShowReverse] = useState(false);
  const effectiveReverseImagePath = reverseImagePath ?? reverseImagePathForImagePath(imagePath);
  const activeImagePath = showReverse && effectiveReverseImagePath
    ? effectiveReverseImagePath
    : imagePath;
  const resolvedClassName = className.trim();

  useEffect(() => {
    setShowReverse(false);
  }, [imagePath, effectiveReverseImagePath]);

  const flipControl = showFlipControl && effectiveReverseImagePath ? (
    <button
      type="button"
      className="card-image__flip"
      aria-label={showReverse ? `Show front of ${alt}` : `Show reverse of ${alt}`}
      aria-pressed={showReverse}
      title={showReverse ? 'Show front' : 'Show reverse'}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setShowReverse((current) => !current);
      }}
    >
      <span aria-hidden="true">↻</span>
    </button>
  ) : null;

  const useProgressive =
    progressive && canProgressiveLoad(activeImagePath, catalogType) && !shouldSkipFullResUpgrade();
  const progressiveThumb = catalogTypeSupportsProgressiveThumb(catalogType);
  const foilWrap = (node: ReactNode) =>
    wrapWithFoil(node, {
      isFoil,
      showFoilEffect,
      foilSeed,
      imagePath: activeImagePath,
      foilSize,
      foilEagerIntro,
    });

  if (useProgressive) {
    return foilWrap(
      <ProgressiveCardImage
        key={`${activeImagePath ?? ''}|${catalogType ?? ''}`}
        imagePath={activeImagePath}
        catalogType={catalogType}
        alt={alt}
        className={resolvedClassName}
        style={style}
        loading={loading}
        progressiveThumb={progressiveThumb}
        progressiveSessionScope={progressiveSessionScope}
        flipControl={flipControl}
      />,
    );
  }

  return foilWrap(
    <SingleLayerCardImage
      key={`${activeImagePath ?? ''}|${catalogType ?? ''}`}
      imagePath={activeImagePath}
      catalogType={catalogType}
      alt={alt}
      useThumbnail={useThumbnail}
      className={resolvedClassName}
      style={style}
      loading={loading}
      onImageFailed={onImageFailed}
      flipControl={flipControl}
    />,
  );
}

function SingleLayerCardImage({
  imagePath,
  catalogType,
  alt,
  useThumbnail,
  className,
  style,
  loading,
  onImageFailed,
  flipControl,
}: {
  imagePath?: string | null;
  catalogType?: CatalogType;
  alt: string;
  useThumbnail: boolean;
  className: string;
  style?: CSSProperties;
  loading: 'lazy' | 'eager';
  onImageFailed?: () => void;
  flipControl?: ReactNode;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const useFullRes = !useThumbnail || thumbFailed;
  const src = failed
    ? placeholderImageUrl()
    : useFullRes
      ? resolveImageUrl(imagePath, catalogType)
      : resolveThumbUrl(imagePath, catalogType);

  useLayoutEffect(() => {
    setFailed(false);
    setThumbFailed(false);
    setLoaded(syncImageLoaded(imgRef.current));
  }, [imagePath, catalogType, useThumbnail]);

  // Thumb→full fallback changes src without resetting thumbFailed; still sync cache hits.
  useLayoutEffect(() => {
    if (syncImageLoaded(imgRef.current)) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <span className={`card-image ${loaded ? 'card-image--loaded' : 'card-image--loading'} ${className}`} style={style}>
      <span className="card-image__media">
        <img
          ref={imgRef}
          className="card-image__img"
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (useThumbnail && !thumbFailed) {
              setThumbFailed(true);
              setLoaded(false);
              return;
            }
            if (!failed) {
              setFailed(true);
              setLoaded(true);
              onImageFailed?.();
            }
          }}
          draggable={false}
        />
      </span>
      {flipControl}
    </span>
  );
}

function ProgressiveCardImage({
  imagePath,
  catalogType,
  alt,
  className,
  style,
  loading,
  progressiveThumb,
  progressiveSessionScope,
  flipControl,
}: {
  imagePath?: string | null;
  catalogType?: CatalogType;
  alt: string;
  className: string;
  style?: CSSProperties;
  loading: 'lazy' | 'eager';
  progressiveThumb: boolean;
  progressiveSessionScope: ProgressiveImageSessionScope;
  flipControl?: ReactNode;
}) {
  const [wrapperRef, inView] = useInView('200px', loading === 'eager');
  const thumbRef = useRef<HTMLImageElement>(null);
  const fullImgRef = useRef<HTMLImageElement>(null);
  const [thumbLoaded, setThumbLoaded] = useState(!progressiveThumb);
  const [thumbFailed, setThumbFailed] = useState(false);
  const fullSrc = resolveImageUrl(imagePath, catalogType);
  const [fullLoaded, setFullLoaded] = useState(() =>
    isFullResRevealed(fullSrc, progressiveSessionScope),
  );

  const thumbSrc = thumbFailed ? placeholderImageUrl() : resolveThumbUrl(imagePath, catalogType);

  const markThumbLoaded = () => setThumbLoaded(true);
  const showLoadedState = progressiveThumb ? thumbLoaded || fullLoaded : fullLoaded;

  useLayoutEffect(() => {
    if (!progressiveThumb) return;
    if (syncImageLoaded(thumbRef.current)) {
      markThumbLoaded();
    }
  }, [thumbSrc, progressiveThumb]);

  useLayoutEffect(() => {
    if (!isFullResRevealed(fullSrc, progressiveSessionScope)) return;
    const fullImg = fullImgRef.current;
    if (!fullImg) return;

    if (!imageElementMatchesUrl(fullImg, fullSrc)) {
      fullImg.src = fullSrc;
    }
    if (syncImageLoaded(fullImg)) {
      setFullLoaded(true);
      return;
    }
    fullImg
      .decode()
      .then(() => setFullLoaded(true))
      .catch(() => setFullLoaded(true));
  }, [fullSrc, progressiveSessionScope]);

  const revealFullIfReady = (img: HTMLImageElement | null) => {
    if (!img || !imageElementMatchesUrl(img, fullSrc) || !syncImageLoaded(img)) return;
    img
      .decode()
      .then(() => setFullLoaded(true))
      .catch(() => setFullLoaded(true));
  };

  useEffect(() => {
    if (fullLoaded || isFullResRevealed(fullSrc, progressiveSessionScope)) return undefined;
    if (!inView) return undefined;

    const fullImg = fullImgRef.current;
    if (!fullImg) return undefined;

    if (imageElementMatchesUrl(fullImg, fullSrc) && syncImageLoaded(fullImg)) {
      revealFullIfReady(fullImg);
      return undefined;
    }

    const handle = preloadAndRevealFullRes(fullSrc, fullImg, () => setFullLoaded(true), {
      scope: progressiveSessionScope,
    });
    return () => {
      handle.cancel();
      revealFullIfReady(fullImg);
    };
  }, [inView, fullSrc, fullLoaded, imagePath, progressiveSessionScope]);

  return (
    <span
      ref={wrapperRef}
      className={`card-image card-image--progressive ${showLoadedState ? 'card-image--loaded' : 'card-image--loading'} ${className}`}
      style={style}
    >
      <span className="card-image__media">
        {progressiveThumb ? (
          <img
            ref={thumbRef}
            className="card-image__img card-image__img--thumb"
            src={thumbSrc}
            alt={alt}
            loading={loading}
            decoding="async"
            onLoad={markThumbLoaded}
            onError={() => {
              if (!thumbFailed) {
                setThumbFailed(true);
                markThumbLoaded();
              }
            }}
            draggable={false}
          />
        ) : null}
        <img
          ref={fullImgRef}
          className={`card-image__img card-image__img--full ${fullLoaded ? 'card-image__full--loaded' : ''}`}
          alt={progressiveThumb ? '' : alt}
          aria-hidden={progressiveThumb || undefined}
          draggable={false}
        />
      </span>
      {flipControl}
    </span>
  );
}
