/* Mobile Add Bar */
import { useEffect, useState } from "react";

import { useCurrency } from "../../../../context/CurrencyContext";
import { useLanguage } from "../../../../context/LanguageContext";
import { cn } from "../../../../utils/cn";

/**
 * Phones and tablets: once the main "Add to bag" scrolls out of view above,
 * a slim bar with the name, price and the same button rises from the foot of
 * the screen, so adding never needs a scroll back up. With no size chosen it
 * takes the shopper back to the sizes instead.
 */
export default function ProductMobileAddBar({ product, size, needsSize, soldOut, added, onAdd, watch, sizesRef }) {
  const { t } = useLanguage();
  const { format } = useCurrency();
  const [shown, setShown] = useState(false);

  /* Side Effect */
  // Measured on scroll rather than with an IntersectionObserver, which only
  // reports a change of visibility: a jump straight past a button that was
  // never on screen (a restored scroll position, a long swipe) would leave
  // the bar down.
  useEffect(() => {
    const el = watch.current;
    if (!el) return undefined;
    let frame = 0;
    const check = () => {
      frame = 0;
      setShown(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [watch]);

  // The chat and WhatsApp buttons read this to sit above the bar while it is up.
  useEffect(() => {
    document.documentElement.style.setProperty("--addbar-height", shown ? "4.75rem" : "0px");
    return () => document.documentElement.style.removeProperty("--addbar-height");
  }, [shown]);

  const pickSize = needsSize && !size;
  const click = () => {
    if (pickSize) {
      onAdd(); // shows "Please select a size" beside the sizes
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAdd();
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[55] flex items-center gap-4 border-t border-umber-50 bg-ivory-50/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none sm:px-6 lg:hidden",
        shown ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!shown}
      inert={!shown || undefined}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] text-espresso">{product.name}</p>
        <p className="truncate text-[13px] tabular-nums text-espresso-soft">
          {format(product.price)}
          {size && <span> · {t("pdp.sizeShort", "Size")} {size}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={click}
        disabled={soldOut}
        className="h-11 shrink-0 border border-espresso bg-espresso px-5 text-[12px] font-medium uppercase tracking-[0.16em] text-ivory-50 transition-colors hover:bg-espresso-600 disabled:opacity-40"
      >
        {soldOut
          ? t("pdp.soldOut", "Sold out")
          : pickSize
            ? t("pdp.chooseSize", "Choose a size")
            : added
              ? t("common.added", "Added to your bag")
              : t("common.addToBag", "Add to bag")}
      </button>
    </div>
  );
}
