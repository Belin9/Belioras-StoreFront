/* SEO: what each page tells search engines and link previews */

/**
 * One description of every page's head, shared by the app and the build.
 *
 * The app applies it on each route change (`seo/head.js`); the build writes it
 * into a static HTML file per public page and generates the sitemap from the
 * same functions (`scripts/seo/vitePluginSeo.js`). Link previews on WhatsApp,
 * Facebook or iMessage never run JavaScript, so the static files are what
 * they see; Google sees both, and they agree because they come from here.
 *
 * Pure on purpose: no imports, no store, no browser globals. Callers pass the
 * data in.
 */

export const SITE_NAME = "Belioras";
export const DEFAULT_TITLE = "Belioras | Your Style. Your Crown.";
export const DEFAULT_DESCRIPTION =
  "Belioras — luxury fashion and hair, curated for confident women. Dresses, hair, accessories and beauty, shipped from Germany across the EU and beyond.";
/** 1200 × 630, the size every link preview crops to. */
export const DEFAULT_IMAGE = "/og-image.jpg";
export const CURRENCY = "EUR";
export const LOCALE = "en_GB";

/**
 * Addresses no search engine should list: signed-in areas, the till, one-off
 * links from emails, and documents. robots.txt keeps crawlers out and each
 * page also says noindex, for links that reach them anyway.
 */
export const PRIVATE_PREFIXES = [
  "/dashboard",
  "/account",
  "/checkout",
  "/atelier",
  "/login",
  "/signup",
  "/forgot-password",
  "/invoice",
  "/packing-slips",
  "/newsletter",
  "/search",
];

