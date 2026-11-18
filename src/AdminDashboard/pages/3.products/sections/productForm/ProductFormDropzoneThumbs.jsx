/* Uploaded Image Thumbnails */
import { useState } from "react";
import { ChevronLeft, ChevronRight, GripVertical, Star, X } from "lucide-react";

import { cn } from "@/utils/cn";

/**
 * Photos in a portrait grid, each with a swatch row to tag the colour it
 * shows. Drag a photo to put it elsewhere in the order; the arrow and star
 * buttons do the same by keyboard and on touch.
 */
export default function ProductFormDropzoneThumbs({ images, onRemove, onMove, swatches = [], onTag }) {
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  if (!images.length) return null;

  const endDrag = () => {
    setDragFrom(null);
    setDragOver(null);
  };

  return (
    <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
      {images.map((image, i) => {
        const tagged = swatches.find((s) => s.id === image.colorId);
        return (
          <li
            key={image.id ?? image.url}
            draggable={images.length > 1}
            onDragStart={(e) => {
              setDragFrom(i);
              e.dataTransfer.effectAllowed = "move";
              // Firefox starts no drag without data.
              e.dataTransfer.setData("text/plain", String(i));
            }}
            onDragOver={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              e.stopPropagation();
              if (dragOver !== i) setDragOver(i);
            }}
            onDrop={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              e.stopPropagation();
              onMove(dragFrom, i);
              endDrag();
            }}
            onDragEnd={endDrag}
            className={cn(
              "group border bg-white transition",
              images.length > 1 && "cursor-grab active:cursor-grabbing",
              dragFrom === i && "opacity-40",
              dragOver === i && dragFrom !== i ? "border-espresso ring-1 ring-espresso" : "border-umber-50",
            )}
          >
            <div className="relative">
              <img
                src={image.url}
                alt={image.name ? `Preview of ${image.name}` : `Photo ${i + 1}`}
                draggable={false}
                className="aspect-[3/4] w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-0 top-0 bg-espresso px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-ivory-50">
                  Lead
                </span>
              )}
              <div className="absolute right-1 top-1 flex gap-1 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                {i !== 0 && (
                  <button type="button" onClick={() => onMove(i, 0)} aria-label={`Make photo ${i + 1} the lead photo`} title="Make lead" className={ICON_BUTTON}>
                    <Star className="size-3.5" aria-hidden="true" />
                  </button>
                )}
                <button type="button" onClick={() => onRemove(i)} aria-label={`Remove photo ${i + 1}`} className={cn(ICON_BUTTON, "hover:bg-error")}>
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              {images.length > 1 && (
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                  <button type="button" disabled={i === 0} onClick={() => onMove(i, i - 1)} aria-label={`Move photo ${i + 1} earlier`} title="Move earlier" className={cn(ICON_BUTTON, "disabled:invisible")}>
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </button>
                  <GripVertical className="size-4 text-ivory-50 drop-shadow" aria-hidden="true" />
                  <button type="button" disabled={i === images.length - 1} onClick={() => onMove(i, i + 1)} aria-label={`Move photo ${i + 1} later`} title="Move later" className={cn(ICON_BUTTON, "disabled:invisible")}>
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {onTag && (
              <div className="px-1 pb-1.5 pt-1">
                <div role="group" aria-label={`Colour shown in photo ${i + 1}`} className="flex flex-wrap items-center">
                  {swatches.length === 0 ? (
                    <span className="px-1 py-1.5 text-[10px] text-espresso-soft">No colours yet</span>
                  ) : (
                    swatches.map((s) => {
                      const on = image.colorId === s.id;
                      return (
                        <button key={s.id} type="button" aria-pressed={on} aria-label={`Photo ${i + 1} shows ${s.name}`} title={s.name} onClick={() => onTag(i, s.id)} className="flex size-8 items-center justify-center">
                          <span
                            aria-hidden="true"
                            className={cn("size-5 border transition", on ? "border-espresso ring-1 ring-espresso ring-offset-1" : "border-umber-100 opacity-55 hover:opacity-100")}
                            style={{ backgroundColor: s.hex }}
                          />
                        </button>
                      );
                    })
                  )}
                </div>
                {swatches.length > 0 && (
                  <p className={cn("truncate px-1 text-[10px] tracking-[0.02em]", tagged ? "text-espresso" : "text-gold-700")}>
                    {tagged?.name ?? "Tag its colour"}
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const ICON_BUTTON = "flex size-7 items-center justify-center bg-espresso/85 text-ivory-50 transition-colors hover:bg-espresso";
