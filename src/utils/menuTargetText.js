/* Menu Target Text */
import { LABELS } from "./menuTargets";

/** A plain-language description: "Accessories › Heels", "Dresses · Party, Evening". */
export function describeTarget(target, { categories = [], taxonomy = {}, products = [] } = {}) {
  if (!target) return "Nothing chosen";
  const categoryName = (id) => categories.find((c) => c.id === id)?.name ?? id;
  const valueName = (dimension, id) => {
    if (String(dimension).startsWith("subcat:")) {
      const subId = dimension.slice("subcat:".length);
      const sub = categories.find((c) => c.id === target.category)?.subcategories?.find((s) => s.id === subId);
      return sub?.types?.find((t) => t.id === id)?.name ?? id;
    }
    return taxonomy[dimension]?.values?.find((v) => v.id === id)?.name ?? id;
  };

  let text;
  switch (target.kind) {
    case "all":
      text = "Everything in the shop";
      break;
    case "category":
      text = categoryName(target.id);
      break;
    case "filter":
      text = (target.values ?? []).map((v) => valueName(target.dimension, v)).join(", ");
      break;
    case "label":
      text = LABELS[target.id] ?? target.id;
      break;
    case "product":
      text = products.find((p) => p.id === target.id)?.name ?? "A product that no longer exists";
      break;
    default:
      text = "Unknown";
  }

  const scope = [
    target.kind !== "category" && target.category ? categoryName(target.category) : null,
    target.newOnly && !(target.kind === "label" && target.id === "new") ? "new arrivals only" : null,
  ].filter(Boolean);

  return scope.length ? `${text} · ${scope.join(" · ")}` : text;
}

/**
 * A sensible starting name for a link, which the admin may change: the thing
 * itself, without its scope.
 */
export function suggestLabel(target, lookups = {}) {
  // A subcategory filter's value names live under the category, because type
  // ids repeat across categories — stripping `category` (below) would lose them.
  if (target?.kind === "filter" && String(target.dimension).startsWith("subcat:")) {
    const subId = target.dimension.slice("subcat:".length);
    const category = (lookups.categories ?? []).find((c) => c.id === target.category);
    const sub = category?.subcategories?.find((s) => s.id === subId);
    return (target.values ?? []).map((v) => sub?.types?.find((t) => t.id === v)?.name ?? v).join(", ");
  }
  return describeTarget({ ...target, category: undefined, newOnly: undefined }, lookups);
}
