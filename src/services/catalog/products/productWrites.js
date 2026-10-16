/* Catalogue Writes */
import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { normalize } from "./productStore";
import { forgetProduct, mirrorProducts } from "./productSync";
import { audited } from "../../auth/audited";

/**
 * Creating, editing and deleting pieces, on the server (`/products`).
 *
 * The server numbers new pieces, keeps addresses unique, recomputes stock from
 * the colourways and writes the stock history for whatever a save changed —
 * all in one step, so none of that happens here any more. Writes never fall
 * back: a save that did not land has to fail visibly.
 */

const ONE = (id) => resourcePath(routes.products.one, "staff", { id });

/** Only the fields the server accepts, so an extra key from a form never turns a save into a 400. */
const WRITABLE = [
  "name", "slug", "sku", "description", "collectionId", "price", "costPrice", "originalPrice",
  "isNew", "featured", "bestseller", "limited", "status", "colorways", "sizes", "images", "stock",
  "lowStockThreshold", "tags", "modelFit", "details", "materials", "care",
  "isNonReturnable", "hairType", "lengthInInches", "weight",
  // Form-save safety, read by the server and never stored: see updateProduct.
  "ifEditVersion", "stockBase",
];

function body(input) {
  const out = {};
  for (const key of WRITABLE) if (input[key] !== undefined) out[key] = input[key];
  if ("name" in out) out.name = String(out.name ?? "").trim();
  for (const key of ["price", "costPrice", "originalPrice", "stock", "lowStockThreshold"]) {
    if (out[key] !== undefined && out[key] !== null) out[key] = Number(out[key]);
  }
  return out;
}

async function createProduct$raw(input) {
  const payload = body(input);
  if (!payload.name) throw new ApiError("A product needs a name.", 422);
  if (!(payload.price > 0)) throw new ApiError("A product needs a price.", 422);
  const saved = await http.post(resourcePath(routes.products.list, "staff"), payload, { realm: "staff" });
  mirrorProducts([saved]);
  return normalize(saved);
}

async function updateProduct$raw(id, patch) {
  const saved = await http.patch(ONE(id), body(patch), { realm: "staff" });
  mirrorProducts([saved]);
  return normalize(saved);
}

/** Hides the piece. Returned so the caller can offer Undo. */
async function deleteProduct$raw(id) {
  const removed = await http.del(ONE(id), { realm: "staff" });
  forgetProduct(id);
  return removed;
}

/** Brings a deleted piece back, with its id and address, for the Undo on the delete toast. */
async function restoreProduct$raw(product) {
  const restored = await http.post(resourcePath(routes.products.restore, "staff", { id: product.id }), undefined, { realm: "staff" });
  mirrorProducts([restored]);
  return normalize(restored);
}

/* Recorded in the staff activity log. */
export const createProduct = audited("products", ([, ], r) => `Created “${r.name}”`, createProduct$raw);
export const updateProduct = audited("products", ([, patch], r) => `Updated “${r.name}”${patch?.status ? ` (${patch.status})` : ""}`, updateProduct$raw);
export const deleteProduct = audited("products", (_, r) => `Deleted “${r.name}”`, deleteProduct$raw);
export const restoreProduct = audited("products", ([p]) => `Restored “${p?.name ?? "a product"}”`, restoreProduct$raw);
