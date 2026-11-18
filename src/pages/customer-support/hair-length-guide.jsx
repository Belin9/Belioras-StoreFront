/* Page: Customer-support - hair-length-guide */
import PageShell, { Section } from "../../components/layout/PageShell";
import SizeChart from "../../components/storefront/sizeChart/SizeChart";
import HairLengthFigure from "../../components/storefront/sizeChart/figures/HairLengthFigure";
import { useAsyncData } from "../../hooks/useAsyncData";
import { getSizeCharts } from "../../services/catalog/sizeChartApi";

export default function HairLengthGuidePage() {
  const { data: charts } = useAsyncData(getSizeCharts, []);
  const lengths = charts?.hair?.lengths ?? [];

  return (
    <PageShell
      eyebrow="Client care"
      title="Hair Length Guide"
      intro="Hair is measured stretched, but you wear it curled — so the number on the label is rarely the length you see in the mirror. Here is how the two relate."
    >
      {lengths.length > 0 && (
        <Section title="Where each length falls">
          <HairLengthFigure lengths={lengths} className="mx-auto sm:mx-0" />
        </Section>
      )}

      <Section title="Lengths and textures">
        <SizeChart kind="hair" />
      </Section>

      <Section title="How texture changes length">
        <p>
          This is the part most people are caught by. A 20&Prime; kinky wig and a 20&Prime; straight
          wig contain the same length of hair, but the kinky one will sit near the shoulder while the
          straight one reaches mid-back.
        </p>
      </Section>

      <Section title="Choosing">
        <ul>
          <li>Measure from your hairline to where you want the hair to end.</li>
          <li>Add the allowance above for your texture.</li>
          <li>If you are between two lengths, take the longer — it can be cut, not added to.</li>
        </ul>
        <p>
          Unsure? Send us a photograph at{" "}
          <a href="mailto:support@belioras.com">support@belioras.com</a> and we will advise.
        </p>
      </Section>

      <Section title="Before you order">
        <p>
          <strong>Hair cannot be returned once its packaging is opened</strong> — a hygiene rule
          under EU consumer law. Unopened and still sealed, it can be returned normally within
          fourteen days. Please check the length before you break the seal.
        </p>
      </Section>
    </PageShell>
  );
}
