/* Vite plugin: static page heads, sitemap.xml and robots.txt */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  catalogSeo,
  headTags,
  homeSeo,
  isPrivatePath,
  PRIVATE_PREFIXES,
  productSeo,
  STATIC_PAGES,
  titleCase,
} from "../../src/seo/seo.js";

/**
 * The shop is a single-page app: every address used to be served the same
 * index.html, so a link shared on WhatsApp or Facebook (which never run
 * JavaScript) previewed every product as the home page.
 *
 * At build this writes one HTML file per public page — home, fixed pages,
 * every menu page and every live product — each with its own title,
 * description, canonical, preview image and structured data. The app then
 * boots on top exactly as before. It also writes sitemap.xml and robots.txt,
 * and `app.html`, the neutral shell every other address falls back to
 * (see scripts/netlify/vitePluginRedirects.js).
 *
 * Data comes from the catalogue seed in src/data. Once the API is live, read
 * the same collections from it here, and trigger a rebuild (a Netlify build
 * hook) when products or the menu change.
 */

const START = "<!--seo:start-->";
const END = "<!--seo:end-->";

/** Netlify sets URL to the site's primary address; SITE_URL overrides it. */
function siteUrl() {
  return (process.env.SITE_URL || process.env.URL || "https://belioras.netlify.app").replace(/\/+$/, "");
}

const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escapeXml = (s) => escapeHtml(s).replace(/'/g, "&apos;");

function renderTags(meta, site) {
  return headTags(meta, site)
    .map(({ tag, attrs, text }) => {
      const attributes = Object.entries(attrs)
        .map(([k, v]) => ` ${k}="${escapeHtml(v)}"`)
        .join("");
      if (tag === "meta" || tag === "link") return `<${tag}${attributes} data-seo>`;
      // JSON-LD is already safe (its "<" are escaped); a title is text.
      const body = tag === "script" ? text : escapeHtml(text);
      return `<${tag}${attributes} data-seo>${body}</${tag}>`;
    })
    .join("\n    ");
}

function readJson(root, file) {
  return JSON.parse(fs.readFileSync(path.join(root, "src/data", file), "utf8"));
}

/** Every public page the build knows about, as { path, meta, lastmod?, images? }. */
function collectPages(root, site) {
  const settings = readJson(root, "settings.json");
  const navigation = readJson(root, "navigation.json").items;
  const categories = readJson(root, "categories.json");
  const reviews = readJson(root, "reviews.json");
  const products = ["products.json", "hair.json", "accessories.json", "catalogExtra.json"].flatMap((f) => readJson(root, f));

  const pages = [{ path: "/", meta: homeSeo(site, settings) }];

  for (const [pagePath, meta] of Object.entries(STATIC_PAGES)) {
    if (pagePath !== "/") pages.push({ path: pagePath, meta: { ...meta, path: pagePath } });
  }

  // Menu pages: a root or link resolves only when it says what it shows
  // (the same rule as the catalogue page, services/catalog/catalogApi.js).
  const seen = new Set(pages.map((p) => p.path));
  const addCatalog = (url, label, trail) => {
    if (!url || seen.has(url) || isPrivatePath(url)) return;
    seen.add(url);
    pages.push({ path: url, meta: catalogSeo(site, { path: url, label, trail }) });
  };
  for (const item of navigation) {
    const rootStep = { label: item.label, url: item.url };
    if (item.target) addCatalog(item.url, item.label, [rootStep]);
    for (const section of item.sections ?? []) {
      for (const leaf of section.items ?? []) {
        if (leaf.target) addCatalog(leaf.url, leaf.label, [rootStep, { label: leaf.label, url: leaf.url }]);
      }
    }
  }

  // Products: live ones only, as the storefront shows them.
  for (const product of products) {
    if ((product.status ?? "active") !== "active" || !product.slug) continue;
    const colorways = product.colorways ?? [];
    const images = [...(product.images ?? []), ...colorways.flatMap((w) => w.images ?? [])];
    const available = colorways.length
      ? colorways.reduce((sum, w) => sum + Object.values(w.stock ?? {}).reduce((a, n) => a + (Number(n) || 0), 0), 0)
      : Number(product.stock) || 0;
    const published = reviews.filter((r) => r.productId === product.id && r.status === "published");
    const rating = published.length
      ? Math.round((published.reduce((s, r) => s + r.rating, 0) / published.length) * 10) / 10
      : 0;
    const category = categories.find((c) => c.id === product.collectionId);
    const meta = productSeo(site, product, {
      images,
      available,
      category: product.collectionId
        ? { label: category?.name ?? titleCase(product.collectionId), url: `/${product.collectionId}` }
        : null,
      rating,
      reviewCount: published.length,
    });
    pages.push({
      path: meta.path,
      meta,
      lastmod: product.updatedAt ?? product.createdAt,
      images: [...new Set(images)].slice(0, 10),
    });
  }

  return pages;
}

function sitemapXml(pages, site) {
  const urls = pages.map((page) => {
    const loc = `${site}${page.path === "/" ? "/" : page.path}`;
    const lastmod = page.lastmod ? `\n    <lastmod>${String(page.lastmod).slice(0, 10)}</lastmod>` : "";
    const images = (page.images ?? [])
      .map((src) => `\n    <image:image><image:loc>${escapeXml(src.startsWith("http") ? src : site + src)}</image:loc></image:image>`)
      .join("");
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}${images}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;
}

function robotsTxt(site) {
  return `User-agent: *
Allow: /
${PRIVATE_PREFIXES.map((p) => `Disallow: ${p}`).join("\n")}

Sitemap: ${site}/sitemap.xml
`;
}

/** /product/x → product/x.html, which Netlify serves at /product/x without a trailing-slash redirect. */
function fileFor(pagePath) {
  return pagePath === "/" ? "index.html" : `${pagePath.replace(/^\/+/, "")}.html`;
}

export default function seoPlugin() {
  let root = process.cwd();
  let outDir = "dist";

  return {
    name: "belioras-seo",

    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },

    // The shell: site defaults, no canonical. Pages without their own file
    // (signed-in areas, new menu pages added since the last build) get this.
    transformIndexHtml(html) {
      return html.replace(/<!--seo-->/, `${START}\n    ${renderTags({}, siteUrl())}\n    ${END}`);
    },

    // So /sitemap.xml and /robots.txt can be checked with `npm run dev`.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const site = `http://${req.headers.host}`;
        if (req.url === "/sitemap.xml") {
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          return res.end(sitemapXml(collectPages(root, site), site));
        }
        if (req.url === "/robots.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          return res.end(robotsTxt(site));
        }
        return next();
      });
    },

    closeBundle() {
      const shellPath = path.join(outDir, "index.html");
      if (!fs.existsSync(shellPath)) return;
      const shell = fs.readFileSync(shellPath, "utf8");
      const block = new RegExp(`${START}[\\s\\S]*?${END}`);
      if (!block.test(shell)) throw new Error("belioras-seo: the <!--seo--> marker is missing from index.html");

      const site = siteUrl();
      const pages = collectPages(root, site);

      fs.writeFileSync(path.join(outDir, "app.html"), shell);
      for (const page of pages) {
        const file = path.join(outDir, fileFor(page.path));
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, shell.replace(block, `${START}\n    ${renderTags(page.meta, site)}\n    ${END}`));
      }
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemapXml(pages, site));
      fs.writeFileSync(path.join(outDir, "robots.txt"), robotsTxt(site));

      console.log(`belioras-seo: ${pages.length} pages, sitemap.xml and robots.txt for ${site}`);
    },
  };
}
