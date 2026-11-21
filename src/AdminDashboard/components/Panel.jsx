/* Admin Dashboard: Panel */
import { createContext, useContext } from "react";

import { cn } from "@/utils/cn";

const AsideContext = createContext(false);

/**
 * Inside <PanelRows>, every Panel lays out as a settings row on large
 * screens: title, hint and action in a narrow column on the left, the fields
 * in a card on the right. This uses the page's full width instead of one
 * narrow column. Smaller screens stack as usual.
 */
export function PanelRows({ children, className }) {
  return (
    <AsideContext.Provider value>
      <div className={cn("divide-y divide-umber-50", className)}>{children}</div>
    </AsideContext.Provider>
  );
}

/** A titled card. `action` sits at the header's right (a link, button or switch). */
export default function Panel({ id, title, hint, action, className, children }) {
  const aside = useContext(AsideContext);

  if (aside) {
    return (
      <section id={id} className={cn("grid gap-5 py-8 first:pt-0 last:pb-0 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12", className)}>
        <div className="lg:sticky lg:top-4 lg:self-start">
          <h2 className="font-display text-xl tracking-wide text-espresso">{title}</h2>
          {hint && <p className="mt-2 max-w-[38ch] text-[13px] leading-relaxed text-espresso-soft">{hint}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
        {children && <div className="min-w-0 space-y-5 border border-umber-50 bg-white p-5 sm:p-6">{children}</div>}
      </section>
    );
  }

  return (
    <section id={id} className={cn("border border-umber-50 bg-ivory-50 p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg tracking-wide text-espresso">{title}</h2>
          {hint && <p className="mt-1 text-[12px] leading-relaxed text-espresso-soft">{hint}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4 space-y-4">{children}</div>}
    </section>
  );
}
