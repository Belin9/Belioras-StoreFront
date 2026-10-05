/**
 * Facet counting and filtering over the shared token vocabulary.
 *
 * The same `dimension:value` tokens a menu link's target matches on (see
 * menuTargets.js) are what the filter panel selects on, so a menu link and a
 * filter checkbox are the same operation rather than two implementations of it
 * that drift apart.
 *
 * Pure module — no React, no data imports — so the counting logic is testable
 * on its own.
 */

/** Taxonomy dimension id → token prefix used on products. */
export const DIMENSION_PREFIX = {
  category: "cat",
  color: "color",
  size: "size",
};

/** Human-facing labels, in the order they should appear in the panel. A category's Subcategories lead; see typeFacet.js. */
export const DIMENSION_ORDER = ["color", "size"];

export function tokenFor(dimension, value) {
  return `${DIMENSION_PREFIX[dimension] ?? dimension}:${value}`;
}

/**
 * Does a product satisfy the selection?
 *
 * Within a dimension the match is OR — picking Satin and Lace means "either",
 * which is what a shopper ticking two boxes intends. Across dimensions it is
 * AND, so Satin + Party narrows rather than widens. This asymmetry is standard
 * in faceted search and getting it backwards makes filters feel broken.
 */

export function matchesSelection(product, dimensions, { ignore = null } = {}) {

  const tags = new Set(product.tags ?? []);

  for (const [dimension, values] of Object.entries(dimensions)) {
    if (!values?.length || dimension === ignore) continue;
    if (!values.some((value) => tags.has(tokenFor(dimension, value)))) return false;
  }

  return true;
}

export function withinPrice(product, { min, max }) {
  if (min !== null && product.price < min) return false;
  if (max !== null && product.price > max) return false;
  return true;
}

export function applyFilters(products, { dimensions, price, onSale, query }) {
  return products.filter((product) => {
    if (!matchesSelection(product, dimensions)) return false;
    if (!withinPrice(product, price)) return false;
    if (onSale && !(product.originalPrice && product.originalPrice > product.price)) return false;

    if (query) {

      const haystack = `${product.name} ${product.description ?? ""}`.toLowerCase();
      if (!haystack.includes(query.toLowerCase())) return false;
    }

    return true;
  });
}

/**
 * Counts how many products each facet value would yield.
 *
 * The count for a value is computed with its *own* dimension excluded from the
 * selection. Otherwise, once a shopper picks "Satin", every other fabric would
 * read 0 and the dimension would appear exhausted — when in fact those options
 * are alternatives, not additions.
 */

export function computeFacets(products, taxonomy, activeFilters, order = DIMENSION_ORDER) {
  const { dimensions, price, onSale, query } = activeFilters;

  const facets = {};

  for (const dimension of order) {

    const definition = taxonomy?.[dimension];
    if (!definition?.values?.length) continue;

    const candidates = products.filter(
      (product) =>
        matchesSelection(product, dimensions, { ignore: dimension }) &&
        withinPrice(product, price) &&
        (!onSale || (product.originalPrice && product.originalPrice > product.price)) &&
        (!query || `${product.name}`.toLowerCase().includes(query.toLowerCase())),
    );

    const counts = new Map();
    for (const product of candidates) {
      for (const tag of product.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    const values = definition.values
      .map((value) => ({
        id: value.id,
        name: value.name ?? value.id,
        hex: value.hex,
        count: counts.get(tokenFor(dimension, value.id)) ?? 0,
      }))
      // Only offer values that would actually return something. A currently
      // selected value is always kept, or clearing it would be impossible once
      // it dropped out of the list.
      //
      // Counts are not displayed (see FilterPanel), which is why an empty value
      // is removed rather than shown greyed out — without a number there is
      // nothing to explain why a row is inert.
      .filter((value) => value.count > 0 || (dimensions[dimension] ?? []).includes(value.id));

    if (values.length) {
      facets[dimension] = { id: dimension, label: labelFor(dimension, definition), values };
    }
  }

  return facets;
}

function labelFor(dimension, definition) {

  const label = definition.label;
  if (typeof label === "string") return label;
  if (label?.en) return label.en;
  return dimension.charAt(0).toUpperCase() + dimension.slice(1);
}

/** Price bounds across a product set, rounded outward to whole currency units. */
export function priceBounds(products) {
  if (!products.length) return [0, 500];

  const prices = products.map((p) => p.price);
  return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}
