/* Stock Ledger */
import { http } from "@/api/client";
import { resourcePath, routes } from "@/api/routes";
import { mirrorProducts } from "../products/productSync";
import { ANY } from "./variants";

/** Why stock changed. Only these reach the history. */
export const REASONS = {
  received: "Received",
  adjusted: "Adjusted",
  counted: "Stock count",
  damaged: "Damaged or lost",
  sold: "Shipped to a customer",
  returned: "Returned to stock",
};

/**
 * Applies what an order does to the shelf, on the server, which updates the
 * products and writes the history in one step.
 *
 * `changes`: `[{ productId, colorId, size, delta, reason, orderId }]`, as
 * `stockChangesForStatus` and `returnLine` build them — all for one order and
 * one reason ("sold" takes units off, "returned" puts them back). A change of
 * 0 is dropped. Returns the movements written.
 *
 * Goes through the orders edge rather than the general one, so anyone who may
 * handle orders can ship one without being able to edit stock by hand. The
 * server refuses taking an order's pieces off twice.
 */
export async function applyStockChanges(changes) {
  const real = changes.filter((c) => Number(c.delta) !== 0);
  if (!real.length) return [];
  const [{ orderId, reason }] = real;

  const { movements, products } = await http.post(
    resourcePath(routes.inventory.orderMovements, "staff"),
    {
      orderId,
      reason,
      lines: real.map((c) => ({
        productId: c.productId,
        colorId: c.colorId ?? ANY,
        size: c.size ?? ANY,
        quantity: Math.abs(Number(c.delta)),
      })),
    },
    { realm: "staff" },
  );
  mirrorProducts(products);
  return movements;
}
