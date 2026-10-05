/* Slug And Tag Derivation */

const LIGATURES = {
  œ: "oe",
  æ: "ae",
  ø: "o",
  ß: "ss",
  đ: "d",
  ð: "d",
  þ: "th",
  ł: "l",
};

/** Slugify a product name for its URL. */
export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[œæøßđðþł]/g, (ch) => LIGATURES[ch] ?? ch)
    // Split accented letters into base + combining mark, then drop the marks.
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Colour families come from the managed colour list, resolved by the caller.
function deriveTags(product, colorFamilies = []) {

  const tags = new Set(product.tags ?? []);

  if (product.collectionId) tags.add(`cat:${product.collectionId}`);
  if (product.isNew) tags.add("tag:new");
  if (product.bestseller) tags.add("tag:bestseller");
  if (product.featured) tags.add("tag:featured");
  if (product.limited) tags.add("tag:limited");
  // "Shop this edit": everything one model wears.
  if (product.modelFit?.modelId) tags.add(`model:${product.modelFit.modelId}`);

  for (const size of product.sizes ?? []) tags.add(`size:${size}`);

  for (const family of colorFamilies) tags.add(`color:${family}`);

  return [...tags];
}

export { deriveTags };
