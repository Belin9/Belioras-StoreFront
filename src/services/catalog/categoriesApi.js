import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { getState, setState } from "../store/contentStore";
import { catalogItems } from "./products/productStore";
import { audited } from "../auth/audited";

/**
 * Categories: what a piece is. Each offers a set of sizes and its own
 * Subcategories — freely-named "Shop by …" groups (Bags, Shop by Occasion…),
 * each holding the types products are tagged with (Clutch Bags, Party
 * Dresses…). Types live only inside Subcategories.
 *
 * Ids are fixed at creation: a category id is every product's collectionId and
 * a type is a product's `subcat:<sub>:<type>` tag, and both are filter tokens,
 * so renaming changes only the name. The server owns the ids and never reissues a deleted
 * one.
 *
 * ## Reads fall back, writes do not
 *
 * The list lives on the server (`/taxonomy/categories`). Every successful read
 * or write is mirrored into the local `categories` domain, which is what the
 * synchronous readers — search, reports, size usage, the menu checks below —
 * read, and what a read falls back to when the API cannot be reached. Writes
 * never fall back: a category id is permanent, so a save that did not land has
 * to fail visibly.
 *
 * ## The in-use guards stay here
 *
 * "A category still holding products cannot be deleted", "a type still tagged
 * on a product cannot be removed", and "nothing the Mega Menu links to can be
 * removed" all need the products and the menu, which still live in this
 * browser. So they are checked here before the request is sent. The server
 * cannot see them, which is why it spends deleted ids instead.
 */

const LIST = () => resourcePath(routes.taxonomy.categories, "staff");
const ONE = (id) => resourcePath(routes.taxonomy.category, "staff", { id });

function categoryItems() {
  return getState("categories").items;
}

function usable(list) {
  return Array.isArray(list) && list.every((c) => c && typeof c.id === "string" && typeof c.name === "string");
}

/**
 * Writes the server's list into the local mirror. A write announces itself so
 * open pages re-read; a read is silent, or every reader keyed on `version`
 * would re-run itself forever.
 */
function mirror(items, { silent = false } = {}) {
  setState("categories", (state) => ({ ...state, items }), { silent });
  return items;
}

/** Replaces or appends one category in the mirror, keeping the server's order. */
function mirrorOne(category) {
  const items = categoryItems();
  const at = items.findIndex((c) => c.id === category.id);
  return mirror(at === -1 ? [...items, category] : items.map((c) => (c.id === category.id ? category : c)));
}

/**
 * The first Mega Menu link (or tile) that shows something a category edit is
 * about to remove. The menu can only be built from what exists, so what
 * exists can't be removed out from under it — same rule as a type still on a
 * product.
 *
 * `gone` describes what is being removed: { category, subcategory?, subcategoryType? }.
 */
function menuUsing(gone) {
  const uses = (t) => {
    if (!t) return false;
    if (t.kind === "category") return t.id === gone.category && !gone.subcategory;
    if (t.kind === "filter" && String(t.dimension).startsWith("subcat:") && t.category === gone.category) {
      if (t.dimension !== `subcat:${gone.subcategory}`) return false;
      return !gone.subcategoryType || (t.values ?? []).includes(gone.subcategoryType);
    }
    return false;
  };
  for (const root of getState("navigation").items) {
    if (uses(root.target)) return root.label;
    for (const section of root.sections ?? []) {
      for (const leaf of section.items ?? []) if (uses(leaf.target)) return `${root.label} › ${leaf.label}`;
    }
    for (const tile of root.tiles ?? []) if (uses(tile.target)) return `${root.label} › ${tile.title}`;
  }
  return null;
}

function inMenuError(name, where) {
  return new ApiError(`${name} is used by the menu (${where}). Remove or change that link in Mega Menu first.`, 409);
}

const products = (n) => `${n} ${n === 1 ? "product" : "products"}`;

/**
 * Every category, in display order.
 *
 * `realm` picks the boundary: the storefront reads the public route, the
 * dashboard reads through `staff` so it is never served a cached public copy
 * of a list it just edited.
 */
export async function getCategories({ realm = "customer" } = {}) {
  try {
    const items = await http.get(resourcePath(routes.taxonomy.categories, realm), { realm });
    if (!usable(items)) throw new ApiError("The category list came back incomplete.", 502);
    return [...mirror(items, { silent: true })];
  } catch (err) {
    // A 401 or 403 is an answer, not an outage — don't hide it behind a copy.
    if (err?.status === 401 || err?.status === 403) throw err;
    return [...categoryItems()];
  }
}

/** The dashboard's read. A named function so `useAsyncData` keys it apart from the storefront's. */
export function getStaffCategories() {
  return getCategories({ realm: "staff" });
}

/** How many products sit in each category, keyed by category id. */
export async function categoryUsage() {
  const counts = {};
  for (const product of catalogItems()) {
    counts[product.collectionId] = (counts[product.collectionId] ?? 0) + 1;
  }
  return counts;
}

