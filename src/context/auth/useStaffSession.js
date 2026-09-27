/* Staff Session State */
import { useCallback, useEffect, useMemo, useState } from "react";

import { accessToken, onTokenChange } from "@/api/tokens";
import { refreshSession } from "@/api/refresh";
import { accessFor, isAdminRole } from "@/utils/roles";
import { staffLogin, staffLogout, staffLogoutAll, staffMe } from "@/services/auth/authStaffApi";
import { setCurrentStaff } from "@/services/auth/staffRegistry";

/**
 * The atelier session, backed by the real API.
 *
 * Separate from `useAuthSession` rather than a `transport` option on it. The
 * shopper's session is still mock-backed and persisted; this one is neither.
 * Merging them would have meant a hook that branches on storage, on transport
 * and on where the role comes from, and — worse — one where a provider could
 * choose which door it is. The realm is fixed here, once, and cannot be picked
 * per call.
 *
 * Nothing is persisted. The access token lives in `api/tokens.js` (memory) and
 * the refresh token is an httpOnly cookie, so a page reload arrives with
 * neither a user nor a token and rebuilds the session from the cookie. That is
 * the trade for not leaving a bearer token where injected script can read it.
 *
 * `booting` exists because of that rebuild: the user is unknown for one
 * request on every cold start, and a route guard that cannot tell "signed out"
 * from "not yet asked" would bounce a signed-in admin to the sign-in page on
 * every refresh. Guard reads it and waits.
 */

const REALM = "staff";

/**
 * Recovers the session from the refresh cookie, or confirms the in-memory token
 * is still good. Never rejects: any failure means "signed out", which is the
 * state the caller renders either way.
 */
async function restore() {
  try {
    if (accessToken(REALM)) return await staffMe();
    // A successful refresh returns the user alongside the new token, so the
    // common cold start costs one request, not two.
    const session = await refreshSession(REALM);
    return session?.user ?? (await staffMe());
  } catch {
    return null;
  }
}

export function useStaffSession() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);

  /* Side Effect */
  useEffect(() => {
    let live = true;

    restore().then((restored) => {
      // StrictMode mounts, unmounts and remounts, so the first run's
      // continuation must not write into a session nobody is watching.
      if (!live) return;
      setUser(restored);
      setBooting(false);
    });

    return () => {
      live = false;
    };
  }, []);

  /* Side Effect */
  useEffect(() => setCurrentStaff(user), [user]);

  /**
   * A token that disappears takes the user with it. This is the mid-flight case
   * the refresh path cannot report back: `client.js` refreshes a rejected
   * request, and when that refresh fails it clears the token — so the session
   * ends here instead of leaving a stale admin on screen until the next
   * navigation. Only a *cleared* token is reacted to, because a login also
   * stores one and must not be treated as a revocation.
   */
  useEffect(
    () =>
      onTokenChange((realm, token) => {
        if (realm === REALM && !token) setUser(null);
      }),
    [],
  );

  const login = useCallback(async (credentials) => {
    setBusy(true);
    try {
      // staffLogin stores the token; the user comes back from the server.
      const { user: signedIn } = await staffLogin(credentials);
      setUser(signedIn);
      return { user: signedIn };
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await staffLogout();
    } finally {
      setUser(null);
      setBusy(false);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    setBusy(true);
    try {
      await staffLogoutAll();
    } finally {
      setUser(null);
      setBusy(false);
    }
  }, []);

  const role = user?.role ?? null;

  return useMemo(
    () => ({
      realm: REALM,
      user,
      role,
      // Derived from the role the server assigned. The capability matrix itself
      // is still the client's (`utils/permissions.js`) and is not yet enforced
      // server-side, so these answer "what should this screen offer", which is
      // the question the dashboard is actually asking.
      isAdmin: isAdminRole(role),
      access: (section) => accessFor(role, section),
      can: (section) => accessFor(role, section) !== "none",
      canEdit: (section) => accessFor(role, section) === "edit",
      token: accessToken(REALM),
      loading: busy,
      booting,
      isAuthenticated: Boolean(user),
      login,
      logout,
      logoutAll,
    }),
    [user, role, busy, booting, login, logout, logoutAll],
  );
}
