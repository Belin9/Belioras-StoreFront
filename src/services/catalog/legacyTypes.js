/**
 * The one-time move from flat category Types to Subcategory types.
 *
 * Categories used to carry two kinds of type: a flat `types` list (a product's
 * single `type`, a menu link's `{ kind: "type" }`) and the types inside each
 * "Shop by …" Subcategory (`subcat:<sub>:<type>` tags). Types now live only
 * in Subcategories. This rewrites what still points at a flat type onto the
 * Subcategory type that means the same thing, so stored products and menus
 * upgrade in place instead of being discarded.
 *
 * Pure, and imports nothing, so the seed files can be rewritten with it too.
 */

/** Flat ids whose Subcategory twin was given a longer id. Matched by id otherwise. */
const ALIASES = {
  accessories: { clutch: "clutch-bags", shoulder: "shoulder-bags", mini: "mini-bags", bracelets: "bracelets-bangles" },
};

/** `{ sub, type }` in `category`'s Subcategories for a former flat type id, or null. */
export function subcategoryTypeFor(category, typeId) {
  const id = ALIASES[category?.id]?.[typeId] ?? typeId;
  for (const sub of category?.subcategories ?? []) {
    if ((sub.types ?? []).some((t) => t.id === id)) return { sub: sub.id, type: id };
  }
  return null;
}

/**
 * A product without `type`. Its former type becomes a Subcategory tag where one
 * matches; one that does not (Hair's "Wigs", which every wig already carries as
 * the Wigs Subcategory) is simply dropped — the product keeps its category.
 */
export function migrateProduct(product, categories) {
  if (!product || !("type" in product)) return product;
  const { type, ...rest } = product;
  if (!type) return rest;
  const match = subcategoryTypeFor(categories.find((c) => c.id === product.collectionId), type);
  if (!match) return rest;
  const tag = `subcat:${match.sub}:${match.type}`;
  const tags = rest.tags ?? [];
  return { ...rest, tags: tags.includes(tag) ? tags : [...tags, tag] };
}

/**
 * A menu target without `kind: "type"`: the same pieces, as a Subcategory
 * filter. The link's stored URL is untouched, so shared addresses keep working.
 * A type with no Subcategory twin is left as it was, for the menu editor to
 * flag as a broken link.
 */
export function migrateTarget(target, categories) {
  if (target?.kind !== "type") return target;
  const match = subcategoryTypeFor(categories.find((c) => c.id === target.category), target.id);
  if (!match) return target;
  return {
    kind: "filter",
    dimension: `subcat:${match.sub}`,
    values: [match.type],
    category: target.category,
    ...(target.newOnly ? { newOnly: true } : {}),
  };
}

/** Every target in a navigation tree: item targets, link targets, tile targets. */
export function migrateNavigation(items, categories) {
  const fix = (node) => (node?.target ? { ...node, target: migrateTarget(node.target, categories) } : node);
  return (items ?? []).map((root) => ({
    ...fix(root),
    sections: (root.sections ?? []).map((section) => ({ ...section, items: (section.items ?? []).map(fix) })),
    tiles: (root.tiles ?? []).map(fix),
  }));
}
