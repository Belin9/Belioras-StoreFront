/* Access Token Refresh */
import { apiUrl } from "./config";
import { apiErrorFromBody } from "./error";
import { clearAccessToken, setAccessToken } from "./tokens";
import { authPath, routes } from "./routes";

/**
 * One refresh per realm at a time.
 *
 * A page that fires four requests on mount would otherwise send four refreshes
 * against the same cookie. The server rotates refresh tokens, so the three
 * that lose the race present a token that has already been spent — and a spent
 * token is indistinguishable from a stolen one, which revokes every session
 * the user has. Deduping here is what keeps a normal page load from looking
 * like an attack.
 */

const pending = new Map();

export function refreshSession(realm) {
  if (!pending.has(realm)) {
    pending.set(
      realm,
      run(realm).finally(() => pending.delete(realm)),
    );
  }
  return pending.get(realm);
}

async function run(realm) {
  // The refresh token is an httpOnly cookie, so it is never read here — it
  // rides along because of `credentials`. The realm travels in the path
  // (/storefront/auth/refresh vs /admin/auth/refresh) and in the cookie name
  // itself, so no header is needed to pick which cookie to honour.
  const response = await fetch(apiUrl(authPath(routes.auth.refresh, realm)), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const error = apiErrorFromBody(response.status, body);
    /**
     * Only a *refusal* ends the session.
     *
     * Clearing the token on every failure is what turned a throttled refresh
     * into a sign-out: the limiter answered 429, this cleared the token, the
     * session took the cleared token as a revocation, and the dashboard sent
     * the person to the sign-in page — where login was itself throttled, so
     * there was no way back until the window rolled over.
     *
     * 401 and 403 are the server saying this session is gone, and only then has
     * the token served its purpose. A 429 is "not yet", a 5xx is "not the
     * server's fault", and neither means the person should be logged out — the
     * cookie is still good and the next attempt will use it.
     */
    if (error.status === 401 || error.status === 403) clearAccessToken(realm);
    throw error;
  }

  const session = body?.data ?? body;
  setAccessToken(realm, session?.accessToken ?? null);
  return session;
}
