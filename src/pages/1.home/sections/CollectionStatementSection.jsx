/* Page: Home - CollectionStatementSection */
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { useLanguage } from "../../../context/LanguageContext";
import { useContentVersion } from "../../../context/ContentContext";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSettings } from "../../../services/content/settingsApi";

export default function CollectionStatementSection() {
  const { t } = useLanguage();
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);
  // Written in Dashboard › Home page › Statement; until then, the translated wording.
  const s = settings?.home?.statement ?? {};
  if (s.show === false) return null;
  const pick = (value, key, fallback) => (value?.trim() ? value : t(key, fallback));

  const titleLines = pick(s.title, "home.heroTitle", "Quiet Luxury,\nWorn Loudly.").split("\n");

  return (
    <section className="bg-ivory-50" aria-labelledby="collection-statement">
      {/* Container and rhythm match the prototype rather than the site's
          default section spacing, so the block sits exactly as reviewed. */}
      <div className="mx-auto max-w-[87.5rem] px-6 py-20 text-center md:px-10 md:py-28">
        <p className="eyebrow">{pick(s.eyebrow, "home.heroKicker", "The Belioras Collection")}</p>

        <h2
          id="collection-statement"
          className="mt-6 font-display text-4xl leading-tight text-espresso md:text-6xl"
        >
          {titleLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-sm tracking-wide text-espresso-soft md:text-base">
          {pick(s.text, "home.heroSub", "Considered silhouettes in cashmere, silk and wool — cut for the modern wardrobe.")}
        </p>

        <Link
          to={s.ctaTo?.trim() || "/shop"}
          className="group mt-10 inline-flex items-center gap-2 border-b border-gold-500 pb-1 text-[12px] font-medium uppercase tracking-[0.2em] text-espresso transition-colors hover:text-gold-700"
        >
          {pick(s.ctaLabel, "home.heroCta", "Explore the Collection")}
          <ArrowRight
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
