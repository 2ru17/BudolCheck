import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ProductCheckRecord } from '../../types/budol.ts';
import { buildGallery, GallerySlide } from '../../lib/productContent.ts';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  ExpandIcon,
  ProductIllustrationSvg,
  ZoomInIcon,
  ZoomOutIcon,
} from '../icons/SvgIcons.tsx';

interface SlideArtProps {
  slide: GallerySlide;
  illustrationKey: ProductCheckRecord['illustrationKey'];
  size: number;
  zoomed?: boolean;
  origin?: string;
}

const SlideArt: React.FC<SlideArtProps> = ({ slide, illustrationKey, size, zoomed, origin }) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [slide.imageUrl]);

  if (slide.imageUrl && !imageFailed) {
    return (
      <img
        src={slide.imageUrl}
        alt={slide.caption}
        draggable={false}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
        className="h-full w-full object-contain transition-transform duration-200"
        style={{
          transform: `scale(${(zoomed ? 2.2 : 1) * slide.scale})`,
          transformOrigin: origin,
        }}
      />
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center transition-transform duration-200"
      style={{
        transform: `scale(${(zoomed ? 2.2 : 1) * slide.scale}) rotate(${slide.rotate}deg)`,
        transformOrigin: origin,
      }}
    >
      <ProductIllustrationSvg variant={illustrationKey} size={size} />
    </div>
  );
};

interface LightboxProps {
  slides: GallerySlide[];
  index: number;
  title: string;
  illustrationKey: ProductCheckRecord['illustrationKey'];
  onChange: (index: number) => void;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  slides,
  index,
  title,
  illustrationKey,
  onChange,
  onClose,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const closeRef = useRef<HTMLButtonElement>(null);
  const slide = slides[index];

  const go = useCallback(
    (delta: number) => {
      setZoomed(false);
      onChange((index + delta + slides.length) % slides.length);
    },
    [index, onChange, slides.length]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const handleStageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
    setZoomed((value) => !value);
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photo viewer`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex flex-col bg-ink/90 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 pb-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0 text-cream">
          <p className="truncate text-sm font-semibold">{title}</p>
          {slides.length > 1 && (
            <p className="text-xs tabular-nums text-cream/70">
              {index + 1} of {slides.length}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((value) => !value)}
            aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
            className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-cream text-ink shadow-crisp"
          >
            {zoomed ? <ZoomOutIcon size={18} /> : <ZoomInIcon size={18} />}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
            className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-cream text-ink shadow-crisp"
          >
            <CloseIcon size={18} />
          </button>
        </div>
      </div>

      <div
        className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-1 items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          onClick={handleStageClick}
          className={`h-full max-h-[70dvh] w-full overflow-hidden rounded-2xl border-[1.5px] border-ink ${slide.bgClass} ${
            zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
        >
          <SlideArt
            slide={slide}
            illustrationKey={illustrationKey}
            size={320}
            zoomed={zoomed}
            origin={origin}
          />
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-ink bg-cream text-ink shadow-crisp"
            >
              <ChevronLeftIcon size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-ink bg-cream text-ink shadow-crisp"
            >
              <ChevronRightIcon size={20} />
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div
          className="mx-auto w-full max-w-4xl pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex justify-center gap-2">
            {slides.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setZoomed(false);
                  onChange(itemIndex);
                }}
                aria-label={`Show photo ${itemIndex + 1}`}
                aria-current={itemIndex === index}
                className={`h-14 w-14 overflow-hidden rounded-xl border-[1.5px] ${item.bgClass} ${
                  itemIndex === index ? 'border-cream' : 'border-ink opacity-70'
                }`}
              >
                <SlideArt slide={item} illustrationKey={illustrationKey} size={44} />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface ProductGalleryProps {
  check: ProductCheckRecord;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ check }) => {
  const [extraUrls, setExtraUrls] = useState<string[]>([]);
  const baseSlides = buildGallery(check);
  const slides =
    baseSlides.length < 2 && extraUrls.length > 1
      ? buildGallery({ ...check, imageUrls: extraUrls })
      : baseSlides;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
    setExtraUrls([]);
    if (check.uploadedImageUrl || baseSlides.length >= 2) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ q: check.productTitle, checkId: check.id });
    fetch(`/api/images/gallery?${params.toString()}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { urls?: string[] } | null) => {
        if (data?.urls && data.urls.length > 1) setExtraUrls(data.urls);
      })
      .catch(() => {});
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check.id]);

  const safeIndex = Math.min(index, slides.length - 1);
  const slide = slides[safeIndex];
  const hasRealPhoto = Boolean(slide.imageUrl);

  const step = (delta: number) =>
    setIndex((safeIndex + delta + slides.length) % slides.length);

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40 && slides.length > 1) step(dx < 0 ? 1 : -1);
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-2xl border-[1.5px] border-ink shadow-crisp ${slide.bgClass}`}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Enlarge photo"
          className="absolute inset-0 z-10 cursor-zoom-in"
        />
        <SlideArt slide={slide} illustrationKey={check.illustrationKey} size={190} />

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open full screen viewer"
          className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-ink shadow-crisp"
        >
          <ExpandIcon size={17} />
        </button>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-ink shadow-crisp"
            >
              <ChevronLeftIcon size={18} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-ink bg-white text-ink shadow-crisp"
            >
              <ChevronRightIcon size={18} />
            </button>
            <span className="absolute bottom-3 right-3 z-20 rounded-full border border-ink bg-white px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-ink">
              {safeIndex + 1} / {slides.length}
            </span>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {slides.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={`Show photo ${itemIndex + 1}`}
              aria-current={itemIndex === safeIndex}
              className={`flex aspect-square min-h-[44px] items-center justify-center overflow-hidden rounded-xl border-[1.5px] transition-shadow ${item.bgClass} ${
                itemIndex === safeIndex
                  ? 'border-ink shadow-crisp'
                  : 'border-ink/30 opacity-80 hover:opacity-100'
              }`}
            >
              <SlideArt slide={item} illustrationKey={check.illustrationKey} size={44} />
            </button>
          ))}
        </div>
      )}

      <p className="text-pretty text-xs font-normal leading-relaxed text-ink-muted">
        {hasRealPhoto
          ? 'Tap photo to inspect full screen.'
          : `Direct marketplace photo preview unavailable. Use Open on ${check.platformName} to view live seller photos.`}
      </p>

      {createPortal(
        <AnimatePresence>
          {open && (
            <Lightbox
              slides={slides}
              index={safeIndex}
              title={check.productTitle}
              illustrationKey={check.illustrationKey}
              onChange={setIndex}
              onClose={() => setOpen(false)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ProductGallery;
