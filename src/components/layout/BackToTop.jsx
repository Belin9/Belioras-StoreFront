/* Layout Component: BackToTop */
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "../../utils/cn";

/* REVEAL AT */
const REVEAL_AT = 600;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  /* Scroll Handler */
  useEffect(() => {

    const onScroll = () => setVisible(window.scrollY > REVEAL_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
      // Kept mounted and faded rather than unmounted, so it animates out
      // instead of vanishing. inert while hidden keeps it off the tab order.
      inert={!visible || undefined}
      className={cn(
        // Positioned by FloatingActions, at the bottom of the stack under chat.
        // While hidden it collapses to nothing (and cancels the stack's gap),
        // so the chat button above sits at the bottom instead of over a hole.
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-gold-500/30 bg-espresso/90 text-gold-400 shadow-large backdrop-blur",
        "transition-all duration-300 hover:bg-espresso hover:text-gold-300 liquid-hover",
        visible ? "size-11 opacity-100" : "pointer-events-none -mt-3 size-0 border-0 opacity-0",
      )}
    >
      <ArrowUp className="liquid-icon size-5" aria-hidden="true" />
    </button>
  );
}
