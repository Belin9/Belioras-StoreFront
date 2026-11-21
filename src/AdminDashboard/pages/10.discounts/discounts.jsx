/* Admin Dashboard Page: Discounts - discounts */
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import DashHeaderActions from "@/AdminDashboard/components/DashHeaderActions";
import DashListToolbar from "@/AdminDashboard/components/DashListToolbar";
import ExportButton from "@/AdminDashboard/components/ExportButton";
import {
  couponStats,
  createCoupon,
  deleteCoupon,
  getCoupons,
  setCouponActive,
  updateCoupon,
} from "@/services/sales/couponsApi";
import CouponDialog from "./sections/CouponDialog";
import CouponsTable from "./sections/CouponsTable";
import { DAY, STATE_CHIP, gives, stateOf } from "./sections/couponState";
import DiscountsSummary from "./sections/DiscountsSummary";

/**
 * Discount codes — global-only, no product or category scoping. A coupon
 * still referenced by a past order's couponCode is a historical string, not
 * a live link, so deleting one never touches order history.
 */
export default function DashDiscounts() {
  const { toast } = useToast();
  const { format } = useCurrency();
  const { locale } = useLanguage();
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);

  const { data: coupons, loading } = useAsyncData(getCoupons, [revision]);
  const { data: stats, loading: statsLoading } = useAsyncData(couponStats, [revision]);
  const rows = useMemo(() => coupons ?? [], [coupons]);

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(null);
  const [dialog, setDialog] = useState({ open: false, initial: null, n: 0 });
  const [pendingDelete, setPendingDelete] = useState(null);

  // Dates in words, so "10/1/2026" is never January or October.
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }), [locale]);

  const usedBy = (coupon) => stats?.byCode?.[coupon.code.toUpperCase()] ?? { orders: 0, customers: 0, revenue: 0, discount: 0 };
  const withState = rows.map((c) => ({ coupon: c, state: stateOf(c, usedBy(c).orders) }));
  const count = (test) => withState.filter(test).length;
  const tabs = [
    { value: "all", label: "All", count: withState.length },
    { value: "live", label: "Live", count: count((r) => r.state === "live") },
    { value: "paused", label: "Paused", count: count((r) => r.state === "paused") },
    { value: "ended", label: "Ended", count: count((r) => r.state === "expired" || r.state === "redeemed") },
  ];
  const q = query.trim().toLowerCase();
  const visible = withState.filter(
    (r) =>
      (tab === "all" ? true : tab === "ended" ? r.state === "expired" || r.state === "redeemed" : r.state === tab) &&
      (!q || r.coupon.code.toLowerCase().includes(q) || (r.coupon.description ?? "").toLowerCase().includes(q)),
  );
  const exportColumns = [
    [(r) => r.coupon.code, "Code"], [(r) => gives(r.coupon, format), "Value"], [(r) => r.coupon.description, "Description"],
    [(r) => r.coupon.minOrderValue || "", "Minimum order (EUR)"], [(r) => usedBy(r.coupon).orders, "Orders"],
    [(r) => usedBy(r.coupon).revenue, "Revenue (EUR)"], [(r) => usedBy(r.coupon).discount, "Discount given (EUR)"],
    [(r) => r.coupon.expiresAt?.slice(0, 10) ?? "", "Expires"], [(r) => STATE_CHIP[r.state].label, "Status"],
  ];

  const openDialog = (initial) => setDialog((d) => ({ open: true, initial, n: d.n + 1 }));
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const save = async (form) => {
    const saved = dialog.initial ? await updateCoupon(dialog.initial.id, form) : await createCoupon(form);
    closeDialog();
    refresh();
    toast(`${saved.code} ${dialog.initial ? "saved" : "added"}.`, "success");
  };

  const toggleActive = async (coupon) => {
    try {
      await setCouponActive(coupon.id, !coupon.active);
      refresh();
      toast(`${coupon.code} ${coupon.active ? "paused" : "is live"}.`, "success");
    } catch (err) {
      toast(err.message ?? "Could not update that coupon.", "error");
    }
  };

  // A lapsed code comes back for another 30 days, live, in one step.
  const extend = async (coupon) => {
    try {
      const expiresAt = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10) + "T23:59:59Z";
      await updateCoupon(coupon.id, { ...coupon, expiresAt, active: true });
      refresh();
      toast(`${coupon.code} extended to ${dateFmt.format(new Date(expiresAt))}.`, "success");
    } catch (err) {
      toast(err.message ?? "Could not extend that coupon.", "error");
    }
  };

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
    } catch {
      toast("Could not copy that code.", "error");
    }
  };

  const confirmDelete = async () => {
    const coupon = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteCoupon(coupon.id);
      refresh();
      toast(`${coupon.code} deleted.`, "success");
    } catch (err) {
      toast(err.message ?? "Could not delete that coupon.", "error");
    }
  };

  if (loading) return <p className="text-[13px] text-espresso-soft">Loading…</p>;

  
  return (
    <section className="space-y-5">
      <DashHeaderActions>
        <ExportButton columns={exportColumns} rows={visible} filename="belioras-coupons.csv" />
        <Button icon={Plus} size="sm" onClick={() => openDialog(null)} className="h-10">
          Add<span className="hidden sm:inline"> coupon</span>
        </Button>
      </DashHeaderActions>

      <DiscountsSummary stats={stats} loading={statsLoading} activeCodes={count((r) => r.state === "live")} />

      <DashListToolbar tabs={tabs} tab={tab} onTabChange={setTab} tabsLabel="Coupons by state" query={query} onQueryChange={setQuery} placeholder="Search codes…" />

      {visible.length === 0 ? (
        <p className="border border-umber-50 bg-ivory-50 px-4 py-8 text-center text-[13px] text-espresso-soft">
          {rows.length === 0 ? "No coupons yet." : q ? "No codes match." : "No coupons here."}
        </p>
      ) : (
        <CouponsTable
          visible={visible}
          usedBy={usedBy}
          format={format}
          dateFmt={dateFmt}
          copied={copied}
          onCopy={copy}
          onToggle={toggleActive}
          onExtend={extend}
          onEdit={openDialog}
          onDelete={setPendingDelete}
        />
      )}

      <CouponDialog key={dialog.n} open={dialog.open} initial={dialog.initial} onClose={closeDialog} onSave={save} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.code ?? "this coupon"}?`}
        description="Past orders that used this code keep it in their history. This only removes it from checkout."
        confirmLabel="Delete"
      />
    </section>
  );
}
