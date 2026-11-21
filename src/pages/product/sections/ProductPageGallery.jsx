/* Page: Product - ProductGallery */
import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Maximize2, Play } from "lucide-react";

import ProductVideo from "../../../components/storefront/ProductVideo";
import { cn } from "../../../utils/cn";
import ProductLightbox from "./ProductLightbox";

/**
 * The piece's photos, and its clip on the model when the colour has one.
 *
 * The clip sits third, after two photos, so the page opens on photographs and
 * loads fast, and a shopper meets the movement once they have seen the piece
 * still. Thumbnails run down the side on larger screens, in a column that
 * scrolls with arrows when there are more than fit; on a phone they run across.
 */
export default function ProductPageGallery({ images = [], video = null, name = "", imageClassName = "aspect-[3/4]" }) {
  const media = [
    ...images.slice(0, 2).map((src) => ({ kind: "image", src })),
    ...(video?.url ? [{ kind: "video", src: video.poster ?? images[0], video }] : []),
    ...images.slice(2).map((src) => ({ kind: "image", src })),
  ];
  const [active, setActive] = useState(0);
  const strip = useRef(null);
  const [lightbox, setLightbox] = useState(null); // index into images while open

  if (!media.length) return <div className="aspect-[3/4] w-full bg-ivory-200" />;
  const current = media[Math.min(active, media.length - 1)];
  const scroll = (dir) => strip.current?.scrollBy({ top: dir * 240, left: dir * 200, behavior: "smooth" });
  const many = media.length > 4;

  return (
    <div className="flex flex-col gap-4 self-start md:flex-row-reverse md:items-start">
      <div className="min-w-0 flex-1 overflow-hidden bg-ivory-200">
        {current.kind === "video" ? (
          <ProductVideo key={current.video.url} video={current.video} label={`${name}, on the model`} className={imageClassName} />
        ) : (
          <button
            type="button"
            onClick={() => setLightbox(Math.max(0, images.indexOf(current.src)))}
            aria-label={`Open ${name} full screen`}
            className="group relative block w-full cursor-zoom-in"
          >
            <img src={current.src} alt={name} className={cn("h-full w-full object-cover", imageClassName)} />
            <span aria-hidden="true" className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-ivory-50/85 text-espresso opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100">
              <Maximize2 className="size-4" strokeWidth={1.5} />
            </span>
          </button>
        )}
      </div>

      {lightbox !== null && <ProductLightbox photos={images} start={lightbox} name={name} onClose={() => setLightbox(null)} />}

      {media.length > 1 && (
        <div className="flex shrink-0 flex-col items-center gap-2 md:w-20 lg:w-24">
          {many && (
            <button type="button" onClick={() => scroll(-1)} aria-label="Earlier photos" className="hidden text-espresso/40 transition-colors hover:text-espresso md:block">
              <ChevronUp className="size-5" aria-hidden="true" />
            </button>
          )}
          <div
            ref={strip}
            className="no-scrollbar flex w-full gap-3 overflow-x-auto md:max-h-[34rem] md:flex-col md:overflow-y-auto md:overflow-x-hidden"
          >
            {media.map((item, i) => (
              <button
                key={`${item.kind}:${item.src}:${i}`}
                type="button"
                onClick={() => setActive(i)}
                aria-label={item.kind === "video" ? "Watch it on the model" : `View image ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "relative w-16 shrink-0 overflow-hidden border-2 transition-colors md:w-full",
                  i === active ? "border-gold-600" : "border-transparent opacity-75 hover:opacity-100",
                )}
              >
                <img src={item.src} alt="" className="aspect-[3/4] w-full object-cover" />
                {item.kind === "video" && (
                  <span aria-hidden="true" className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-espresso/85 text-gold-400 shadow-sm md:size-7">
                    <Play className="size-3 translate-x-px fill-current md:size-3.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
          {many && (
            <button type="button" onClick={() => scroll(1)} aria-label="More photos" className="hidden text-espresso/40 transition-colors hover:text-espresso md:block">
              <ChevronDown className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
