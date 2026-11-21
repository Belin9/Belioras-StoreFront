/* Details Care Shipping And Product Safety */
import { Link } from "react-router-dom";
import { Droplets, Info, Ruler, ShieldCheck, Truck } from "lucide-react";

import CareIcon from "../../../components/storefront/CareIcon";
import { useCurrency } from "../../../context/CurrencyContext";
import { useLanguage } from "../../../context/LanguageContext";
import { useContentVersion } from "../../../context/ContentContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSettings } from "../../../services/content/settingsApi";
import { splitCare } from "../../../utils/careSymbols";
import { isNonReturnable } from "../../../utils/checkout";

export default function ProductPageAccordions({ product }) {
  const { t } = useLanguage();
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);
  const details = [...(product.details ?? []), ...(product.materials ?? [])];

  return (
    <div className="mt-10 divide-y divide-umber-50 border-y border-umber-50">
      {product.description?.trim() && (
        <Accordion icon={Info} title={t("pdp.description", "Description")}>
          <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
        </Accordion>
      )}

      {details.length > 0 && (
        <Accordion icon={Ruler} title={t("pdp.details", "Details & Composition")}>
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

      <Accordion icon={Truck} title={t("pdp.shipping", "Shipping & Returns")}>
        <ShippingReturns product={product} zones={settings?.shipping?.zones ?? []} />
      </Accordion>

      <ProductSafety product={product} gpsr={settings?.gpsr} />
    </div>
  );
}

// Native <details>, so it works before hydration and needs no open state.
// An icon, the name, and a + at the right that turns to × when open.
function Accordion({ icon: Icon, title, children }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3.5 py-5 text-[15px] text-espresso marker:hidden [&::-webkit-details-marker]:hidden">
        {Icon && <Icon className="size-[18px] shrink-0 text-espresso-soft" strokeWidth={1.4} aria-hidden="true" />}
        <span className="flex-1">{title}</span>
        <span aria-hidden="true" className="text-xl font-light leading-none text-espresso-soft transition-transform duration-200 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-5 pl-[32px] text-sm text-espresso-soft">{children}</div>
    </details>
  );
}

const linkClass = "underline underline-offset-2 hover:text-gold-700";

/**
 * Rates from the shipping zones in settings (dashboard › Shipping), so the
 * panel cannot drift from what checkout charges. Returns follow this piece:
 * hair is sold sealed and only comes back unopened. The full terms are on the
 * policy pages, linked below.
 */
function ShippingReturns({ product, zones }) {
  const { t } = useLanguage();
  const { format } = useCurrency();

  return (
    <div className="space-y-3 leading-relaxed">
      {zones.length > 0 && (
        <ul className="space-y-1">
          {zones.map((z) => (
            <li key={z.id}>
              <span className="text-espresso">{z.label}</span>: {zoneRate(z, t, format)}
              {z.days && <span> · {z.days}</span>}
            </li>
          ))}
        </ul>
      )}
      <p>
        {isNonReturnable(product)
          ? t(
              "pdp.returnsSealed",
              "Returnable within 14 days only while unopened and sealed. Once opened, hair cannot be returned, for hygiene reasons.",
            )
          : t("pdp.returnsStandard", "Unworn pieces with their tags attached can be returned within 14 days.")}
      </p>
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        <Link to="/shipping-policy" className={linkClass}>
          {t("pdp.shippingPolicy", "Shipping policy")}
        </Link>
        <Link to="/return-and-refund-policy" className={linkClass}>
          {t("pdp.returnsPolicy", "Returns & refunds")}
        </Link>
      </p>
    </div>
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

/**
 * EU product safety (GPSR). The manufacturer is the piece's own maker, set on
 * the product; Belioras is the seller and the EU contact, from Settings ›
 * Product safety. Its postal address is in the Impressum only, at the owner's
 * request.
 */
function ProductSafety({ product, gpsr }) {
  const { t } = useLanguage();
  const maker = product.manufacturer;
  const warnings = product.safetyWarnings ?? [];
  const seller = gpsr?.manufacturer;

  if (!maker?.name && !seller && !warnings.length) return null;

  return (
    <Accordion icon={ShieldCheck} title={t("pdp.safety", "Product Safety")}>
      <dl className="space-y-1 leading-relaxed">
        {maker?.name && (
          <Row label={t("pdp.safetyManufacturer", "Manufacturer")}>
            {maker.name}
            {maker.address && <>, {maker.address}</>}
            {maker.contact && <>, <ContactLink value={maker.contact} /></>}
          </Row>
        )}
        {seller && <Row label={t("pdp.safetySeller", "Sold by")}>{seller}</Row>}
        {gpsr?.email && (
          <Row label={t("pdp.safetyContact", "Safety enquiries")}>
            <a href={`mailto:${gpsr.email}`} className={linkClass}>
              {gpsr.email}
            </a>
          </Row>
        )}
        {seller && (
          <Row label={t("pdp.safetyAddress", "Postal address")}>
            <Link to="/impressum" className={linkClass}>
              Impressum
            </Link>
          </Row>
        )}
      </dl>
      {warnings.length > 0 && (
        <>
          <p className="mt-3 text-espresso">{t("pdp.safetyWarnings", "Warnings")}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </>
      )}
    </Accordion>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <dt className="inline">{label}: </dt>
      <dd className="inline">{children}</dd>
    </div>
  );
}

/** An email or a website, as a link; anything else as text. */
function ContactLink({ value }) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return (
      <a href={`mailto:${value}`} className={linkClass}>
        {value}
      </a>
    );
  }
  if (/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(value)) {
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {value}
      </a>
    );
  }
  return value;
}
