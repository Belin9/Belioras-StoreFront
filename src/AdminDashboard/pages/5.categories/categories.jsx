/* Admin Dashboard Page: Categories - categories */
import DashTabs from "@/AdminDashboard/components/DashTabs";
import { useTabParam } from "@/AdminDashboard/lib/useTabParam";
import CategoriesPanel from "./sections/CategoriesPanel";
import ColoursPanel from "./sections/ColoursPanel";

const TABS = [
  { value: "categories", label: "Categories" },
  { value: "colours", label: "Colours" },
];

const PANELS = { categories: CategoriesPanel, colours: ColoursPanel };

export default function DashCategories() {
  const [tab, setTab] = useTabParam(TABS.map((t) => t.value));
  const Panel = PANELS[tab];

  return (
    <div className="space-y-6">
      <DashTabs options={TABS} value={tab} onChange={setTab} ariaLabel="Catalogue setup" />
      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab).label}>
        <Panel />
      </div>
    </div>
  );
}
