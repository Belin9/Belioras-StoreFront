/* Context: WishlistContext
 *
 * The context object and its hook. The value comes from WishlistProvider
 * (WishlistProvider.jsx); they live apart so fast refresh can keep the
 * provider's state while either file is edited.
 */
import { createContext, useContext } from "react";

export const WishlistContext = createContext(null);

export function useWishlist() {

  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
