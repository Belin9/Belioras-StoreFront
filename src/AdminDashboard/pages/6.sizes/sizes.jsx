/* Admin Dashboard Page: Sizes - sizes */
import DashTabs from "@/AdminDashboard/components/DashTabs";
import { useTabParam } from "@/AdminDashboard/lib/useTabParam";
import SizesPanel from "./sections/SizesPanel";
import GuidesPanel from "./sections/GuidesPanel";
import ModelsPanel from "./sections/ModelsPanel";

const TABS = [
  { value: "sizes", label: "Sizes" },
  { value: "guides", label: "Size guides" },
  { value: "models", label: "Models" },
];

const PANELS = { sizes: SizesPanel, guides: GuidesPanel, models: ModelsPanel };

export default function DashSizes() {
  const [tab, setTab] = useTabParam(TABS.map((t) => t.value));
  const Panel = PANELS[tab];

  return (
    <div className="space-y-6">
      <DashTabs options={TABS} value={tab} onChange={setTab} ariaLabel="Sizes & guides" />
      <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab).label}>
        <Panel />
      </div>
    </div>
  );
}
