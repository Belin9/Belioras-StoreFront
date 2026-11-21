/* Admin Dashboard Page: Reports - reports */
import { useMemo, useState } from "react";
import { Download, FileBarChart, Landmark, Receipt, RotateCcw, Wallet } from "lucide-react";

import Button from "@/components/ui/Button";
import { useLanguage } from "@/context/LanguageContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getReports } from "@/services/sales/reportsApi";
import DashHeaderActions from "../../components/DashHeaderActions";
import DashTabs from "../../components/DashTabs";
import StatCard from "../../components/StatCard";
import { downloadCsv, toCsv } from "../../lib/csv";
import { cn } from "@/utils/cn";

const iso = (d) => d.toISOString().slice(0, 10);

/** Period presets, relative to today. */
function presets() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return [
    { id: "month", label: "This month", from: iso(new Date(Date.UTC(y, m, 1))), to: iso(now) },
    { id: "last-month", label: "Last month", from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) },
    { id: "quarter", label: "Last 3 months", from: iso(new Date(Date.UTC(y, m - 2, 1))), to: iso(now) },
    { id: "year", label: "This year", from: `${y}-01-01`, to: iso(now) },
    { id: "all", label: "All time", from: "", to: "" },
    { id: "custom", label: "Custom" },
  ];
}

const REPORTS = [
  { id: "sales", label: "Sales & VAT", blurb: "Paid orders by month: goods, discounts, shipping, VAT and net. The figures for your VAT return." },
  { id: "orders", label: "Orders", blurb: "Every order placed in the period, one row each, with its invoice number." },
  { id: "products", label: "Products", blurb: "What sold: units and revenue per piece, best first." },
  { id: "coupons", label: "Coupons", blurb: "Each code's paid orders, the discount it gave and the revenue it brought." },
  { id: "customers", label: "Customers", blurb: "Who bought, how often, how much — and whether they were new in the period." },
  { id: "stock", label: "Stock value", blurb: "What is on the shelf today, by category, at retail and at cost. Not affected by the period." },
];

/**
 * Figures for a period, each downloadable as CSV for an accountant or a
 * spreadsheet. Read-only by nature: nothing here changes the shop.
 */
