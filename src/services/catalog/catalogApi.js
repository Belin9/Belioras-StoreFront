import { mockApi } from "@/api/mock";
import { getState } from "../store/contentStore";
import { flattenLeaves, syncNavigation } from "./navigationApi";
import { getProducts } from "./productsApi";
import { matchesTarget } from "../../utils/menuTargets";

/**
 * The catalog page's single data source.
 *
 * A path is valid only when it belongs to a menu item or link in the
 * navigation tree, and its products are whatever that item's target selects.
 * The menu and the pages it links to therefore cannot disagree: a link in the
 * menu always resolves, and an invented path always 404s.
 */

function findNavMatch(pathname) {
  const slug = pathname.replace(/\/+$/, "").replace(/^\//, "");
  const { items } = getState("navigation");

  const root = items.find((item) => item.slug === slug);
  if (root) {
    return { node: root, root, breadcrumb: [{ label: root.label, url: root.url }] };
  }

  for (const leaf of flattenLeaves(items)) {
    // An older address (before links carried their column) still resolves,
    // then redirects to the current one so bookmarks and shared links live on.
    const viaAlias = leaf.slug !== slug && (leaf.aliases ?? []).includes(slug);
    if (leaf.slug !== slug && !viaAlias) continue;
    const parent = items.find((item) => item.id === leaf.rootId);
    return {
      redirectTo: viaAlias ? leaf.url : null,
      node: leaf,
      root: parent,
      breadcrumb: [
        { label: parent?.label ?? leaf.rootLabel, url: parent?.url ?? `/${leaf.rootId}` },
        { label: leaf.label, url: leaf.url },
      ],
    };
  }

  return null;
}

/**
 * Resolves a pathname to its products.
 *
 * `valid: false` means the caller should render a 404: the path is not in the
 * navigation tree, or its item no longer says what it shows.
 */
export function getCatalog(pathname) {
  return mockApi(async () => {
    await syncNavigation();
    const match = findNavMatch(pathname);
    if (!match?.node?.target) {
      return { valid: false, resolved: null, products: [], total: 0 };
    }

    if (match.redirectTo) return { valid: true, redirectTo: match.redirectTo, resolved: null, products: [], total: 0 };

    const all = await getProducts();
    const products = all.filter((product) => matchesTarget(product, match.node.target));

    return {
      valid: true,
      resolved: {
        label: match.node.label,
        breadcrumb: match.breadcrumb,
        target: match.node.target,
        rootUrl: match.root?.url ?? "/shop",
        rootLabel: match.root?.label ?? "Shop",
      },
      products,
      total: products.length,
    };
  }, 0);
}

/**
 * The Featured Collection, as the menu defines it: the menu page that shows
 * featured pieces, and the pieces it lists. The home page previews it, so its
 * photos and its link always agree with the page it opens. Without such a page
 * in the menu, it falls back to every featured piece and the shop.
 */
export function getFeaturedCollection(limit = 4) {
  return mockApi(async () => {
    await syncNavigation();
    const { items } = getState("navigation");
    const nodes = [...flattenLeaves(items), ...items];
    const node = nodes.find((n) => n.target?.kind === "label" && n.target.id === "featured");
    const target = node?.target ?? { kind: "label", id: "featured" };

    const all = await getProducts();
    return {
      url: node?.url ?? "/shop",
      label: node?.label ?? "Featured",
      products: all.filter((product) => matchesTarget(product, target)).slice(0, limit),
    };
  }, 0);
}

/** Sibling leaves under the same section — the chips shown above the grid. */
export function getSiblingLeaves(pathname) {
  return mockApi(async () => {
    await syncNavigation();
    const slug = pathname.replace(/^\//, "").replace(/\/+$/, "");
    const { items } = getState("navigation");

    for (const root of items) {
      for (const section of root.sections) {
        if (section.items.some((leaf) => leaf.slug === slug)) return section.items;
      }
    }

    // A root landing: offer the first section's leaves as an entry point.
    const rootMatch = items.find((item) => item.slug === slug.split("/")[0]);
    return rootMatch?.sections?.[0]?.items ?? [];
  }, 0);
}
