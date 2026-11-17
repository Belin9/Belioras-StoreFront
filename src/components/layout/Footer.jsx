/* Layout Component: Footer */
import { useAsyncData } from "../../hooks/useAsyncData";
import { useContentVersion } from "../../context/ContentContext";
import { getSettings } from "../../services/content/settingsApi";

import FooterNewsletter from "./footer/FooterNewsletter";
import FooterBrand from "./footer/FooterBrand";
import FooterLinkColumn from "./footer/FooterLinkColumn";
import FooterBottomBar from "./footer/FooterBottomBar";
import { FOOTER_COLUMNS } from "./footer/footerLinks";

export default function Footer() {
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);

  return (
    <footer className="bg-ivory-50 text-espresso">
      <FooterNewsletter />

      {/* One tree for every width. The columns were written twice, once under
          md:hidden and once under hidden md:grid, so each link existed in the
          markup twice and could only be edited in both places at once.
          No address or owner line here: those appear only in the Impressum. */}
      <div className="container-main pb-14 pt-16 md:pb-16 md:pt-20">
        <div className="md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-14 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:gap-x-8">
          <FooterBrand social={settings?.social} />

          {FOOTER_COLUMNS.map((column, i) => (
            <FooterLinkColumn
              key={column.id}
              title={column.title}
              links={column.links}
              // Support opens by default on a phone; the rest stay closed so
              // the footer is a short list rather than a screen of links.
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </div>

      <FooterBottomBar taxNote={settings?.tax?.note} />
    </footer>
  );
}
