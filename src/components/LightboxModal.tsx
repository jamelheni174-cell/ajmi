import { useEffect } from "react";
import type { GalerieItem } from "../data";

interface LightboxModalProps {
  item: GalerieItem | null;
  items: GalerieItem[];
  onClose: () => void;
  onSelect: (item: GalerieItem) => void;
}

export function LightboxModal({ item, items, onClose, onSelect }: LightboxModalProps) {
  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        const currentIndex = items.findIndex((x) => x.id === item.id);
        if (currentIndex !== -1 && currentIndex < items.length - 1) {
          onSelect(items[currentIndex + 1]);
        } else if (items.length > 0) {
          onSelect(items[0]);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        const currentIndex = items.findIndex((x) => x.id === item.id);
        if (currentIndex > 0) {
          onSelect(items[currentIndex - 1]);
        } else if (items.length > 0) {
          onSelect(items[items.length - 1]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [item, items, onClose, onSelect]);

  if (!item) return null;

  const currentIndex = items.findIndex((x) => x.id === item.id);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : items[items.length - 1];
  const nextItem = currentIndex < items.length - 1 ? items[currentIndex + 1] : items[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-md transition-all duration-300 animate-fadeIn"
      onClick={onClose}
    >
      {/* Bouton Fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 rounded-full bg-white/10 p-2.5 sm:p-3 text-white/80 transition hover:bg-white/20 hover:text-white"
        aria-label="Fermer"
      >
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Flèche Précédent */}
      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (prevItem) onSelect(prevItem);
          }}
          className="absolute left-2 sm:left-4 md:left-8 z-50 rounded-full bg-white/20 p-2.5 sm:p-3 text-white transition hover:bg-white/30 backdrop-blur-sm shadow-lg"
          aria-label="Photo précédente"
        >
          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Conteneur Média & Légende */}
      <div
        className="relative flex max-h-[92vh] max-w-5xl flex-col items-center justify-center overflow-hidden rounded-2xl bg-black/40 p-2 shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.src}
          alt={item.legende}
          className="max-h-[60vh] sm:max-h-[72vh] w-auto max-w-full rounded-xl object-contain shadow-2xl transition-all duration-300"
        />

        <div className="mt-3 flex w-full flex-col items-center justify-between gap-1.5 px-3 sm:px-6 pb-2 text-center md:flex-row md:text-left">
          <div>
            <span className="inline-block rounded-full bg-navy/80 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-amber-200/90 border border-amber-500/20 mb-1">
              {item.categoryLabel}
            </span>
            <p className="font-serif text-sm sm:text-base font-light text-paper/90 leading-snug">{item.legende}</p>
          </div>
          <span className="text-[11px] text-paper/50 font-mono shrink-0">
            {currentIndex + 1} / {items.length}
          </span>
        </div>
      </div>

      {/* Flèche Suivant */}
      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (nextItem) onSelect(nextItem);
          }}
          className="absolute right-2 sm:right-4 md:right-8 z-50 rounded-full bg-white/20 p-2.5 sm:p-3 text-white transition hover:bg-white/30 backdrop-blur-sm shadow-lg"
          aria-label="Photo suivante"
        >
          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
