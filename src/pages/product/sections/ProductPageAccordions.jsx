/* Details Care Shipping And Product Safety */
import { Link } from "react-router-dom";

import CareIcon from "../../../components/storefront/CareIcon";
import { useLanguage } from "../../../context/LanguageContext";
import { useContentVersion } from "../../../context/ContentContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSettings } from "../../../services/content/settingsApi";
import { splitCare } from "../../../utils/careSymbols";

export default function ProductPageAccordions({ product }) {
  const { t } = useLanguage();
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);
  const gpsr = settings?.gpsr;

  return (
    <div className="mt-10 divide-y divide-umber-50 border-y border-umber-50">
      <Accordion title={t("pdp.details", "Details & composition")}>
        <ul className="list-disc space-y-1 pl-5">
          {[...(product.details ?? []), ...(product.materials ?? [])].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Accordion>

      {product.care?.length > 0 && (
        <Accordion title={t("pdp.care", "Care instructions")}>
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

      <Accordion title={t("pdp.shipping", "Shipping & returns")}>
        <p className="leading-relaxed">
          {t(
            "pdp.shippingBody",
            "Free shipping in Germany, and across the EU on orders over €250, tracked with DHL. Unworn pieces can be returned within 14 days; opened hair cannot, for hygiene reasons.",
          )}
        </p>
      </Accordion>

      {/* EU product safety (GPSR) contact, kept on the product it concerns.
          The postal address is in the Impressum only, at the owner's request. */}
      {gpsr?.manufacturer && (
        <Accordion title={t("pdp.safety", "Product safety")}>
          <p className="leading-relaxed">
            {t("pdp.safetyManufacturer", "Manufacturer")}: {gpsr.manufacturer}
            {gpsr.email && (
              <>
                <br />
                {t("pdp.safetyContact", "Safety enquiries")}:{" "}
                <a href={`mailto:${gpsr.email}`} className="underline underline-offset-2 hover:text-gold-700">
                  {gpsr.email}
                </a>
              </>
            )}
            <br />
            {t("pdp.safetyAddress", "Postal address")}:{" "}
            <Link to="/impressum" className="underline underline-offset-2 hover:text-gold-700">
              Impressum
            </Link>
          </p>
        </Accordion>
      )}
    </div>
  );
}

// Native <details>, so it works before hydration and needs no open state.
function Accordion({ title, children }) {
  return (
    <details className="group py-4">
      <summary className="flex cursor-pointer list-none items-center text-[11px] font-semibold uppercase tracking-[0.22em] text-espresso marker:hidden">
        <span
          aria-hidden="true"
          className="mr-2 inline-block transition-transform duration-200 group-open:rotate-45"
        >
          +
        </span>
        {title}
      </summary>
      <div className="mt-3 text-sm text-espresso-soft">{children}</div>
    </details>
  );
}
