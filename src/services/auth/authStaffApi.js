/* Staff Auth — Over Real HTTP */

import { http } from "@/api/client";
import { clearAccessToken, setAccessToken } from "@/api/tokens";
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
