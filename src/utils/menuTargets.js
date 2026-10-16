/* Menu Targets */
import { DIMENSION_PREFIX } from "./faceting";

/**
 * What a menu item, link or tile shows, independent of its address.
 *
 *   { kind: "all" }                                    everything
 *   { kind: "category", id }                           Dresses
 *   { kind: "filter", dimension, values[], category? } Party or Evening dresses
 *   { kind: "label", id: "new" | "featured" | "sale" } New arrivals
 *   { kind: "product", id }                            one piece (tiles only)
 *
 * A "filter" target's `dimension` is either a shared taxonomy dimension
 * (today, only "color") or `subcat:<subcategoryId>` — a category's own
 * Subcategory, scoped by the required `category`. Either way it resolves the
 * same way: `values` are matched against `<dimension's prefix>:<value>`
 * tokens on the product (see DIMENSION_PREFIX and subcategoryTag).
 *
 * Any collection target may also carry `category` (only within that category)
 * and `newOnly` (only pieces marked New). The address is generated once and
 * stored beside the target, so renaming a link never breaks a shared URL.
 */

export const FILTER_DIMENSIONS = ["color"];

export const LABELS = {
  new: "New arrivals",
  featured: "Featured",
  bestseller: "Best sellers",
  limited: "Limited releases",
  sale: "On sale",
};

/** Addresses the storefront already uses, so a menu item may not take them. */
export const RESERVED_SLUGS = new Set([
  "product", "checkout", "account", "wishlist", "search", "login", "signup",
  "forgot-password", "reset-password", "atelier", "dashboard", "faq", "about-us", "contact-us",
  "order-tracking", "hair-length-guide", "shoe-size-guide", "privacy-policy",
  "terms-of-service", "shipping-policy", "return-and-refund-policy",
  "cookie-policy", "whats-new", "newsletter",
]);

export function matchesTarget(product, target) {
  if (!product || !target) return false;
  const tags = new Set(product.tags ?? []);

  if (target.category && !tags.has(`cat:${target.category}`)) return false;
  if (target.newOnly && !tags.has("tag:new")) return false;

  switch (target.kind) {
    case "all":
      return true;
    case "category":
      return tags.has(`cat:${target.id}`);
    case "filter": {
      const prefix = DIMENSION_PREFIX[target.dimension] ?? target.dimension;
      return (target.values ?? []).some((value) => tags.has(`${prefix}:${value}`));
    }
    case "label":
      if (target.id === "sale") return Boolean(product.originalPrice && product.originalPrice > product.price);
      return tags.has(`tag:${target.id}`);
    case "product":
      return product.id === target.id;
    default:
      return false;
  }
}

/** Whether a target still points at something that exists. */
export function targetExists(target, { categories = [], taxonomy = {}, products = [] } = {}) {
  if (!target) return false;
  const category = (id) => categories.find((c) => c.id === id);
  if (target.category && !category(target.category)) return false;

  switch (target.kind) {
    case "all":
      return true;
    case "category":
      return Boolean(category(target.id));
    case "filter": {
      if (String(target.dimension).startsWith("subcat:")) {
        const subId = target.dimension.slice("subcat:".length);
        const sub = category(target.category)?.subcategories?.find((s) => s.id === subId);
        const known = new Set((sub?.types ?? []).map((t) => t.id));
        return (target.values ?? []).length > 0 && target.values.every((v) => known.has(v));
      }
      const known = new Set((taxonomy[target.dimension]?.values ?? []).map((v) => v.id));
      return (target.values ?? []).length > 0 && target.values.every((v) => known.has(v));
    }
    case "label":
      return target.id in LABELS;
    case "product":
      return products.some((p) => p.id === target.id);
    default:
      return false;
  }
}

/** A URL segment from a name, unique among `taken` and never a reserved address. */
export function menuSlug(name, taken = new Set(), { reserved = false } = {}) {
  const base =
    String(name ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "link";

  let slug = base;
  for (let n = 2; taken.has(slug) || (reserved && RESERVED_SLUGS.has(slug)); n += 1) slug = `${base}-${n}`;
  return slug;
}
