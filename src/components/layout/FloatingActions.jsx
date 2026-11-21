/* Layout Component: FloatingActions
 *
 * The bottom-right stack: WhatsApp, the chat launcher, then back to top, in one
 * column so they can never overlap each other. The whole stack rides above the
 * cookie bar via --consent-bar-height.
 */
import { useCallback, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAsyncData } from "../../hooks/useAsyncData";
import { useContentVersion } from "../../context/ContentContext";
import { getSettings } from "../../services/content/settingsApi";
import BackToTop from "./BackToTop";
import { ChatLauncher, ChatPanel } from "./chat/ChatWidget";
import { whatsappHref } from "./chat/chatApi";
import WhatsAppIcon from "./chat/WhatsAppIcon";

// Paying needs no distractions.
const QUIET_PATHS = ["/checkout"];

export default function FloatingActions() {
  const { pathname } = useLocation();
  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);
  const [open, setOpen] = useState(false);
  const launcherRef = useRef(null);

  const quiet = QUIET_PATHS.some((p) => pathname.startsWith(p));
  const whatsapp = settings?.contact?.whatsapp;
  const waHref = whatsappHref(whatsapp);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, []);

  return (
    <>
      <div
        className="fixed right-4 z-[60] flex flex-col items-center gap-3 sm:right-6"
        style={{ bottom: "calc(1.5rem + var(--consent-bar-height, 0px) + var(--addbar-height, 0px))" }}
      >
        {!quiet && waHref && !open && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Talk to a person on WhatsApp"
            title="Talk to a person on WhatsApp"
            className="liquid-hover flex size-12 items-center justify-center rounded-full border border-[#25D366]/40 bg-espresso text-[#25D366] shadow-large transition-colors hover:border-[#25D366]"
          >
            <WhatsAppIcon className="liquid-icon size-6" />
          </a>
        )}

        {!quiet && <ChatLauncher open={open} onToggle={() => (open ? close() : setOpen(true))} buttonRef={launcherRef} />}

        {/* Bottom of the stack, under chat. Hidden while the panel is open. */}
        {!open && <BackToTop />}
      </div>

      {!quiet && <ChatPanel open={open} onClose={close} whatsapp={whatsapp} />}
    </>
  );
}
