/* Page: Legal - privacy-policy */
import PageShell, { DraftNotice, Section } from "../../components/layout/PageShell";
import { AUTHORITY, BUSINESS, UPDATED } from "./legalDetails";
import BusinessAddress from "./sections/BusinessAddress";
import LegalFacts from "./sections/LegalFacts";

export default function PrivacyPolicyPage() {
  return (
    <PageShell
      eyebrow="Data protection & legal"
      title="Privacy Policy"
      intro="We respect your privacy and are committed to protecting your personal information. Here is how we collect, use and safeguard it."
      meta={UPDATED}
    >
      <LegalFacts
        facts={[
          { label: "Framework", value: "GDPR", note: "EU standard" },
          { label: "Controller", value: "Belioras", note: "Kaiserslautern, Germany" },
          { label: "Scope", value: BUSINESS.site, note: "All services" },
          { label: "Your data", value: "Never sold", note: "Shared only to fulfil orders" },
        ]}
      />

      <DraftNotice>
        It states our real practices but has not been reviewed by a lawyer. Before launch it needs
        checking against the GDPR and the German Federal Data Protection Act (BDSG).
      </DraftNotice>

      <Section title="Who we are">
        <p>The data controller for the personal data described here is:</p>
        <BusinessAddress email={BUSINESS.privacy} />
        <p>Personal data is processed in strict accordance with the General Data Protection Regulation (GDPR).</p>
      </Section>

      <Section title="What we collect">
        <ul>
          <li>
            <strong>Personal and contact data:</strong> your name, email address, phone number, and
            delivery and billing address.
          </li>
          <li>
            <strong>Order data:</strong> what you ordered and your order history. Payment is handled
            by our payment providers: we never see or store your full card number.
          </li>
          <li>
            <strong>Account data:</strong> your email, a hashed password, and any saved addresses and
            preferences.
          </li>
          <li>
            <strong>Technical data:</strong> your IP address, device and browser type, which our
            hosting provider records to keep the store running and secure.
          </li>
          <li>
            <strong>Newsletter:</strong> your email address and the record of your consent, until you
            unsubscribe.
          </li>
        </ul>
      </Section>

      <Section title="Why we use it">
        <ul>
          <li>
            <strong>To process and deliver your order</strong>, and to keep you updated about it:
            performance of our contract with you.
          </li>
          <li>
            <strong>To answer your questions</strong> as customer support.
          </li>
          <li>
            <strong>To meet our legal obligations</strong>, such as keeping invoices as German tax law
            requires.
          </li>
          <li>
            <strong>To improve the store</strong>: our legitimate interest. You can object at any time.
          </li>
          <li>
            <strong>To send the newsletter</strong>: only if you subscribed, and you can withdraw that
            consent from any email.
          </li>
        </ul>
      </Section>

      <Section title="Who we share it with">
        <p>We do not sell your personal information. It is shared only with the partners we need to fulfil your order:</p>
        <ul>
          <li>Payment providers (PayPal, Stripe, Klarna)</li>
          <li>Shipping and logistics carriers, mainly DHL</li>
          <li>Website hosting and security partners</li>
          <li>Our email platform, for order emails and, if you subscribed, the newsletter</li>
        </ul>
        <p>
          Each acts on our instructions and may not use your data for anything else. Where one works
          outside the European Economic Area, the transfer is covered by the European
          Commission&rsquo;s Standard Contractual Clauses.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Orders and invoices are kept for as long as German tax and commercial law requires, up to
          ten years. Account data is kept until you close your account, and newsletter data until you
          unsubscribe.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You may ask for a copy of your data, have it corrected or deleted, restrict or object to how
          we use it, or receive it in a portable format. Where we rely on your consent, you can
          withdraw it at any time, and unsubscribe from marketing whenever you like.
        </p>
        <p>
          To make a request, write to <a href={`mailto:${BUSINESS.privacy}`}>{BUSINESS.privacy}</a>.
          We reply within one month. You may also complain to the data protection authority for
          Rhineland-Palatinate: {AUTHORITY.name} (<a href={AUTHORITY.url}>datenschutz.rlp.de</a>).
        </p>
      </Section>

      <Section title="Security">
        <p>
          We protect your information with secure servers, SSL encryption, and trusted,
          PCI-compliant payment providers.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          We set only what the store needs until you choose otherwise. See our{" "}
          <a href="/cookie-policy">cookie policy</a> for the detail.
        </p>
      </Section>
    </PageShell>
  );
}
