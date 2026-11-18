/* Product Colourways */
import { getState } from "../../store/contentStore";
import { slugify } from "./productSlug";
import { isAsShown } from "../../../utils/productColors";

/**
 * A product's colourways: the colours it comes in, the photographs of each,
 * and stock per size within each.
 *
 * Stored by colour id, never by name, so renaming a colour in the dashboard
 * renames it on every product rather than orphaning them. Products saved
 * before colourways existed carry `colors` (names), `colorImages` and one
 * `stock` number; those are read into the same shape here, so both kinds of
 * product behave identically everywhere else.
 */

export const ONE_SIZE = "one-size";

export function colorIndex() {
  const items = getState("colors").items;
  return {
    byId: new Map(items.map((c) => [c.id, c])),
    byName: new Map(items.map((c) => [c.name.toLowerCase(), c])),
  };
}

export function colorwaysOf(product, index = colorIndex()) {
  if (Array.isArray(product?.colorways)) return product.colorways;
  return (product?.colors ?? []).map((name) => ({
    colorId: index.byName.get(String(name).toLowerCase())?.id ?? slugify(name),
    images: product.colorImages?.[name] ?? [],
    // Not tracked per colour and size yet: the product-level number stands.
    stock: null,
  }));
}

/** What the storefront reads: names, swatches, filter families, photos, stock. */
export function expandColorways(product) {
  const index = colorIndex();
  const ways = colorwaysOf(product, index).map((way) => {
    const color = index.byId.get(way.colorId);
    return {
      ...way,
      name: color?.name ?? way.colorId,
      hex: color?.hex ?? null,
      family: color?.family ?? null,
    };
  });

  const tracked = ways.some((way) => way.stock);

  return {
    colorways: ways,
    colors: ways.map((w) => w.name),
    swatches: Object.fromEntries(ways.map((w) => [w.name, w.hex])),
    // "As shown" is not a colour a shopper filters by.
    colorFamilies: [...new Set(ways.filter((w) => !isAsShown(w.colorId)).map((w) => w.family).filter(Boolean))],
    colorImages: Object.fromEntries(
      ways.filter((w) => w.images?.length).map((w) => [w.name, w.images]),
    ),
    // A short clip of the piece on the model, per colour: { url, poster }.
    colorVideos: Object.fromEntries(ways.filter((w) => w.video?.url).map((w) => [w.name, w.video])),
    inventory: tracked ? Object.fromEntries(ways.map((w) => [w.name, w.stock ?? {}])) : null,
    stock: tracked ? ways.reduce((sum, w) => sum + sumStock(w.stock), 0) : (product.stock ?? 0),
    images: product.images?.length
      ? product.images
      : (ways.find((w) => w.images?.length)?.images ?? []),
  };
}

export function sumStock(stock) {
  return Object.values(stock ?? {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
}
