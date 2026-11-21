/* Admin Dashboard Page: Overview - OverviewSetup */
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getStaffCategories } from "@/services/catalog/categoriesApi";
import { getStaffColors } from "@/services/catalog/colorsApi";
import { getTaxonomy } from "@/services/catalog/navigationApi";
import { getAllProducts } from "@/services/catalog/productsApi";
import { getSettings } from "@/services/content/settingsApi";
import { cn } from "@/utils/cn";

/**
 * "Get the shop ready": what a working shop needs, each step linking to where
 * it is done. Disappears once every step is ticked, so it never nags a shop
 * that is running.
 */
export default function OverviewSetup() {
  const { data } = useAsyncData(async () => {
    const [categories, colors, taxonomy, products, settings] = await Promise.all([
      getStaffCategories().catch(() => []),
      getStaffColors().catch(() => []),
      getTaxonomy().catch(() => ({})),
      getAllProducts().catch(() => []),
      getSettings().catch(() => ({})),
    ]);
    return [
      { label: "Add your categories", done: categories.length > 0, to: "/dashboard/categories" },
      { label: "Add the colours pieces come in", done: colors.length > 0, to: "/dashboard/categories?tab=colours" },
      { label: "Set up your sizes", done: (taxonomy?.size?.values ?? []).length > 0, to: "/dashboard/sizes" },
      { label: "Publish a first piece", done: products.some((p) => p.status === "active"), to: "/dashboard/products/new" },
      { label: "Set where you ship and what it costs", done: (settings?.shipping?.zones ?? []).length > 0, to: "/dashboard/shipping" },
      { label: "Add a contact email", done: Boolean(settings?.contact?.support || settings?.contact?.general), to: "/dashboard/settings" },
      { label: "Fill in the seller details for invoices", done: Boolean(settings?.invoice?.sellerName || settings?.gpsr?.manufacturer), to: "/dashboard/settings?tab=checkout" },
    ];
  }, []);

  const steps = data ?? [];
  const done = steps.filter((s) => s.done).length;
  if (!steps.length || done === steps.length) return null;

  return (
    <section aria-labelledby="setup-title" className="border border-gold-500/40 bg-ivory-50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="setup-title" className="font-display text-lg tracking-wide text-espresso">Get the shop ready</h2>
        <p className="text-[12px] tabular-nums text-espresso-soft">{done} of {steps.length} done</p>
      </div>
      <span aria-hidden="true" className="mt-3 block h-1 bg-umber-50">
        <span className="block h-full bg-gold-500 transition-[width]" style={{ width: `${(done / steps.length) * 100}%` }} />
      </span>
      <ul className="mt-4 grid gap-1 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.label}>
            <Link to={s.to} className={cn("group flex items-center gap-3 px-2 py-2 text-[13px] transition-colors hover:bg-brown-50/40", s.done ? "text-espresso-soft" : "text-espresso")}>
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", s.done ? "border-success bg-success text-ivory-50" : "border-umber-100")}>
                {s.done && <Check className="size-3" aria-hidden="true" />}
              </span>
              <span className={cn("flex-1", s.done && "line-through decoration-umber-100")}>{s.label}</span>
              {!s.done && <ArrowRight className="size-3.5 text-gold-800 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
