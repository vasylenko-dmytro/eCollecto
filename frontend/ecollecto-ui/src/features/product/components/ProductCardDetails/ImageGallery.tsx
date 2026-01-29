import { useState, useEffect, useCallback } from 'react';
import defaultImg from '@/assets/images/default.png';
import { Product } from "../../types/product";

export default function ImageGallery({ product }: { product: Product }) {

  const images = [
    product.images.original,
    product.images.pane
  ].filter(Boolean) as string[];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentImage = images.length > 0 ? images[selectedIndex] : defaultImg;

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('no-scroll');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('no-scroll');
    };
  }, [isLightboxOpen, handlePrev, handleNext]);

  return (
    <div className="md:col-span-4 flex flex-col gap-6">

      {/* --- Main Image View --- */}
      <div
        className="relative aspect-square bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 flex items-center justify-center p-6 shadow-sm group cursor-zoom-in overflow-hidden"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={currentImage}
          alt={product.name}
          className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = defaultImg;
            e.currentTarget.onerror = null;
          }}
        />

        {/* Carousel Arrows (Inline) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-900 backdrop-blur-sm rounded-full shadow-md border border-gray-200 dark:border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10"
            >
              <ArrowLeftIcon />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-neutral-900/80 hover:bg-white dark:hover:bg-neutral-900 backdrop-blur-sm rounded-full shadow-md border border-gray-200 dark:border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 z-10"
            >
              <ArrowRightIcon />
            </button>
          </>
        )}
      </div>

      {/* --- Thumbnails --- */}
      {images.length > 1 && (
        <div className="flex gap-3 justify-start overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`size-20 shrink-0 border-2 rounded-lg overflow-hidden transition-all ${
                selectedIndex === i
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : "border-gray-100 dark:border-neutral-700 hover:border-blue-500/50"
              }`}
            >
              <img
                src={img}
                className="w-full h-full object-cover"
                alt={`View ${i + 1}`}
                onError={(e) => {
                  e.currentTarget.src = defaultImg;
                  e.currentTarget.onerror = null;
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* --- Lightbox Modal --- */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Large Image */}
          <div className="w-full h-full p-4 flex items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
            <img
              src={currentImage}
              alt={product.name}
              className="max-w-[95vw] max-h-[95vh] object-contain shadow-2xl animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Lightbox Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeftIcon size="size-10" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 text-white/70 hover:text-white transition-colors"
              >
                <ArrowRightIcon size="size-10" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 font-medium px-4 py-1 bg-black/50 rounded-full text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Icon Components to keep JSX clean
const ArrowLeftIcon = ({ size = "size-5" }: { size?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ArrowRightIcon = ({ size = "size-5" }: { size?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={size}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);