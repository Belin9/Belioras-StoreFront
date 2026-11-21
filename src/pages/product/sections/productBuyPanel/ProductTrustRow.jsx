/* Trust Row Under Add To Bag */
import { Star } from "lucide-react";

import { useContentVersion } from "../../../../context/ContentContext";
import { useAsyncData } from "../../../../hooks/useAsyncData";
import { getSettings } from "../../../../services/content/settingsApi";
import { TRUST_ICONS } from "../../../../utils/trustIcons";

/** "Reliable worldwide delivery · Easy returns · …", as written in Settings › Product page. */
export default function ProductTrustRow() {
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);
  if (settings?.productPage?.show?.trust === false) return null;
  const lines = (settings?.productPage?.trust ?? []).filter((l) => l?.text?.trim()).slice(0, 4);
  if (!lines.length) return null;

  return (
    <ul className="mt-6 space-y-2.5">
      {lines.map((l, i) => {
        const Icon = TRUST_ICONS[l.icon] ?? Star;
        return (
          <li key={i} className="flex items-center gap-3 text-[12px] uppercase tracking-[0.12em] text-espresso">
            <Icon className="size-4 shrink-0 text-espresso-soft" strokeWidth={1.5} aria-hidden="true" />
            {l.text}
          </li>
        );
      })}
    </ul>
  );
}
