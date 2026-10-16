import { ApiError, mockApi } from "@/api/mock";
import { getState, setState } from "../store/contentStore";
import { audited } from "../auth/audited";
import { getOrders } from "../sales/ordersApi";

function reviewItems() {
  return getState("reviews").items;
}

function write(items) {
  setState("reviews", (state) => ({ ...state, items }));
}

function nextId() {
  const n = reviewItems().reduce((max, r) => {
    const num = Number(String(r.id).replace(/^r/, ""));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 0);
  return `r${n + 1}`;
}

/**
 * Whether this customer has an order that included this product — a badge, not
 * a gate. Asked of the server (their own orders), since a shopper's browser no
 * longer holds the shop's orders. A failed read just means no badge.
 */
async function hasPurchased(userId, productId) {
  if (!userId) return false;
  const orders = await getOrders(userId).catch(() => []);
  return orders.some((o) => (o.items ?? []).some((line) => line.productId === productId));
}

/** Published reviews for one product, newest first. The only reviews the storefront ever sees. */
export function getReviews(productId) {
  return mockApi(() =>
    reviewItems()
      .filter((r) => r.productId === productId && r.status === "published")
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  );
}

export function getRecentReviews(limit = 3) {
  return mockApi(() =>
    reviewItems()
      .filter((r) => r.status === "published")
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, limit)
  );
}

/** Every review, for the admin moderation queue — every status, most recent first. */
export function getAllReviews() {
  return mockApi(() => reviewItems().slice().sort((a, b) => (a.date < b.date ? 1 : -1)));
}

/**
 * A shopper's own submission. Lands as `pending`, so it never shows anywhere
 * on the storefront until a moderator publishes it — `getReviews` filters to
 * `published` only, this is what makes that filter meaningful.
 */
export function createReview({ productId, userId, rating, title, body, name }) {
  return mockApi(async () => {
    const value = Number(rating);
    if (!(value >= 1 && value <= 5)) throw new ApiError("Choose a rating from 1 to 5.", 422);
    if (!String(body ?? "").trim()) throw new ApiError("Say a little about how it wears.", 422);

    const review = {
      id: nextId(),
      productId,
      name: String(name ?? "").trim() || "Anonymous",
      rating: Math.round(value),
      title: String(title ?? "").trim(),
      body: String(body).trim(),
      date: new Date().toISOString().slice(0, 10),
      verified: await hasPurchased(userId, productId),
      status: "pending",
      reply: null,
    };
    write([...reviewItems(), review]);
    return review;
  });
}

function publishReview$raw(id) {
  return mockApi(() => {
    const current = reviewItems();
    const existing = current.find((r) => r.id === id);
    if (!existing) throw new ApiError("That review no longer exists.", 404);
    const updated = { ...existing, status: "published" };
    write(current.map((r) => (r.id === id ? updated : r)));
    return updated;
  });
}

function hideReview$raw(id) {
  return mockApi(() => {
    const current = reviewItems();
    const existing = current.find((r) => r.id === id);
    if (!existing) throw new ApiError("That review no longer exists.", 404);
    const updated = { ...existing, status: "hidden" };
    write(current.map((r) => (r.id === id ? updated : r)));
    return updated;
  });
}

function replyToReview$raw(id, text) {
  return mockApi(() => {
    const current = reviewItems();
    const existing = current.find((r) => r.id === id);
    if (!existing) throw new ApiError("That review no longer exists.", 404);
    const trimmed = String(text ?? "").trim();
    const updated = { ...existing, reply: trimmed ? { text: trimmed, at: new Date().toISOString() } : null };
    write(current.map((r) => (r.id === id ? updated : r)));
    return updated;
  });
}

/* Recorded in the staff activity log. */
export const publishReview = audited("reviews", ([id]) => `Published review ${id}`, publishReview$raw);
export const hideReview = audited("reviews", ([id]) => `Hid review ${id}`, hideReview$raw);
export const replyToReview = audited("reviews", ([id]) => `Replied to review ${id}`, replyToReview$raw);
