import { ApiError, mockApi } from "@/api/mock";
import { getState, setState } from "../store/contentStore";
import { nextStatuses, normalizeStatus } from "../../utils/orderStatus";
import { assertCouponRedeemable } from "./couponsApi";
import { availabilityProblems, stockChangesForStatus } from "../catalog/inventory/orderStock";
import { applyStockChanges } from "../catalog/inventory/stockLedger";
import { audited } from "../auth/audited";
import { queueEmail } from "../notifications/emailsApi";
import { paymentsFor, refund as refundPayment } from "./paymentsApi";
import { returnLine } from "../catalog/inventory/orderStock";

export { returnableUnits } from "../catalog/inventory/orderStock";
export { getBestSellerProductIds } from "./orderRankings";

/**
 * Orders, read and written through the content store.
 *
 * Previously a module-level `let orders = [...seed]`, so an order placed at
 * checkout or a status changed in the dashboard survived exactly until the
 * next reload. Same reasoning as the catalogue: a getter, not a captured
 * value, because setState replaces the domain object.
 */

function orderItems() {
  return getState("orders").items;
}

function nextOrderNumber(items) {

  const highest = items.reduce((max, o) => {

    const n = Number(String(o.id).replace(/\D/g, "")) || 0;
    return n > max ? n : max;
  }, 1000);
  return highest + 1;
}

export function getOrders(userId) {
  return mockApi(() => {
    // An absent userId must return nothing rather than everything — this is
    // the guard between "signed out" and "here is the whole store's history".
    if (!userId) return [];
    return orderItems()
      .filter((o) => o.userId === userId)
      .map((o) => ({ ...o }));
  });
}

/** Every order, regardless of customer. Used for store-wide aggregates. */
export function getAllOrders() {
  return mockApi(() => orderItems().map((o) => ({ ...o })));
}

/**
 * Fetch one order, with an ownership check.
 *
 * This previously took only an id and applied no check at all, while
 * /order-tracking is public — so anyone could walk ORD-1001, ORD-1002 … and
 * read a stranger's items, totals and delivery address. The reference alone is
 * guessable and is therefore not a credential.
 *
 * `as` is what the caller can prove: `{ userId }` for a signed-in customer,
 * `{ email }` for the public tracker, `{ staff: true }` for the dashboard.
 * The mismatch and the missing-order cases deliberately return the same error,
 * so the response cannot be used to confirm that a reference exists.
 */

export function getOrder(id, as = {}) {
  return mockApi(() => {

    const notFound = new ApiError("No order matches those details.", 404);

    const order = orderItems().find((o) => o.id === id);
    if (!order) throw notFound;

    if (as.staff) return { ...order };
    if (as.userId && order.userId === as.userId) return { ...order };
    if (as.email && order.email?.toLowerCase() === String(as.email).toLowerCase()) {
      return { ...order };
    }

    throw notFound;
  });
}

export function createOrder(payload) {
  return mockApi(() => {

    // Refused rather than oversold: another shopper may have taken the last
    // one since this bag was filled.
    const problems = availabilityProblems(payload.items ?? []);
    if (problems.length) throw new ApiError(problems.join(" "), 409);

    // The last use of a code may have gone since it was applied.
    if (payload.couponCode) {
      assertCouponRedeemable(payload.couponCode, payload.subtotal ?? 0, { userId: payload.userId, email: payload.email });
    }

    const now = new Date().toISOString();

    const items = orderItems();

    const order = {
      id: `ORD-${nextOrderNumber(items)}`,
      userId: payload.userId ?? null,
      email: payload.email ?? null,
      name: payload.name ?? null,
      items: payload.items ?? [],
      subtotal: payload.subtotal ?? 0,
      discount: payload.discount ?? 0,
      shipping: payload.shipping ?? 0,
      tax: payload.tax ?? 0,
      total: payload.total ?? 0,
      couponCode: payload.couponCode ?? null,
      shippingAddress: payload.shippingAddress ?? null,
      status: "to-pay",
      createdAt: now,
      updatedAt: now,
    };

    setState("orders", (state) => ({ ...state, items: [order, ...state.items] }));
    return { ...order };
  }, 400);
}

