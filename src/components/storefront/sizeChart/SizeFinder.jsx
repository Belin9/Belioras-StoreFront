/* Storefront Component: SizeFinder */
import { useId, useState } from "react";

import { useLanguage } from "../../../context/LanguageContext";
import { CM_PER_INCH, findSize } from "../../../utils/sizing";

const FIELDS = [
  { key: "bust", label: "pdp.finderBust", fallback: "Bust" },
  { key: "waist", label: "pdp.finderWaist", fallback: "Waist" },
  { key: "hip", label: "pdp.finderHip", fallback: "Hip" },
];

/**
 * "Find your size": a shopper's measurements in, a size out, from the same
 * garment guide the table below shows. Any one measurement is enough; cm or
 * inches follow the chart's unit toggle.
 */
export default function SizeFinder({ garment, unit = "cm" }) {
  const { t } = useLanguage();
  const id = useId();
  const [m, setM] = useState({ bust: "", waist: "", hip: "" });
  const [result, setResult] = useState(null);
  const inches = unit === "in";

  const toCm = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    return inches ? n * CM_PER_INCH : n;
  };

  const find = (e) => {
    e.preventDefault();
    const found = findSize(garment?.rows, { bust: toCm(m.bust), waist: toCm(m.waist), hip: toCm(m.hip) });
    setResult(found ?? { empty: true });
  };

  if (!garment?.rows?.length) return null;

  return (
    <form onSubmit={find} noValidate className="border border-umber-50 bg-ivory-100 p-5">
      <p className="font-display text-lg text-espresso">{t("pdp.finderTitle", "Find your size")}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-espresso-soft">
        {t("pdp.finderIntro", "Enter your body measurements. One is enough; more makes it surer.")}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} htmlFor={`${id}-${f.key}`} className="flex flex-col">
            <span className="input-label">
              {t(f.label, f.fallback)} ({inches ? "in" : "cm"})
            </span>
            <input
              id={`${id}-${f.key}`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              value={m[f.key]}
              onChange={(e) => {
                setM({ ...m, [f.key]: e.target.value });
                setResult(null);
              }}
              className="input"
            />
          </label>
        ))}
      </div>
      <button type="submit" className="mt-4 h-11 w-full border border-espresso bg-espresso text-[12px] font-medium uppercase tracking-[0.16em] text-ivory-50 transition-colors hover:bg-espresso-600">
        {t("pdp.finderButton", "Show my size")}
      </button>

      {result && (
        <p role="status" className="mt-4 text-[14px] leading-relaxed text-espresso">
          {result.empty ? (
            t("pdp.finderEmpty", "Enter at least one measurement.")
          ) : (
            <>
              {t("pdp.finderResult", "Your size is")} <strong className="font-semibold">{result.size}</strong>
              {!result.exact && <span className="text-espresso-soft"> ({t("pdp.finderClosest", "closest match")})</span>}.
              {result.between && <span className="block text-[13px] text-espresso-soft">{t("pdp.finderBetween", "You are between sizes, so we suggest the larger.")}</span>}
            </>
          )}
        </p>
      )}
    </form>
  );
}
