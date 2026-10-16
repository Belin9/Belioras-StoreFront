/* Catalogue Store Access */
import { getState } from "../../store/contentStore";
import { reservedUnits, variantKey } from "../inventory/variants";
import { expandColorways } from "./productColorways";
import { deriveTags } from "./productSlug";

function catalogItems() {
  return getState("products").items;
}

/**
 * What a shopper can buy, not what is on the shelf: units held by orders not
 * yet shipped are taken off. `stock` and `inventory` are available units, which
 * the storefront, the bag and checkout all read; `onHand` and `reserved` are
 * there for the dashboard. `colorways[].stock` stays on hand, which the product
 * form edits.
 */
function withAvailability(product, expanded) {
  // The public list comes with open orders already taken off; subtracting the
  // (staff-only) orders mirror again would count them twice.
  const reserved = getState("products").realm === "customer" ? new Map() : reservedUnits();
  const held = reserved.get(variantKey(product.id)) ?? 0;
  const onHand = expanded.stock;

  if (!expanded.inventory) {
    return { onHand, reserved: held, stock: Math.max(0, onHand - held) };
  }
  const inventory = Object.fromEntries(
    expanded.colorways.map((w) => [
      w.name,
      Object.fromEntries(
        Object.entries(w.stock ?? {}).map(([size, n]) => [
          size,
          Math.max(0, (Number(n) || 0) - (reserved.get(variantKey(product.id, w.colorId, size)) ?? 0)),
        ]),
      ),
    ]),
  );
  const stock = Object.values(inventory).reduce((sum, sizes) => sum + Object.values(sizes).reduce((a, n) => a + n, 0), 0);
  // Held units per colour id and size, for the product form's stock grid.
  const reservedCells = Object.fromEntries(
    expanded.colorways.map((w) => [
      w.colorId,
      Object.fromEntries(Object.keys(w.stock ?? {}).map((size) => [size, reserved.get(variantKey(product.id, w.colorId, size)) ?? 0])),
    ]),
  );
  return { onHand, reserved: held, stock, inventory, reservedCells };
}

/** Average and count of the published reviews, keyed by product id. Reviews are the one source: a stored rating would drift from them. */
function reviewSummary(productId) {
  const rows = (getState("reviews")?.items ?? []).filter((r) => r.productId === productId && r.status === "published");
  if (!rows.length) return { rating: 0, reviewCount: 0 };
  const total = rows.reduce((sum, r) => sum + r.rating, 0);
  return { rating: Math.round((total / rows.length) * 10) / 10, reviewCount: rows.length };
}

function normalize(product) {
  const expanded = expandColorways(product);
  return {
    ...product,
    status: product.status ?? "active",
    ...reviewSummary(product.id),
    ...expanded,
    ...withAvailability(product, expanded),
    tags: deriveTags(product, expanded.colorFamilies),
  };
}

export { catalogItems, normalize };
