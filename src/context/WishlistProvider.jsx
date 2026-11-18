/* Context Provider: WishlistProvider */
import { useCallback, useMemo } from "react";

import { useCustomerAuth } from "@/context/auth/useAuthRealm";
import { useScopedStorage } from "../hooks/useScopedStorage";
import { WishlistContext } from "./WishlistContext";

function mergeIds(accountIds = [], anonymousIds = []) {
  return [...new Set([...accountIds, ...anonymousIds])];
}

export function WishlistProvider({ children }) {
  const { user } = useCustomerAuth();
  const [ids, setIds] = useScopedStorage("belioras:wishlist", [], user?.id, {
    merge: mergeIds,
  });

  const toggle = useCallback(
    (id) => {
      setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [setIds],
  );

  const remove = useCallback(
    (id) => setIds((prev) => prev.filter((x) => x !== id)),
    [setIds],
  );

  const clear = useCallback(() => setIds([]), [setIds]);

  const has = useCallback((id) => ids.includes(id), [ids]);

  const value = useMemo(
    () => ({ ids, toggle, remove, clear, has, count: ids.length }),
    [ids, toggle, remove, clear, has],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
