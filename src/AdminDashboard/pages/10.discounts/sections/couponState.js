/* Admin Dashboard Page: Discounts - couponState */

export const DAY = 24 * 60 * 60 * 1000;
/** Warn this long before a code lapses. */
export const EXPIRY_WARNING_DAYS = 14;

export function gives(coupon, format) {
  if (coupon.type === "free_shipping") return "Free shipping";
  if (coupon.type === "percent") return `${coupon.value}% off`;
  return `${format(coupon.value)} off`;
}

/** Where a code stands: live, paused, or ended (expired or fully redeemed). */
export function stateOf(coupon, used) {
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return "expired";
  if (coupon.maxUses && used >= coupon.maxUses) return "redeemed";
  return coupon.active ? "live" : "paused";
}

export const STATE_CHIP = {
  live: { label: "Live", tone: "positive" },
  paused: { label: "Paused", tone: "pending" },
  expired: { label: "Expired", tone: "neutral" },
  redeemed: { label: "Fully redeemed", tone: "neutral" },
};

export function daysLeft(coupon) {
  if (!coupon.expiresAt) return null;
  return Math.ceil((new Date(coupon.expiresAt).getTime() - Date.now()) / DAY);
}
