/* Facet Derivation */
import { filedUnderNames } from "../../../../utils/productFiling";

export const DEFAULT_RESULTS = 6;
const MAX_RESULTS = 12;
const MAX_SUGGESTIONS = 4;

// Facets come from the catalogue actually loaded, not the taxonomy wholesale —
// offering a colour nothing in stock carries is a dead end.
// Each colour on its own, as added in the dashboard ("As shown" excluded).
export function stockedColours(catalog, colours = []) {
  const stocked = new Set(catalog.flatMap((p) => (p.colorways ?? []).map((w) => w.colorId)));
  return colours.filter((c) => c.id !== "as-shown" && stocked.has(c.id));
}

/** Sizes in stock — only those of the chosen categories once any is chosen, so dress sizes and shoe sizes are not offered side by side. */
export function stockedSizes(catalog, categoryIds = []) {
  const pool = categoryIds.length ? catalog.filter((p) => categoryIds.includes(p.collectionId)) : catalog;
  const stocked = new Set(pool.flatMap((p) => p.sizes ?? []));
  // "default" is the placeholder carried by one-size pieces, not a size.
  return [...stocked].filter((s) => s && s !== "default");
}

/** The categories the catalogue actually has pieces in, in the dashboard's order. */
export function stockedCategories(catalog, categories = []) {
  const held = new Set(catalog.map((p) => p.collectionId));
  return categories.filter((c) => held.has(c.id));
}

/**
 * One group per Subcategory of the chosen categories ("Shop by Occasion"), its
 * Types as the choices — only those something in stock is filed under.
 */
export function typeGroups(catalog, categories, categoryIds = []) {
  const groups = [];
  for (const category of categories.filter((c) => categoryIds.includes(c.id))) {
    const tags = new Set(catalog.filter((p) => p.collectionId === category.id).flatMap((p) => p.tags ?? []));
    for (const sub of category.subcategories ?? []) {
      const values = sub.types.filter((t) => tags.has(`subcat:${sub.id}:${t.id}`));
      if (values.length) {
        groups.push({ dimension: `subcat:${sub.id}`, label: categoryIds.length > 1 ? `${category.name} · ${sub.name}` : sub.name, values });
      }
    }
  }
  return groups;
}

/**
 * `picks` holds the shopper's choices: { colours, sizes, categories, types },
 * where `types` maps a Subcategory dimension to its chosen Type ids. Within a
 * filter the match is "any of", across filters "all", as in the shop.
 */
export function searchResults(catalog, trimmed, picks, categories = []) {
  const { colours = [], sizes = [], categories: cats = [], types = {} } = picks;
  const q = trimmed.toLowerCase();
  const base = trimmed
    ? catalog.filter((p) => [p.name, p.description ?? "", ...filedUnderNames(p, categories)].join(" ").toLowerCase().includes(q))
    : catalog;
  const filtered = base
    .filter((p) => (cats.length === 0 ? true : cats.includes(p.collectionId)))
    .filter((p) =>
      Object.entries(types).every(([dimension, values]) =>
        !values?.length ? true : values.some((v) => (p.tags ?? []).includes(`${dimension}:${v}`)),
      ),
    )
    .filter((p) => (colours.length === 0 ? true : (p.colorways ?? []).some((w) => colours.includes(w.colorId))))
    .filter((p) => (sizes.length === 0 ? true : (p.sizes ?? []).some((s) => sizes.includes(s))));

  const narrowed = trimmed || cats.length || colours.length || sizes.length || Object.values(types).some((v) => v?.length);
  return (narrowed ? filtered : filtered.slice(0, DEFAULT_RESULTS)).slice(0, MAX_RESULTS);
}

export function nameSuggestions(results, trimmed) {
  if (!trimmed) return [];
  return [...new Set(results.map((p) => p.name))].slice(0, MAX_SUGGESTIONS);
}

/** The shop address for these choices, in the shop's own filter vocabulary, so "View all" keeps them. */
export function shopAddress(trimmed, picks) {
  const params = new URLSearchParams();
  if (trimmed) params.set("q", trimmed);
  if (picks.categories?.length) params.set("category", picks.categories.join(","));
  for (const [dimension, values] of Object.entries(picks.types ?? {})) {
    if (values?.length) params.set(dimension, values.join(","));
  }
  if (picks.colours?.length) params.set("shade", picks.colours.join(","));
  if (picks.sizes?.length) params.set("size", picks.sizes.join(","));
  return `/shop?${params.toString()}`;
}
