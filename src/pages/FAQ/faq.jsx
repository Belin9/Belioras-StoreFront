/* Page: FAQ - faq */
import PageShell from "../../components/layout/PageShell";
import { FAQ_GROUPS as GROUPS } from "../../data/faq";

export default function FAQPage() {
  return (
    <PageShell
      eyebrow="Client care"
      title="Frequently Asked"
      intro="The questions we are asked most. If yours is not here, write to us and a person will answer."
    >
      <div className="space-y-12">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-700">
              {group.title}
            </h2>
            <div className="border-t border-umber-50">
              {group.items.map((item) => (
                // <details> so the browser's find-in-page can reach an answer
                // inside a collapsed panel, which a div accordion cannot.
                <details key={item.q} className="group border-b border-umber-50 py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] text-espresso marker:hidden">
                    {item.q}
                    <span
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-espresso/35 transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-espresso-soft">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 text-[15px] text-espresso-soft">
        Still stuck?{" "}
        <a
          href="/contact-us"
          className="text-gold-700 underline underline-offset-4 transition-colors hover:text-espresso"
        >
          Write to us
        </a>{" "}
        — we answer within one working day.
      </p>
    </PageShell>
  );
}
