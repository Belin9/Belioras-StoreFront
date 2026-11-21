/* Admin Dashboard: Panel */
import { cn } from "@/utils/cn";

/** A titled card. `action` sits at the header's right (a link or button). */
export default function Panel({ id, title, hint, action, className, children }) {
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
