/* Purchase History */

// One-size pieces say nothing about how someone is sized, so they never count
// toward a usual size.
const UNSIZED = new Set(["one-size", "default", ""]);

/**
 * The pieces a customer owns, newest first, one entry per product.
 *
 * Orders answer "where is my parcel"; this answers "what do I own", which is
 * a different question and the one a returning shopper actually has. Buying
 * the same piece twice collapses to one entry carrying both dates.
 */
export function ownedPieces(orders, catalog) {
  const byProduct = new Map();

  for (const order of orders ?? []) {
    // An order that never shipped is not something they own yet.
    if (order.status === "cancelled" || order.status === "refunded") continue;

    for (const line of order.items ?? []) {
      const placed = new Date(order.createdAt);
      const existing = byProduct.get(line.productId);

      if (existing) {
        existing.timesBought += 1;
        if (placed > existing.lastBought) {
          existing.lastBought = placed;
          existing.size = line.size;
          existing.color = line.color;
        }
        continue;
      }

      byProduct.set(line.productId, {
        productId: line.productId,
        name: line.name,
        size: line.size,
        color: line.color,
        lastBought: placed,
        timesBought: 1,
        // The photo and address the order kept, so a withdrawn piece still
        // shows; the live product (for the link and Buy again) when it exists.
        image: line.image ?? null,
        slug: line.slug ?? null,
        product: catalog?.find((p) => p.id === line.productId) ?? null,
      });
    }
  }

  return [...byProduct.values()].sort((a, b) => b.lastBought - a.lastBought);
}

/**
 * The size taken most often, per collection.
 *
 * Grouped by collection because one number across a wardrobe is misleading —
 * a dress size and a shoe size are different scales, and averaging them would
 * produce a figure that is true of neither.
 */
export function usualSizes(pieces) {
  const counts = new Map();

  for (const piece of pieces) {
    const collection = piece.product?.collectionId;
    const size = piece.size;
    if (!collection || !size || UNSIZED.has(size)) continue;

    const forCollection = counts.get(collection) ?? new Map();
    forCollection.set(size, (forCollection.get(size) ?? 0) + piece.timesBought);
    counts.set(collection, forCollection);
  }

  return [...counts.entries()]
    .map(([collection, sizes]) => {
      const [size, times] = [...sizes.entries()].sort((a, b) => b[1] - a[1])[0];
      return { collection, size, times };
    })
    .sort((a, b) => b.times - a.times);
}

/** The usual size for one collection, or null when nothing was bought in it. */
export function usualSizeFor(pieces, collectionId) {
  return usualSizes(pieces).find((s) => s.collection === collectionId)?.size ?? null;
}
