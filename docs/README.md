# Belioras — Build Breakdown & Master Status Tracker

Luxury fashion & hair e-commerce frontend (Vite + React 19 + Tailwind v4 + Motion + React Router + Lucide) plus brand-tinted admin dashboard. Mock JSON data in `src/data/`, accessed **only** through the backend-ready services layer in `src/services/`.

## Golden Rules

1. **Backend-ready**: components/contexts never import JSON directly — always via `src/services/*` (promise wrappers with `mockDelay`). Swap internals to `fetch()` later = zero component changes.
2. **Split rule**: JSX files max ~250 lines (checked against the codebase — none exceed it). Page-level splits go in the page's `sections/` folder; shared/layout splits go in `src/components/`.
3. **Comment style**: simple, minimal. `{/* Section name */}` above tags/sections. Title case, no dashes, no decoration. One-line file-top comment only when needed.
4. **Palette**: always Belioras tokens from `src/index.css` (`gold-*`, `brown-*`, `champagne-*`, `umber-*`, `ivory-*`, `espresso`). No arbitrary hex in components — use `constants.js` maps when needed.
5. **EU legal (non-negotiable)**: see `08-eu-legal-compliance.md`. Omnibus price, cookie consent equal-weight, GPSR records, no pre-ticked boxes, hair non-returnable, 14-day withdrawal, VAT-inclusive.
6. **Design**: follow `ui-ux-pro-max` skill + `belioras-design.md`, plus installed taste-skills: `design-taste-frontend` (anti-generic baseline: Density 4 / Variance 8 / Motion 6), `high-end-visual-design` (Editorial Luxury archetype — this project's exact archetype), `minimalist-ui` (serif editorial, crisp borders), `gpt-taste` (headline/filler-text discipline only — no GSAP; we use Motion). Lucide icons only, no emojis. Touch targets ≥ 44px. Focus rings everywhere. `prefers-reduced-motion` respected.

## Build Order (Phases)

Storefront-first: everything the customer sees (layout shell → UI kit → storefront pages) ships before the admin dashboard. **Dashboard is the last build phase.**

| # | Phase | Doc | Status |
|---|-------|-----|--------|
| 0 | Dependencies & config | `01-dependencies.md` | done |
| 1 | Foundations (utils, contexts, services, hooks, data) | `02-data-layer.md` + `03-foundations.md` | done |
| 2 | Layout — storefront shell first (navbar folder, footer, cookie, shell) | `04-layout.md` | done |
| 3 | UI kit (incl. swatches) | `05-ui-kit.md` | done |
| 4 | Storefront (home, shop, PDPs, search, checkout, auth, FAQ, legal) | `06-storefront.md` | done |
| 5 | AdminDashboard (15 modules, 2 reserved slots unbuilt) | `07-dashboard.md` | done |
| 6 | QA & polish (a11y, responsive, lint, build, favicon) — final pass over the whole app incl. dashboard | `09-qa-polish.md` | in-progress |
| 7 | Client account portal | `11-client-account.md` | done |
- [12 — Backend integration: flows and contracts](12-backend-integration.md)
- [14 — Backend changes from the November 2026 client requests](14-backend-changes-nov-2026.md)
| 8 | Folder structure reference | `10-folder-structure.md` | done |

**Not done, and blocking launch:** authorization is entirely client-side. A
forged localStorage session reaches `/dashboard/users` and every customer's
email, because no service checks its caller. Auth itself is a mock — plaintext
passwords in a JSON fixture. Both are backend work; see `belioras-backend`.

## Status Legend

- `pending` — not started
- `in-progress` — actively working
- `done` — complete & verified

## File Tree (Target)

```
docs/
├── README.md                ← this file
├── 00-code-conventions.md
├── 01-dependencies.md
├── 02-data-layer.md
├── 03-foundations.md
├── 04-layout.md
├── 05-ui-kit.md
├── 06-storefront.md
├── 07-dashboard.md
├── 08-eu-legal-compliance.md
├── 09-qa-polish.md
├── 10-folder-structure.md
└── 11-client-account.md

src/
├── main.jsx
├── index.css                ← Tailwind v4 tokens
├── App.jsx                  ← AppProviders + BrowserRouter, routes composed from
│                               authRoutes() / dashboardRoutes() / storefrontRoutes()
├── routes/                  ← the three route-tree builders above, one per realm
├── utils/                   ← cn, formatCurrency, constants, faceting, catalogSort, orderStatus, …
├── hooks/                   ← useAsyncData, useLocalStorage, useScopedStorage, …
├── services/                ← store/, auth/, catalog/, sales/, marketing/, content/ (see 02)
├── context/                 ← Content, Language, Currency, Auth (customer + staff realms), Cart, Wishlist, ProductDraft, Toast
├── components/
│   ├── layout/              ← Footer, CookieConsent, PageShell, NotFound, Forbidden, ScrollToTop, BackToTop, navbar/, footer/
│   ├── ui/                  ← Button, Field, Modal, Drawer, ConfirmDialog, EmptyState, StatusChip, ToastViewport, …
│   ├── account/             ← Avatar, OrderTimeline, accountMenuItems — shared by the storefront navbar, the public tracker, and both dashboards
│   ├── storefront/          ← ProductCard, ProductCarousel, GridViewSwitcher, size chart
│   └── common/, auth/, shared/
├── data/                    ← JSON fixtures per service module — products, catalogExtra, hair, accessories, categories, taxonomy, navigation, orders, coupons, reviews, settings, sizeCharts, and more (see 02)
├── pages/
│   ├── 0.auth/              ← login, signup, forgot password, atelier (staff door)
│   ├── 1.home/sections/     ← Hero, FeaturedCategories, NewArrivals, BestSellers, BrandStory, Testimonials, Instagram grid, …
│   ├── 3.shop/              ← CatalogPage (serves New Arrivals, Dresses, Hair, Accessories and every filtered collection through splat routes) + sections/
│   ├── product/             ← Product detail page
│   ├── checkout/            ← CheckoutPage + sections/
│   ├── FAQ/                 ← faq.jsx
│   ├── customer-support/    ← about-us, contact-us, order-tracking, hair-length-guide, shoe-size-guide
│   ├── legal/               ← 5 legal pages
│   └── newsletter/          ← confirm, unsubscribe
├── customerDashboard/       ← the signed-in shopper's own app (see 11)
└── AdminDashboard/          ← the admin app (see 07) — DashboardPages.jsx barrel + 15 numbered page modules
```

## Verifier

At the end of every phase: `npm run lint` (if configured) + `npx vite build` must pass; tracker checkboxes updated in the phase doc.