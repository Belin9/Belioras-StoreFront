/* Product Colour Variants */

/**
 * The colour a product gets when it is saved without one ("As shown"). It is
 * a real colour behind the scenes, so photos, stock per size, the cart and
 * orders work unchanged, but shoppers never see it as a choice or a label.
 * Colour ids are the slug of the name, so it is always "as-shown".
 */
export const AS_SHOWN_ID = "as-shown";
export const AS_SHOWN_NAME = "As shown";

/** Whether a colour id or name is the hidden "As shown" colour. */
export function isAsShown(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "-") === AS_SHOWN_ID;
}

/** A colour name as shoppers should read it: nothing for "As shown". */
export function shownColor(value) {
  return isAsShown(value) ? null : value;
}

/**
 * A colourway's photographs, or the product's own when it has none.
 *
 * Keyed by colour name rather than modelled as separate variant products: the
 * dashboard already edits `colors` as a list of names, so one photo set per
 * name is the smallest shape the product form can grow into. A product without
 * `colorImages` behaves exactly as before.
 */
export function imagesForColor(product, color) {
  const own = color ? product?.colorImages?.[color] : null;
  return own?.length ? own : (product?.images ?? []);
}

/**
 * The chosen colour's clip of the piece on the model, or null. Never another
 * colour's: a red dress moving under "Ebony" would mislead.
 */
export function videoForColor(product, color) {
  const videos = product?.colorVideos ?? {};
  return (color ? videos[color] : Object.values(videos)[0]) ?? null;
}

/** The colour named in the URL if this product offers it, else its first. */
export function colorFromParam(product, param) {
  const colors = product?.colors ?? [];
  const wanted = String(param ?? "").toLowerCase();
  return colors.find((c) => c.toLowerCase() === wanted) ?? colors[0] ?? null;
}

/**
 * How many of a piece are left in one colour, and one size when given.
 *
 * Products tracked per colour and size read their own cell. Older products
 * still hold a single number for the whole piece, which stands for every
 * colour and size until someone sets stock per variant in the dashboard.
 */
export function stockFor(product, color, size) {
  const byColor = product?.inventory?.[color];
  if (!byColor) return product?.stock ?? 0;
  if (size) return Number(byColor[size]) || 0;
  return Object.values(byColor).reduce((sum, n) => sum + (Number(n) || 0), 0);
}
