/**
 * The product list's filters: what each group offers, and how a row is kept.
 *
 * Pure, so the page can count tabs over the filtered rows and the filters
 * panel can count options over all of them.
 */

export const FILTER_KEYS = ["category", "type", "color", "stock", "label", "price"];

const PRICE_BANDS = [
  { value: "under-50", min: 0, max: 50 },
  { value: "50-100", min: 50, max: 100 },
  { value: "100-200", min: 100, max: 200 },
  { value: "over-200", min: 200, max: Infinity },
];

const LABELS = [
  { value: "new", label: "New arrival", test: (p) => Boolean(p.isNew) },
  { value: "featured", label: "Featured", test: (p) => Boolean(p.featured) },
  { value: "sale", label: "On sale", test: (p) => Number(p.originalPrice) > Number(p.price) },
];

const LEVELS = [
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Sold out" },
];

const colorIdsOf = (row) => (row.colorways ?? []).map((c) => c.colorId);
/** Every Subcategory type a row is tagged with, as `<category>:<sub>:<type>` (sub ids repeat across categories). */
const typeKeys = (row) =>
  (row.tags ?? []).flatMap((tag) => {
    const [prefix, subId, typeId] = String(tag).split(":");
    return prefix === "subcat" && typeId ? [`${row.collectionId}:${subId}:${typeId}`] : [];
  });

/** Groups for DashFilters, each option counted over every row. */
export function filterGroups(rows, { categories = [], colors = [], format }) {
  const count = (test) => rows.filter(test).length;
  const withCount = (options, test) =>
    options.map((o) => ({ ...o, count: count((r) => test(r, o.value)) })).filter((o) => o.count > 0);

  const types = categories.flatMap((c) =>
    (c.subcategories ?? []).flatMap((sub) =>
      (sub.types ?? []).map((t) => ({
        value: `${c.id}:${sub.id}:${t.id}`,
        label: `${c.name} · ${t.name}`,
        shortLabel: t.name,
        section: `${c.name} · ${sub.name}`,
      })),
    ),
  );
  const money = (n) => format(n).replace(/[.,]00(?=\D*$)/, "");
  const bandLabel = ({ min, max }) =>
    max === Infinity ? `${money(min)} and over` : min === 0 ? `Under ${money(max)}` : `${money(min)}–${money(max)}`;

  return [
    { id: "category", label: "Category", options: withCount(categories.map((c) => ({ value: c.id, label: c.name })), (r, v) => r.collectionId === v) },
    { id: "type", label: "Type", options: withCount(types, (r, v) => typeKeys(r).includes(v)) },
    {
      id: "color",
      label: "Colour",
      options: withCount(
        [...colors].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ value: c.id, label: c.name, swatch: c.hex })),
        (r, v) => colorIdsOf(r).includes(v),
      ),
    },
    { id: "stock", label: "Stock", options: withCount(LEVELS, (r, v) => r.level === v) },
    { id: "label", label: "Label", options: withCount(LABELS, (r, v) => LABELS.find((l) => l.value === v).test(r)) },
    {
      id: "price",
      label: "Price",
      options: withCount(PRICE_BANDS.map((b) => ({ value: b.value, label: bandLabel(b) })), (r, v) => inBand(r, v)),
    },
  ].filter((g) => g.options.length > 0);
}

function inBand(row, value) {
  const band = PRICE_BANDS.find((b) => b.value === value);
  return Boolean(band) && row.price >= band.min && row.price < band.max;
}

/** Within a group any value matches; across groups every group must. */
export function applyFilters(rows, filters) {
  const tests = {
    category: (r, v) => v.includes(r.collectionId),
    type: (r, v) => typeKeys(r).some((key) => v.includes(key)),
    color: (r, v) => colorIdsOf(r).some((id) => v.includes(id)),
    stock: (r, v) => v.includes(r.level),
    label: (r, v) => LABELS.some((l) => v.includes(l.value) && l.test(r)),
    price: (r, v) => v.some((band) => inBand(r, band)),
  };
  const on = Object.entries(filters).filter(([k, v]) => tests[k] && v?.length);
  return on.length ? rows.filter((r) => on.every(([k, v]) => tests[k](r, v))) : rows;
}