export default function DashReports() {
  const { locale } = useLanguage();
  const [PRESETS] = useState(presets);
  const [presetId, setPresetId] = useState("year");
  const [custom, setCustom] = useState({ from: PRESETS[3].from, to: PRESETS[3].to });
  const [report, setReport] = useState("sales");

  const period = presetId === "custom" ? custom : PRESETS.find((p) => p.id === presetId);
  const { data, loading } = useAsyncData(() => getReports({ from: period.from, to: period.to }), [period.from, period.to]);

  const eur = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }), [locale]);
  const money = (n) => eur.format(n ?? 0);
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }), [locale]);

  // Columns per report: [key, header, kind]. Money columns are always in euros —
  // these are the shop's books, not a shopper's view.
  const COLUMNS = {
    sales: [["month", "Month"], ["orders", "Orders", "n"], ["goods", "Goods", "€"], ["discount", "Discounts", "€"], ["shipping", "Shipping", "€"], ["gross", "Total incl. VAT", "€"], ["vat", "VAT", "€"], ["net", "Net", "€"]],
    orders: [["id", "Order"], ["date", "Date", "d"], ["invoice", "Invoice"], ["customer", "Customer"], ["status", "Status"], ["coupon", "Coupon"], ["discount", "Discount", "€"], ["shipping", "Shipping", "€"], ["vat", "VAT", "€"], ["total", "Total", "€"]],
    products: [["name", "Piece"], ["category", "Category"], ["units", "Units sold", "n"], ["revenue", "Revenue", "€"]],
    coupons: [["code", "Code"], ["orders", "Paid orders", "n"], ["discount", "Discount given", "€"], ["revenue", "Revenue", "€"]],
    customers: [["customer", "Customer"], ["email", "Email"], ["orders", "Orders", "n"], ["spent", "Spent", "€"], ["firstOrder", "First order", "d"], ["isNew", "New in period"]],
    stock: [["category", "Category"], ["pieces", "Pieces", "n"], ["units", "Units on hand", "n"], ["low", "Low on stock", "n"], ["retail", "Value at retail", "€"], ["cost", "Value at cost", "€"]],
  };

  const rows = data?.[report] ?? [];
  const totals = report === "sales" && rows.length ? data.salesTotals : null;
  const cols = COLUMNS[report];
  const cell = (row, [key, , kind]) =>
    kind === "€" ? money(row[key]) : kind === "d" && row[key] ? dateFmt.format(new Date(row[key])) : String(row[key] ?? "");

  const periodText = period.from || period.to ? `${period.from || "start"}_to_${period.to || "today"}` : "all-time";
  const exportCsv = () =>
    downloadCsv(
      toCsv(cols.map(([key, header, kind]) => [key, kind === "€" ? `${header} (EUR)` : header]), totals ? [...rows, totals] : rows),
      `belioras-${report}-${periodText}.csv`,
    );

  const s = data?.summary;
  const current = REPORTS.find((r) => r.id === report);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="Period" className="flex flex-wrap border border-umber-100 bg-ivory-50">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={presetId === p.id}
              onClick={() => setPresetId(p.id)}
              className={cn(
                "px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                presetId === p.id ? "bg-espresso text-ivory-50" : "text-espresso-soft hover:text-espresso",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {presetId === "custom" && (
          <div className="flex items-center gap-2 text-[12px] text-espresso-soft">
            <input type="date" aria-label="From" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="input h-10 w-auto py-1" />
            to
            <input type="date" aria-label="To" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="input h-10 w-auto py-1" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px border border-umber-50 bg-umber-50 xl:grid-cols-4">
        <StatCard label="Sales incl. VAT" value={loading || !s ? "—" : money(s.gross)} hint={s ? `${s.orders} paid ${s.orders === 1 ? "order" : "orders"}` : undefined} icon={Wallet} />
        <StatCard label="VAT collected" value={loading || !s ? "—" : money(s.vat)} hint="included in prices" icon={Landmark} />
        <StatCard label="Net sales" value={loading || !s ? "—" : money(s.net)} hint="after VAT" icon={Receipt} />
        <StatCard label="Refunded" value={loading || !s ? "—" : money(s.refunded)} hint={s ? `${s.refundedCount} refunded · ${s.unpaid} awaiting payment` : undefined} icon={RotateCcw} />
      </div>

      <DashTabs ariaLabel="Report" options={REPORTS.map((r) => ({ value: r.id, label: r.label }))} value={report} onChange={setReport} />

      <DashHeaderActions>
        <Button icon={Download} size="sm" variant="secondary" onClick={exportCsv} disabled={!rows.length} className="h-10">
          Export<span className="hidden sm:inline"> CSV</span>
        </Button>
      </DashHeaderActions>

      <p className="max-w-2xl text-[13px] leading-relaxed text-espresso-soft">{current.blurb}</p>

      {loading ? (
        <div className="skeleton h-48 w-full" />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-umber-50 bg-ivory-50 px-6 py-12 text-center">
          <FileBarChart className="size-6 text-espresso/30" aria-hidden="true" />
          <p className="text-[13px] text-espresso-soft">Nothing in this period. Try a wider one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-umber-50 bg-ivory-50">
          <table className="dash-cards w-full text-[13px]">
            <thead className="border-b border-umber-50">
              <tr>
                {cols.map(([key, header, kind]) => (
                  <th key={key} scope="col" className={cn("whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-espresso-soft", kind === "€" || kind === "n" ? "text-right" : "text-left")}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-umber-50">
              {[...rows, ...(totals ? [totals] : [])].map((row, i) => (
                <tr key={i} className={cn(row === totals && "bg-brown-50/40 font-semibold")}>
                  {cols.map((col, c) => (
                    <td
                      key={col[0]}
                      data-primary={c === 0 ? "" : undefined}
                      data-label={c > 0 ? col[1] : undefined}
                      className={cn("whitespace-nowrap px-4 py-3 tabular-nums text-espresso", (col[2] === "€" || col[2] === "n") && "text-right")}
                    >
                      {cell(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] leading-relaxed text-espresso-soft">
        Sales count orders paid and not refunded; orders awaiting payment are left out until they are paid. Amounts are in euros.
      </p>
    </div>
  );
}
