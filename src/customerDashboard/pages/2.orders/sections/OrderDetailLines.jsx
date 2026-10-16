/* Customer Dashboard Page: Orders - OrderDetailLines */
import { Link } from "react-router-dom";

import { sizeLabel } from "../../../../utils/sizeLabel";

export default function OrderLines({ order, thumbnails, taxonomy, format, discount }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-umber-50 bg-white">
      <ul className="divide-y divide-umber-50">
        {order.items.map((item) => (
          <li
            key={`${item.productId}-${item.size}-${item.color}`}
            className="flex items-start gap-4 px-5 py-4 sm:px-6"
          >
            {/* The piece itself. This was a letter tile — the first character
                of the product name in a coloured square — because order items
                carry no image; it is resolved by productId. */}
            <Link
              to={`/product/${item.slug ?? item.productId}`}
              className="block size-16 shrink-0 overflow-hidden rounded-xl border border-umber-50"
              aria-label={item.name}
            >
              {item.image || thumbnails[item.productId] ? (
                <img
                  // The photo saved on the order first; the live catalogue only
                  // for orders placed before lines kept one.
                  src={item.image || thumbnails[item.productId]}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center bg-gold-500/15 text-lg font-medium text-gold-700">
                  {item.name.charAt(0)}
                </span>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                to={`/product/${item.slug ?? item.productId}`}
                className="text-sm font-medium text-espresso transition-colors hover:text-gold-700"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-xs text-espresso-soft">
                Qty {item.quantity}
                {item.size ? ` · Size ${sizeLabel(taxonomy, item.size)}` : ""}
                {item.color ? ` · ${item.color}` : ""}
              </p>
            </div>

            <p className="shrink-0 text-sm font-semibold text-espresso">
              {format(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="space-y-2 border-t border-umber-50 px-5 py-5 sm:px-6">
        <TotalRow label="Subtotal" amount={format(order.subtotal)} />
        <TotalRow label="Shipping" amount={format(order.shipping)} />
        <TotalRow label="Tax" amount={format(order.tax)} />
        {/* This printed format(order.total) — the order total — beside the
            coupon label, so a discount line showed what was actually paid.
            Hidden when it comes to nothing. */}
        {order.couponCode && discount > 0 ? (
          <TotalRow label={`Coupon ${order.couponCode}`} amount={`−${format(discount)}`} />
        ) : null}
        <div className="flex items-center justify-between border-t border-umber-50 pt-3">
          <dt className="font-display text-base font-medium tracking-wide">Total</dt>
          <dd className="font-display text-xl font-semibold">{format(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

function TotalRow({ label, amount }) {
  return (
    <div className="flex items-center justify-between text-sm text-espresso-soft">
      <dt>{label}</dt>
      <dd>{amount}</dd>
    </div>
  );
}
