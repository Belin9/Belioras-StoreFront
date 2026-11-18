/* Page: Customer-support - shoe-size-guide */
import PageShell, { Section } from "../../components/layout/PageShell";
import SizeChart from "../../components/storefront/sizeChart/SizeChart";
import FootFigure from "../../components/storefront/sizeChart/figures/FootFigure";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getSizeCharts } from "../../services/catalog/sizeChartApi";

export default function ShoeSizeGuidePage() {
  const { data: charts } = useAsyncData(getSizeCharts, []);
  const steps = charts?.footwear?.howTo ?? [];

  return (
    <PageShell
      eyebrow="Client care"
      title="Shoe size guide"
      intro="Our shoes are made on European lasts. Measure your foot and read across."
    >
      <Section title="Conversions">
        <SizeChart kind="footwear" />
      </Section>

      <Section title="How to measure your foot">
        <div className="grid gap-8 sm:grid-cols-[220px_1fr] sm:items-start">
          <FootFigure className="mx-auto sm:mx-0" />
          <ol className="!list-none space-y-4 !pl-0">
            {steps.map((step, i) => (
              <li key={step.term} className="flex gap-3">
                <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brown-50 text-[11px] font-semibold tabular-nums text-espresso">
                  {i + 1}
                </span>
                <span>
                  <strong>{step.term}. </strong>
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section title="Between sizes">
        <p>
          Take the larger size. If you are more than half a size over, a heel grip will close the gap
          more comfortably than a size down will.
        </p>
        <p>
          Our heels are cut narrow through the toe. If your foot is wide, we suggest going up a full
          size in the pointed styles.
        </p>
      </Section>
    </PageShell>
  );
}
