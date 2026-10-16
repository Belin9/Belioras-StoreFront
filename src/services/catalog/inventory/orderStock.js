/* Orders And Stock */
import { normalizeStatus } from "../../../utils/orderStatus";
import { isHolding } from "./variants";

/**
 * What an order does to stock, Shopify's way — applied on the server now, in
 * the order flows:
 *
 *   placed (to pay / to ship)  holds the units: available drops, on hand does not
 *   shipped                    takes them off the shelf: on hand drops, once
 *   cancelled before shipping  nothing to undo; the hold simply ends
 *   cancelled / refunded after shipping
 *                              on hand rises again only if the pieces came back
 *
 * What stays here is the question the dashboard asks before a cancel.
 */

const ENDED = new Set(["cancelled", "refunded"]);

/** How many pieces a shipped order would put back, for the question asked before cancelling it. */
export function returnableUnits(order) {
  const status = normalizeStatus(order?.status);
  if (!order || isHolding(status) || ENDED.has(status) || order.stockReturnedAt) return 0;
  return (order.items ?? []).reduce((sum, line) => sum + (Number(line.quantity) || 1), 0);
}
