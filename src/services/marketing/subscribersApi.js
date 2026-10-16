import { http } from "@/api/client";
import { resourcePath } from "@/api/routes";
import { audited } from "../auth/audited";

/**
 * The Belioras Letter's audience, on the server, with the rules an email
 * service applies: double opt-in (a sign-up stays `pending` until its
 * confirmation link is followed), consent recorded with its wording, the
 * welcome code sent once per address, unsubscribing keeps the record and
 * erasure deletes it. The confirmation and welcome emails are queued there.
 */

const shop = (path) => resourcePath(path, "customer");
const staff = (path) => resourcePath(path, "staff");

/** Starts, or restarts, a sign-up. Signed in, the subscription is linked to the account by the server. */
export function subscribe({ email, name = null, source = "footer" } = {}) {
  return http.post(shop("newsletter/subscribe"), { email: String(email ?? "").trim(), name, source }, { realm: "customer" });
}

/** The confirmation link. Subscribes the address and, the first time, issues the welcome code. */
export function confirmSubscription(token) {
  return http.post(shop("newsletter/confirm"), { token }, { realm: "customer" });
}

/** The link in every email. */
export function unsubscribe(token) {
  return http.post(shop("newsletter/unsubscribe"), { token }, { realm: "customer" });
}

/** From a signed-in customer's account settings: their own address, as the server knows it. */
export function unsubscribeByEmail() {
  return http.post(shop("newsletter/unsubscribe-me"), undefined, { realm: "customer" });
}

/** A signed-in customer's own subscription, or null. */
export function getSubscription(email) {
  if (!email) return Promise.resolve(null);
  return http.get(shop("newsletter/subscription"), { realm: "customer" });
}

export function getSubscribers() {
  return http.get(staff("newsletter/subscribers"), { realm: "staff" });
}

/** From the dashboard: stops all email to this person straight away. */
const unsubscribeSubscriber$raw = (id) => http.post(staff(`newsletter/subscribers/${encodeURIComponent(id)}/unsubscribe`), undefined, { realm: "staff" });

/** A GDPR erasure: the address and its consent record are deleted entirely. */
const eraseSubscriber$raw = (id) => http.del(staff(`newsletter/subscribers/${encodeURIComponent(id)}`), { realm: "staff" });

/* Recorded in the staff activity log. */
export const unsubscribeSubscriber = audited("newsletter", ([id]) => `Unsubscribed subscriber ${id}`, unsubscribeSubscriber$raw);
export const eraseSubscriber = audited("newsletter", ([id]) => `Erased subscriber ${id}`, eraseSubscriber$raw);
