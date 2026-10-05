/**
 * The storefront filter's dimensions, drawn from the same Category →
 * Subcategory → Type tree the dashboard edits, for the products in view.
 *
 *   Category     — only when the page mixes categories (Shop, New Arrivals)
 *   <Subcategory> one filter per "Shop by …" group of the category in play,
 *                 its Types as the choices (`subcat:<subId>:<typeId>` tags)
 *
 * On a page of one category (Dresses) its Subcategories show straight away. On
 * a mixed page they wait until a Category is ticked, so the panel never opens
 * as thirty checkboxes from three unrelated ranges. Colour and size, which
 * belong to every category, are appended by the caller from the taxonomy.
 *
 * Returns `{ dimensions, order }` in the shape computeFacets reads.
 */
export function catalogueDimensions(categories = [], products = [], selectedCategories = []) {
  const held = new Set(products.map((p) => p.collectionId));
  const present = categories.filter((c) => held.has(c.id));
  const inPlay = present.length === 1 ? present : present.filter((c) => selectedCategories.includes(c.id));
  const prefix = (c) => (present.length > 1 ? `${c.name} · ` : "");

  const dimensions = {};
  const order = [];
  const add = (id, label, values) => {
    if (!values.length) return;
    if (dimensions[id]) dimensions[id].values.push(...values);
    else {
      dimensions[id] = { label, values: [...values] };
      order.push(id);
    }
  };

  if (present.length > 1) {
    add("category", "Category", present.map((c) => ({ id: c.id, name: c.name })));
  }

  for (const category of inPlay) {
    for (const sub of category.subcategories ?? []) {
      add(`subcat:${sub.id}`, `${prefix(category)}${sub.name}`, (sub.types ?? []).map((t) => ({ id: t.id, name: t.name })));
    }
  }

  return { dimensions, order };
}
