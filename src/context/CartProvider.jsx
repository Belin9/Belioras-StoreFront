/* Context Provider: CartProvider */
import { useCallback, useMemo, useState } from "react";

import { useLocalStorage } from "../hooks/useLocalStorage";
import { CartContext } from "./CartContext";

function clampQty(qty, stock) {
  return Math.min(Math.max(1, Math.floor(qty)), Math.max(0, stock));
}

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage("belioras:cart", []);
  // Not persisted: nobody wants the drawer to reopen on its own because it
  // happened to be open when they last left the site.
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const addItem = useCallback(
    (product, { size, color, quantity = 1, image, stock } = {}) => {
      // The limit is this colour and size when the caller knows it, since the
      // piece as a whole can be in stock while that variant is not.
      const limit = stock ?? product?.stock ?? 0;
      if (!product || limit <= 0) return false;

      const qty = clampQty(quantity, limit);
      setItems((prev) => {

        const existing = prev.find(
          (i) => i.id === product.id && i.size === size && i.color === color
        );
        if (existing) {

          const merged = clampQty(existing.quantity + qty, limit);
          return prev.map((i) => (i === existing ? { ...i, quantity: merged } : i));
        }
        return [
          ...prev,
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: image ?? product.images?.[0],
            size,
            color,
            quantity: qty,
          },
        ];
      });
      return true;
    },
    [setItems]
  );

  const updateQty = useCallback(
    (index, quantity) => {
      setItems((prev) => {

        const item = prev[index];
        if (!item) return prev;

        const next = clampQty(quantity, 99);
        return next <= 0 ? prev.filter((_, i) => i !== index) : prev.map((i, idx) => (idx === index ? { ...i, quantity: next } : i));
      });
    },
    [setItems]
  );

  const removeItem = useCallback(
    (index) => setItems((prev) => prev.filter((_, i) => i !== index)),
    [setItems]
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  const isInCart = useCallback((productId) => items.some((i) => i.id === productId), [items]);

  const value = useMemo(() => {

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    return { items, subtotal, count, addItem, updateQty, removeItem, clear, isInCart, cartOpen, openCart, closeCart };
  }, [items, addItem, updateQty, removeItem, clear, isInCart, cartOpen, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
