import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { getState, setState } from "../store/contentStore";
import { catalogItems, normalize } from "./products/productStore";
import { getSizes } from "./sizesApi";
import { RESERVED_SLUGS, matchesTarget, targetExists } from "../../utils/menuTargets";
import { audited } from "../auth/audited";

/**
 * The menu tree and product taxonomy.
 *
 * The tree is the single source of truth for both the mega menu and address
 * validity: a menu item or link always resolves, and a path not in the tree
 * always 404s. What each node shows is its `target` (see menuTargets.js).
 *
 * ## The tree lives on the server
 *
 * `/navigation` holds one document: `{ items, version }`. Every successful
 * read or write is mirrored into the local `navigation` domain, which is what
 * catalogue pages resolve their URL against synchronously, and what a read
 * falls back to offline. A read only announces itself when the tree actually
 * changed — the header and footer re-read on the content version, so a read
 * that always announced itself would loop.
 *
 * A save names the version the editor loaded; the server refuses a stale one
 * (409) so two people editing at once cannot silently overwrite each other.
 * Whether each target still points at something real needs the catalogue,
 * which is still in this browser, so `menuProblem` runs here before saving.
 */

function navState() {
  return getState("navigation");
}

function usable(data) {
  return data && Array.isArray(data.items) && Number.isInteger(data.version);
}

/** Writes the server's tree into the mirror; notifies only if it changed (or `notify` forces it). */
function mirror({ items, version }, { notify = false } = {}) {
  const changed = JSON.stringify(items) !== JSON.stringify(navState().items);
  setState("navigation", (state) => ({ ...state, items, version }), { silent: !(notify || changed) });
  return { items, version };
}

/** The stored tree and its version, from the server or, failing that, the mirror. */
async function readTree(realm) {
  try {
    const data = await http.get(resourcePath(routes.navigation.tree, realm), { realm });
    if (!usable(data)) throw new ApiError("The menu came back incomplete.", 502);
    return mirror(data);
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) throw err;
    const { items, version = null } = navState();
    return { items, version };
  }
}

let synced = null;

/**
 * Refreshes the mirror once at start-up, and is what URL resolution waits on:
 * a deep link to a page added since this browser last looked must not 404
 * just because the header has not fetched the menu yet. Never rejects.
 */
export function syncNavigation() {
  if (!synced) synced = readTree("customer").catch(() => null);
  return synced;
}

/** The menu as the storefront renders it, with each tile's link and photo filled in. */
export async function getNavigation() {
  const { items } = await readTree("customer");
  const products = catalogItems().map(normalize).filter((p) => p.status === "active");
  return items.map((root) =>
    root.tiles?.length ? { ...root, tiles: root.tiles.map((tile) => resolveTile(tile, products)) } : root,
  );
}

/** The menu exactly as stored, with the version a save must name, for the dashboard to edit. */
export function getNavigationForEditing() {
  return readTree("staff");
}

export async function getNavItem(id) {
  const { items } = await readTree("customer");
  return items.find((item) => item.id === id) ?? null;
}

/**
 * Attribute dimensions (colour, size, fabric, occasion, style, length, hair).
 *
 * Sizes come from the server; colours do not. The two are merged behind the one
 * shape this has always returned, and that is the whole trick — fifteen call
 * sites read `taxonomy.size.values` (the shop facet, the cart, the wardrobe,
 * packing slips, the invoice) and none of them should have to learn where the
 * list came from.
 *
 * Both halves come from the server now. `color` here is the *family*
 * dimension (black, brown…) — `/taxonomy/colors/families` — which each boutique
 * colour (`colorsApi`) points at, and which the storefront facet and every
 * mega-menu `filter:color` link resolve against. The families are mirrored
 * into the local `taxonomy` domain, which the menu checks read synchronously.
 *
 * Each half falls back on its own (sizes: API, IndexedDB, the bundled list;
 * families: API, the mirror), so a failure in one cannot take the other with it.
 */
export async function getTaxonomy({ realm = "customer" } = {}) {
  const [families, sizes] = await Promise.all([
    http.get(resourcePath("taxonomy/colors/families", realm), { realm }).catch(() => null),
    getSizes({ realm }).catch(() => null),
  ]);
  if (families?.values?.length) {
    const current = getState("taxonomy");
    if (JSON.stringify(current.dimensions.color) !== JSON.stringify(families)) {
      setState("taxonomy", { ...current, dimensions: { ...current.dimensions, color: families } }, { silent: true });
    }
  }
  const local = getState("taxonomy").dimensions;
  return sizes ? { ...local, size: { ...local.size, values: sizes } } : local;
}

