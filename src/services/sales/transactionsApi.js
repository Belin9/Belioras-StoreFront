import { http } from "@/api/client";
import { resourcePath, routes } from "@/api/routes";
import { setState } from "../store/contentStore";

/**
 * Transactions: every movement of money against an order, from the server,
 * shaped for the dashboard (customer joined from the order, a charge's status
 * reflecting the refunds made against it).
 *
 * Read-only: money moves through an order's payment and refund on the server.
 * The full list is mirrored locally, because the refund dialog works out
 * what is still refundable from it before asking.
 */

export async function getTransactions() {
  const items = await http.get(resourcePath(routes.transactions, "staff"), { realm: "staff" });
  setState("transactions", (state) => ({ ...state, items }), { silent: true });
  return items;
}

export function getTransactionsForOrder(orderId) {
  return http.get(resourcePath(routes.transactions, "staff"), { realm: "staff", params: { orderId } });
}
