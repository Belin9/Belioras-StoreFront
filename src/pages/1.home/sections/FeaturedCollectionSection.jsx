/* Page: Home - FeaturedCollectionSection */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { useAsyncData } from "../../../hooks/useAsyncData";
import { useContentVersion } from "../../../context/ContentContext";
import { useLanguage } from "../../../context/LanguageContext";
import { getFeaturedCollection } from "../../../services/catalog/catalogApi";
import { cn } from "../../../utils/cn";

/* Grid and photo shape for however many pieces the collection holds */
const LAYOUT = {
  1: { grid: "grid-cols-1", photo: "aspect-[16/9]" },
  2: { grid: "grid-cols-2", photo: "aspect-[4/5]" },
  3: { grid: "grid-cols-3", photo: "aspect-[3/4]" },
  4: { grid: "grid-cols-2", photo: "aspect-square" },
};

/**
 * A preview of the Featured Collection page, built only from the pieces that
 * page lists: one photo per piece, up to four, and no stock imagery. The whole
 * block links to that page. With nothing in the collection it is not shown.
 */
export default function FeaturedCollectionSection() {
  const version = useContentVersion();
  const { data } = useAsyncData(getFeaturedCollection, [version]);
  const { t } = useLanguage();

  const photos = (data?.products ?? []).filter((p) => p.images?.[0]).slice(0, 4);
  if (!photos.length) return null;

  const layout = LAYOUT[photos.length];

  return (
    <section
      className="mx-auto max-w-[87.5rem] px-6 py-10 md:px-10"
      aria-labelledby="featured-collection-heading"
    >
      <Link to={data.url} className={cn("group relative grid gap-1", layout.grid)}>
        {photos.map((product) => (
          <span key={product.id} className="group/photo block overflow-hidden bg-ivory-300">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className={cn(
                "w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/photo:scale-[1.04]",
                layout.photo,
              )}
            />
          </span>
        ))}

        {/* Lets the pointer reach the photo beneath, so only that photo reacts. */}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex flex-col items-center bg-ivory-50/90 px-8 py-5 text-center shadow-sm backdrop-blur-[2px] transition-colors group-hover:bg-ivory-50">
            <span className="mb-2 font-sans text-[10px] uppercase tracking-[0.3em] text-espresso-300">
              {t("home.featuredKicker", "Curated for you")}
            </span>
            <span
              id="featured-collection-heading"
              className="font-display text-xl italic leading-tight text-espresso md:text-2xl"
            >
              {t("home.featuredLine1", "Featured")}
              <span className="block">{t("home.featuredLine2", "Collection")}</span>
            </span>
            <span aria-hidden="true" className="mt-3 h-px w-12 bg-gold-500" />
            <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-espresso">
              {t("home.featuredCta", "View the collection")}
              <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </span>
        </span>
      </Link>
    </section>
  );
}
