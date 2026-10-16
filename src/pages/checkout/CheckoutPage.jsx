/* Page: Checkout - CheckoutPage */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Lock, ShoppingBag } from "lucide-react";

import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import PageShell from "../../components/layout/PageShell";
import { useCustomerAuth } from "@/context/auth/useAuthRealm";
import { useCart } from "../../context/CartContext";
import { useContentVersion } from "../../context/ContentContext";
import { useToast } from "../../context/ToastContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useScopedStorage } from "../../hooks/useScopedStorage";
import { placeOrder as payAndPlace } from "../../services/sales/checkoutApi";
import { PAYMENTS_SIMULATED, PAYMENT_METHODS } from "../../services/sales/paymentsApi";
import { cn } from "../../utils/cn";
import { getProducts } from "../../services/catalog/productsApi";
import { getSettings } from "../../services/content/settingsApi";
import { computeTotals, nonReturnableItems } from "../../utils/checkout";
import DeliveryForm from "./sections/DeliveryForm";
import OrderSummary from "./sections/OrderSummary";

export default function CheckoutPage() {

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCustomerAuth();
  const { items, clear } = useCart();

  const version = useContentVersion();

  const { data: settings } = useAsyncData(getSettings, [version]);
  const { data: catalog } = useAsyncData(getProducts, []);
  const [savedAddresses] = useScopedStorage("belioras:addresses", [], user?.id);

  const [coupon, setCoupon] = useState(null);
  const [method, setMethod] = useState("card");
  const [placing, setPlacing] = useState(false);

  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name ?? defaultAddress?.recipient ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      line1: defaultAddress?.line1 ?? "",
      city: defaultAddress?.city ?? "",
      postcode: defaultAddress?.postcode ?? "",
      country: defaultAddress?.country ?? "Germany",
    },
  });

  const country = watch("country");

  const totals = computeTotals({ items, country, coupon, settings });

  const nonReturnable = nonReturnableItems(items, catalog ?? []);

  const useSaved = (address) => {
    setValue("name", address.recipient ?? "", { shouldValidate: true });
    setValue("line1", address.line1 ?? "", { shouldValidate: true });
    setValue("city", address.city ?? "", { shouldValidate: true });
    setValue("postcode", address.postcode ?? "", { shouldValidate: true });
    setValue("country", address.country ?? "", { shouldValidate: true });
  };

  const placeOrder = async (values) => {
    if (!totals.shippable) {
      toast(`We don't ship to ${values.country} yet. Choose one of the countries listed.`, "error");
      return;
    }
    setPlacing(true);
    try {

      const order = await payAndPlace({
        userId: user?.id ?? null,
        email: values.email.trim().toLowerCase(),
        name: values.name.trim(),
        phone: values.phone?.trim() || null,
        items: items.map((i) => ({
          productId: i.id,
          slug: i.slug,
          name: i.name,
          // Kept on the order, so it still shows the piece it sold if the
          // product is later re-photographed, unpublished or deleted.
          image: i.image ?? null,
          price: i.price,
          quantity: i.quantity,
          size: i.size ?? null,
          color: i.color ?? null,
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        country: values.country,
        shippingAddress: [values.line1, values.city, values.postcode, values.country]
          .filter(Boolean)
          .join(", "),
      }, { method });

      clear();
      toast(`Payment received. Order ${order.id} is confirmed.`, "success");

      // Signed in, they can follow it in their account; a guest gets the
      // reference on a confirmation page, since it is the only way they will
      // find this order again.
      navigate(user ? `/account/orders/${order.id}` : `/checkout/confirmed/${order.id}`, {
        replace: true,
        state: { email: order.email },
      });
    } catch (err) {
      toast(err.message ?? "Could not place that order.", "error");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageShell eyebrow="Checkout" title="Your bag is empty" width="wide">
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to check out"
          description="Add a piece to your bag and it will appear here."
          action={{ label: "Browse the collection", to: "/shop" }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Checkout"
      title="Complete your order"
      intro="Delivery details, then payment. Your order is confirmed the moment payment succeeds."
      width="wide"
    >
      <form
        onSubmit={handleSubmit(placeOrder)}
        className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12"
      >
        <div className="space-y-6">
          <DeliveryForm
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
            savedAddresses={savedAddresses}
            onUseSaved={useSaved}
            signedIn={Boolean(user)}
          />

          <section aria-labelledby="payment-heading" className="border border-umber-50 bg-ivory-50 p-6">
            <h2 id="payment-heading" className="font-display text-xl tracking-wide text-espresso">Payment</h2>
            <div role="radiogroup" aria-label="Payment method" className="mt-4 grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "border px-4 py-3 text-left transition-colors",
                    method === m.id ? "border-espresso bg-brown-50/50" : "border-umber-100 hover:border-espresso/50",
                  )}
                >
                  <span className="block text-[14px] text-espresso">{m.label}</span>
                  <span className="block text-[12px] text-espresso-soft">{m.detail}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-espresso-soft">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-gold-700" aria-hidden="true" />
              {PAYMENTS_SIMULATED
                ? "Test mode: the payment is simulated and nothing is charged. When payments go live you pay on Stripe's or PayPal's secure page, and card details never touch this site."
                : "You pay on our payment provider's secure page. Card details never touch this site."}
            </p>
          </section>

          {/* EU withdrawal rights allow 14 days to change your mind, with a
              lawful exception for hygiene-sealed goods. The exception only
              holds if the customer was told before buying. */}
          {nonReturnable.length > 0 && (
            <section className="border border-umber-50 px-5 py-4">
              <p className="text-[13px] font-medium text-espresso">
                {nonReturnable.length === 1 ? "One piece is" : `${nonReturnable.length} pieces are`}{" "}
                non-returnable
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-espresso-soft">
                {nonReturnable.map((i) => i.name).join(", ")} — hair is sealed for hygiene and
                cannot be returned once opened. Your 14-day right to withdraw applies to
                everything else in this order.
              </p>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" loading={placing}>
              Pay {totals.shippable ? new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(totals.total) : ""} and place order
            </Button>
            <p className="text-[12px] text-espresso-soft">
              By ordering you accept our{" "}
              <a href="/terms-of-service" className="text-gold-700 underline underline-offset-4">
                terms
              </a>{" "}
              and{" "}
              <a href="/return-and-refund-policy" className="text-gold-700 underline underline-offset-4">
                returns policy
              </a>
              .
            </p>
          </div>
        </div>

        <OrderSummary
          items={items}
          totals={totals}
          coupon={coupon}
          onCoupon={setCoupon}
          customer={{ userId: user?.id, email: watch("email") }}
          disabled={placing}
        />
      </form>
    </PageShell>
  );
}
