/* Page: Product - ProductLightbox */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

import { cn } from "../../../utils/cn";

/**
 * The photos full screen, for the close look fabric and hair texture need.
 * Arrows, the arrow keys or a swipe move between photos; a click (or the zoom
 * button) magnifies twice where you point, and moving the pointer pans.
 * Escape, the close button or a click on the empty space closes it, and focus
 * goes back to the photo that opened it.
 */
export default function ProductLightbox({ photos, start = 0, name, onClose }) {
  const [at, setAt] = useState(start);
  const [zoom, setZoom] = useState(null); // { x, y } in % while magnified
  const closeRef = useRef(null);
  const swipe = useRef(null);
  const many = photos.length > 1;
  // Read through a ref so a new onClose from the parent never re-runs the
  // focus effect below and pulls focus back to the close button.
  const closeFn = useRef(onClose);
  useEffect(() => {
    closeFn.current = onClose;
  }, [onClose]);

  const step = (dir) => {
    setZoom(null);
    setAt((i) => (i + dir + photos.length) % photos.length);
  };

  /* Side Effect */
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closeFn.current();
      if (many && e.key === "ArrowRight") step(1);
      if (many && e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus?.();
    };
    // step only reads state through setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [many]);

  const point = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const ARROW = "grid size-11 place-items-center rounded-full bg-ivory-50/85 text-espresso backdrop-blur transition-colors hover:bg-ivory-50";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${name}, photo ${at + 1} of ${photos.length}`} className="fixed inset-0 z-[95] flex flex-col bg-ivory-100 text-espresso">
      <div className="flex h-16 shrink-0 items-center justify-between px-5 sm:px-8">
        <span className="text-[13px] tabular-nums text-espresso-soft" aria-live="polite">{many ? `${at + 1} / ${photos.length}` : ""}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setZoom((z) => (z ? null : { x: 50, y: 50 }))} aria-label={zoom ? "Zoom out" : "Zoom in"} className="grid size-11 place-items-center rounded-full transition-colors hover:bg-umber-50">
            {zoom ? <ZoomOut className="size-5" strokeWidth={1.5} aria-hidden="true" /> : <ZoomIn className="size-5" strokeWidth={1.5} aria-hidden="true" />}
          </button>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full transition-colors hover:bg-umber-50">
            <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 pb-3 sm:px-20"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onPointerDown={(e) => (swipe.current = e.pointerType === "mouse" || zoom ? null : e.clientX)}
        onPointerUp={(e) => {
          if (swipe.current === null || !many) return;
          const dx = e.clientX - swipe.current;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          swipe.current = null;
        }}
      >
        <img
          key={photos[at]}
          src={photos[at]}
          alt={name}
          draggable={false}
          onClick={(e) => setZoom((z) => (z ? null : point(e)))}
          onPointerMove={(e) => zoom && e.pointerType === "mouse" && setZoom(point(e))}
          style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          className={cn(
            "max-h-full max-w-full select-none object-contain transition-transform duration-300 motion-reduce:transition-none",
            zoom ? "cursor-zoom-out" : "cursor-zoom-in",
          )}
        />
        {many && !zoom && (
          <div className="pointer-events-none absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-between sm:inset-x-6">
            <button type="button" className={cn(ARROW, "pointer-events-auto")} aria-label="Previous photo" onClick={() => step(-1)}>
              <ChevronLeft className="size-6" strokeWidth={1.25} aria-hidden="true" />
            </button>
            <button type="button" className={cn(ARROW, "pointer-events-auto")} aria-label="Next photo" onClick={() => step(1)}>
              <ChevronRight className="size-6" strokeWidth={1.25} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {many && (
        <div className="shrink-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1 sm:pb-6">
          <div className="no-scrollbar mx-auto flex w-fit max-w-full gap-2.5 overflow-x-auto p-0.5" aria-label="Choose a photo">
            {photos.map((src, i) => (
              <button
                key={`${src}:${i}`}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-current={i === at}
                onClick={() => { setZoom(null); setAt(i); }}
                className={cn("relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-ivory-200 transition-opacity sm:w-14", i === at ? "outline outline-1 outline-offset-2 outline-espresso" : "opacity-55 hover:opacity-100")}
              >
                <img src={src} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
