/* Admin Dashboard Page: Overview - overview */
import { useMemo } from "react";

import { cn } from "@/utils/cn";
import { useLocalStorage } from "@/hooks/useLocalStorage";

import { useStaffAuth } from "@/context/auth/useAuthRealm";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { useCurrency } from "../../../context/CurrencyContext";
import { useLanguage } from "../../../context/LanguageContext";
import { PERIODS, getDashboardStats, getRecentOrders } from "../../../services/sales/dashboardApi";

import KeyFigures from "./sections/OverviewKeyFigures";
import RevenuePanel from "./sections/OverviewRevenuePanel";
import OverviewAttention from "./sections/OverviewAttention";
import OverviewTopSellers from "./sections/OverviewTopSellers";
import RecentOrders from "./sections/overviewTable/OverviewRecentOrders";
import OverviewSetup from "./sections/OverviewSetup";

/* RECENT ORDER COUNT */
const RECENT_ORDER_COUNT = 6;

export default function DashOverview() {
  const [period, setPeriod] = useLocalStorage("belioras:dash:overviewPeriod", "30d");
  const current = PERIODS.find((p) => p.id === period) ?? PERIODS[1];
  const { data: stats, loading } = useAsyncData(() => getDashboardStats(current.id), [current.id]);
  const { data: orders } = useAsyncData(() => getRecentOrders(RECENT_ORDER_COUNT), []);
  const { format, currency } = useCurrency();
  const { locale } = useLanguage();
  const { can } = useStaffAuth();
  // Money is for roles that see payments or reports; the rest see the work.
  const seesMoney = can("transactions") || can("reports");

  // Compact so a five-figure month does not wrap the chart's axis labels.
  const formatCompact = useMemo(() => {

    const fmt = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return (value) => fmt.format(value);
  }, [locale, currency]);

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }),
    [locale],
  );

  return (
    <div className="space-y-10">
      <OverviewSetup />
      <div className="space-y-4">
        <div role="radiogroup" aria-label="Period" className="inline-flex max-w-full overflow-x-auto border border-umber-50 bg-ivory-50 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={current.id === p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                "whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                current.id === p.id ? "bg-espresso text-ivory-50" : "text-espresso-soft hover:text-espresso",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <KeyFigures stats={stats} loading={loading} format={format} locale={locale} seesMoney={seesMoney} compare={current.compare} />
      </div>
      {seesMoney && <RevenuePanel series={stats?.series} formatCompact={formatCompact} />}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <OverviewAttention attention={stats?.attention} loading={loading} />
        <OverviewTopSellers topSellers={stats?.topSellers} format={format} loading={loading} seesMoney={seesMoney} />
      </div>
      <RecentOrders orders={orders} format={format} dateFmt={dateFmt} />
    </div>
  );
}
