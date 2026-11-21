/* Admin Dashboard Page: Products - ProductFormSection */
import { createContext, useContext } from "react";

import { cn } from "@/utils/cn";

/** Set by a panel that holds other sections, so they draw as parts of it. */
const NestedContext = createContext(false);

export function NestedSections({ children }) {
  return <NestedContext.Provider value>{children}</NestedContext.Provider>;
}

/**
 * One card of the product form. Inside NestedSections it draws as a titled
 * part of the surrounding card instead (a rule above, no box of its own).
 */
export default function FormSection({ title, hint, action, className, children }) {
  const nested = useContext(NestedContext);

  if (nested) {
    return (
      <section className={cn("border-t border-umber-50 pt-5 first:border-t-0 first:pt-0", className)}>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-espresso">{title}</h3>
        {hint && <p className="mt-1 text-[12px] leading-relaxed text-espresso-soft">{hint}</p>}
        <div className="mt-4 space-y-5">{children}</div>
      </section>
    );
  }

  return (
    <section className={cn("border border-umber-50 bg-ivory-50 p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg tracking-wide text-espresso">{title}</h2>
          {hint && <p className="mt-1 text-[12px] leading-relaxed text-espresso-soft">{hint}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="mt-4 space-y-5">{children}</div>}
    </section>
  );
}
