/* Staff Session State */
import { useCallback, useEffect, useMemo, useState } from "react";

import { accessFor, isAdminRole } from "@/utils/roles";
import {
  changePassword as changePasswordRequest,
  onStaffTokenChange,
  staffLogin,
  staffLogout,
  staffLogoutAll,
  staffRestore,
} from "@/services/auth/authStaffApi";
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
 * Recovers the session from the refresh cookie.
 *
 * Returns the user, or `null` when the server says there is no session — and
 * only then. Every other failure is rethrown, because "we could not ask" and
 * "you are signed out" are different answers and collapsing them logs people
 * out for the network's sake: a throttled refresh, a 500, or a laptop lid
 * closed mid-request all used to arrive here and return `null`, which is a
 * sign-out the person never caused and cannot undo by trying again.
 */
async function restore() {
  try {
    return await staffRestore();
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) return null;
    throw err;
  }
}

export function useStaffSession() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  // Set when the cold start could not be completed — throttled, offline, server
  // error. Distinct from "signed out", and the reason the guard shows a retry
  // rather than the sign-in page.
  const [bootError, setBootError] = useState(null);
  const [busy, setBusy] = useState(false);

  /* Side Effect */
  useEffect(() => {
    let live = true;

    restore().then(
      (restored) => {
        // StrictMode mounts, unmounts and remounts, so the first run's
        // continuation must not write into a session nobody is watching.
        if (!live) return;
        setUser(restored);
        setBootError(null);
        setBooting(false);
      },
      (err) => {
        if (!live) return;
        setBootError(err);
        setBooting(false);
      },
    );

    return () => {
      live = false;
    };
  }, []);

  /** Asks again. The cookie is untouched, so this is the whole recovery. */
  const retryBoot = useCallback(async () => {
    setBootError(null);
    setBooting(true);
    try {
      setUser(await restore());
    } catch (err) {
      setBootError(err);
    } finally {
      setBooting(false);
    }
  }, []);

  /* Side Effect */
  useEffect(() => setCurrentStaff(user), [user]);

  /**
   * A token that disappears takes the user with it. This is the mid-flight case
   * the refresh path cannot report back: `client.js` refreshes a rejected
   * request, and when the server refuses that refresh it clears the token — so
   * the session ends here instead of leaving a stale admin on screen until the
   * next navigation. Only a *cleared* token is reacted to, because a login also
   * stores one and must not be treated as a revocation.
   */
  useEffect(
    () =>
      onStaffTokenChange((hasToken) => {
        if (!hasToken) setUser(null);
      }),
    [],
  );

  const login = useCallback(async (credentials) => {
    setBusy(true);
    try {
      // staffLogin stores the token; the user comes back from the server.
      const { user: signedIn } = await staffLogin(credentials);
      setUser(signedIn);
      // Signing in is also the answer to a boot that could not complete.
      setBootError(null);
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
  const mustChangePassword = Boolean(user?.mustChangePassword);

  /**
   * Replaces this person's own password, then folds the server's answer into
   * state.
   *
   * The user object is replaced rather than patched locally: the flag lives on
   * the server, and the only trustworthy copy of it came back on this response.
   * Setting it optimistically would let the dashboard open a moment before the
   * server agreed.
   *
   * The session survives this call — the server keeps this device's refresh
   * cookie and drops the others — so there is no re-login here. What *can* fail
   * is the current password being wrong, and that error propagates for the form
   * to show.
   */
  const changePassword = useCallback(async (credentials) => {
    setBusy(true);
    try {
      const updated = await changePasswordRequest(credentials);
      setUser(updated);
      // The registry is the non-React copy used by code that cannot use a hook
      // (route guards, api layer). Leaving it pointing at the pre-rotation user
      // would have `mustChangePassword: true` still being believed after the
      // flag was cleared, and the guard would send them back here forever.
      setCurrentStaff(updated);
      return { user: updated };
    } finally {
      setBusy(false);
    }
  }, []);

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
      /**
       * The server says this account was created by someone else with a
       * temporary password and has not replaced it yet. The route guard holds
       * such an account out of the dashboard and sends it to the one screen that
       * can let it through.
       *
       * Not derived from anything local: the flag is set by the API at creation
       * and cleared by the API at rotation, and a browser that guessed either
       * would be guessing about a security control.
       */
      mustChangePassword,
      /**
       * Deliberately no `token` here. The access token lives in the transport
       * (`api/tokens.js`) and is read by the HTTP client; nothing in React needs
       * it, and putting a bearer token on a context value hands it to every
       * consumer of this provider for no benefit. `isAuthenticated` is the only
       * question a component should be asking.
       */
      loading: busy,
      booting,
      /**
       * The cold start could not be completed — throttled, offline, or the API
       * returned an error. Not a sign-out: the refresh cookie is untouched, so
       * `retryBoot` is the whole recovery. `null` whenever the start succeeded,
       * including when it succeeded by finding no session.
       */
      bootError,
      retryBoot,
      isAuthenticated: Boolean(user),
      login,
      logout,
      logoutAll,
      changePassword,
    }),
    [user, role, mustChangePassword, busy, booting, bootError, retryBoot, login, logout, logoutAll, changePassword],
  );
}
