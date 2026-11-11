/**
 * The dashboard's sections, as permissions. Each role gives every section one
 * level: "none" (hidden), "view" (look, change nothing) or "edit". Sections
 * that only report on things (`readOnly`) stop at "view".
 */
export const SECTIONS = [
  { id: "overview", label: "Overview", group: "General", readOnly: true },
  { id: "products", label: "Products", group: "Catalogue" },
  { id: "inventory", label: "Inventory", group: "Catalogue" },
  { id: "categories", label: "Categories & Colours", group: "Catalogue" },
  { id: "sizes", label: "Sizes & Guides", group: "Catalogue" },
  { id: "mega-menu", label: "Mega Menu", group: "Catalogue" },
  { id: "reviews", label: "Reviews", group: "Catalogue" },
  { id: "orders", label: "Orders", group: "Sales" },
  { id: "transactions", label: "Transactions", group: "Sales", readOnly: true },
  { id: "customers", label: "Customers", group: "Sales", readOnly: true },
  { id: "reports", label: "Reports", group: "Sales", readOnly: true },
  { id: "discounts", label: "Discounts", group: "Marketing" },
  { id: "newsletter", label: "Newsletter", group: "Marketing" },
  { id: "home", label: "Home page", group: "Marketing" },
  { id: "team", label: "Team & roles", group: "Store" },
  { id: "activity", label: "Activity log", group: "Store", readOnly: true },
  { id: "shipping", label: "Shipping", group: "Store" },
  { id: "settings", label: "Settings", group: "Store" },
];

export const LEVELS = ["none", "view", "edit"];
const RANK = { none: 0, view: 1, edit: 2 };

export function rank(level) {
  return RANK[level] ?? 0;
}

/** A role's level for one section. The locked Administrator role always edits. */
export function levelIn(role, section) {
  if (!role) return "none";
  if (role.locked) return "edit";
  const level = role.permissions?.[section] ?? "none";
  const def = SECTIONS.find((s) => s.id === section);
  return def?.readOnly && level === "edit" ? "view" : level;
}

/** How many sections a role reaches, for summaries. */
export function reach(role) {
  return SECTIONS.filter((s) => levelIn(role, s.id) !== "none");
}
