/* Inventory API */
import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { DEFAULT_LOW_STOCK, stockLevel, thresholdFor } from "../../../utils/stockLevel";
import { getState, setState } from "../../store/contentStore";
import { colorIndex, colorwaysOf } from "../products/productColorways";
import { mirrorProducts, refreshProducts } from "../products/productSync";
import { REASONS } from "./stockLedger";
import { ANY, isTracked, onHandOf, reservedUnits, variantKey } from "./variants";
import { audited } from "../../auth/audited";

export { REASONS };

/**
 * Stock, on the server: every change updates the product and writes its
 * history in one step, and concurrent changes to the same piece all land.
 *
 * What stays here is what needs the orders, which still live in this browser:
 * "reserved" (units in orders not yet shipped) and the rule that on hand can't
 * drop below it. Those are worked out locally and checked before asking.
 */

/** The shop-wide low-stock line; a product may set its own. Mirrored from the server into settings. */
export function lowStockThreshold() {
  const value = getState("settings").inventory?.lowStockThreshold;
  return Number.isFinite(value) ? value : DEFAULT_LOW_STOCK;
}

/**
 * One row per variant: a piece in one colour and size, with what is on the
 * shelf, what open orders hold, and what is left to sell.
 */
export async function getInventory() {
  await Promise.all([refreshProducts(), getLowStockThreshold().catch(() => null)]);
  const reserved = reservedUnits();
  const { byId } = colorIndex();
  const shop = lowStockThreshold();
  const rows = [];

  for (const product of getState("products").items) {
    const base = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price) || 0,
      cost: Number(product.costPrice) || 0,
      collectionId: product.collectionId,
      threshold: thresholdFor(product, shop),
    };
    const push = (colorId, size, image, held) => {
      const onHand = onHandOf(product, colorId, size);
      const available = Math.max(0, onHand - held);
      const color = byId.get(colorId);
      rows.push({
        ...base,
        id: variantKey(product.id, colorId, size),
        colorId,
        colorName: colorId === ANY ? null : (color?.name ?? colorId),
        hex: color?.hex ?? null,
        size,
        image,
        onHand,
        reserved: held,
        available,
        level: stockLevel(available, base.threshold),
      });
    };

    if (!isTracked(product)) {
      push(ANY, ANY, product.images?.[0] ?? null, reserved.get(variantKey(product.id)) ?? 0);
      continue;
    }
    for (const way of colorwaysOf(product)) {
      const image = way.images?.[0] ?? product.images?.[0] ?? null;
      for (const size of Object.keys(way.stock ?? {})) {
        push(way.colorId, size, image, reserved.get(variantKey(product.id, way.colorId, size)) ?? 0);
      }
    }
  }
  return rows;
}

/**
 * Changes one variant's on hand. `mode` is "add", "remove" or "set". On hand
 * may not drop below what open orders already hold: those pieces are promised.
 * `by` is accepted for the activity log; the server records who from the session.
 */
async function adjustStock$raw({ productId, colorId = ANY, size = ANY, mode, quantity, reason, note }) {
  const product = getState("products").items.find((p) => p.id === productId);
  if (!product) throw new ApiError("That piece no longer exists.", 404);
  const qty = Math.floor(Number(quantity));
  if (!Number.isFinite(qty) || qty < 0 || (mode !== "set" && qty === 0)) {
    throw new ApiError("Enter how many pieces, as a whole number.", 422);
  }
  const before = onHandOf(product, colorId, size);
  const after = mode === "set" ? qty : mode === "remove" ? before - qty : before + qty;
  const reservedMap = reservedUnits();
  const held = colorId === ANY ? (reservedMap.get(variantKey(productId)) ?? 0) : (reservedMap.get(variantKey(productId, colorId, size)) ?? 0);
  if (after < held) {
    throw new ApiError(`${held} ${held === 1 ? "is" : "are"} held by open orders, so on hand can't go below ${held}.`, 409);
  }
  if (after === before) throw new ApiError("That leaves the count unchanged.", 422);

  const { movements, products } = await http.post(
    resourcePath(routes.inventory.adjust, "staff"),
    { productId, colorId, size, mode, quantity: qty, reason: REASONS[reason] ? reason : "adjusted", note: note || null },
    { realm: "staff" },
  );
  mirrorProducts(products);
  return movements[0];
}

/** "Receive stock" for several variants at once: the same number added to each. */
async function receiveStock$raw(variantIds, quantity, { reason = "received", note } = {}) {
  const qty = Math.floor(Number(quantity));
  if (!(qty > 0)) throw new ApiError("Enter how many pieces arrived, as a whole number.", 422);
  const variants = variantIds.map((id) => {
    const [productId, colorId, size] = id.split("|");
    return { productId, colorId, size };
  });
  const { movements, products } = await http.post(
    resourcePath(routes.inventory.receive, "staff"),
    { variants, quantity: qty, reason, note: note || null },
    { realm: "staff" },
  );
  mirrorProducts(products);
  return movements;
}

/** One variant's history, newest first. */
export function getStockHistory(productId, colorId = ANY, size = ANY) {
  return http.get(resourcePath(routes.inventory.movements, "staff"), {
    realm: "staff",
    params: { productId, colorId, size },
  });
}

/** Mirrors the server's line into settings, where `lowStockThreshold()` reads it. */
function mirrorThreshold(value) {
  setState("settings", (s) => ({ ...s, inventory: { ...(s.inventory ?? {}), lowStockThreshold: value } }), {
    silent: value === lowStockThreshold(),
  });
  return value;
}

export async function getLowStockThreshold() {
  try {
    const { lowStockThreshold: value } = await http.get(resourcePath(routes.inventory.settings, "staff"), { realm: "staff" });
    return mirrorThreshold(value);
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) throw err;
    return lowStockThreshold();
  }
}

async function setLowStockThreshold$raw(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0 || n > 999) throw new ApiError("Enter a whole number from 0 to 999.", 422);
  const saved = await http.put(resourcePath(routes.inventory.settings, "staff"), { lowStockThreshold: n }, { realm: "staff" });
  return mirrorThreshold(saved.lowStockThreshold);
}

/* Recorded in the staff activity log. */
export const adjustStock = audited("inventory", ([a]) => `Stock ${a.mode === "set" ? "count set to" : a.mode === "add" ? "added" : "removed"} ${a.quantity} (${a.reason}) for ${a.productId}`, adjustStock$raw);
export const receiveStock = audited("inventory", ([ids, qty]) => `Received ${qty} into each of ${ids.length} variants`, receiveStock$raw);
export const setLowStockThreshold = audited("inventory", ([v]) => `Set the low-stock level to ${v}`, setLowStockThreshold$raw);
