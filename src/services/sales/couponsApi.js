import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { setState } from "../store/contentStore";
import { audited } from "../auth/audited";

/**
 * Discount codes, on the server. The server counts a code's uses from its
 * orders (cancelled and refunded ones hand theirs back) and decides whether a
 * shopper may use it — at checkout's "Apply", and again when the order is
 * placed, since the last use may have gone in between.
 *
 * The form's checks run here first only so the dashboard can say what is
 * wrong before asking; the server applies the same rules.
 */

const TYPES = new Set(["percent", "fixed", "free_shipping"]);
const staffPath = (leaf, params) => resourcePath(leaf, "staff", params);

function mirror(items) {
  setState("coupons", (state) => ({ ...state, items }), { silent: true });
  return items;
}

export async function getCoupons() {
  return mirror(await http.get(staffPath(routes.coupons.list), { realm: "staff" }));
}

/** What each code has done, and the totals across all of them, for the Discounts page. */
export function couponStats() {
  return http.get(staffPath(routes.coupons.stats), { realm: "staff" });
}

/** Checkout's "Apply": the coupon if this shopper may use it on this subtotal, otherwise the reason. */
export function validateCoupon(code, subtotal = 0, customer = null) {
  return http.post(
    resourcePath(routes.coupons.validate, "customer"),
    { code: String(code ?? "").trim(), subtotal, ...(customer?.email ? { email: customer.email } : {}) },
    { realm: "customer" },
  );
}

/** A limit is blank (no limit) or a whole number of at least 1. */
function limit(value, label) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new ApiError(`${label} must be a whole number, 1 or more — or blank for no limit.`, 422);
  return n;
}

/** The form's values as the server takes them, with the form's own checks first. */
function body(payload) {
  const code = String(payload.code ?? "").trim().toUpperCase();
  if (!code) throw new ApiError("Give the coupon a code.", 422);
  if (!TYPES.has(payload.type)) throw new ApiError("Choose what the coupon gives.", 422);
  const value = Number(payload.value ?? 0);
  if (payload.type === "percent" && (!(value > 0) || value > 100)) throw new ApiError("A percentage discount must be between 1 and 100.", 422);
  if (payload.type === "fixed" && !(value > 0)) throw new ApiError("A fixed discount must be a positive amount.", 422);
  return {
    code,
    type: payload.type,
    value: payload.type === "free_shipping" ? 0 : value,
    minOrderValue: Number(payload.minOrderValue ?? 0) || 0,
    maxDiscount: payload.maxDiscount ? Number(payload.maxDiscount) : null,
    expiresAt: payload.expiresAt || null,
    ...(payload.active !== undefined ? { active: Boolean(payload.active) } : {}),
    description: String(payload.description ?? "").trim(),
    maxUses: limit(payload.maxUses, "Total uses"),
    maxUsesPerCustomer: limit(payload.maxUsesPerCustomer, "Uses per customer"),
  };
}

function createCoupon$raw(payload) {
  return http.post(staffPath(routes.coupons.list), body(payload), { realm: "staff" });
}

function updateCoupon$raw(id, payload) {
  return http.patch(staffPath(routes.coupons.one, { id }), body(payload), { realm: "staff" });
}

/** An order's couponCode is a historical string, not a live reference — deleting a coupon never touches past orders. */
function deleteCoupon$raw(id) {
  return http.del(staffPath(routes.coupons.one, { id }), { realm: "staff" });
}

function setCouponActive$raw(id, active) {
  return http.patch(staffPath(routes.coupons.one, { id }), { active: Boolean(active) }, { realm: "staff" });
}

/* Recorded in the staff activity log. */
export const createCoupon = audited("discounts", (_, r) => `Created coupon ${r.code}`, createCoupon$raw);
export const updateCoupon = audited("discounts", (_, r) => `Updated coupon ${r.code}`, updateCoupon$raw);
export const deleteCoupon = audited("discounts", (_, r) => `Deleted coupon ${r.code}`, deleteCoupon$raw);
export const setCouponActive = audited("discounts", ([, on], r) => `${r.code} ${on ? "made live" : "paused"}`, setCouponActive$raw);
