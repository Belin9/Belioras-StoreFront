/* Payments */
import { getState } from "../store/contentStore";

/**
 * Payments are taken on the server: checkout's payment step is the server's
 * development stand-in for now (production refuses it), and refunds go
 * through the order's refund on the server. What stays here is the list of
 * methods the checkout offers, and `paymentsFor`, which the refund dialog
 * reads from the transactions the dashboard loaded.
 */

/** True while payments are simulated. The storefront says so; switch off once a provider is connected. */
export const PAYMENTS_SIMULATED = true;

export const PAYMENT_METHODS = [
  { id: "card", label: "Card", provider: "stripe", detail: "Visa, Mastercard, American Express" },
  { id: "paypal", label: "PayPal", provider: "paypal", detail: "Pay with your PayPal account" },
];

const round = (n) => Math.round(n * 100) / 100;

/** Money already taken for an order, and already given back. */
export function paymentsFor(orderId) {
  const txns = getState("transactions").items.filter((t) => t.orderId === orderId && t.status === "succeeded");
  const charges = txns.filter((t) => t.type === "charge");
  const charged = round(charges.reduce((s, t) => s + t.amount, 0));
  const refunded = round(txns.filter((t) => t.type === "refund").reduce((s, t) => s + t.amount, 0));
  return { charges, charged, refunded, refundable: round(Math.max(0, charged - refunded)) };
}
