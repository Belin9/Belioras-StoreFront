/* Product Page Accordions: Description, Size Guide, Details, Care and the policies */
import { Link } from "react-router-dom";
import { Clock, Droplets, Info, Layers, Leaf, RotateCcw, Ruler, Truck } from "lucide-react";

import CareIcon from "../../../components/storefront/CareIcon";
import RichText from "../../../components/shared/RichText";
import SizeChart from "../../../components/storefront/sizeChart/SizeChart";
import { sizeChartKindFor, sizeChartLabelFor } from "../../../components/storefront/sizeChart/sizeChartKind";
import { useCurrency } from "../../../context/CurrencyContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useContentVersion } from "../../../context/ContentContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSettings } from "../../../services/content/settingsApi";
import { splitCare } from "../../../utils/careSymbols";
import { isNonReturnable } from "../../../utils/checkout";

/**
 * The rows under Add to bag. The policy texts are written in Settings ›
 * Product page (an empty text hides its row); the shipping rates come from
 * the shipping zones and the returns line from the piece itself, so neither
 * can disagree with checkout.
 */
export default function ProductPageAccordions({ product }) {
  const { t } = useLanguage();
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);
  const details = [...(product.details ?? []), ...(product.materials ?? [])];
  const texts = settings?.productPage ?? {};
  const chartKind = sizeChartKindFor(product);

  return (
    <div className="mt-10 divide-y divide-umber-50 border-y border-umber-50">
      {product.description?.trim() && (
        <Accordion icon={Info} title={t("pdp.description", "Description")}>
          <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
        </Accordion>
      )}

      {chartKind && (
        <Accordion icon={Ruler} title={chartKind === "hair" ? t("pdp.lengthGuideRow", sizeChartLabelFor("hair")) : t("pdp.sizeGuideRow", "Size Guide")}>
          <SizeChart kind={chartKind} />
        </Accordion>
      )}

      {details.length > 0 && (
        <Accordion icon={Layers} title={t("pdp.details", "Details & Composition")}>
          <ul className="list-disc space-y-1 pl-5">
            {details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Accordion>
      )}

      {product.care?.length > 0 && (
        <Accordion icon={Droplets} title={t("pdp.care", "Care Instructions")}>
          <ul className="space-y-2.5">
            {splitCare(product.care).symbols.map((s) => (
              <li key={s.id} className="flex items-center gap-3 text-espresso">
                <CareIcon name={s.icon} className="size-5 shrink-0" />
                {s.label}
              </li>
            ))}
          </ul>
          {splitCare(product.care).notes.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {splitCare(product.care).notes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </Accordion>
      )}

      <Accordion icon={Truck} title={t("pdp.shippingRow", "Shipping Policy")}>
        <ShippingRates zones={settings?.shipping?.zones ?? []} />
        <RichText text={texts.shipping} className="mt-4" />
        <p className="mt-4">
          <Link to="/shipping-policy" className={linkClass}>
            {t("pdp.shippingPolicyLink", "Shipping & delivery details")}
          </Link>
        </p>
      </Accordion>

      {product.isPreOrder && texts.preOrder?.trim() && (
        <Accordion icon={Clock} title={t("pdp.preOrder", "Pre-Order Policy")}>
          <RichText text={texts.preOrder} />
        </Accordion>
      )}

      <Accordion icon={RotateCcw} title={t("pdp.returnsRow", "Return & Refund Policy")}>
        <p className="leading-relaxed text-espresso">
          {isNonReturnable(product)
            ? t(
                "pdp.returnsSealed",
                "Returnable within 14 days only while unopened and sealed. Once opened, hair cannot be returned, for hygiene reasons.",
              )
            : t("pdp.returnsStandard", "Unworn pieces with their tags attached can be returned within 14 days.")}
        </p>
        <RichText text={texts.returns} className="mt-4" />
        <p className="mt-4">
          <Link to="/return-and-refund-policy" className={linkClass}>
            {t("pdp.returnsPolicyLink", "Read the full Return & Refund Policy")}
          </Link>
        </p>
      </Accordion>

      {texts.responsible?.trim() && (
        <Accordion icon={Leaf} title={t("pdp.responsible", "Responsible Production")}>
          <RichText text={texts.responsible} />
        </Accordion>
      )}
    </div>
  );
}

// Native <details>, so it works before hydration and needs no open state.
// An icon, the name, and a + at the right that turns to × when open.
function Accordion({ icon: Icon, title, children }) {
  return (
    <details className="group">
      <summary className="-mx-3 flex cursor-pointer list-none items-center gap-3.5 px-3 py-5 text-[15px] text-espresso transition-colors marker:hidden group-open:bg-espresso group-open:text-ivory-50 [&::-webkit-details-marker]:hidden">
        {Icon && <Icon className="size-[18px] shrink-0 text-espresso-soft group-open:text-ivory-50" strokeWidth={1.4} aria-hidden="true" />}
        <span className="flex-1">{title}</span>
        <span aria-hidden="true" className="text-xl font-light leading-none text-espresso-soft transition-transform duration-200 group-open:rotate-45 group-open:text-ivory-50">
          +
        </span>
      </summary>
      <div className="py-5 pl-[32px] text-sm text-espresso-soft">{children}</div>
    </details>
  );
}

const linkClass = "underline underline-offset-2 hover:text-gold-700";

/** The live rates, from the shipping zones checkout charges (dashboard › Shipping). */
function ShippingRates({ zones }) {
  const { t } = useLanguage();
  const { format } = useCurrency();
  if (!zones.length) return null;
  return (
    <ul className="space-y-1 leading-relaxed">
      {zones.map((z) => (
        <li key={z.id}>
          <span className="text-espresso">{z.label}</span>: {zoneRate(z, t, format)}
          {z.days && <span> · {z.days}</span>}
        </li>
      ))}
    </ul>
  );
}

function zoneRate(zone, t, format) {
  const flat = Number(zone.flat) || 0;
  if (flat === 0) return t("pdp.shippingFree", "free");
  if (zone.freeThreshold) {
    return t("pdp.shippingFreeOver", "{rate}, free over {threshold}", {
      rate: format(flat),
      threshold: format(zone.freeThreshold),
    });
  }
  return format(flat);
}
