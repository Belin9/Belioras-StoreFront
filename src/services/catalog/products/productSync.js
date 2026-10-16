/* Catalogue Sync */
import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { accessToken } from "@/api/tokens";
import { getState, setState } from "../../store/contentStore";

/**
 * Keeps the local `products` domain a mirror of the server's catalogue.
 *
 * Every storefront read, the stock maths (`variants.js`) and the in-use guards
 * on categories, colours and sizes read products synchronously, so the list is
 * kept here and refreshed from `/products`:
 *
 *   - `syncProducts()` once per page load — the storefront reads wait on it;
 *   - `refreshProducts()` on every dashboard read, so staff never work from a
 *     stale list;
 *   - `mirrorProducts()` after every write, with what the server answered.
 *
 * The read uses the staff boundary whenever a staff session exists (drafts and
 * cost price included), and the public one otherwise. A read only announces
 * itself when the list changed: pages keyed on the content version re-read,
 * and a read that always announced itself would loop.
 */

function realm() {
  return accessToken("staff") ? "staff" : "customer";
}

function usable(list) {
  return Array.isArray(list) && list.every((p) => p && typeof p.id === "string" && typeof p.name === "string");
}

/**
 * `realm` records which list this is: the public one already has what open
 * orders hold taken off, so the stock maths must not subtract it again
 * (see productStore.js); the staff one is on hand.
 */
function replaceAll(items, { notify = false, realm: from = getState("products").realm } = {}) {
  const changed = JSON.stringify(items) !== JSON.stringify(getState("products").items) || from !== getState("products").realm;
  setState("products", (state) => ({ ...state, items, realm: from }), { silent: !(notify || changed) });
  return items;
}

/** Fetches the catalogue into the mirror. Falls back to the mirror when the server can't be reached. */
export async function refreshProducts() {
  const r = realm();
  try {
    const items = await http.get(resourcePath(routes.products.list, r), { realm: r });
    if (!usable(items)) throw new ApiError("The catalogue came back incomplete.", 502);
    return replaceAll(items, { realm: r });
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) throw err;
    return getState("products").items;
  }
}

let synced = null;

/** Once per page load. Never rejects: the mirror already holds a usable list. */
export function syncProducts() {
  if (!synced) synced = refreshProducts().catch(() => null);
  return synced;
}

/** Puts pieces the server just returned into the mirror, newest first for new ones, and tells readers. */
export function mirrorProducts(products) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const items = getState("products").items;
  const known = new Set(items.map((p) => p.id));
  const added = products.filter((p) => !known.has(p.id));
  // Written by staff, so these are on-hand counts: mark the list as staff's.
  return replaceAll([...added, ...items.map((p) => byId.get(p.id) ?? p)], { notify: true, realm: "staff" });
}

/** Drops a piece from the mirror after a delete. */
export function forgetProduct(id) {
  return replaceAll(getState("products").items.filter((p) => p.id !== id), { notify: true });
}
