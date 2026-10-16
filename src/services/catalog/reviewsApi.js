import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath } from "@/api/routes";
import { setState } from "../store/contentStore";
import { audited } from "../auth/audited";

/**
 * Reviews, on the server. A shopper's submission lands `pending` and shows
 * nowhere until a moderator publishes it; the storefront only ever receives
 * published reviews. "Verified" is decided by the server from the reviewer's
 * own orders. Each product's stars arrive with the product itself.
 *
 * The moderation queue is mirrored into the local `reviews` domain, which the
 * dashboard's overview counts pending reviews from.
 */

const shop = (path) => resourcePath(path, "customer");
const staff = (path) => resourcePath(path, "staff");

/** Published reviews for one product, newest first. */
export function getReviews(productId) {
  return http.get(shop("reviews"), { realm: "customer", params: { productId } });
}

export function getRecentReviews(limit = 3) {
  return http.get(shop("reviews"), { realm: "customer", params: { limit } });
}

/** Every review, for the moderation queue — every status, most recent first. */
export async function getAllReviews() {
  const items = await http.get(staff("reviews"), { realm: "staff" });
  setState("reviews", (state) => ({ ...state, items }), { silent: true });
  return items;
}

/** A shopper's own submission: pending until published. Signed in, the server knows who they are. */
export function createReview({ productId, rating, title, body, name }) {
  const value = Number(rating);
  if (!(value >= 1 && value <= 5)) throw new ApiError("Choose a rating from 1 to 5.", 422);
  if (!String(body ?? "").trim()) throw new ApiError("Say a little about how it wears.", 422);
  return http.post(
    shop("reviews"),
    { productId, rating: Math.round(value), title: String(title ?? "").trim(), body: String(body).trim(), ...(name ? { name: String(name).trim() } : {}) },
    { realm: "customer" },
  );
}

const publishReview$raw = (id) => http.post(staff(`reviews/${encodeURIComponent(id)}/publish`), undefined, { realm: "staff" });
const hideReview$raw = (id) => http.post(staff(`reviews/${encodeURIComponent(id)}/hide`), undefined, { realm: "staff" });
const replyToReview$raw = (id, text) => http.put(staff(`reviews/${encodeURIComponent(id)}/reply`), { text: String(text ?? "") }, { realm: "staff" });

/* Recorded in the staff activity log. */
export const publishReview = audited("reviews", ([id]) => `Published review ${id}`, publishReview$raw);
export const hideReview = audited("reviews", ([id]) => `Hid review ${id}`, hideReview$raw);
export const replyToReview = audited("reviews", ([id]) => `Replied to review ${id}`, replyToReview$raw);
