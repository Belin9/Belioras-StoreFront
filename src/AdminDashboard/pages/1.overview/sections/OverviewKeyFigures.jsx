/* Admin Dashboard Page: Overview - OverviewKeyFigures */
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Package, Receipt, Users, Wallet } from "lucide-react";

import StatCard from "../../../components/StatCard";

export default function KeyFigures({ stats, loading, format, locale, seesMoney = true, compare = "vs the period before" }) {
  return (
    <section aria-label="Key figures">
      <div className={`grid grid-cols-2 gap-px border border-umber-50 bg-umber-50 ${seesMoney ? "xl:grid-cols-4" : ""}`}>
        {seesMoney && <StatCard
          label="Revenue"
          value={loading ? "—" : format(stats?.revenue ?? 0)}
          change={stats?.revenueChange}
          hint={compare}
          icon={Wallet}
        />}
        <StatCard
          label="Orders"
          value={loading ? "—" : (stats?.orderCount ?? 0).toLocaleString(locale)}
          change={stats?.orderChange}
          hint={compare}
          icon={Receipt}
        />
        {seesMoney && <StatCard
          label="Average order"
          value={loading ? "—" : format(stats?.averageOrder ?? 0)}
          change={stats?.averageOrderChange}
          hint={compare}
          icon={Package}
        />}
        <StatCard
          label="Customers"
          value={loading ? "—" : (stats?.customerCount ?? 0).toLocaleString(locale)}
          hint={loading ? undefined : `${stats?.newCustomers ?? 0} new in this period`}
          icon={Users}
        />
      </div>

      {stats?.lowStockCount > 0 && (
        <Link
          to="/dashboard/inventory?level=low"
          className="mt-4 flex items-center gap-3 border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-[13px] text-espresso transition-colors hover:border-gold-500"
        >
          <AlertTriangle className="size-4 shrink-0 text-gold-700" strokeWidth={1.75} aria-hidden="true" />
          <span className="flex-1">
            <strong className="font-semibold">
              {stats.lowStockCount} {stats.lowStockCount === 1 ? "piece is" : "pieces are"} low on stock.
            </strong>{" "}
            Restock before they sell out.
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-800">
            Review
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </Link>
      )}
    </section>
  );
}
