/* Page: Legal - terms-of-service */
import PageShell, { DraftNotice, Section } from "../../components/layout/PageShell";
import { PAYMENT_METHODS, UPDATED } from "./legalDetails";
import BusinessAddress from "./sections/BusinessAddress";
import LegalFacts from "./sections/LegalFacts";
import TermsWithdrawal from "./sections/TermsWithdrawal";

export default function TermsOfServicePage() {
  return (
    <PageShell eyebrow="Belioras – International" title="Terms &amp; Conditions" intro="The terms you agree to when you buy from Belioras." meta={UPDATED}>
      <LegalFacts
        facts={[
          { label: "Scope", value: "Online boutique", note: "International" },
          { label: "Contract party", value: "Belioras", note: "Kaiserslautern, Germany" },
          { label: "Withdrawal", value: "14 days", note: "EU statutory right" },
          { label: "Base currency", value: "EUR (€)", note: "VAT included" },
        ]}
      />

      <DraftNotice>
        These need review against German law (BGB) and the EU consumer rights directive before
        launch, particularly the liability and withdrawal sections.
      </DraftNotice>

      <Section title="1. Overview">
        <p>These terms apply to every purchase made in the Belioras online store. By placing an order, you agree to them.</p>
      </Section>

      <Section title="2. Contracting party">
        <p>Your purchase contract is with:</p>
        <BusinessAddress />
      </Section>

      <Section title="3. Products and availability">
        <p>
          We offer fashion, accessories, beauty items and hair. Availability cannot be guaranteed,
          and we may change or discontinue pieces at any time.
        </p>
      </Section>

      <Section title="4. Orders and contract">
        <p>
          Clicking &ldquo;Place order&rdquo; makes a binding offer to buy. The contract is formed when
          we email you an order confirmation. If we cannot accept your order, we will tell you and
          refund anything you have paid.
        </p>
      </Section>

      <Section title="5. Prices and currency">
        <p>
          Prices are in euro (€) and include VAT. International customers may see prices converted
          for display; you are charged in euro. Shipping costs are shown at checkout.
        </p>
      </Section>

      <Section title="6. Payment">
        <p>We accept:</p>
        <ul>
          {PAYMENT_METHODS.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p>Payment must be completed before an order ships.</p>
      </Section>

      <Section title="7. Shipping and delivery">
        <p>
          We ship to Germany, the European Union and selected international destinations. Delivery
          times on the site are estimates, not guarantees: some pieces are prepared after you order
          or ship from international locations. If there is a significant delay, we will tell you.
          Rates and times are in our <a href="/shipping-policy">shipping policy</a>.
        </p>
      </Section>

      <Section title="8. Customs and import duties">
        <p>Orders shipped outside the EU may be charged customs duty or import tax on arrival. These are the customer&rsquo;s responsibility.</p>
      </Section>

      <Section title="9. Returns, exchanges and damaged items">
        <p>
          You may withdraw from your purchase within 14 days of receiving it, as set out in the
          withdrawal policy below and our <a href="/return-and-refund-policy">returns policy</a>.
          We do not offer direct exchanges: return the piece and place a new order.
        </p>
        <p>
          If a piece arrives damaged or is not what you ordered, please tell us within 48 hours with
          photos, so we can replace or refund it quickly at no cost to you. Your statutory warranty
          rights are not affected.
        </p>
      </Section>

      <Section title="10. Intellectual property">
        <p>All images, designs, logos and content on Belioras belong to Belioras or are used with permission. Using them without permission is prohibited.</p>
      </Section>

      <Section title="11. Liability">
        <p>
          We are fully liable for intent and gross negligence, and for injury to life, body or health.
          Otherwise we are liable only for breaches of essential contractual duties, limited to the
          damage typical and foreseeable for this kind of contract. We are not responsible for delays
          caused by carriers, customs or payment providers beyond our control, or for damage from
          improper use of a product. Your statutory rights as a consumer are not affected.
        </p>
      </Section>

      <Section title="12. Privacy">
        <p>
          We process personal data under the GDPR, only to process and ship orders, provide customer
          service and meet legal obligations. See our <a href="/privacy-policy">privacy policy</a>.
        </p>
      </Section>

      <Section title="13. Governing law">
        <p>
          These terms are governed by German law. If you are a consumer living in another country,
          the mandatory consumer protection laws of that country still apply to you.
        </p>
      </Section>

      <Section title="14. Changes">
        <p>We may update these terms. The version in force when you placed your order applies to it.</p>
      </Section>

      <TermsWithdrawal />
    </PageShell>
  );
}
