/* Footer Link Columns */

// One definition per column. The footer previously wrote each list's markup
// twice, once per breakpoint, so a link added to one appeared on only half
// the site's widths. Shop links live in the header only — the footer
// repeating them was noise.
export const FOOTER_COLUMNS = [
  {
    id: "support",
    title: "Support",
    links: [
      { label: "FAQ", to: "/faq" },
      { label: "Contact", to: "/contact-us" },
      { label: "Order Tracking", to: "/order-tracking" },
      { label: "Returns & Refunds", to: "/return-and-refund-policy" },
      { label: "Shipping Policy", to: "/shipping-policy" },
      { label: "Size Guide", to: "/size-guide" },
      { label: "Hair Length Guide", to: "/hair-length-guide" },
      { label: "Shoe Size Guide", to: "/shoe-size-guide" },
    ],
  },
  {
    id: "company",
    title: "Company",
    links: [{ label: "About Us", to: "/about-us" }],
  },
  {
    id: "legal",
    title: "Legal",
    links: [
      { label: "Impressum", to: "/impressum" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Service", to: "/terms-of-service" },
      { label: "Cookie Policy", to: "/cookie-policy" },
    ],
  },
];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
