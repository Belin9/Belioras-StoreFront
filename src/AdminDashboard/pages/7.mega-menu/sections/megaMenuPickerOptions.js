/* Mega Menu Picker Options */
import { LABELS, matchesTarget } from "@/utils/menuTargets";

const SUBCAT_PREFIX = "subcat:";

/** A category's own Subcategories, as pickable "kinds" — Shop by Category,
    Shop by Occasion… — scoped to whichever category is currently picked in
    "Only in". Empty until a category with Subcategories is chosen. */
function subcategoryKinds(categories, categoryId) {
  const category = categories.find((c) => c.id === categoryId);
  return (category?.subcategories ?? []).map((s) => ({ id: `${SUBCAT_PREFIX}${s.id}`, label: s.name }));
}

/** A top-level item shows something broad; a link can show anything but a single product. */
export function kindsFor(mode, categories = [], categoryId = "") {
  if (mode === "item") {
    return [
      { id: "all", label: "Everything" },
      { id: "category", label: "A category" },
      { id: "label", label: "A label" },
    ];
  }
  return [
    { id: "category", label: "Category" },
    ...subcategoryKinds(categories, categoryId),
    { id: "color", label: "Colour" },
    { id: "label", label: "Label" },
  ];
}

/** Filters can combine several values, such as two colours, or two types
    within the same Subcategory. */
export function isMulti(kind) {
  return kind === "color" || String(kind).startsWith(SUBCAT_PREFIX);
}

/** Kinds that can be narrowed to one category. A Subcategory kind is always
    scoped — it belongs to exactly one category by definition — so its "Only
    in" is fixed rather than optional, but it still renders through the same
    field. */
export function isScoped(kind) {
  return kind === "color" || kind === "label" || String(kind).startsWith(SUBCAT_PREFIX);
}

export function optionsFor(kind, { categories = [], taxonomy = {}, category = "" }) {
  if (kind === "category") return categories.map((c) => ({ value: c.id, name: c.name }));
  if (kind === "label") return Object.entries(LABELS).map(([value, name]) => ({ value, name }));
  if (String(kind).startsWith(SUBCAT_PREFIX)) {
    const subId = kind.slice(SUBCAT_PREFIX.length);
    const sub = categories.find((c) => c.id === category)?.subcategories?.find((s) => s.id === subId);
    return (sub?.types ?? []).map((t) => ({ value: t.id, name: t.name }));
  }
  return (taxonomy[kind]?.values ?? []).map((v) => ({ value: v.id, name: v.name ?? v.id, hex: v.hex }));
}

/** The picker's state -> a target, or null while nothing is chosen. */
export function targetFrom({ kind, values = [], category, newOnly }) {
  if (kind === "all") return { kind: "all" };
  if (!values.length) return null;

  const onlyNew = newOnly ? { newOnly: true } : {};
  const scope = { ...(category ? { category } : {}), ...onlyNew };

  if (kind === "category") return { kind, id: values[0], ...onlyNew };
  if (kind === "label") return { kind, id: values[0], ...scope };
  if (String(kind).startsWith(SUBCAT_PREFIX)) {
    if (!category) return null; // a Subcategory filter is always scoped to its own category
    return { kind: "filter", dimension: kind, values, ...scope };
  }
  return { kind: "filter", dimension: kind, values, ...scope };
}

/** A stored target -> the picker's state, so editing opens on what is there. */
export function stateFrom(target, defaultCategory = "") {
  if (!target) return { kind: null, values: [], category: defaultCategory, newOnly: false };

  const base = { category: target.category ?? "", newOnly: Boolean(target.newOnly) };
  switch (target.kind) {
    case "all":
      return { ...base, kind: "all", values: ["all"] };
    case "category":
      return { ...base, category: "", kind: "category", values: [target.id] };
    case "label":
      return { ...base, kind: "label", values: [target.id] };
    case "filter":
      return { ...base, kind: target.dimension, values: [...(target.values ?? [])] };
    default:
      return { ...base, kind: null, values: [] };
  }
}

export function countFor(target, products = []) {
  return target ? products.filter((p) => matchesTarget(p, target)).length : 0;
}

export function piecesText(count) {
  if (count === null || count === undefined) return "";
  return count === 0 ? "No pieces yet" : `${count} ${count === 1 ? "piece" : "pieces"}`;
}
