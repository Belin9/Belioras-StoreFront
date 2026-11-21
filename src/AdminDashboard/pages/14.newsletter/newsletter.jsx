/* Admin Dashboard Page: Newsletter - newsletter */
import DashTabs from "@/AdminDashboard/components/DashTabs";
import { useTabParam } from "@/AdminDashboard/lib/useTabParam";
import NewsletterCampaigns from "./sections/NewsletterCampaigns";
import NewsletterSubscribers from "./sections/NewsletterSubscribers";
import NewsletterWelcome from "./sections/NewsletterWelcome";

const TABS = [
  { value: "subscribers", label: "Subscribers" },
  { value: "campaigns", label: "Campaigns" },
  { value: "welcome", label: "Welcome email" },
];

/**
 * People join the Belioras Letter from the footer or their account and
 * confirm by email; confirmed subscribers get campaigns until they
 * unsubscribe, which every email offers in one click.
 */
export default function DashNewsletter() {
  const [tab, setTab] = useTabParam(TABS.map((t) => t.value));

  return (
    <div className="space-y-6">
      <DashTabs options={TABS} value={tab} onChange={setTab} ariaLabel="Newsletter" />
      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab).label}>
        {tab === "subscribers" && <NewsletterSubscribers />}
        {tab === "campaigns" && <NewsletterCampaigns />}
        {tab === "welcome" && <NewsletterWelcome />}
      </div>
    </div>
  );
}
