/* Customer Auth — Over Real HTTP */

import { http } from "@/api/client";
import { refreshSession } from "@/api/refresh";
import { accessToken, clearAccessToken, onTokenChange, setAccessToken } from "@/api/tokens";
import { authPath, resourcePath, routes } from "@/api/routes";

/**
 * The shopper's door, talking to the real API — the counterpart of
 * `authStaffApi.js`, with the `customer` realm fixed here so no caller can
 * walk a shopper's token through another boundary.
 *
 * The access token is kept in memory and the refresh token is an httpOnly
 * cookie, so a reload rebuilds the session from the cookie (`customerRestore`).
 */

const REALM = "customer";
const path = (name) => authPath(routes.auth[name], REALM);

function adopt({ accessToken: token }) {
  setAccessToken(REALM, token ?? null);
}

export async function customerLogin({ email, password }) {
  const data = await http.post(path("login"), { email, password }, { realm: REALM });
  adopt(data);
  return { user: data.user };
}

/** Creates the account and signs in. The welcome email is queued by the server. */
export async function customerRegister({ name, email, password }) {
  const data = await http.post(path("register"), { name, email, password }, { realm: REALM });
  adopt(data);
  return { user: data.user };
}

export function customerMe() {
  return http.get(path("me"), { realm: REALM });
}

export async function customerLogout() {
  try {
    await http.post(path("logout"), null, { realm: REALM });
  } finally {
    clearAccessToken(REALM);
  }
}

/** Rebuilds the session after a reload from the refresh cookie. Rejects when there is none. */
export async function customerRestore() {
  if (accessToken(REALM)) return customerMe();
  const session = await refreshSession(REALM);
  return session?.user ?? (await customerMe());
}

/** Name, phone and (with `currentPassword`) email. */
export function customerUpdateProfile(patch) {
  return http.patch(path("me"), patch, { realm: REALM });
}

/** Language, currency and other per-account preferences, merged into what is stored. */
export function customerUpdatePreferences(preferences) {
  return http.patch(path("preferences"), { preferences }, { realm: REALM });
}

export function customerChangePassword({ currentPassword, newPassword }) {
  return http.post(path("changePassword"), { currentPassword, newPassword }, { realm: REALM });
}

/** Always resolves, whether or not the address has an account. */
export function requestPasswordReset(input) {
  const email = typeof input === "string" ? input : input?.email;
  return http.post(path("passwordReset"), { email: String(email ?? "").trim() }, { realm: REALM });
}

/** Sets the new password from the emailed link. Signs the account out everywhere. */
export function confirmPasswordReset({ token, password }) {
  return http.post(path("passwordResetConfirm"), { token, password }, { realm: REALM });
}

/** Shoppers with an account, for the dashboard's Customers page. */
export function listCustomers() {
  return http.get(resourcePath(routes.customers, "staff"), { realm: "staff" });
}

export function onCustomerTokenChange(fn) {
  return onTokenChange((realm, token) => {
    if (realm === REALM) fn(Boolean(token));
  });
}
