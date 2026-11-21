/**
 * In stock, low or sold out, from the units a shopper can still buy.
 *
 * One rule for the product list, Inventory and the Overview's low-stock
 * figure, so they never disagree. A product may set its own threshold
 * (`lowStockThreshold`); otherwise the shop-wide one applies.
 */

export const DEFAULT_LOW_STOCK = 10;

export const STOCK_LEVELS = {
  in: { label: "In stock", tone: "positive" },
  low: { label: "Low stock", tone: "pending" },
  out: { label: "Sold out", tone: "negative" },
};

export function stockLevel(available, threshold = DEFAULT_LOW_STOCK) {
  const units = Number(available) || 0;
  if (units <= 0) return "out";
  return units <= threshold ? "low" : "in";
}

/** A product's own threshold, else the shop's. */
export function thresholdFor(product, shopThreshold = DEFAULT_LOW_STOCK) {
  const own = product?.lowStockThreshold;
  return Number.isFinite(own) && own >= 0 ? own : shopThreshold;
}
