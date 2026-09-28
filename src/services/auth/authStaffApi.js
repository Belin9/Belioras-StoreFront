/* Staff Auth — Over Real HTTP */

import { http } from "@/api/client";
import { refreshSession } from "@/api/refresh";
import { accessToken, clearAccessToken, onTokenChange, setAccessToken } from "@/api/tokens";
import { authPath, routes } from "@/api/routes";

/**
 * The atelier door, talking to the real API.
 *
 * Every function names the `staff` realm and the realm is not a parameter. That
 * is not tidiness: the API splits identity spaces by URL (`/admin/*` vs
 * `/storefront/*`) and rejects a cross-realm token with 403, so a caller that
 * could pick its own realm is a caller that can walk a staff token through a
 * shopper endpoint. The realm is fixed here, once.
 *
 * The refresh token is an httpOnly cookie this code can never read — it rides
 * along on `credentials: "include"` and is addressed by the path. That is why
 * the token returned below is the short-lived access token, and why the module
 * keeps it in memory rather than handing it to storage.
 *
 * Deliberately not exported through `authApi.js`: the shopper's mock-backed
 * login lives there under the same names, and one import path per door is what
 * keeps the two implementations from being swapped by accident.
 */

const REALM = "staff";
const path = (name) => authPath(routes.auth[name], REALM);

/** Stores the access token, and mirrors the token store's death to the caller. */
function adoptSession({ accessToken }) {
  setAccessToken(REALM, accessToken ?? null);
  return accessToken ?? null;
}

/**
 * Signs in at the staff door. Returns the server's user, whose `role` is the
 * dashboard role the API assigned — not a role the browser decided.
 *
 * Rejects with a uniform 401 "Invalid email or password." for both an unknown
 * address and a wrong password, so a staff door never reports which emails
 * exist.
 */
export async function staffLogin({ email, password } = {}) {
  const data = await http.post(path("login"), { email, password }, { realm: REALM });
  adoptSession(data);
  return { user: data.user };
}

/**
 * The signed-in administrator, from the server. The boot path calls this after
 * a successful refresh to recover the user a page reload threw away.
 */
export async function staffMe() {
  return http.get(path("me"), { realm: REALM });
}

/**
 * Signs out of this device: drops the server-side session and clears the
 * cookie.
 *
 * The access token is cleared either way, so a failure cannot leave a
 * half-authenticated user behind — but the *error still propagates*, because
 * the httpOnly refresh cookie can only be cleared by the server. If this
 * throws, the server-side session is still live and the next page load will
 * restore it, so the caller is told rather than shown a false confirmation.
 */
export async function staffLogout() {
  try {
    await http.post(path("logout"), null, { realm: REALM });
  } finally {
    clearAccessToken(REALM);
  }
}

/** Signs out everywhere: every session this account has, on every device. */
export async function staffLogoutAll() {
  try {
    await http.post(path("logoutAll"), null, { realm: REALM });
  } finally {
    clearAccessToken(REALM);
  }
}

/**
 * Rebuilds the session after a page load, when the in-memory token is gone and
 * only the httpOnly refresh cookie remains.
 *
 * Rejects on failure so the caller decides what a dead session means — this is
 * the transport's job, not the UI's.
 */
export async function staffRestore() {
  // A token already in hand means the page never actually reloaded, so /me is
  // both cheaper and authoritative.
  if (accessToken(REALM)) return staffMe();

  // A successful refresh returns the user alongside the new token, so the
  // common cold start costs one request rather than two.
  const session = await refreshSession(REALM);
  return session?.user ?? (await staffMe());
}

/**
 * Notifies when this realm's access token appears or is revoked, so a session
 * can end mid-flight — which is the one case the request/response path cannot
 * report, because it happens inside a failed refresh.
 *
 * The realm is filtered here so a caller cannot subscribe to another realm's
 * tokens by accident.
 */
export function onStaffTokenChange(fn) {
  return onTokenChange((realm, token) => {
    if (realm === REALM) fn(Boolean(token));
  });
}

// ---------------------------------------------------------------------------
// Staff management
//
// These two are the first calls from the dashboard that ask the server a
// question the browser used to answer itself. Whether the caller is allowed to
// ask is decided server-side (`requireRole`), not here: the client already knows
// it is super-admin, but that is a reason to render the button, not a reason to
// be trusted with the outcome. A 403 from here is the server disagreeing, and
// the UI must be able to say so rather than silently showing an empty table.
// ---------------------------------------------------------------------------

/**
 * The staff roster, newest first. Members only — no password hashes, no
 * tokenVersion, whatever else is on the row.
 *
 * Deliberately not cached in this module. A roster is the sort of thing that
 * goes stale the moment a colleague is hired, and the caller is expected to put
 * it in React Query where the invalidation story is visible.
 */
export async function listStaff() {
  const data = await http.get(path("staff"), { realm: REALM });
  return data ?? [];
}

/**
 * Creates a staff account with a temporary password chosen by the caller.
 *
 * Returns the new member *and* the temporary password. The password is not
 * retrievable afterwards — only its hash is stored — so this response is the one
 * chance the admin has to write it down, which is why the UI is expected to show
 * it plainly rather than treat it as a secret to be quietly discarded.
 *
 * No session is created for the new account, so the person it is for is the only
 * one who can ever sign in with it.
 */
export async function createStaff({ name, email, role, password } = {}) {
  const data = await http.post(path("staff"), { name, email, role, password }, { realm: REALM });
  return { user: data.user, temporaryPassword: data.temporaryPassword };
}

/**
 * Replaces the signed-in person's own password and clears the
 * temporary-password flag.
 *
 * The refresh cookie rides along on the same request, so the server can keep
 * this device signed in and drop the others. That is the whole point: rotating
 * a password that was handed out must not also sign the person out of the tab
 * they are rotating it in.
 */
export async function changePassword({ currentPassword, newPassword } = {}) {
  return http.post(path("changePassword"), { currentPassword, newPassword }, { realm: REALM });
}
