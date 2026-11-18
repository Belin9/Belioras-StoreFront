/* Page: Checkout - OrderSummary */
import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";

import { useCurrency } from "../../../context/CurrencyContext";
import { useLanguage } from "../../../context/LanguageContext";
import { formatCurrency } from "../../../utils/formatCurrency";
import { validateCoupon } from "../../../services/sales/couponsApi";
import { getTaxonomy } from "../../../services/catalog/navigationApi";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { cn } from "../../../utils/cn";
import { sizeLabel } from "../../../utils/sizeLabel";
import { shownColor } from "../../../utils/productColors";

export default function OrderSummary({ items, totals, coupon, onCoupon, disabled, customer }) {
  const { format, currency } = useCurrency();
  const { locale } = useLanguage();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { data: taxonomy } = useAsyncData(getTaxonomy, []);

  const apply = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setError("");
    try {
      const valid = await validateCoupon(code, totals.subtotal, customer);
      onCoupon(valid);
      setCode("");
      toast(`${valid.code} applied to your order.`, "success");
    } catch (err) {
      const message = err.message ?? "That code is not valid.";
      setError(message);
      toast(message, "error");
    } finally {
      setChecking(false);
    }
  };

  return (
    <aside className="border border-umber-50 bg-ivory-50 p-6">
      <h2 className="font-display text-xl tracking-wide text-espresso">Your order</h2>

      <ul className="mt-5 space-y-4 border-b border-umber-50 pb-5">
        {items.map((item) => (
          <li key={`${item.id}-${item.size}-${item.color}`} className="flex gap-3">
            <img src={item.image} alt="" className="size-16 shrink-0 border border-umber-50 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-espresso">{item.name}</p>
              <p className="mt-0.5 text-[11px] text-espresso-soft">
                {[
                  item.size && `Size ${sizeLabel(taxonomy, item.size)}`,
                  shownColor(item.color),
                  `Qty ${item.quantity}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <span className="shrink-0 text-[13px] tabular-nums text-espresso">
              {format(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      {coupon ? (
        <div className="mt-5 flex items-center justify-between gap-3 border border-gold-500/40 bg-gold-500/5 px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-[12px] text-espresso">
            <Tag className="size-3.5 shrink-0 text-gold-700" aria-hidden="true" />
            <span className="truncate font-medium">{coupon.code}</span>
          </span>
          <button
            type="button"
            onClick={() => onCoupon(null)}
            aria-label={`Remove coupon ${coupon.code}`}
            className="shrink-0 text-espresso/40 transition-colors hover:text-error liquid-hover rounded-full"
          >
            <X className="liquid-icon size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <label htmlFor="coupon" className="input-label">
            Discount code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="WELCOME10"
              disabled={disabled}
              onKeyDown={(e) => {
                // Enter applies the code rather than submitting the order.
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply();
                }
              }}
              className="input flex-1 uppercase"
            />
            <button
              type="button"
              onClick={apply}
              disabled={disabled || checking || !code.trim()}
              className="btn btn-md btn-secondary shrink-0"
            >
              {checking && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              Apply
            </button>
          </div>
          {error && (
            <p role="alert" className="input-helper mt-1.5 text-error">
              {error}
            </p>
          )}
        </div>
      )}

      <dl className="mt-6 space-y-2 border-t border-umber-50 pt-5 text-[13px]">
        <Row label="Subtotal" value={format(totals.subtotal)} />
        {totals.discount > 0 && (
          <Row label="Discount" value={`−${format(totals.discount)}`} accent />
        )}
        <Row
          label={`Shipping · ${totals.zone.label ?? "Standard"}`}
          value={!totals.shippable ? "Not available" : totals.qualifiesFree ? "Complimentary" : format(totals.shipping)}
          accent={totals.qualifiesFree}
        />

        {totals.freeShippingGap != null && totals.freeShippingGap > 0 && (
          <p className="pt-1 text-[11px] text-espresso-soft">
            {format(totals.freeShippingGap)} more for complimentary shipping.
          </p>
        )}

        <div className="flex items-baseline justify-between border-t border-umber-50 pt-3">
          <dt className="font-display text-base tracking-wide text-espresso">Total</dt>
          <dd className="font-display text-xl tabular-nums text-espresso">
            {format(totals.total)}
          </dd>
        </div>

        {/* A component of the total, not a line added to it. */}
        <p className="text-[11px] text-espresso-soft">Includes {format(totals.tax)} VAT</p>

        {/* Orders are charged in euros, so a shopper viewing another currency
            would otherwise see one figure here and another on the pay button. */}
        {currency !== "EUR" && totals.shippable && (
          <p className="text-[11px] leading-relaxed text-espresso-soft">
            You are charged{" "}
            <span className="font-medium text-espresso">{formatCurrency(totals.total, "EUR", locale)}</span>{" "}
            in euros. {currency} amounts are an estimate; your bank converts at its own rate.
          </p>
        )}
      </dl>
    </aside>
  );
}

function Row({ label, value, accent = false }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-espresso-soft">{label}</dt>
      <dd className={cn("tabular-nums", accent ? "text-gold-700" : "text-espresso")}>{value}</dd>
    </div>
  );
}
