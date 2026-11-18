/* Layout Component: AnnouncementBar */
import { Link } from "react-router-dom";

import { useAsyncData } from "../../../hooks/useAsyncData";
import { useLanguage } from "../../../context/LanguageContext";
import { getTopBanner } from "../../../services/marketing/promotionsApi";

export default function AnnouncementBar() {
  const { data: banner } = useAsyncData(getTopBanner, []);
  const { t } = useLanguage();

  const announcements = banner?.announcements ?? [];

  // Language and currency now live in the header row on every width, so an
  // empty promo list leaves nothing to show here.
  if (announcements.length === 0) return null;

  // Duplicate the sequence so the -50% translate loops seamlessly
  const items = [...announcements, ...announcements];

  return (
    <div className="flex items-center bg-espresso text-ivory-50">
      <div className="relative min-w-0 flex-1 overflow-hidden py-2">
        {/* Fade the track out at the screen edge rather than cutting a word. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-r from-transparent to-espresso lg:hidden"
        />
        <div className="flex w-max animate-[marquee-left_28s_linear_infinite] items-center whitespace-nowrap">
          {items.map((message, i) => (
            <span key={i} className="flex items-center">
              <span className="px-8 text-xs font-medium uppercase tracking-[0.18em]">
                {/* Messages are dashboard-editable content, so they carry a
                    translation key plus the authored English as the fallback.
                    The string form is still accepted while data migrates. */}
                {(() => {
                  const text =
                    typeof message === "string"
                      ? message
                      : message.key
                        ? t(message.key, message.text ?? message.default)
                        : message.text;
                  return message.link ? (
                    <Link to={message.link} className="transition-opacity hover:opacity-80">{text}</Link>
                  ) : (
                    text
                  );
                })()}
              </span>
              <span aria-hidden="true" className="text-gold-400">·</span>
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
