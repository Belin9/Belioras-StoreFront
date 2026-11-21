/* Storefront Component: ProductCard */
import { useState } from "react";
import { Eye, Heart } from "lucide-react";
import { Link } from "react-router-dom";

import { useCurrency } from "../../context/CurrencyContext";
import { useToast } from "../../context/ToastContext";
import { useWishlist } from "../../context/WishlistContext";
import { cn } from "../../utils/cn";
import QuickView from "./QuickView";

/**
 * A round icon button that swells like a drop of liquid on hover or focus:
 * it squashes and stretches (the `liquid-swell` keyframes in index.css), a soft
 * ring ripples out from it, and the icon pops. Colours never change.
 * Hover-capable screens only; on touch it stays a plain circle.
 */
function CardAction({ active = false, icon: Icon, iconClassName, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "liquid-hover group/act relative flex size-11 items-center justify-center rounded-full backdrop-blur",
        "shadow-[0_1px_3px_rgba(43,29,20,0.18),0_2px_10px_rgba(43,29,20,0.10)]",
        "transition-[scale,box-shadow] duration-300 hover:shadow-[0_4px_14px_rgba(43,29,20,0.25)] active:scale-90",
        "hover:animate-[liquid-swell_650ms_cubic-bezier(0.34,1.56,0.64,1)_forwards] focus-visible:animate-[liquid-swell_650ms_cubic-bezier(0.34,1.56,0.64,1)_forwards]",
        "motion-reduce:animate-none motion-reduce:transition-none",
        active ? "bg-espresso/80 text-gold-400" : "bg-ivory-50/80 text-espresso-soft",
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full border border-current opacity-0 group-hover/act:animate-[liquid-ring_700ms_ease-out] group-focus-visible/act:animate-[liquid-ring_700ms_ease-out] motion-reduce:hidden"
      />
      <Icon
        className={cn(
          "size-4 transition-[scale] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/act:scale-125 group-focus-visible/act:scale-125 motion-reduce:transition-none",
          iconClassName,
        )}
        aria-hidden="true"
      />
    </button>
  );
}

export default function ProductCard({ product }) {
  const { format } = useCurrency();
  const { has, toggle } = useWishlist();
  const { toast } = useToast();

  const { id, slug, name, price, originalPrice, images = [], isNew, stock = 0 } = product;

  const saved = has(id);

  const onSale = originalPrice && originalPrice > price;

  const soldOut = stock === 0;

  const secondImage = images[1];

  // Not mounted until first asked for: a grid holds dozens of cards, and each
  // dialog is markup that would otherwise sit in the page for nothing.
  const [quick, setQuick] = useState({ open: false, session: 0, used: false });
  const openQuick = () => setQuick((q) => ({ open: true, session: q.session + 1, used: true }));

  return (
    <article className="group relative">
      <div className="relative overflow-hidden">
      <Link to={`/product/${slug}`} className="block overflow-hidden bg-ivory-200">
        <div className="relative aspect-[3/4] w-full">
          <img
            src={images[0]}
            alt={name}
            loading="lazy"
            className={cn(
              "h-full w-full object-contain transition-all duration-700 ease-out",
              secondImage ? "group-hover:opacity-0" : "group-hover:scale-[1.03]",
            )}
          />
          {secondImage && (
            <img
              src={secondImage}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full bg-ivory-200 object-contain opacity-0 transition-all duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
            />
          )}

          {soldOut && (
            <span className="absolute inset-x-0 bottom-0 bg-ivory-50/90 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-espresso backdrop-blur">
              Sold out
            </span>
          )}
        </div>

        {/* One badge only. Two competing labels on a photograph is clutter. */}
        {!soldOut &&
          (onSale ? (
            <span className="absolute left-3 top-3 bg-espresso px-2 py-1 text-[9px] uppercase tracking-widest text-champagne-300">
              Sale
            </span>
          ) : (
            isNew && (
              <span className="absolute left-3 top-3 bg-ivory-50 px-2 py-1 text-[9px] uppercase tracking-widest text-gold-600">
                New
              </span>
            )
          ))}
      </Link>

      {/* One column of round buttons, top right: save and quick view. Permanent on touch; from md up they appear on hover or focus,
          and stay reachable by keyboard. */}
      <div
        className={cn(
          "absolute right-2 top-2 flex flex-col items-end gap-2 transition-opacity duration-300",
          "md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100",
          saved && "md:opacity-100",
        )}
      >
        <CardAction
          icon={Heart}
          iconClassName={saved ? "fill-current" : undefined}
          active={saved}
          aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name}`}
          aria-pressed={saved}
          onClick={() => {
            toggle(id);
            toast(saved ? `${name} removed from your wishlist.` : `${name} saved to your wishlist.`, saved ? "info" : "success");
          }}
        />

        <CardAction icon={Eye} aria-label={`Quick view ${name}`} onClick={openQuick} />
      </div>
      </div>

      <div className="mt-3">
        <h3>
          <Link
            to={`/product/${slug}`}
            className="font-sans text-sm leading-snug text-espresso transition-colors duration-200 group-hover:text-gold-700"
          >
            {name}
          </Link>
        </h3>

        <p className="mt-1 flex items-baseline gap-2 text-sm">
          <span className={cn("tabular-nums", onSale ? "text-espresso" : "text-espresso-soft")}>
            {format(price)}
          </span>
          {onSale && (
            <span className="text-xs tabular-nums text-espresso/35 line-through">
              {format(originalPrice)}
            </span>
          )}
        </p>
      </div>
      {quick.used && <QuickView product={product} open={quick.open} session={quick.session} onClose={() => setQuick((q) => ({ ...q, open: false }))} />}
    </article>
  );
}
