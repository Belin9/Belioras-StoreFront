/* Customer Session State */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  customerChangePassword,
  customerLogin,
  customerLogout,
  customerRegister,
  customerRestore,
  customerUpdatePreferences,
  customerUpdateProfile,
  onCustomerTokenChange,
} from "@/services/auth/authCustomerApi";

/**
 * The shopper's session, backed by the real API — the same shape the old
 * mock-backed `useAuthSession` gave every page, so nothing that reads
 * `useCustomerAuth()` had to change.
 *
 * Like the staff session, nothing is persisted: the access token is in memory
 * and the refresh token is an httpOnly cookie, so a reload restores the
 * session with one request. `loading` is true until that has answered, so an
 * account page does not bounce a signed-in shopper to sign-in on refresh.
 */

const PROFILE_FIELDS = new Set(["name", "phone", "email", "currentPassword"]);

/**
 * The session from the refresh cookie, or null. A shop page has nothing to
 * retry with, so "could not ask" (offline, server down) is treated as signed
 * out for now; signing in, or the next reload, asks again.
 */
async function restore() {
  try {
    return await customerRestore();
  } catch {
    return null;
  }
}

export function useCustomerSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    restore().then((restored) => {
      if (!live) return;
      setUser(restored);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  // A refresh the server refused clears the token mid-flight; the session ends with it.
  useEffect(() => onCustomerTokenChange((hasToken) => !hasToken && setUser(null)), []);

  const login = useCallback(async (credentials) => {
    const { user: signedIn } = await customerLogin(credentials);
    setUser(signedIn);
    return { user: signedIn };
  }, []);

  const register = useCallback(async (details) => {
    const { user: created } = await customerRegister(details);
    setUser(created);
    return { user: created };
  }, []);

  const logout = useCallback(async () => {
    try {
      await customerLogout();
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Profile fields go to `/auth/me`; anything else (language, currency) is a
   * preference, merged into what the account already stores. Changing the
   * email needs `currentPassword` in the same patch — the server checks it.
   */
  const updateProfile = useCallback(
    async (patch) => {
      const profile = Object.fromEntries(Object.entries(patch).filter(([k]) => PROFILE_FIELDS.has(k)));
      const prefs = Object.fromEntries(Object.entries(patch).filter(([k]) => !PROFILE_FIELDS.has(k)));
      let next = user;
      if (Object.keys(profile).length) next = await customerUpdateProfile(profile);
      if (Object.keys(prefs).length) next = await customerUpdatePreferences({ ...(next?.preferences ?? {}), ...prefs });
      setUser(next);
      return next;
    },
    [user],
  );

  const changePassword = useCallback((payload) => customerChangePassword(payload), []);

  return useMemo(
    () => ({
      realm: "customer",
      user,
      role: user?.role ?? null,
      isAdmin: false,
      access: () => "none",
      can: () => false,
      canEdit: () => false,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, loading, login, register, logout, updateProfile, changePassword],
  );
}
