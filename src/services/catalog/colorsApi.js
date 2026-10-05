import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { getState, setState } from "../store/contentStore";
import { colorIndex, colorwaysOf } from "./products/productColorways";
import { catalogItems } from "./products/productStore";
import { audited } from "../auth/audited";

/**
 * The colour list: a boutique name, a swatch, and the shop filter family.
 *
 * Lives on the server (`/taxonomy/colors`). A colour's id is fixed when it is
 * created and the server never reissues a deleted one: products store their
 * colourways by id, so a rename reaches every product carrying the colour.
 *
 * ## The local `colors` domain is a mirror
 *
 * Every product read resolves its colourways synchronously through
 * `colorIndex()`, so the list has to be in hand before any of them run. Every
 * API read and write is written into the domain, and `syncColors()` runs once
 * at start-up so the storefront picks up the server's list. A read only
 * announces itself (bumping the content version) when the list actually
 * changed — pages keyed on that version re-read, and a read that always
 * announced itself would loop.
 *
 * Reads fall back to the mirror (which starts as the bundled seed). Writes never
 * fall back. The "still on a product" delete guard stays here, because products
 * still live in this browser.
 */

const HEX = /^#[0-9a-f]{6}$/i;
const ONE = (id) => resourcePath(routes.taxonomy.color, "staff", { id });

function colorItems() {
  return getState("colors").items;
}

const byName = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name));

function usable(list) {
  return Array.isArray(list) && list.every((c) => c && typeof c.id === "string" && typeof c.name === "string");
}

/** Writes the server's list into the mirror; notifies only if something changed (or `notify` forces it). */
function mirror(items, { notify = false } = {}) {
  const changed = JSON.stringify(items) !== JSON.stringify(colorItems());
  setState("colors", (state) => ({ ...state, items }), { silent: !(notify || changed) });
  return items;
}

/** Every colour, A–Z. `realm` picks the boundary, as in `getCategories`. */
export async function getColors({ realm = "customer" } = {}) {
  try {
    const items = await http.get(resourcePath(routes.taxonomy.colors, realm), { realm });
    if (!usable(items)) throw new ApiError("The colour list came back incomplete.", 502);
    return [...mirror(items)];
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) throw err;
    return byName(colorItems());
  }
}

/** The dashboard's read. A named function so `useAsyncData` keys it apart from the storefront's. */
export function getStaffColors() {
  return getColors({ realm: "staff" });
}

/** Refreshes the mirror once at start-up. Never throws: the mirror already holds a usable list. */
export function syncColors() {
  return getColors().catch(() => null);
}

/** How many products carry each colour, keyed by colour id. */
export async function colorUsage() {
  const index = colorIndex();
  const counts = {};
  for (const product of catalogItems()) {
    for (const way of colorwaysOf(product, index)) {
      counts[way.colorId] = (counts[way.colorId] ?? 0) + 1;
    }
  }
  return counts;
}

/** Friendly messages before the request; the server checks the same rules again. */
function toBody({ name, hex, family } = {}) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) throw new ApiError("Give the colour a name.", 422);
  if (!HEX.test(String(hex ?? ""))) throw new ApiError("Choose a swatch, as a hex code like #120700.", 422);
  if (!family) throw new ApiError("Choose which shop filter the colour belongs to.", 422);
  return { name: trimmed, hex: hex.toUpperCase(), family };
}

function upsertMirror(color) {
  const items = colorItems();
  const exists = items.some((c) => c.id === color.id);
  return mirror(byName(exists ? items.map((c) => (c.id === color.id ? color : c)) : [...items, color]), { notify: true });
}

async function createColor$raw(input) {
  const saved = await http.post(resourcePath(routes.taxonomy.colors, "staff"), toBody(input), { realm: "staff" });
  upsertMirror(saved);
  return saved;
}

async function updateColor$raw(id, input) {
  if (!colorItems().some((c) => c.id === id)) throw new ApiError("That colour no longer exists.", 404);
  const saved = await http.patch(ONE(id), toBody(input), { realm: "staff" });
  upsertMirror(saved);
  return saved;
}

async function deleteColor$raw(id) {
  const color = colorItems().find((c) => c.id === id);
  if (!color) throw new ApiError("That colour no longer exists.", 404);

  const index = colorIndex();
  const using = catalogItems().filter((p) => colorwaysOf(p, index).some((w) => w.colorId === id));
  if (using.length) {
    const names = using.slice(0, 3).map((p) => p.name).join(", ");
    throw new ApiError(
      `${color.name} is on ${using.length} ${using.length === 1 ? "product" : "products"} (${names}${using.length > 3 ? "…" : ""}). Remove it from them first.`,
      409,
    );
  }

  const deleted = await http.del(ONE(id), { realm: "staff" });
  mirror(colorItems().filter((c) => c.id !== id), { notify: true });
  return deleted;
}

/** Puts the shipped colours back. */
async function resetColors$raw() {
  const items = await http.post(resourcePath(routes.taxonomy.colorsReset, "staff"), undefined, { realm: "staff" });
  return mirror(items, { notify: true });
}

/* Recorded in the staff activity log. */
export const createColor = audited("categories", (_, r) => `Added colour ${r.name}`, createColor$raw);
export const updateColor = audited("categories", (_, r) => `Updated colour ${r.name}`, updateColor$raw);
export const deleteColor = audited("categories", (_, r) => `Deleted colour ${r.name}`, deleteColor$raw);
export const resetColors = audited("categories", () => "Reset colours to defaults", resetColors$raw);
