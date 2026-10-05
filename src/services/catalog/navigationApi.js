import { ApiError, mockApi } from "@/api/mock";
import { getState, resetDomain, setState } from "../store/contentStore";
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
 */

/** The menu as the storefront renders it, with each tile's link and photo filled in. */
export function getNavigation() {
  return mockApi(() => {
    const products = catalogItems().map(normalize).filter((p) => p.status === "active");
    return getState("navigation").items.map((root) =>
      root.tiles?.length ? { ...root, tiles: root.tiles.map((tile) => resolveTile(tile, products)) } : root,
    );
  }, 0);
}

/** The menu exactly as stored, for the dashboard to edit. */
export function getNavigationForEditing() {
  return mockApi(() => getState("navigation").items, 0);
}

export function getNavItem(id) {
  return mockApi(() => getState("navigation").items.find((item) => item.id === id) ?? null, 0);
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
 * Only `size` is replaced. `color` here is the *family* dimension (black,
 * brown…), which is still local. The boutique colour list (Ebony, Champagne) is
 * a separate resource on the server (`colorsApi`); each colour's `family`
 * points at one of these ids, and that id is what the storefront facet and
 * every mega-menu `filter:color` link resolve against.
 *
 * The size read falls back (API, then IndexedDB, then the bundled list) inside
 * `getSizes`, so this resolves even with the network down. Colours resolve
 * synchronously as they always did, and are spread in first so a size read that
 * somehow throws cannot take the colour half with it.
 */
export function getTaxonomy({ realm = "customer" } = {}) {
  const local = getState("taxonomy").dimensions;
  return getSizes({ realm }).then(
    (values) => ({ ...local, size: { ...local.size, values } }),
    () => local,
  );
}

/** Flat list of every link, used for address resolution and breadcrumbs. */
export function getNavLeaves() {
  return mockApi(() => flattenLeaves(getState("navigation").items), 0);
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
 * touches every sibling anyway.
 */
function updateNavigation$raw(items) {
  return mockApi(() => {
    const problem = menuProblem(items, {
      categories: getState("categories").items,
      taxonomy: getState("taxonomy").dimensions,
      products: catalogItems(),
    });
    if (problem) throw new ApiError(problem, 422);

    setState("navigation", (state) => ({ ...state, items }));
    return items;
  });
}

/** Restore the shipped menu, discarding every dashboard edit. */
function resetNavigation$raw() {
  return mockApi(() => resetDomain("navigation").items);
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