/** How many products are tagged with each Subcategory type, keyed by `<categoryId>:<subId>:<typeId>`. */
export async function typeUsage() {
  const counts = {};
  for (const p of catalogItems()) {
    for (const tag of p.tags ?? []) {
      const [prefix, subId, typeId] = String(tag).split(":");
      if (prefix !== "subcat" || !typeId) continue;
      const key = `${p.collectionId}:${subId}:${typeId}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

/** Blank rows dropped, and only the keys the server accepts. */
function toBody({ name, sizes, subcategories } = {}) {
  const named = (list) =>
    (Array.isArray(list) ? list : [])
      .map((item) => ({ ...item, name: String(item?.name ?? "").trim() }))
      .filter((item) => item.name);
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new ApiError("Give the category a name.", 422);

  return {
    name: trimmed,
    sizes: Array.isArray(sizes) ? sizes : [],
    subcategories: named(subcategories).map(({ id, name: n, types: t }) => ({
      ...(id ? { id } : {}),
      name: n,
      types: named(t).map(({ id: tid, name: tn }) => (tid ? { id: tid, name: tn } : { name: tn })),
    })),
  };
}

/**
 * Refuses an edit that would remove something still in use.
 *
 * An entry survives the save when the body still carries its id — that is how
 * the server matches them — so anything in `existing` whose id is missing from
 * the body is being removed.
 */
function assertRemovable(existing, body) {
  const id = existing.id;
  const items = catalogItems().filter((p) => p.collectionId === id);

  const nextSubs = new Map(body.subcategories.filter((s) => s.id).map((s) => [s.id, s]));
  const tagged = (subId, typeId) =>
    items.filter((p) => (p.tags ?? []).includes(`subcat:${subId}:${typeId}`)).length;

  for (const sub of existing.subcategories ?? []) {
    const next = nextSubs.get(sub.id);
    const stay = new Set((next?.types ?? []).map((t) => t.id).filter(Boolean));
    for (const type of sub.types ?? []) {
      if (stay.has(type.id)) continue;
      const count = tagged(sub.id, type.id);
      if (count) {
        const label = next ? type.name : `${sub.name} (${type.name})`;
        throw new ApiError(
          `${label} is tagged on ${products(count)}. Untag ${count === 1 ? "it" : "them"} before removing it.`,
          409,
        );
      }
      if (next) {
        const where = menuUsing({ category: id, subcategory: sub.id, subcategoryType: type.id });
        if (where) throw inMenuError(type.name, where);
      }
    }
    if (!next) {
      const where = menuUsing({ category: id, subcategory: sub.id });
      if (where) throw inMenuError(sub.name, where);
    }
  }
}

async function createCategory$raw(input) {
  const saved = await http.post(LIST(), toBody(input), { realm: "staff" });
  mirrorOne(saved);
  return saved;
}

async function updateCategory$raw(id, input) {
  const existing = categoryItems().find((c) => c.id === id);
  if (!existing) throw new ApiError("That category no longer exists.", 404);

  const body = toBody(input);
  assertRemovable(existing, body);

  const saved = await http.patch(ONE(id), body, { realm: "staff" });
  mirrorOne(saved);
  return saved;
}

async function deleteCategory$raw(id) {
  const category = categoryItems().find((c) => c.id === id);
  if (!category) throw new ApiError("That category no longer exists.", 404);

  const count = catalogItems().filter((p) => p.collectionId === id).length;
  if (count) {
    throw new ApiError(`${category.name} still holds ${products(count)}. Move them to another category first.`, 409);
  }
  const where = menuUsing({ category: id });
  if (where) throw inMenuError(category.name, where);

  const deleted = await http.del(ONE(id), { realm: "staff" });
  mirror(categoryItems().filter((c) => c.id !== id));
  return deleted;
}

/** Sets the display order. `ids` must be every category id, in the new order. */
async function reorderCategories$raw(ids) {
  const items = await http.put(resourcePath(routes.taxonomy.categoriesOrder, "staff"), { ids }, { realm: "staff" });
  mirror(items);
  return items;
}

/** Puts the shipped categories back. */
async function resetCategories$raw() {
  const items = await http.post(resourcePath(routes.taxonomy.categoriesReset, "staff"), undefined, { realm: "staff" });
  mirror(items);
  return items;
}

/* Recorded in the staff activity log. */
export const createCategory = audited("categories", (_, r) => `Created category ${r.name}`, createCategory$raw);
export const updateCategory = audited("categories", (_, r) => `Updated category ${r.name}`, updateCategory$raw);
export const deleteCategory = audited("categories", (_, r) => `Deleted category ${r.name}`, deleteCategory$raw);
export const reorderCategories = audited("categories", () => "Reordered categories", reorderCategories$raw);
export const resetCategories = audited("categories", () => "Reset categories to defaults", resetCategories$raw);
