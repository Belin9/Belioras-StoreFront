/* Admin Dashboard Page: Discounts - CouponsTable */
import { Check, Copy, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/utils/cn";
import IconAction from "@/AdminDashboard/components/IconAction";
import Switch from "@/AdminDashboard/components/Switch";
import { STATUS_TONES } from "@/AdminDashboard/lib/constants";
import { EXPIRY_WARNING_DAYS, STATE_CHIP, daysLeft, gives } from "./couponState";

const TH = "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso-soft";

/** The coupon list: code, value, conditions, usage, expiry, status, actions. Cards on a phone. */
export default function CouponsTable({ visible, usedBy, format, dateFmt, copied, onCopy, onToggle, onExtend, onEdit, onDelete }) {
  return (
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
                      onClick={() => onCopy(coupon.code)}
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
                      onChange={() => onToggle(coupon)}
                      label={coupon.active ? `Pause ${coupon.code}` : `Make ${coupon.code} live`}
                      text={coupon.active ? "Live" : "Paused"}
                    />
                  ) : (
                    <span className="flex flex-col items-start gap-1.5">
                      <span className={cn("inline-flex items-center whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", STATUS_TONES[chip.tone])}>
                        {chip.label}
                      </span>
                      {state === "expired" && (
                        <button type="button" onClick={() => onExtend(coupon)} className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-800 underline underline-offset-4 hover:text-espresso">
                          Extend 30 days
                        </button>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <IconAction label={`Edit ${coupon.code}`} icon={Pencil} onClick={() => onEdit(coupon)} />
                    <IconAction label={`Delete ${coupon.code}`} icon={Trash2} destructive onClick={() => onDelete(coupon)} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
