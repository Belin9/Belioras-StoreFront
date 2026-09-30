/* Size List Service */

import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { readCachedSizes, writeCachedSizes } from "./sizeCache";
import { audited } from "../auth/audited";
import { bumpVersion, getState } from "../store/contentStore";
import { catalogItems } from "./products/productStore";
import taxonomySeed from "@/data/taxonomy.json";

/**
 * The size list — "M", "EU 38 · UK 3 · US 5", "One Size" — that a category
 * offers from and a product picks within.
 *
 * This is the list, not the measurement tables: those are `sizeChartApi`, and
 * the two are separate resources that are allowed to disagree.
 *
 * ## Reads fall back, writes do not
 *
 * API, then IndexedDB, then the list the app shipped with. The fallback is not
 * politeness here — fifteen places read this, and a shopper with a full basket
 * or a staff member printing packing slips is exactly who should not get "EU38"
 * because the network blinked. `sizeLabel` uppercases an id it cannot resolve,
 * so a missing list does not fail visibly, it degrades quietly and wrongly.
 *
 * Writes never fall back. A size's id is permanent, so a save that half-landed
 * is worse than one that plainly failed.
 *
 * ## The id does not move, and this module never asks it to
 *
 * The id is a key in a product's `colorways[].stock` and the value in a
 * bookmarked `?size=eu38,m`. That is why `renameSize` sends only a name, why
 * there is no "update id" call, and why the server rejects a body carrying one.
 * A client that could re-point an id could re-point every stock row holding it
 * in a single request, which is not something an accidental edit should be able
 * to do.
 *
 * ## `sizeUsage` stays here, and that is a real limitation
 *
 * Deleting a size that something still uses is refused client-side, because the
 * server cannot know: there is no `Category` or `Product` model on it at all —
 * the catalogue lives in this browser's localStorage. So this guard holds for
 * whoever holds the catalogue and for nobody else, and the server's own delete
 * is unguarded. What the server does guarantee is that a deleted id is spent
 * forever, which bounds how badly an unguarded delete can go: a size that no
 * longer resolves, rather than one that silently came to mean something else.
 */

const FALLBACK_LABEL = { en: "Size", fr: "Taille" };

/** The shipped list, as `{id, name}` pairs in the order the bundle has them. */
function bundled() {
  return (taxonomySeed.dimensions?.size?.values ?? []).map(({ id, name }) => ({ id, name }));
}

/** True when a value is a list a shopper can actually be shown. */
function usable(sizes) {
  return (
    Array.isArray(sizes) &&
    sizes.length > 0 &&
    sizes.every((s) => s && typeof s.id === "string" && typeof s.name === "string")
  );
}

/**
 * The list, in display order.
 *
 * `realm` picks the boundary: the storefront reads the public route because a
 * shopper filtering a category page has no account, while the dashboard reads
 * through `admin` so its read is authenticated like the rest of its work.
 */
export async function getSizes({ realm = "customer" } = {}) {
  try {
    const sizes = await http.get(resourcePath(routes.taxonomy.sizes, realm), { realm });
    if (!usable(sizes)) throw new ApiError("The size list came back incomplete.", 502);
    writeCachedSizes(sizes);
    return sizes;
  } catch (err) {
    const cached = await readCachedSizes();
    if (usable(cached)) return cached;

    // A 401 or 403 is an answer, not an outage. Falling back would serve a
    // visitor a list the server said they may not have, and would hide a real
    // session problem behind a page that looks fine.
    if (err?.status === 401 || err?.status === 403) throw err;

    return bundled();
  }
}

/**
 * How many categories offer, and how many products carry, each size — keyed by id.
 *
 * Deliberately still computed here, from the local catalogue. The server has no
 * products and no categories to count, so a count it produced would be a number
 * it invented. This one is at least true of the browser that is asking.
 */
export function sizeUsage() {
  const categories = {};
  const products = {};
  for (const c of getState("categories").items) {
    for (const id of c.sizes ?? []) categories[id] = (categories[id] ?? 0) + 1;
  }
  for (const p of catalogItems()) {
    for (const id of p.sizes ?? []) products[id] = (products[id] ?? 0) + 1;
  }
  return Promise.resolve({ categories, products });
}

async function createSize$raw(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new ApiError("Give it a name.", 422);

  // No fallback: an id is permanent, so a create that did not land has to be
  // visible rather than quietly retried into a different row later.
  const saved = await http.post(resourcePath(routes.taxonomy.sizes, "staff"), { name: trimmed }, { realm: "staff" });
  await refreshCache();
  bumpVersion();
  return saved;
}

async function renameSize$raw(id, name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new ApiError("Give it a name.", 422);

  // Only the name goes. Sending an `id` would be refused server-side anyway —
  // and being refused is the correct outcome, not an accident to route around.
  const saved = await http.patch(resourcePath(routes.taxonomy.size, "staff", { id }), { name: trimmed }, { realm: "staff" });
  await refreshCache();
  bumpVersion();
  return saved;
}

async function deleteSize$raw(id) {
  const deleted = await http.del(resourcePath(routes.taxonomy.size, "staff", { id }), { realm: "staff" });
  await refreshCache();
  bumpVersion();
  return deleted;
}

/** Puts the list back to the shipped twelve. */
async function resetSizes$raw() {
  const sizes = await http.post(resourcePath(routes.taxonomy.sizesReset, "staff"), undefined, { realm: "staff" });
  writeCachedSizes(sizes);
  bumpVersion();
  return sizes;
}

/**
 * Re-reads the list so the offline copy matches what was just written.
 *
 * A rename is one row, but the cached list is the whole thing, and a cache left
 * holding the old name would go on printing it for every cart and slip that
 * reads offline. Re-reading is one request on a write, which is the cheaper
 * mistake than a cache that is quietly wrong.
 */
async function refreshCache() {
  const sizes = await http.get(resourcePath(routes.taxonomy.sizes, "staff"), { realm: "staff" });
  if (usable(sizes)) writeCachedSizes(sizes);
  return sizes;
}

/**
 * The dimension the rest of the app reads, shaped the way it always was.
 *
 * `getTaxonomy` hands out `{color, size}`, and fifteen call sites — the shop
 * facet, the cart, the wardrobe, packing slips — read `taxonomy.size.values`
 * from it. Rather than edit all of them, the list is merged in here behind the
 * same shape. The colour half is still local: colours are a separate store with
 * separate writers, and moving them is a different job with a much wider blast
 * radius, since every product read resolves its colourways through them.
 */
export async function getSizeDimension({ realm = "customer" } = {}) {
  const sizes = await getSizes({ realm });
  return { label: FALLBACK_LABEL, values: sizes };
}

/* Recorded in the staff activity log. */
export const createSize = audited("sizes", ([name]) => `Added size ${name}`, createSize$raw);
export const renameSize = audited("sizes", ([, name]) => `Renamed a size to ${name}`, renameSize$raw);
export const deleteSize = audited("sizes", ([id]) => `Deleted size ${id}`, deleteSize$raw);
export const resetSizes = audited("sizes", () => "Reset the size list to defaults", resetSizes$raw);
