import { http } from "@/api/client";
import { resourcePath, routes } from "@/api/routes";
import { setState } from "../store/contentStore";
import { refreshProducts } from "../catalog/products/productSync";
import { audited } from "../auth/audited";
import { paymentsFor } from "./paymentsApi";

export { returnableUnits } from "../catalog/inventory/orderStock";
export { getBestSellerProductIds } from "./orderRankings";

/**
 * Orders, on the server (`/orders`, `/checkout`).
 *
 * The server prices every order, holds and moves its stock, numbers its
 * invoice and credit notes, takes the (simulated) payment and queues its
 * emails — this module only asks. Reads check ownership server-side: `as` says
 * what the caller can prove, `{ staff: true }` for the dashboard, `{ userId }`
 * for a signed-in customer, `{ email }` for the public tracker; a wrong guess
 * and a missing order look the same.
 *
 * The dashboard's read of every order is mirrored into the local `orders`
 * domain, which the stock maths ("reserved") and reports read synchronously.
 * A shopper's own orders are never mirrored: the storefront's stock already
 * comes from the server with open orders taken off.
 */

const staffPath = (leaf, params) => resourcePath(leaf, "staff", params);
const shopPath = (leaf, params) => resourcePath(leaf, "customer", params);

function mirrorOrders(items) {
  setState("orders", (state) => ({ ...state, items }), { silent: true });
  return items;
}

function mirrorOrder(order) {
  setState("orders", (state) => {
    const known = state.items.some((o) => o.id === order.id);
    return { ...state, items: known ? state.items.map((o) => (o.id === order.id ? order : o)) : [order, ...state.items] };
  });
  return order;
}

/** A signed-in customer's own orders. No id means signed out: nothing, never everything. */
export async function getOrders(userId) {
  if (!userId) return [];
  return http.get(shopPath(routes.orders.list), { realm: "customer" });
}

/** Every order, for the dashboard and its figures. */
export async function getAllOrders() {
  return mirrorOrders(await http.get(staffPath(routes.orders.list), { realm: "staff" }));
}

/** One order, if the caller may see it (see `as` above). */
export function getOrder(id, as = {}) {
  if (as.staff) return http.get(staffPath(routes.orders.one, { id }), { realm: "staff" });
  return http.get(shopPath(routes.orders.one, { id }), {
    realm: "customer",
    params: as.email ? { email: as.email } : undefined,
  });
}

/** The invoice, or with `creditNumber` a credit note, as printed. */
export function getInvoice(id, as = {}, creditNumber = null) {
  const params = { ...(creditNumber ? { credit: creditNumber } : {}), ...(!as.staff && as.email ? { email: as.email } : {}) };
  return as.staff
    ? http.get(staffPath(routes.orders.invoice, { id }), { realm: "staff", params })
    : http.get(shopPath(routes.orders.invoice, { id }), { realm: "customer", params });
}

/**
 * Places an order, waiting for payment and holding its stock. Only what the
 * shopper chose is sent; `expectedTotal` is what they were shown, and the
 * server refuses the order if its own total differs.
 */
export function createOrder(payload) {
  return http.post(
    shopPath(routes.orders.checkout),
    {
      email: payload.email,
      name: payload.name,
      phone: payload.phone ?? null,
      items: (payload.items ?? []).map(({ productId, quantity, size, color }) => ({
        productId,
        quantity,
        size: size ?? null,
        color: color ?? null,
      })),
      couponCode: payload.couponCode ?? null,
      country: payload.country,
      shippingAddress: payload.shippingAddress,
      expectedTotal: payload.total,
    },
    { realm: "customer" },
  );
}

/** The development payment stand-in: the server charges and confirms at once. Refused in production. */
export function simulatePayment(orderId, { method = "card", email } = {}) {
  return http.post(shopPath(routes.orders.simulatePayment, { id: orderId }), { method, email }, { realm: "customer" });
}

/** What each line is worth after the order's discount, so a refund gives back what was paid for it. */
const round2 = (n) => Math.round(n * 100) / 100;
function paidShare(order, line) {
  const gross = (line.price ?? 0) * (line.quantity ?? 1);
  const ratio = order.subtotal ? Math.max(0, 1 - (order.discount ?? 0) / order.subtotal) : 1;
  return round2(gross * ratio);
}

/**
 * What can still be refunded on an order, per line and in total, for the
 * refund dialog — from the transactions the dashboard loaded. The server works
 * it out again when the refund is made.
 */
export function refundQuote(order) {
  const { charged, refunded, refundable } = paymentsFor(order.id);
  const lines = (order.items ?? []).map((line, index) => ({
    index,
    name: line.name,
    color: line.color,
    size: line.size,
    quantity: line.quantity ?? 1,
    unitPaid: round2(paidShare(order, line) / (line.quantity ?? 1)),
  }));
  return { charged, refunded, refundable, shipping: order.shipping ?? 0, lines };
}

/** After a change that moves stock, the catalogue mirror is refreshed so Inventory shows it. */
async function afterStockChange(result) {
  await refreshProducts().catch(() => null);
  return result;
}

async function refundOrder$raw(id, options = {}) {
  const result = await http.post(staffPath(routes.orders.refund, { id }), options, { realm: "staff" });
  mirrorOrder(result.order);
  return afterStockChange(result);
}

async function cancelOrder$raw(id, { reason } = {}) {
  const result = await http.post(staffPath(routes.orders.cancel, { id }), { reason: reason ?? null }, { realm: "staff" });
  mirrorOrder(result.order);
  return result;
}

/** A customer cancelling their own order, before it ships. Ownership is checked as for reading it. */
export function cancelMyOrder(id, as = {}) {
  return http.post(shopPath(routes.orders.cancel, { id }), as.email ? { email: as.email } : {}, { realm: "customer" });
}

async function updateOrderStatus$raw(id, status, { trackingRef, carrier } = {}) {
  const order = await http.post(
    staffPath(routes.orders.status, { id }),
    { status, trackingRef: trackingRef ?? null, carrier: carrier ?? null },
    { realm: "staff" },
  );
  mirrorOrder(order);
  return afterStockChange(order);
}

async function resendConfirmation$raw(id) {
  return http.post(staffPath(routes.orders.resend, { id }), undefined, { realm: "staff" });
}

/* Recorded in the staff activity log. */
export const updateOrderStatus = audited("orders", ([id, status]) => `Marked order ${id} ${status === "to-review" ? "delivered" : status}`, updateOrderStatus$raw);
export const cancelOrder = audited("orders", ([id], r) => `Cancelled order ${id}${r.creditNote ? ` and refunded €${r.creditNote.amount.toFixed(2)}` : ""}`, cancelOrder$raw);
export const refundOrder = audited("orders", ([id], r) => `Refunded €${r.creditNote.amount.toFixed(2)} on order ${id} (${r.creditNote.number})`, refundOrder$raw);
export const sendReceipt = audited("orders", ([id]) => `Resent the order confirmation for ${id}`, resendConfirmation$raw);
