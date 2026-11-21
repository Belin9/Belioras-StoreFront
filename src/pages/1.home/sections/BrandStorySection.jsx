/* Page: Home - BrandStorySection */
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { useAsyncData } from "../../../hooks/useAsyncData";
import { useContentVersion } from "../../../context/ContentContext";
import { getSettings } from "../../../services/content/settingsApi";

export default function BrandStorySection() {

  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);

  const story = settings?.brandStory;

  if (!story || story.show === false) return null;

  return (
    // Espresso band. Moving the newsletter into the footer removed one of the
    // page's few dark sections, and the brief was explicit that white must not
    // dominate — this restores the balance.
    <section aria-labelledby="brand-story-title" className="bg-espresso text-ivory-50">
      <div className="container-main grid items-center gap-12 py-section-mobile md:grid-cols-2 md:py-section-desktop">
        <div className="order-2 md:order-1">
          <img
            src={story.image || "https://ik.imagekit.io/sbgenu6wj/Belioras/Home/model-belioras123.jpeg"}
            alt={story.imageAlt ?? "Inside the Belioras atelier"}
            loading="lazy"
            className="w-full rounded-lg border border-gold-500/25"
          />
        </div>
        <div className="order-1 max-w-xl md:order-2">
          <p className="eyebrow !text-gold-400">{story.eyebrow || "Our Maison"}</p>
          <h2
            id="brand-story-title"
            className="mt-3 font-display text-3xl tracking-wide text-ivory-50 md:text-4xl"
          >
            {story.heading}
          </h2>
          <p className="mt-6 leading-relaxed text-ivory-50/70">{story.body}</p>

          {story.stats?.length > 0 && (
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-ivory-50/15 pt-8">
              {story.stats.map(({ value, label }) => (
                <div key={label}>
                  <dd className="font-display text-3xl text-gold-400">{value}</dd>
                  <dt className="mt-1 text-xs uppercase tracking-[0.15em] text-ivory-50/50">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
          )}

          <Link
            to={story.ctaTo || "/about-us"}
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-gold-400 transition hover:text-gold-300"
          >
            {story.ctaLabel || "Discover our story"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}