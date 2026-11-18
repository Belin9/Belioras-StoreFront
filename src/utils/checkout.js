/**
 * Checkout arithmetic.
 *
 * Pure functions, no React, so the numbers can be reasoned about in one place
 * rather than inside a form component.
 *
 * **VAT is inclusive**, which is what EU consumer law requires of a price shown
 * to a shopper and what settings.tax.note says. So the tax figure, at the rate
 * in settings, is *extracted* from the subtotal for the receipt, not added on top.
 */

/**
 * Where Belioras ships, by zone, as the shipping policy lists it: Germany, the
 * other 26 EU countries, and seven international destinations. Anywhere else
 * is not shipped to yet, and checkout says so instead of quoting a price.
 */
export const SHIPPING_COUNTRIES = {
  de: ["Germany"],
  eu: [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia",
    "Finland", "France", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg",
    "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
  ],
  intl: ["United Kingdom", "Switzerland", "Norway", "United States", "Canada", "Australia", "New Zealand"],
};

const ALIASES = { czechia: "czech republic", uk: "united kingdom", "great britain": "united kingdom", usa: "united states", "united states of america": "united states" };
const ZONE_BY_COUNTRY = new Map(
  Object.entries(SHIPPING_COUNTRIES).flatMap(([zone, names]) => names.map((n) => [n.toLowerCase(), zone])),
);

/** Which shipping zone a delivery country falls into, or null where we do not ship. */
export function zoneIdFor(country) {
  const name = String(country ?? "").trim().toLowerCase();
  return ZONE_BY_COUNTRY.get(ALIASES[name] ?? name) ?? null;
}

/**
 * Everything the summary and the order record need.
 *
 * `coupon` is the validated object from couponsApi, or null. Discount applies
 * to the goods only — never to shipping, which is a real cost — and is capped
 * by the coupon's own maxDiscount.
 */

export function computeTotals({ items = [], country, coupon = null, settings }) {

  const zones = settings?.shipping?.zones ?? [];

  const zoneId = zoneIdFor(country);

  // No zone means we do not ship there: no price is quoted and the order cannot be placed.
  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const shippable = Boolean(zone);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let discount = 0;
  if (coupon && coupon.type === "percent") {
    discount = (subtotal * coupon.value) / 100;
  } else if (coupon && coupon.type === "fixed") {
    discount = coupon.value;
  }
  if (coupon?.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);

  const goods = subtotal - discount;

  // The threshold is checked against what the customer actually pays for the
  // goods, so a discount can legitimately drop an order below free shipping.
  // A zone that costs nothing (Germany) is free whatever the order. A
  // free_shipping coupon waives the zone's own cost outright rather than
  // discounting the goods — it was previously computed as a €0 discount,
  // which validated at checkout and then changed nothing.
  const qualifiesFree =
    shippable &&
    ((zone.flat ?? 0) === 0 ||
      (zone.freeThreshold != null && goods >= zone.freeThreshold) ||
      coupon?.type === "free_shipping");

  const shipping = !shippable || qualifiesFree ? 0 : (zone.flat ?? 0);

  const total = goods + shipping;

  // Extracted, not added: the prices already contain it.
  const rate = settings?.tax?.rate ?? 0;

  const tax = rate > 0 ? total - total / (1 + rate) : 0;

  return {
    zone: zone ?? { id: null, label: "Not shipped here yet" },
    shippable,
    subtotal: round(subtotal),
    discount: round(discount),
    shipping: round(shipping),
    tax: round(tax),
    total: round(total),
    qualifiesFree,
    /** How much more to spend to reach free shipping, or null. */
    freeShippingGap:
      shippable && zone.freeThreshold != null && !qualifiesFree ? round(zone.freeThreshold - goods) : null,
  };
}

/** Two decimals, avoiding the usual float drift on repeated addition. */
function round(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Pieces that cannot be returned, for the pre-purchase notice.
 *
 * EU withdrawal rights allow a 14-day change of mind, but hygiene-sealed goods
 * — which is how hair is sold — are a lawful exception. The exception only
 * holds if the customer was told *before* buying, so this belongs on the
 * checkout page rather than only in the returns policy.
 */

export function nonReturnableItems(items = [], catalog = []) {
  return items.filter((i) => isNonReturnable(catalog.find((p) => p.id === i.id)));
}

/**
 * Whether a piece is sold sealed and cannot come back once opened. The
 * product's own flag wins; without one (the API does not send it today), all
 * hair is treated as sealed.
 */
export function isNonReturnable(product) {
  if (!product) return false;
  return product.isNonReturnable ?? product.collectionId === "hair";
}