export function isPrivatePath(pathname) {
  return PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function pageTitle(name) {
  return `${name} | ${SITE_NAME}`;
}

/** The pages whose address never changes. Catalogue and product pages are built from data. */
export const STATIC_PAGES = {
  "/": {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  "/shop": {
    title: pageTitle("Shop All"),
    description:
      "Shop the full Belioras collection: dresses, wigs and hair, bags and accessories. Prices include VAT, with free shipping in Germany.",
  },
  "/about-us": {
    title: pageTitle("About Us"),
    description: "The story behind Belioras, a Kaiserslautern boutique for luxury dresses, hair and accessories, and the women it dresses.",
  },
  "/contact-us": {
    title: pageTitle("Contact Us"),
    description: "Write to Belioras client care about an order, sizing or a piece you have your eye on. We reply within one working day.",
  },
  "/faq": {
    title: pageTitle("Frequently Asked Questions"),
    description: "Answers on ordering, sizing, shipping times and costs, returns and caring for your Belioras dresses and hair.",
  },
  "/order-tracking": {
    title: pageTitle("Track Your Order"),
    description: "Follow a Belioras order with its reference and the email it was placed with.",
  },
  "/hair-length-guide": {
    title: pageTitle("Hair Length Guide"),
    description: "How each wig and hair length falls on the body, from bob to waist length, to choose the right Belioras piece.",
  },
  "/shoe-size-guide": {
    title: pageTitle("Shoe Size Guide"),
    description: "EU, UK and US shoe sizes side by side, with foot length in centimetres and inches.",
  },
  "/privacy-policy": {
    title: pageTitle("Privacy Policy"),
    description: "How Belioras collects, uses and protects your personal data, and your rights under the GDPR.",
  },
  "/terms-of-service": {
    title: pageTitle("Terms of Service"),
    description: "The terms that apply when you shop at Belioras.",
  },
  "/shipping-policy": {
    title: pageTitle("Shipping Policy"),
    description: "Free shipping in Germany, €9.99 to the EU (free over €250) and €14.99 internationally, with tracked DHL delivery.",
  },
  "/return-and-refund-policy": {
    title: pageTitle("Returns & Refunds"),
    description: "Fourteen days to change your mind on unworn pieces, how to send them back, and why opened hair can't be returned.",
  },
  "/impressum": {
    title: pageTitle("Impressum"),
    description: "Legal notice for Belioras under § 5 DDG: who operates this website and how to reach us.",
  },
  "/cookie-policy": {
    title: pageTitle("Cookie Policy"),
    description: "The cookies Belioras uses and how to choose which ones you allow.",
  },
};

/* Helpers */

export function absoluteUrl(siteUrl, pathOrUrl) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl.replace(/\/+$/, "")}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Cuts at a word so the snippet ends cleanly at about the length Google shows. */
export function clip(text, max = 158) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max - 1)).replace(/[,;:.–—-]+$/, "")}…`;
}

/** "NEW ARRIVALS" → "New Arrivals"; menu labels are stored in capitals. */
export function titleCase(label) {
  return String(label ?? "")
    .toLowerCase()
    .replace(/(^|[\s&/-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

function breadcrumbJsonLd(siteUrl, trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.label,
      item: absoluteUrl(siteUrl, step.url),
    })),
  };
}

/* Page builders. Each returns the `meta` that headTags() renders. */

/** The home page: the brand itself, for Google's knowledge panel. */
export function homeSeo(siteUrl, settings = {}) {
  const sameAs = Object.values(settings.social ?? {}).filter((u) => /^https?:\/\//.test(u ?? ""));
  const organization = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_NAME,
    url: absoluteUrl(siteUrl, "/"),
    logo: absoluteUrl(siteUrl, "/android-chrome-512x512.png"),
    image: absoluteUrl(siteUrl, DEFAULT_IMAGE),
    description: DEFAULT_DESCRIPTION,
    ...(settings.contact?.general && { email: settings.contact.general }),
    // No postal address: it appears only in the Impressum, at the owner's request.
    ...(sameAs.length && { sameAs }),
    // What the returns page promises, so Google can show it beside prices.
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "DE",
      returnPolicyCountry: "DE",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnShippingFees",
    },
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl(siteUrl, "/"),
  };
  return { ...STATIC_PAGES["/"], path: "/", jsonLd: [organization, website] };
}

/**
 * A menu page. `trail` is the page's breadcrumb, root first, e.g.
 * [{label:"DRESSES", url:"/dresses"}, {label:"Mini Dresses", url:"/dresses/…"}].
 */
export function catalogSeo(siteUrl, { path, label, trail = [] }) {
  const name = titleCase(label);
  const root = trail.length > 1 ? titleCase(trail[0].label) : null;
  // "Mini Dresses" says where it is already; "Full Collection" needs its root.
  const heading = root && !name.toLowerCase().includes(root.toLowerCase().replace(/s$/, "")) ? `${name} — ${root}` : name;
  return {
    title: pageTitle(heading),
    description: clip(
      `Shop ${heading.replace(" — ", " in ")} at Belioras — luxury pieces for confident women, with tracked shipping from Germany across the EU and beyond.`,
    ),
    path,
    jsonLd: [
      breadcrumbJsonLd(siteUrl, [
        { label: "Home", url: "/" },
        ...trail.map((s) => ({ label: titleCase(s.label), url: s.url })),
      ]),
    ],
  };
}

/**
 * A product page. The caller supplies what differs between the live store and
 * the build: every photo across colours, units available, the category's name
 * and address, and the review summary.
 */
export function productSeo(siteUrl, product, { images = [], available = 0, category, rating = 0, reviewCount = 0 } = {}) {
  const path = `/product/${product.slug}`;
  const url = absoluteUrl(siteUrl, path);
  const photos = [...new Set(images.filter(Boolean))].map((src) => absoluteUrl(siteUrl, src));
  const price = Number(product.price).toFixed(2);
  const onSale = Number(product.originalPrice) > Number(product.price);

  const offer = {
    "@type": "Offer",
    url,
    priceCurrency: CURRENCY,
    price,
    availability: available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", name: SITE_NAME },
    ...(onSale && {
      priceSpecification: [
        { "@type": "UnitPriceSpecification", price, priceCurrency: CURRENCY },
        {
          "@type": "UnitPriceSpecification",
          priceType: "https://schema.org/StrikethroughPrice",
          price: Number(product.originalPrice).toFixed(2),
          priceCurrency: CURRENCY,
        },
      ],
    }),
  };

  const jsonProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: clip(product.description, 500),
    ...(product.sku && { sku: product.sku }),
    ...(photos.length && { image: photos }),
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(category?.label && { category: category.label }),
    ...(product.materials?.length && { material: product.materials.join(", ") }),
    offers: offer,
    ...(reviewCount > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: rating, reviewCount, bestRating: 5, worstRating: 1 },
    }),
  };

  const trail = [{ label: "Home", url: "/" }];
  if (category?.label) trail.push({ label: category.label, url: category.url });
  trail.push({ label: product.name, url: path });

  return {
    title: pageTitle(product.name),
    description: clip(product.description || `${product.name} at Belioras.`),
    path,
    image: photos[0],
    type: "product",
    product: { price, currency: CURRENCY, available: available > 0 },
    jsonLd: [jsonProduct, breadcrumbJsonLd(siteUrl, trail)],
  };
}

/* Rendering */

/**
 * The tags for one page, as plain descriptors both renderers understand:
 * `{ tag, attrs, text? }`. `meta.path` sets the canonical address and
 * `og:url`; without it (the app shell) neither is written.
 */
export function headTags(meta, siteUrl) {
  const title = meta.title ?? DEFAULT_TITLE;
  const description = meta.description ?? DEFAULT_DESCRIPTION;
  const image = absoluteUrl(siteUrl, meta.image ?? DEFAULT_IMAGE);
  const url = meta.path ? absoluteUrl(siteUrl, meta.path) : undefined;
  const m = (key, content, attr = "name") => content != null && { tag: "meta", attrs: { [attr]: key, content: String(content) } };
  const og = (key, content) => m(key, content, "property");

  return [
    { tag: "title", attrs: {}, text: title },
    m("description", description),
    meta.noindex && m("robots", "noindex, follow"),
    url && !meta.noindex && { tag: "link", attrs: { rel: "canonical", href: url } },
    og("og:site_name", SITE_NAME),
    og("og:locale", LOCALE),
    og("og:type", meta.type ?? "website"),
    og("og:title", title),
    og("og:description", description),
    url && og("og:url", url),
    og("og:image", image),
    meta.product && og("product:price:amount", meta.product.price),
    meta.product && og("product:price:currency", meta.product.currency),
    meta.product && og("product:availability", meta.product.available ? "in stock" : "out of stock"),
    m("twitter:card", "summary_large_image"),
    m("twitter:title", title),
    m("twitter:description", description),
    m("twitter:image", image),
    ...(meta.jsonLd ?? []).map((data) => ({
      tag: "script",
      attrs: { type: "application/ld+json" },
      // "<" escaped so text in a product description can never close the tag.
      text: JSON.stringify(data).replace(/</g, "\\u003c"),
    })),
  ].filter(Boolean);
}
