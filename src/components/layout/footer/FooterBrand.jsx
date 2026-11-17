/* Brand Blurb And Socials */
import { Link } from "react-router-dom";

import { FacebookIcon, InstagramIcon, PinterestIcon, TikTokIcon } from "./FooterIcons";

export default function FooterBrand({ social }) {
  // Icons only, one style for every network. A network with no address in
  // dashboard › Settings › Social is left out rather than linking nowhere.
  const networks = [
    { label: "Instagram", href: social?.instagram ?? "https://instagram.com/belioras", Icon: InstagramIcon },
    { label: "Facebook", href: social?.facebook, Icon: FacebookIcon },
    { label: "Pinterest", href: social?.pinterest, Icon: PinterestIcon },
    { label: "TikTok", href: social?.tiktok, Icon: TikTokIcon },
  ].filter((n) => n.href);

  return (
    <div className="border-b border-espresso/10 pb-8 md:border-none md:pb-0">
      {/* Set rather than drawn: the logo asset is a 587KB raster, and the
          wordmark in the display serif is the same mark for no weight. */}
      <Link
        to="/"
        className="font-display text-[26px] leading-none tracking-[0.24em] text-espresso transition-colors hover:text-gold-700"
      >
        BELIORAS
      </Link>

      <p className="mt-6 max-w-[30ch] text-[13px] leading-[1.8] text-espresso/60">
        Your Style. Your Crown. Luxury fashion and hair, curated for confident women.
      </p>

      <div className="-ml-2.5 mt-7 flex items-center gap-1 lg:ml-0 lg:gap-5">
        {networks.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="liquid-hover flex size-11 items-center justify-center rounded-full text-espresso/50 transition-colors hover:text-gold-700 lg:size-auto"
            aria-label={`Belioras on ${label}`}
          >
            <Icon className="liquid-icon size-[18px]" />
          </a>
        ))}
      </div>
    </div>
  );
}
