# 02 — Data Layer & Services (Backend-Ready)

**Rule:** components and contexts call services only. Services return Promises resolving to JSON-shaped data after `mockDelay`. Later, swap each service's internals to `fetch('/api/...')` — no component changes.

## Files: `src/services/`

Grouped by business area. Import a service by its folder, e.g. `@/services/catalog/productsApi`. The transport (`mockDelay`, `mockApi`, `ApiError`) lives below this layer in `src/api/mock.js`.

```
services/
├── store/      contentStore (the local store every domain reads), storeCollections (deletes that stick)
├── auth/       authApi + authSession, authProfile, authRoles, authStore
├── catalog/    productsApi + products/, categoriesApi, colorsApi, collectionsApi, catalogApi,
│               navigationApi, sizeChartApi, visualSearchApi, reviewsApi
├── sales/      ordersApi, transactionsApi, couponsApi, dashboardApi
├── marketing/  subscribersApi, campaignsApi, promotionsApi
└── content/    contentApi, settingsApi, contactApi
```

| File | Exports | Shape |
|------|---------|-------|
| **store/** | | |
| `contentStore.js` | `getState(domain)`, `setState(domain, updater)`, `resetDomain()`, `subscribe()`, `getVersion()` | per-domain localStorage store seeded from `src/data` |
| `storeCollections.js` | `liveItems(domain)`, `removeItem(domain, id)` | a collection minus remembered deletes |
| **auth/** | | |
| `authApi.js` | `login({email,password})`, `register(user)`, `logout()`, `requestPasswordReset()`, `getUsers()`, `updateProfile()`, `verifyPassword()`, `changePassword()`, `updateUserRole()` | `{token, user}` from `users.json`; validate; throws `ApiError` on bad creds |
| **catalog/** | | |
| `productsApi.js` | `getProducts()`, `getProduct(id)`, `getProductsByCollection()`, `getNewArrivals()`, `searchProducts(query)`, `getFeaturedProducts()`, `getBestSellers()`, `createProduct()`, `updateProduct()`, `deleteProduct()`, `restoreProduct()` | product objects |
| `collectionsApi.js` | `getCollections()` | dress/hair/accessory collections |
| `categoriesApi.js` | `getCategories({realm})`, `getStaffCategories()`, `categoryUsage()`, `typeUsage()`, `createCategory()`, `updateCategory()`, `deleteCategory()`, `reorderCategories(ids)`, `resetCategories()` | categories from `/taxonomy/categories`: name, sizes offered, subcategories and their types (mirrored into the local `categories` domain) |
| `colorsApi.js` | `getColors({realm})`, `getStaffColors()`, `syncColors()`, `colorUsage()`, `createColor()`, `updateColor()`, `deleteColor()`, `resetColors()` | colours from `/taxonomy/colors`: name, swatch hex, shop-filter family (mirrored into the local `colors` domain) |
| `navigationApi.js` | `getNavigation()` (tiles resolved), `getNavigationForEditing()`, `updateNavigation(items)` (validated), `resetNavigation()`, `getTaxonomy()` | the menu tree |
| `catalogApi.js` | `getCatalog(pathname)`, `getFeaturedCollection()`, `getSiblingLeaves(pathname)` | a menu page's products |
| `sizeChartApi.js` | `getSizeCharts()` | size reference tables |
| `visualSearchApi.js` | `searchByImage()`, `isVisualSearchAvailable()` | products matching a photo |
| `reviewsApi.js` | `getReviews(productId)`, `getRecentReviews(limit)`, `getAllReviews()`, `createReview(payload)`, `publishReview(id)`, `hideReview(id)`, `replyToReview(id, text)` | review objects (name, rating, title, body, date, verified, status, reply) — `getReviews`/`getRecentReviews` return `status: "published"` only |
| **sales/** | | |
| `ordersApi.js` | `createOrder(payload)`, `getOrders(userId)`, `getOrder(id, {userId\|email})`, `updateOrderStatus(id, status, {restock, by, trackingRef, carrier})` | order with generated id + dates; `trackingRef`/`carrier` are optional, set when an order is marked shipped |
| `transactionsApi.js` | `getTransactions()`, `getTransactionsForOrder(orderId)` | payments and refunds |
| `couponsApi.js` | `validateCoupon(code, subtotal)`, `getCoupons()`, `createCoupon(payload)`, `updateCoupon(id, payload)`, `deleteCoupon(id)`, `setCouponActive(id, active)` | coupon: code, type (percent/fixed/free_shipping), value, minOrderValue, maxDiscount, expiresAt, active, description — global-only, no product/category scoping |
| `dashboardApi.js` | `getDashboardStats()`, `getRecentOrders()` | overview figures |
| **marketing/** | | |
| `subscribersApi.js` | `subscribe()`, `confirmSubscription(token)`, `unsubscribe(token)`, `unsubscribeByEmail()`, `getSubscription(email)`, `getSubscribers()`, `unsubscribeSubscriber(id)`, `eraseSubscriber(id)` | newsletter audience and consent |
| `campaignsApi.js` | `getCampaigns()`, `saveCampaign()`, `scheduleCampaign()`, `unscheduleCampaign()`, `sendCampaign()`, `deleteCampaign()`, `getNewsletterSettings()`, `updateWelcomeEmail()` | newsletter campaigns and welcome email |
| `promotionsApi.js` | `getPromotions()` | promo banners/flash sale config |
| **content/** | | |
| `contentApi.js` | `getHeroSlides()`, `getInstagramPosts()` | home page content |
| `settingsApi.js` | `getSettings()`, `updateSettings()` | shipping zones, tax rate, free-shipping threshold, announcement text, cookies text |
| `contactApi.js` | `sendMessage()`, `getMessages()` | contact form messages |

Hook: `src/hooks/useAsyncData.js` — `useAsyncData(fn, deps)` → `{data, loading, error, refresh}`.

## Mock Data: `src/data/`

All JSON arrays/objects, ~5-10 items each (enough to demo filters/DS):

- `products.json` — main catalog (dresses + accessories). Fields: id, slug, name, price, originalPrice (Omnibus), collectionId, categories[], description, details[], materials[], care[], colors[] (names only), sizes[], stock, isNew, bestseller, rating, reviewCount, images[] (object-fit grayscale placeholders `/img/*.svg` to draw later — see Phase 6).
- `dresses.json` — dress catalogs + `hairVariants[]` merged in `products.json`? No: dresses stay in products.json via `collectionId`; `dresses.json` holds size-chart + styling copy used by Dress PDP.
- `hair.json` — hair extensions/units: fields + `isNonReturnable: true`, `hairType` (brazilian/indian/remy), `lengthInInches`, `weight` (g), `color` names.
- `accessories.json` — bags, belts, scarves, jewelry + `nonReturnable` flags where applicable.
- `colors.json` — the managed colour list (`id`, `name`, `hex`, `family`). Products reference colours by id.
- `subscribers.json`, `campaigns.json`, `newsletter.json` (via `newsletterSeed.js`) — newsletter subscribers with their consent record (`status`, `source`, `consentText`, `consentedAt`, `confirmedAt`, `token`), campaigns, and the welcome email. Deletes are remembered in the domain's `removed` ids (`storeCollections.js`) so seed records don't return on reload.
- `categories.json` — what a piece is (`id`, `name`, `sizes[]`, `subcategories[{id,name,types[]}]`). Types live only inside subcategories; a product is filed under them with `subcat:<sub>:<type>` tags (it has no `type` field). Now only the offline floor: the list lives on the server (`server/src/features/categories/seed.json` is its copy). The id is a product's `collectionId`.
- `navigation.json` — the menu tree: top-level items, their columns (`sections`) of links, and `tiles`. Every node carries a `target` saying what it shows (see `src/utils/menuTargets.js`) and a generated `slug`/`url`. A catalogue page is found by its URL in this tree and lists the products `matchesTarget` selects; any other URL is a 404.
- New Arrivals are the products with `isNew`, newest `createdAt` first; there is no separate list.
- `testimonials.json` — name, city, quote, rating, productUrl.
- `users.json` — customers + `admin@belioras.com` (password `demo123`, role super-admin (see `07-dashboard.md`)) + staff role examples.
- `orders.json` — seed orders covering all statuses (pending/paid/shipped/delivered/cancelled/refunded) for dashboard.
- `coupons.json` — e.g. `WELCOME10` (10% min €50), `FREESHIP` (free shipping threshold). Wrapped as a revisioned collection (`couponsSeed.js`) — admin-editable via `couponsApi.js`.
- `promotions.json` — flash sale entry, top banner, popup (15% first order) with start/end.
- `reviews.json` — per product 2-4 reviews, some "verified purchase". Wrapped as a revisioned collection (`reviewsSeed.js`); every seed review ships `status: "published"`. A customer submission lands `status: "pending"` via `createReview`; `getReviews`/`getRecentReviews` only ever return `published`.
- `settings.json` — shipping zones (EU flat €5.90, free ≥ €150; UK €12; World €19), tax 20% VAT included note, announcement text, cookie banner copy, GPSR manufacturer records, support contact, social links, hero copy, value props, brand story.

## Catalogue data contract (for the backend)

The shapes below are what the mock services persist and the storefront/dashboard read. A real API should return and accept the same.

**Category** (`categories.json`, `categoriesApi.js`)

```json
{ "id": "dresses", "name": "Dresses", "sizes": ["xs","s"],
  "types": [{ "id": "jumpsuits", "name": "Jumpsuits" }],
  "subcategories": [
    { "id": "shop-by-colour", "name": "Shop by Colour",
      "types": [{ "id": "white-dresses", "name": "White Dresses" }] } ] }
```

Ids are assigned once and never change on rename. Removal is refused (409) while a product, or a Mega Menu link/tile, uses what would go.

**Product tags** (`tags: string[]`) are `prefix:value` tokens. Written by the product form: `subcat:<subcategoryId>:<typeId>` (a category's own Subcategory type). Derived at read time (`deriveTags`): `cat:<collectionId>`, `type:<typeId>`, `tag:new|bestseller|featured`, `color:<family>`. The old shared Occasion/Fabric/Style/Length/Hair taxonomy no longer exists; `taxonomy.json` holds only `color` and `size`.

**Navigation** (`navigation.json`): menu items → `sections` (columns) → `items` (links), each with `label`, `slug`, `url`, `target`, and optional `aliases` (older addresses that redirect). A link's address is always `/{item}/{column}/{link}` (`/dresses/shop-by-colour/white-dresses`), generated once and kept on rename. A `target` says what the page shows and is matched against product tags by `matchesTarget` (`utils/menuTargets.js`):

| `target` | matches |
| --- | --- |
| `{kind:"all"}` | everything |
| `{kind:"category", id}` | `cat:<id>` |
| `{kind:"type", category, id}` | `cat:<category>` and `type:<id>` |
| `{kind:"filter", dimension:"subcat:<subcategoryId>", values:[typeId…], category}` | any `subcat:<subcategoryId>:<typeId>` |
| `{kind:"filter", dimension:"color", values:[…]}` | `color:<family>` |
| `{kind:"label", id:"new"\|"featured"\|"sale"}` | `tag:<id>` / on sale |
| `{kind:"product", id}` | one product (tiles only) |

**Storefront routing**: there is no route per category. Fixed pages are declared in `StorefrontRoutes.jsx`; every other address falls to a catch-all that asks `getCatalog(pathname)` (`catalogApi.js`) whether the navigation tree has a node at that slug, and lists the products its `target` selects. An address not in the tree is a 404. A product page is `/product/<slug>`, the slug generated from the name on create (unique, `-2`, `-3`…) and changed only when the name changes.

**Seed revisions**: each domain's seed has a `rev`. When a stored copy's `rev` differs from the seed's, the stored copy is discarded and the seed reloads; when they match, stored items win per `id`. Bump `rev` whenever a seed's shape or addresses change.

## Acceptance

- [ ] `grep -r "from '../../data" src --include=*.jsx` returns nothing (components never import data).
- [ ] Auth service validates against users.json and returns token+user; wrong password rejects with `ApiError`.
- [ ] Orders service persists created order into an in-memory store (module-level array) so checkout → dashboard demo works.
## Consistency rules (checked across storefront, customer and admin dashboards)

One fact lives in one place, and everything else derives from it. These are what the seed files and the services enforce, and what a backend must keep true.

- **Visibility.** A product's `status` is `active` or `draft` (absent means `active`, and `normalize` fills it in). Storefront reads (`getProducts`, `getProduct`, search, best sellers, menu pages, the Featured Collection, tiles) return live pieces only, so an unpublished piece has no page and appears nowhere. The dashboard and order history read `getAllProducts` / `getProduct(id, { includeDrafts: true })`, since an order must still name a piece that was later unpublished.
- **Ratings.** `rating` and `reviewCount` are not stored on a product. `normalize` computes them from *published* reviews, so publishing or hiding a review in the dashboard changes the product and the "Top rated" sort together.
- **Tags.** Products store only the Subcategory tokens (`subcat:<subId>:<typeId>`) plus `type`/`collectionId`; `cat:`, `type:`, `size:`, `color:` and `tag:` tokens are derived in `deriveTags`. The old `categories[]` list and its `len:`/`occ:`/`hair:` tokens are gone; a menu link on a retired dimension is a data error (the seed audit lists it).
- **Sizes.** A product's sizes come from its category's `sizes` (Accessories includes `one-size` for bags and jewellery); the storefront Size filter reads the derived `size:` tokens.
- **Money.** Prices include VAT (`settings.tax`). An order is `subtotal − discount + shipping = total`, `tax` is *extracted* from `total`, the coupon rules are those in `coupons`, and shipping comes from the delivery country's zone in `settings.shipping`. A transaction's charge equals its order's total; a refund never exceeds it. Order statuses are stored in the canonical vocabulary (`to-pay`, `to-ship`, `shipped`, `to-review`, `cancelled`, `refunded`).
- **Colours.** Product colours are names from `colors.json`, and `colorImages` keys must be among the product's colours.

When a seed changes shape, bump its `rev` (see the seed `rev` rule above) so stored copies reload.
