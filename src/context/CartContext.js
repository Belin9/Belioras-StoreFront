/* Context: CartContext
 *
 * The context object and its hook. The value comes from CartProvider
 * (CartProvider.jsx); they live apart so fast refresh can keep the
 * provider's state while either file is edited.
 */
import { createContext, useContext } from "react";

export const CartContext = createContext(null);

export function useCart() {

  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