/** Flat list of every link, used for address resolution and breadcrumbs. */
export async function getNavLeaves() {
  const { items } = await readTree("customer");
  return flattenLeaves(items);
}

export function flattenLeaves(items) {
  return items.flatMap((root) =>
    root.sections.flatMap((section) =>
      section.items.map((leaf) => ({ ...leaf, rootId: root.id, rootLabel: root.label })),
    ),
  );
}

/**
 * A tile pointing at a product links to that product and, unless a photo was
 * uploaded for it, shows the product's lead photo. A tile pointing at a menu
 * page shows its uploaded photo, or the first piece on that page.
 */
export function resolveTile(tile, products = []) {
  if (tile.target?.kind === "product") {
    const product = products.find((p) => p.id === tile.target.id);
    return {
      ...tile,
      url: product ? `/product/${product.slug}` : "/shop",
      image: tile.image || product?.images?.[0] || null,
    };
  }
  if (tile.image) return tile;
  const lead = products.find((p) => p.images?.length && matchesTarget(p, tile.target));
  return { ...tile, image: lead?.images?.[0] ?? null };
}

/**
 * Replace the menu tree, after checking it would work in the shop.
 *
 * The whole tree at once: the menu is one ordered structure, and a reorder
 * touches every sibling anyway. `version` is the one the editor loaded.
 */
async function updateNavigation$raw(items, version) {
  const problem = menuProblem(items, {
    categories: getState("categories").items,
    taxonomy: getState("taxonomy").dimensions,
    products: catalogItems(),
  });
  if (problem) throw new ApiError(problem, 422);

  // No version means the editor is showing this browser's offline copy: the
  // server could not be reached when the menu loaded. Saving that would mean
  // guessing which version it was edited from, so say so instead.
  if (!Number.isInteger(version)) {
    throw new ApiError("The menu couldn't be loaded from the server, so it can't be saved. Reload the page and try again.", 503);
  }

  const saved = await http.put(resourcePath(routes.navigation.tree, "staff"), { items, version }, { realm: "staff" });
  return mirror(saved, { notify: true });
}

/** Restore the shipped menu, discarding every dashboard edit. */
async function resetNavigation$raw() {
  const saved = await http.post(resourcePath(routes.navigation.reset, "staff"), undefined, { realm: "staff" });
  return mirror(saved, { notify: true });
}

/** The first reason the menu would not work, in words the admin can act on. */
function menuProblem(items, lookups) {
  const rootSlugs = new Set();
  const urls = new Set(items.map((root) => root.url));

  for (const root of items) {
    const name = root.label?.trim();
    if (!name) return "Every menu item needs a name.";
    if (rootSlugs.has(root.slug)) return `Two menu items use the address /${root.slug}. Rename one of them.`;
    rootSlugs.add(root.slug);
    if (RESERVED_SLUGS.has(root.slug)) {
      return `“${name}” would use /${root.slug}, which the shop already uses. Give it another name.`;
    }
    if (!["all", "category", "label"].includes(root.target?.kind) || !targetExists(root.target, lookups)) {
      return `Choose what “${name}” shows again: what it pointed at no longer exists.`;
    }

    for (const section of root.sections ?? []) {
      if (!section.title?.trim()) return `A column in “${name}” needs a heading.`;
      if (!section.items?.length) {
        return `The column “${section.title}” in “${name}” has no links. Add one, or remove the column.`;
      }
      for (const leaf of section.items) {
        if (!leaf.label?.trim()) return `A link in “${section.title}” needs a name.`;
        if (urls.has(leaf.url)) return `Two links use the address ${leaf.url}. Rename one of them.`;
        urls.add(leaf.url);
        if (!leaf.target || leaf.target.kind === "product" || !targetExists(leaf.target, lookups)) {
          return `Choose what “${leaf.label}” in “${name}” shows again: what it pointed at no longer exists.`;
        }
      }
    }
  }

  for (const root of items) {
    for (const tile of root.tiles ?? []) {
      if (!tile.title?.trim()) return `A feature tile in “${root.label}” needs a title.`;
      if (!targetExists(tile.target, lookups)) {
        return `The tile “${tile.title}” in “${root.label}” points at something that no longer exists.`;
      }
      if (tile.target.kind !== "product" && !urls.has(tile.url)) {
        return `The tile “${tile.title}” links to a page that is no longer in the menu. Choose its link again.`;
      }
    }
  }

  return null;
}

/* Recorded in the staff activity log. */
export const updateNavigation = audited("mega-menu", () => "Saved the mega menu", updateNavigation$raw);
export const resetNavigation = audited("mega-menu", () => "Restored the original mega menu", resetNavigation$raw);
