/* Checkout */
import { createOrder, simulatePayment } from "./ordersApi";

/**
 * Places an order and pays for it, in the order the real flow takes:
 *
 *   1. the server creates the order — priced by the server, waiting for
 *      payment, holding its stock (POST /checkout);
 *   2. the customer pays with the payment provider;
 *   3. the provider tells the server the payment succeeded, and the server
 *      confirms the order — paid, invoiced, confirmation email queued.
 *
 * No provider is connected yet, so (2) and (3) are the server's development
 * stand-in (`simulate-payment`), which production refuses. Connecting Stripe,
 * Mollie or PayPal replaces that call with a redirect to the provider, and the
 * browser then waits for the order to turn paid.
 */
export async function placeOrder(payload, { method = "card" } = {}) {
  const order = await createOrder(payload);
  return simulatePayment(order.id, { method, email: order.email });
}
