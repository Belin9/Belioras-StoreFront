/* Page: Customer-support - size-guide */
import PageShell, { Section } from "../../components/layout/PageShell";
import SizeChart from "../../components/storefront/sizeChart/SizeChart";
import SizeChartHowTo from "../../components/storefront/sizeChart/SizeChartHowTo";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getSizeCharts } from "../../services/catalog/sizeChartApi";

/** Clothing sizes: the body measurements per size, and how to take your own. */
export default function SizeGuidePage() {
  const { data: charts } = useAsyncData(getSizeCharts, []);
  const garment = charts?.garment;

  return (
    <PageShell
      eyebrow="Client care"
      title="Size Guide"
      intro="Measure yourself once, then read across. Every Belioras dress is sized to these body measurements."
    >
      {garment?.howTo?.length > 0 && (
        <Section title="How to measure">
          <SizeChartHowTo kind="garment" steps={garment.howTo} figureSrc={garment.garmentImage} />
        </Section>
      )}

      <Section title="Sizes">
        <SizeChart kind="garment" />
      </Section>

      <Section title="Between sizes">
        <p>{garment?.note || "Between sizes, we suggest the larger."}</p>
        <p>
          Unsure? Write to us at <a href="mailto:support@belioras.com">support@belioras.com</a> with your measurements and
          we will advise.
        </p>
      </Section>
    </PageShell>
  );
}
