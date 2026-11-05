/* Email Outbox */
import { http } from "@/api/client";
import { resourcePath, routes } from "@/api/routes";
import { getState, setState } from "../store/contentStore";

/**
 * Every email Belioras sends, in one place: the server's outbox.
 *
 * Every flow that emails — orders, accounts, the newsletter, the contact form
 * — queues its message on the server, with the type, the recipient and the
 * facts the template needs. A mail provider (Postmark, Resend, SES…) will send
 * exactly these from a Belioras address; until it is connected the outbox is
 * the record of what would have gone, and the dashboard shows it.
 *
 * The server sends; the payment provider does not. Stripe's own receipt is
 * switched off so a customer gets one Belioras email, not two.
 */
/** False until the backend's mailer is connected; the dashboard says so while it is. */
export const EMAIL_CONNECTED = false;

export const EMAIL_TYPES = {
  "order-confirmation": { label: "Order confirmation", audience: "Customer", when: "Payment succeeded (payment provider webhook). Includes the invoice." },
  "payment-failed": { label: "Payment failed", audience: "Customer", when: "The payment provider reports a failed or expired payment." },
  "order-shipped": { label: "Order shipped", audience: "Customer", when: "Staff mark an order shipped. Includes the carrier and tracking." },
  "order-delivered": { label: "Order delivered", audience: "Customer", when: "The order is marked delivered. Invites a review." },
  "order-cancelled": { label: "Order cancelled", audience: "Customer", when: "An order is cancelled, by the customer or by staff." },
  refund: { label: "Refund", audience: "Customer", when: "A refund is made. Includes the credit note." },
  welcome: { label: "Welcome", audience: "Customer", when: "A customer creates an account." },
  "password-reset": { label: "Password reset", audience: "Customer or staff", when: "Someone asks to reset their password." },
  "newsletter-confirm": { label: "Confirm your subscription", audience: "Subscriber", when: "Someone signs up to the Letter (double opt-in)." },
  "newsletter-welcome": { label: "Newsletter welcome", audience: "Subscriber", when: "A subscription is confirmed. Carries the welcome code." },
  campaign: { label: "Newsletter campaign", audience: "Subscribers", when: "A campaign is sent." },
  "contact-received": { label: "Contact message", audience: "Client care", when: "A shopper writes through the contact form." },
};

/**
 * The outbox, newest first. Mirrored locally so an order's own timeline
 * (`emailsForOrder`) can answer synchronously once the dashboard has loaded it;
 * if the server cannot be reached, the last mirror shows.
 */
export async function getEmails() {
  try {
    const items = await http.get(resourcePath(routes.emails, "staff"), { realm: "staff" });
    setState("emails", (state) => ({ ...state, items }), { silent: true });
  } catch {
    // Unreachable: show the last list this browser saw.
  }
  return getState("emails").items.map((e) => ({ ...e }));
}

/** One order's emails, oldest first — for the order's own timeline. */
export function emailsForOrder(orderId) {
  return getState("emails").items.filter((e) => e.orderId === orderId).slice().reverse();
}
