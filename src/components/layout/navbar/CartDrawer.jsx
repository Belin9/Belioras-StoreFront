/* Layout Component: CartDrawer */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, Trash2, X } from "lucide-react";

import { useCart } from "../../../context/CartContext";
import { useCurrency } from "../../../context/CurrencyContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getTaxonomy } from "../../../services/catalog/navigationApi";
import { sizeLabel } from "../../../utils/sizeLabel";
import { shownColor } from "../../../utils/productColors";
import QuantitySelector from "../../shared/QuantitySelector";

export default function CartDrawer({ open, onClose }) {
  const { items, subtotal, count, updateQty, removeItem } = useCart();
  const { convert, format, formatConverted } = useCurrency();
  const { data: taxonomy } = useAsyncData(getTaxonomy, []);

  /* Keyboard Event Handler */
  useEffect(() => {

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const convertedSubtotal = convert(subtotal);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 cursor-default bg-espresso/60 backdrop-blur-md"
            aria-label="Close cart"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="surface-header absolute inset-y-0 right-0 flex w-[min(95vw,440px)] flex-col shadow-large"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-espresso/10 px-6 py-5 bg-white">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gold-500/10 flex items-center justify-center">
                  <ShoppingBag className="size-5 text-gold-700" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-espresso">Shopping Cart</h2>
                  <p className="text-xs text-espresso/60">{count} item{count !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full text-espresso/60 hover:bg-espresso/5 hover:text-espresso transition-colors liquid-hover"
                aria-label="Close cart"
                onClick={onClose}
              >
                <X className="liquid-icon size-5" aria-hidden="true" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="size-20 rounded-full bg-espresso/5 flex items-center justify-center"
                >
                  <ShoppingBag className="size-8 text-espresso/40" aria-hidden="true" />
                </motion.div>
                <div>
                  <p className="font-display text-2xl text-espresso mb-2">Your cart is empty</p>
                  <p className="text-sm text-espresso/60 max-w-xs mx-auto">
                    Discover this season's pieces and add something to keep.
                  </p>
                </div>
                <Link 
                  to="/shop" 
                  onClick={onClose}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-espresso text-ivory-50 text-sm font-medium hover:bg-gold-700 transition-all duration-200"
                >
                  Start shopping
                  <motion.span
                    className="group-hover:translate-x-1 transition-transform"
                  >
                    →
                  </motion.span>
                </Link>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <ul className="flex-1 divide-y divide-espresso/10 overflow-y-auto px-6 py-4">
                  {items.map((item, index) => (
                    <motion.li
                      key={`${item.id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex gap-4 py-5"
                    >
                      <div className="relative group">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="aspect-[4/5] w-20 shrink-0 rounded-xl object-cover shadow-sm"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 rounded-xl bg-espresso/0 group-hover:bg-espresso/5 transition-colors" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={onClose}
                          className="text-sm font-medium text-espresso hover:text-gold-700 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-xs text-espresso/50">
                          {[shownColor(item.color), item.size && `Size ${sizeLabel(taxonomy, item.size)}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <QuantitySelector
                            value={item.quantity}
                            max={99}
                            onChange={(q) => updateQty(index, q)}
                          />
                          <p className="text-sm font-semibold tabular-nums text-espresso">
                            {format(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="flex size-8 shrink-0 items-center justify-center self-start rounded-full text-espresso/40 hover:bg-rose-50 hover:text-rose-600 transition-colors liquid-hover"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="liquid-icon size-4" aria-hidden="true" />
                      </button>
                    </motion.li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="border-t border-espresso/10 px-6 py-5 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium uppercase tracking-[0.14em] text-espresso/60">
                      Subtotal
                    </span>
                    <span className="font-display text-2xl text-espresso">
                      {formatConverted(convertedSubtotal)}
                    </span>
                  </div>
                  <p className="text-xs text-espresso/50 mb-4">
                    Shipping calculated at checkout · All prices include VAT
                  </p>
                  <Link
                    to="/checkout"
                    onClick={onClose}
                    className="group relative inline-flex items-center justify-center w-full py-4 rounded-xl bg-espresso text-ivory-50 text-sm font-bold uppercase tracking-[0.2em] hover:bg-gold-700 transition-all duration-200 overflow-hidden"
                  >
                    <span className="relative z-10">Checkout</span>
                    <motion.div
                      className="absolute inset-0 bg-gold-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                      whileHover={{ scale: 1.05 }}
                    />
                  </Link>
                  <button
                    type="button"
                    className="w-full py-3 text-sm font-medium text-espresso/60 hover:text-espresso transition-colors"
                    onClick={onClose}
                  >
                    Continue shopping
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}