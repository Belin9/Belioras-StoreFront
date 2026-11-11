/* Page: Home - FeaturedCategoriesSection */
import { Link } from "react-router-dom";

import { useAsyncData } from "../../../hooks/useAsyncData";
import { getHomeTiles } from "../../../services/content/homeApi";

/**
 * The photo tiles under "Explore the Collection". Edited in the dashboard under
 * Home page, read from the server; each opens a page in the mega menu.
 */
export default function FeaturedCategoriesSection() {
  const { data, loading } = useAsyncData(getHomeTiles, []);

  const tiles = loading ? Array.from({ length: 3 }, (_, i) => ({ id: `skeleton-${i}` })) : data ?? [];
  if (!loading && !tiles.length) return null;

  return (
    <section aria-label="Shop by category" className="mx-auto max-w-[87.5rem] px-6 py-16 md:px-10">
      <div className={`grid grid-cols-1 gap-4 ${tiles.length % 2 === 0 && tiles.length % 3 !== 0 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {tiles.map((collection) =>
          collection.url ? (
            <Link key={collection.id} to={collection.url} className="group block">
              <div className="relative overflow-hidden bg-ivory-300">
                <img
                  src={collection.image}
                  alt={collection.name}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>

              <div className="pt-3 pb-1">
                <p className="font-sans text-[13px] font-medium uppercase tracking-[0.12em] text-espresso transition-colors group-hover:text-gold-600">
                  {collection.name}
                </p>
                <p className="mt-0.5 font-sans text-[11px] uppercase tracking-[0.1em] text-espresso-300">
                  {collection.tagline}
                </p>
              </div>
            </Link>
          ) : (
            <div key={collection.id}>
              <div className="skeleton aspect-[3/4] w-full" />
              <div className="skeleton mt-3 h-3 w-1/3" />
              <div className="skeleton mt-2 h-2.5 w-1/2" />
            </div>
          ),
        )}
      </div>
    </section>
  );
}