/** The next number in this year's sequence: BEL-2026-0012. Never reused, never skipped. */
function nextInvoiceNumber() {
  const prefix = getState("settings").invoice?.prefix || "INV";
  const year = new Date().getFullYear();
  const stem = `${prefix}-${year}-`;
  const highest = orderItems().reduce((max, o) => {
    const n = String(o.invoiceNumber ?? "").startsWith(stem) ? Number(o.invoiceNumber.slice(stem.length)) : 0;
    return Math.max(max, n || 0);
  }, 0);
  return `${stem}${String(highest + 1).padStart(4, "0")}`;
}

/**
 * Everything an invoice prints: the seller from Settings, the buyer, each line
 * with its net price and VAT, and the totals. VAT is included in Belioras's
 * prices, so it is worked out of them, at the rate in Settings. Readable by
 * staff, or by the customer the order belongs to.
 */
export function getInvoice(id, as = {}, creditNumber = null) {
  return mockApi(async () => {
    const order = await getOrder(id, as);
    if (!order.invoiceNumber) throw new ApiError("This order has no invoice yet: one is issued when payment is confirmed.", 409);
    const settings = getState("settings");
    const rate = settings.tax?.rate ?? 0;
    const net = (gross) => Math.round((gross / (1 + rate)) * 100) / 100;
    const seller = {
      name: settings.gpsr?.manufacturer ?? "Belioras",
      address: settings.gpsr?.address ?? settings.contact?.boutique ?? "",
      email: settings.contact?.support ?? "",
      vatId: settings.invoice?.vatId ?? "",
      taxNumber: settings.invoice?.taxNumber ?? "",
      note: settings.invoice?.note ?? "",
    };

    // A credit note: the refunded lines, as negatives, against the invoice it corrects.
    if (creditNumber) {
      const cn = (order.creditNotes ?? []).find((c) => c.number === creditNumber);
      if (!cn) throw new ApiError("No credit note with that number on this order.", 404);
      const lines = cn.lines.map((l) => ({ ...l, price: -(l.gross / (l.quantity || 1)), gross: -l.gross, net: -net(l.gross) }));
      if (cn.shipping) lines.push({ name: "Shipping", quantity: 1, price: -cn.shipping, gross: -cn.shipping, net: -net(cn.shipping) });
      const covered = lines.reduce((s, l) => s + l.gross, 0);
      const rest = Math.round((-cn.amount - covered) * 100) / 100;
      if (Math.abs(rest) >= 0.01) lines.push({ name: "Adjustment", quantity: 1, price: rest, gross: rest, net: net(rest) });
      const vat = Math.round((cn.amount - net(cn.amount)) * 100) / 100;
      return {
        kind: "credit",
        creditNote: cn,
        order,
        seller,
        rate,
        lines,
        totals: { net: -net(cn.amount), vat: -vat, gross: -cn.amount },
      };
    }

    const lines = (order.items ?? []).map((i) => {
      const gross = (i.price ?? 0) * (i.quantity ?? 1);
      return { ...i, gross, net: net(gross) };
    });
    if (order.discount) lines.push({ name: `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, quantity: 1, price: -order.discount, gross: -order.discount, net: -net(order.discount) });
    if (order.shipping) lines.push({ name: "Shipping", quantity: 1, price: order.shipping, gross: order.shipping, net: net(order.shipping) });
    const total = order.total ?? 0;
    return {
      kind: "invoice",
      order,
      seller,
      rate,
      lines,
      totals: { net: Math.round((total - (order.tax ?? 0)) * 100) / 100, vat: order.tax ?? 0, gross: total },
    };
  }, 0);
}

const round2 = (n) => Math.round(n * 100) / 100;

function writeOrder(updated) {
  setState("orders", (state) => ({ ...state, items: state.items.map((o) => (o.id === updated.id ? updated : o)) }));
  return updated;
}

function findOrder(id) {
  const order = orderItems().find((o) => o.id === id);
  if (!order) throw new ApiError("Order not found.", 404);
  return order;
}

/* ------------------------------------------------------------ Payment ---- */

/**
 * Payment succeeded — what the server's payment webhook does, and the only
 * way an order becomes paid. It gets its invoice number, once and in sequence
 * as German invoicing requires, and the customer is sent the order
 * confirmation with the invoice. Staff never mark an order paid.
 */
export function confirmPayment(orderId, charge) {
  const order = findOrder(orderId);
  if (normalizeStatus(order.status) !== "to-pay") return order;
  const now = new Date().toISOString();
  const updated = writeOrder({
    ...order,
    status: "to-ship",
    paidAt: now,
    paymentMethod: charge?.method?.type ?? null,
    invoiceNumber: order.invoiceNumber ?? nextInvoiceNumber(),
    updatedAt: now,
  });
  queueEmail({
    type: "order-confirmation",
    to: updated.email,
    subject: `Your Belioras order ${updated.id} is confirmed`,
    orderId: updated.id,
    data: { invoiceNumber: updated.invoiceNumber, total: updated.total },
  });
  return updated;
}

/** Payment failed or expired, as the webhook reports it: the order waits, and the customer is told. */
export function failPayment(orderId, reason = "The payment was declined.") {
  const order = findOrder(orderId);
  queueEmail({ type: "payment-failed", to: order.email, subject: `Payment for your Belioras order ${order.id} didn't go through`, orderId: order.id, data: { reason } });
  return order;
}

/* --------------------------------------------------------- Credit notes -- */

function nextCreditNoteNumber() {
  const prefix = getState("settings").invoice?.prefix || "INV";
  const stem = `${prefix}-CN-${new Date().getFullYear()}-`;
  const highest = orderItems()
    .flatMap((o) => o.creditNotes ?? [])
    .reduce((max, cn) => Math.max(max, cn.number.startsWith(stem) ? Number(cn.number.slice(stem.length)) || 0 : 0), 0);
  return `${stem}${String(highest + 1).padStart(4, "0")}`;
}

/** What each line is worth after the order's discount, so a refund gives back what was paid for it. */
function paidShare(order, line) {
  const gross = (line.price ?? 0) * (line.quantity ?? 1);
  const ratio = order.subtotal ? Math.max(0, 1 - (order.discount ?? 0) / order.subtotal) : 1;
  return round2(gross * ratio);
}

/** What can still be refunded on an order, per line and in total, for the refund dialog. */
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

/**
 * Gives money back — the whole order or part of it — and issues a credit note,
 * since an invoice, once issued, is never edited. `lines` picks what is being
 * refunded ([{ index, quantity }]); `amount` may override the total. Pieces
 * that came back can go back into stock. A refund that leaves nothing paid
 * closes the order: "cancelled" if it never shipped, "refunded" if it had.
 */
async function applyRefund(order, { lines = [], includeShipping = false, amount = null, reason = "", restock = false, by = null, cancel = false } = {}) {
  const { refundable } = paymentsFor(order.id);
  if (refundable <= 0) throw new ApiError("Nothing is left to refund on this order.", 409);

  const chosen = lines
    .map(({ index, quantity }) => ({ line: order.items[index], index, quantity: Math.min(Number(quantity) || 0, order.items[index]?.quantity ?? 1) }))
    .filter((c) => c.line && c.quantity > 0);
  const fromLines = chosen.reduce((s, c) => s + (paidShare(order, c.line) / (c.line.quantity ?? 1)) * c.quantity, 0);
  const suggested = round2(fromLines + (includeShipping ? order.shipping ?? 0 : 0));
  const total = round2(amount === null || amount === "" ? suggested : Number(amount));

  if (!(total > 0)) throw new ApiError("Choose what to refund, or enter an amount.", 422);
  if (total > refundable + 0.001) throw new ApiError(`At most €${refundable.toFixed(2)} can be refunded on this order.`, 422);

  // Pieces only go back on the shelf if they had left it. Done before the
  // money moves: stock is on the server now, and a refund whose restock
  // failed should stop here rather than leave the shelf short.
  if (restock && order.stockDeductedAt && chosen.length) {
    const products = new Map(getState("products").items.map((p) => [p.id, p]));
    await applyStockChanges(
      chosen
        .filter((c) => products.has(c.line.productId))
        .map((c) => ({ ...returnLine(order, c.line, c.quantity, by) })),
    );
  }

  const txn = refundPayment(order.id, total, reason);

  const creditNote = {
    number: nextCreditNoteNumber(),
    at: new Date().toISOString(),
    amount: total,
    reason: reason || null,
    shipping: includeShipping ? order.shipping ?? 0 : 0,
    lines: chosen.map((c) => ({ name: c.line.name, color: c.line.color, size: c.line.size, quantity: c.quantity, gross: round2((paidShare(order, c.line) / (c.line.quantity ?? 1)) * c.quantity) })),
    transactionId: txn?.id ?? null,
  };

  const left = round2(refundable - total);
  const status = normalizeStatus(order.status);
  const nextStatus = left <= 0 || cancel ? (order.stockDeductedAt ? "refunded" : "cancelled") : status;
  const updated = writeOrder({
    ...order,
    status: nextStatus,
    creditNotes: [...(order.creditNotes ?? []), creditNote],
    updatedAt: new Date().toISOString(),
  });

  queueEmail({
    type: "refund",
    to: order.email,
    subject: `Your refund for Belioras order ${order.id}`,
    orderId: order.id,
    data: { amount: total, creditNote: creditNote.number },
  });
  if (nextStatus === "cancelled" && status !== "cancelled") {
    queueEmail({ type: "order-cancelled", to: order.email, subject: `Your Belioras order ${order.id} is cancelled`, orderId: order.id, data: { refunded: total } });
  }
  return { order: updated, creditNote };
}

function refundOrder$raw(id, options = {}, by = null) {
  return mockApi(() => {
    const order = findOrder(id);
    const status = normalizeStatus(order.status);
    if (!["to-ship", "shipped", "to-review", "reviewed", "refunded"].includes(status)) {
      throw new ApiError("Only a paid order can be refunded.", 409);
    }
    return applyRefund(order, { ...options, by });
  });
}

/* ----------------------------------------------------------- Transitions -- */

/**
 * Cancels an order before it ships. Unpaid, it is simply cancelled; paid, the
 * whole amount goes back first, with a credit note. Used by staff and, for
 * their own orders, by customers.
 */
function cancel(order, { reason, by }) {
  const status = normalizeStatus(order.status);
  if (status === "to-pay") {
    const updated = writeOrder({ ...order, status: "cancelled", cancelReason: reason ?? null, updatedAt: new Date().toISOString() });
    queueEmail({ type: "order-cancelled", to: order.email, subject: `Your Belioras order ${order.id} is cancelled`, orderId: order.id, data: { refunded: 0 } });
    return { order: updated, creditNote: null };
  }
  if (status === "to-ship") {
    return applyRefund(order, {
      lines: order.items.map((line, index) => ({ index, quantity: line.quantity ?? 1 })),
      includeShipping: true,
      reason: reason || "Order cancelled before shipping",
      by,
      cancel: true,
    });
  }
  throw new ApiError("An order that has shipped can't be cancelled. Refund it once the pieces are back.", 409);
}

function cancelOrder$raw(id, { reason, by } = {}) {
  return mockApi(() => cancel(findOrder(id), { reason, by }));
}

/** A customer cancelling their own order, before it ships. Ownership is checked as for reading it. */
export function cancelMyOrder(id, as = {}) {
  return mockApi(() => {
    const order = findOrder(id);
    const mine = (as.userId && order.userId === as.userId) || (as.email && order.email?.toLowerCase() === String(as.email).toLowerCase());
    if (!mine) throw new ApiError("No order matches those details.", 404);
    return cancel(order, { reason: "Cancelled by the customer", by: "Customer" });
  });
}

/**
 * Moves a paid order along: shipped, then delivered. Payment, cancellation and
 * refunds each have their own flow above, so none of them can be done by
 * setting a status.
 */
function updateOrderStatus$raw(id, status, { by = null, trackingRef, carrier } = {}) {
  return mockApi(async () => {
    const canonical = normalizeStatus(status);
    if (!canonical) throw new ApiError(`Unknown order status: ${status}`, 422);
    const order = findOrder(id);
    const from = normalizeStatus(order.status);

    if (canonical === "to-ship") throw new ApiError("An order is marked paid by the payment provider when payment succeeds, never by hand.", 409);
    if (canonical === "cancelled" || canonical === "refunded") throw new ApiError("Use Cancel or Refund on the order, so the payment is handled too.", 409);
    if (!nextStatuses(from).includes(canonical)) throw new ApiError(`An order that is ${from} can't become ${canonical}.`, 409);

    // Shipping takes the pieces off the shelf.
    // On the server; if it fails the order stays as it was, so it can be retried.
    const { changes, patch } = stockChangesForStatus(order, canonical, { by });
    await applyStockChanges(changes);

    const updated = writeOrder({
      ...order,
      ...patch,
      status: canonical,
      updatedAt: new Date().toISOString(),
      ...(canonical === "shipped" ? { shippedAt: new Date().toISOString() } : {}),
      ...(canonical === "to-review" ? { deliveredAt: new Date().toISOString() } : {}),
      ...(trackingRef ? { trackingRef } : {}),
      ...(carrier ? { carrier } : {}),
    });

    if (canonical === "shipped") {
      queueEmail({ type: "order-shipped", to: order.email, subject: `Your Belioras order ${order.id} is on its way`, orderId: order.id, data: { carrier: updated.carrier ?? null, trackingRef: updated.trackingRef ?? null } });
    }
    if (canonical === "to-review") {
      queueEmail({ type: "order-delivered", to: order.email, subject: `Your Belioras order ${order.id} has arrived`, orderId: order.id });
    }
    return updated;
  });
}

/** Sends the order confirmation, with its invoice, again. */
function resendConfirmation$raw(id) {
  return mockApi(() => {
    const order = findOrder(id);
    if (!order.invoiceNumber) throw new ApiError("There is nothing to resend until payment is confirmed.", 409);
    return queueEmail({ type: "order-confirmation", to: order.email, subject: `Your Belioras order ${order.id} is confirmed`, orderId: order.id, data: { invoiceNumber: order.invoiceNumber, resent: true } });
  });
}

/* Checked against the signed-in person's Orders access, and recorded in the activity log. */
export const updateOrderStatus = audited("orders", ([id, status]) => `Marked order ${id} ${status === "to-review" ? "delivered" : status}`, updateOrderStatus$raw);
export const cancelOrder = audited("orders", ([id], r) => `Cancelled order ${id}${r.creditNote ? ` and refunded €${r.creditNote.amount.toFixed(2)}` : ""}`, cancelOrder$raw);
export const refundOrder = audited("orders", ([id], r) => `Refunded €${r.creditNote.amount.toFixed(2)} on order ${id} (${r.creditNote.number})`, refundOrder$raw);
export const sendReceipt = audited("orders", ([id]) => `Resent the order confirmation for ${id}`, resendConfirmation$raw);
