/**
 * Where a piece is filed, as words a shopper might type: its category and
 * the Subcategory types it is tagged with ("Hair", "Curly Wigs", "Cocktail
 * Dresses"). The category always comes first. Search matches on these as well as the name, so it agrees with
 * the category tree the shop and dashboard use.
 */
export function filedUnderNames(product, categories = []) {
  const category = categories.find((c) => c.id === product.collectionId);
  if (!category) return [];
  const names = [category.name];
  for (const tag of product.tags ?? []) {
    const [prefix, subId, typeId] = String(tag).split(":");
    if (prefix !== "subcat") continue;
    const sub = category.subcategories?.find((s) => s.id === subId);
    names.push(sub?.types?.find((t) => t.id === typeId)?.name);
  }
  return names.filter(Boolean);
}
