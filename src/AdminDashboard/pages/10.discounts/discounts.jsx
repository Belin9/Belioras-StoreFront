/* Admin Dashboard Page: Discounts - discounts */
import { useMemo, useState } from "react";
import { Check, Copy, Pencil, Plus, Trash2 } from "lucide-react";

import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { cn } from "@/utils/cn";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import DashHeaderActions from "@/AdminDashboard/components/DashHeaderActions";
import DashTabs from "@/AdminDashboard/components/DashTabs";
import IconAction from "@/AdminDashboard/components/IconAction";
import Switch from "@/AdminDashboard/components/Switch";
import { STATUS_TONES } from "@/AdminDashboard/lib/constants";
import {
  couponStats,
  createCoupon,
  deleteCoupon,
  getCoupons,
  setCouponActive,
  updateCoupon,
} from "@/services/sales/couponsApi";
import CouponDialog from "./sections/CouponDialog";
import DiscountsSummary from "./sections/DiscountsSummary";

const DAY = 24 * 60 * 60 * 1000;
/** Warn this long before a code lapses. */
const EXPIRY_WARNING_DAYS = 14;

function gives(coupon, format) {
  if (coupon.type === "free_shipping") return "Free shipping";
  if (coupon.type === "percent") return `${coupon.value}% off`;
  return `${format(coupon.value)} off`;
}

/** Where a code stands: live, paused, or ended (expired or fully redeemed). */
function stateOf(coupon, used) {
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return "expired";
  if (coupon.maxUses && used >= coupon.maxUses) return "redeemed";
  return coupon.active ? "live" : "paused";
}

const STATE_CHIP = {
  live: { label: "Live", tone: "positive" },
  paused: { label: "Paused", tone: "pending" },
  expired: { label: "Expired", tone: "neutral" },
  redeemed: { label: "Fully redeemed", tone: "neutral" },
};

