/* Page: Legal - impressum */
import PageShell, { Section } from "../../components/layout/PageShell";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useContentVersion } from "../../context/ContentContext";
import { getSettings } from "../../services/content/settingsApi";
import { BUSINESS, UPDATED } from "./legalDetails";

/**
 * The legal notice German law requires (§ 5 DDG). The owner asked that her
 * name and postal address appear here and nowhere else on the site — every
 * other page refers back to this one rather than repeating them.
 *
 * Her name cannot be left out: "Belioras – Online Boutique" is the trading
 * name of a sole trader, and § 5 DDG asks for the operator's full name and a
 * serviceable address (the c/o service address keeps her home private). It
 * is set quietly, as one line of the address, the way most German shops do.
 */
export default function ImpressumPage() {
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);
  const vatId = settings?.invoice?.vatId;

  return (
    <PageShell eyebrow="Legal" title="Impressum" intro="Legal notice under § 5 of the German Digital Services Act (DDG)." meta={UPDATED}>
      <Section title="Information under § 5 DDG">
        <address className="not-italic text-espresso">
          {BUSINESS.name}
          <br />
          {BUSINESS.owner}
          <br />
          {BUSINESS.address.slice(0, 2).join(", ")}
          <br />
          {BUSINESS.address.slice(2).join(", ")}
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
