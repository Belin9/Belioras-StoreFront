/* Page: Legal - impressum */
import PageShell, { DraftNotice, Section } from "../../components/layout/PageShell";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useContentVersion } from "../../context/ContentContext";
import { getSettings } from "../../services/content/settingsApi";
import { BUSINESS, UPDATED } from "./legalDetails";

/**
 * The legal notice German law requires (§ 5 DDG). The owner asked that her
 * name and postal address appear here and nowhere else on the site — every
 * other page refers back to this one rather than repeating them.
 */
export default function ImpressumPage() {
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);
  const vatId = settings?.invoice?.vatId;

  return (
    <PageShell eyebrow="Legal" title="Impressum" intro="Legal notice under § 5 of the German Digital Services Act (DDG)." meta={UPDATED}>
      <DraftNotice>
        Check these details against the business registration before launch, and add the VAT ID in
        dashboard › Settings once it is issued.
      </DraftNotice>

      <Section title="Operator of this website">
        <address className="not-italic text-espresso">
          {BUSINESS.name}
          <br />
          Owner: {BUSINESS.owner}
          {BUSINESS.address.map((line) => (
            <span key={line}>
              <br />
              {line}
            </span>
          ))}
        </address>
      </Section>

      <Section title="Contact">
        <p>
          Email: <a href={`mailto:${BUSINESS.support}`}>{BUSINESS.support}</a>
          <br />
          Or write to us through our <a href="/contact-us">contact page</a>.
        </p>
      </Section>

      {vatId && (
        <Section title="VAT identification number">
          <p>VAT ID under § 27a of the German VAT Act: {vatId}</p>
        </Section>
      )}

      <Section title="Consumer dispute resolution">
        <p>
          We are neither obliged nor willing to take part in dispute resolution proceedings before a
          consumer arbitration board.
        </p>
      </Section>
    </PageShell>
  );
}