function daysLeft(coupon) {
  if (!coupon.expiresAt) return null;
  return Math.ceil((new Date(coupon.expiresAt).getTime() - Date.now()) / DAY);
}

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
  const visible = withState.filter((r) =>
    tab === "all" ? true : tab === "ended" ? r.state === "expired" || r.state === "redeemed" : r.state === tab,
  );

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

  const TH = "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso-soft";

  return (
    <section className="space-y-5">
      <DashHeaderActions>
        <Button icon={Plus} size="sm" onClick={() => openDialog(null)} className="h-10">
          Add<span className="hidden sm:inline"> coupon</span>
        </Button>
      </DashHeaderActions>

      <DiscountsSummary stats={stats} loading={statsLoading} activeCodes={count((r) => r.state === "live")} />

      <DashTabs ariaLabel="Coupons by state" options={tabs} value={tab} onChange={setTab} />

      {visible.length === 0 ? (
        <p className="border border-umber-50 bg-ivory-50 px-4 py-8 text-center text-[13px] text-espresso-soft">
          {rows.length === 0 ? "No coupons yet." : "No coupons here."}
        </p>
      ) : (
        <div className="relative overflow-x-auto border border-umber-50 bg-ivory-50">
          <table className="dash-cards w-full text-[13px] md:min-w-[860px]">
            <thead className="border-b border-umber-50">
              <tr>
                <th scope="col" className={TH}>Code</th>
                <th scope="col" className={TH}>Value</th>
                <th scope="col" className={TH}>Conditions</th>
                <th scope="col" className={TH}>Usage</th>
                <th scope="col" className={TH}>Expires</th>
                <th scope="col" className={TH}>Status</th>
                <th scope="col" className="w-px px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-umber-50">
              {visible.map(({ coupon, state }) => {
                const mine = usedBy(coupon);
                const left = daysLeft(coupon);
                const soon = state !== "expired" && left !== null && left <= EXPIRY_WARNING_DAYS;
                const chip = STATE_CHIP[state];
                const conditions = [
                  coupon.minOrderValue > 0 ? `Min ${format(coupon.minOrderValue)}` : null,
                  coupon.maxDiscount ? `Capped at ${format(coupon.maxDiscount)}` : null,
                  coupon.maxUsesPerCustomer ? (coupon.maxUsesPerCustomer === 1 ? "One use per customer" : `${coupon.maxUsesPerCustomer} uses per customer`) : null,
                ].filter(Boolean);
                return (
                  <tr key={coupon.id} className="align-top">
                    <td data-primary className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[13px] font-semibold tracking-wide text-espresso">{coupon.code}</span>
                        <button
                          type="button"
                          onClick={() => copy(coupon.code)}
                          aria-label={`Copy ${coupon.code}`}
                          title="Copy code"
                          className="liquid-hover rounded-full p-1.5 text-espresso/40 transition-colors hover:text-espresso"
                        >
                          {copied === coupon.code ? (
                            <Check className="size-3.5 text-success" aria-hidden="true" />
                          ) : (
                            <Copy className="liquid-icon size-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      {coupon.description && <p className="mt-0.5 max-w-[16rem] text-[12px] text-espresso-soft">{coupon.description}</p>}
                    </td>
                    <td data-label="Value" className="whitespace-nowrap px-4 py-3 tabular-nums text-espresso">{gives(coupon, format)}</td>
                    <td data-label="Conditions" className="px-4 py-3 text-[12px] text-espresso-soft">
                      {conditions.length ? conditions.map((c) => <p key={c}>{c}</p>) : <span className="text-espresso/40">None</span>}
                    </td>
                    <td data-label="Usage" className="px-4 py-3 text-[12px] tabular-nums text-espresso-soft">
                      {mine.orders === 0 ? (
                        "Not yet used"
                      ) : (
                        <>
                          <p className="text-espresso">
                            {mine.orders} {mine.orders === 1 ? "order" : "orders"} · {mine.customers} {mine.customers === 1 ? "customer" : "customers"}
                          </p>
                          <p>
                            {format(mine.revenue)} revenue{coupon.type === "free_shipping" ? " · shipping waived" : ` · ${format(mine.discount)} off`}
                          </p>
                        </>
                      )}
                      {coupon.maxUses ? (
                        <div className="mt-1.5">
                          <p>{mine.orders} of {coupon.maxUses} uses</p>
                          <span aria-hidden="true" className="mt-1 block h-1 w-28 bg-umber-50">
                            <span className="block h-full bg-gold-500" style={{ width: `${Math.min(100, (mine.orders / coupon.maxUses) * 100)}%` }} />
                          </span>
                        </div>
                      ) : null}
                    </td>
                    <td data-label="Expires" className="whitespace-nowrap px-4 py-3 text-[12px]">
                      {coupon.expiresAt ? (
                        soon ? (
                          <span className="font-medium text-warning">
                            {left <= 0 ? "Expires today" : `Expires in ${left} ${left === 1 ? "day" : "days"}`}
                            <span className="block font-normal text-espresso-soft">{dateFmt.format(new Date(coupon.expiresAt))}</span>
                          </span>
                        ) : (
                          <span className="text-espresso-soft">{state === "expired" ? "Expired " : ""}{dateFmt.format(new Date(coupon.expiresAt))}</span>
                        )
                      ) : (
                        <span className="text-espresso-soft">No expiry</span>
                      )}
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      {state === "live" || state === "paused" ? (
                        <Switch
                          checked={coupon.active}
                          onChange={() => toggleActive(coupon)}
                          label={coupon.active ? `Pause ${coupon.code}` : `Make ${coupon.code} live`}
                          text={coupon.active ? "Live" : "Paused"}
                        />
                      ) : (
                        <span className="flex flex-col items-start gap-1.5">
                          <span className={cn("inline-flex items-center whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", STATUS_TONES[chip.tone])}>
                            {chip.label}
                          </span>
                          {state === "expired" && (
                            <button type="button" onClick={() => extend(coupon)} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-800 underline underline-offset-4 hover:text-espresso">
                              Extend 30 days
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconAction label={`Edit ${coupon.code}`} icon={Pencil} onClick={() => openDialog(coupon)} />
                        <IconAction label={`Delete ${coupon.code}`} icon={Trash2} destructive onClick={() => setPendingDelete(coupon)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
