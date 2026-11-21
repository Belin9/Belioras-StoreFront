/* Admin Dashboard: DashHeader */
import { Link } from "react-router-dom";
import { ArrowUpRight, Menu } from "lucide-react";

export default function DashHeader({ title, description, trail = [], onMenuToggle, showMenuButton = true, actionsRef }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-umber-50 bg-ivory-50/95 px-5 py-5 backdrop-blur sm:px-8 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-espresso transition-colors hover:bg-umber-50 liquid-hover lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="liquid-icon size-5" aria-hidden="true" />
          </button>
        )}
        <div className="min-w-0">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">
              {(trail.length ? trail : ["Dashboard"]).map((crumb, i, all) => {
                const label = typeof crumb === "string" ? crumb : crumb.label;
                const last = i === all.length - 1;
                return (
                  <li key={`${label}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden="true" className="text-gold-700/50">/</span>}
                    {typeof crumb === "string" || last ? (
                      <span aria-current={last ? "page" : undefined}>{label}</span>
                    ) : (
                      <Link to={crumb.to} className="transition-colors hover:text-espresso">{label}</Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
          <h1 className="truncate font-display text-2xl leading-tight text-espresso">{title}</h1>
          {/* What the page is for, in one line; hidden on a phone to keep the bar short. */}
          {description && <p className="mt-1 hidden max-w-2xl truncate text-[12px] text-espresso-soft sm:block">{description}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Opens in a new tab: an admin checking the storefront mid-edit should
            not lose their place in the dashboard. Icon-only on a phone, so a
            page's own action still fits beside it. */}
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          aria-label="View store"
          title="View store"
          className="inline-flex h-10 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-espresso-soft transition-colors hover:text-espresso"
        >
          <span className="hidden sm:inline">View store</span>
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
        {/* A page's main action lands here (DashHeaderActions). */}
        <div ref={actionsRef} className="flex items-center gap-2 empty:hidden" />
      </div>
    </header>
  );
}
