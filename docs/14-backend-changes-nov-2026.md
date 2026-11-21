# 14 — Backend changes from the November 2026 client requests

The client asked for a batch of storefront changes (17–18 Nov 2026). Most are frontend-only and already built. This page lists what the **server** needs to do or check, with the exact contracts. Items are ordered by priority.

| # | Item | Server work | Priority |
|---|---|---|---|
| 1 | Fit model "usual size" | Accept and return `size` on models | **Required**: the field is dropped today |
| 2 | WhatsApp number and Facebook link | Make sure settings keep `contact.whatsapp` and `social.facebook` | **Required** if the settings schema is strict |
| 3 | Owner's name and address only in the Impressum | Fix stored data; stop serving the address publicly; check email templates | **Required** (client's explicit request) |
| 4 | Chat assistant | None; keep the public product list stable | Note |
| 5 | Size guides | Check saves round-trip; clear a dead image URL if seeded | Check |
| 5b | Products without a colour ("As shown") | Leave "As shown" out of email and invoice PDF colour labels | Small |
| 6 | New storefront pages | Reserve two slugs if the server validates menu slugs | Check |
| 7 | Per-product manufacturer (GPSR) and returnability | Store and return `manufacturer`, `safetyWarnings`; return `isNonReturnable` | **Required**: fields are dropped today |
| 8 | Photo and colour order | Keep `colorways`, `colorways[].images` and `images` in the order sent | Check |

---

## 1. Fit models: optional `size`

**Client request:** record each model's usual size (XS, S, M…).

**Frontend (done):**
- Dashboard → Sizes & Guides → Models has a **Usual size** dropdown, built from the store's size list.
- The dashboard sends `size` on create and edit ([modelsApi.js](../src/services/catalog/modelsApi.js), `body()`).
- When staff pick a model on a product, her size pre-fills "Size she wears".

**Server:** today the field is not stored. `GET /api/v1/storefront/models` returns only `id, name, photo, heightCm, bustCm, waistCm, hipCm`.

| Endpoint | Change |
|---|---|
| `POST /api/v1/admin/models` | Accept optional `size` |
| `PATCH /api/v1/admin/models/:id` | Accept optional `size` (send `null` to clear) |
| `GET /api/v1/admin/models`, `GET /api/v1/storefront/models` | Return `size` |

- `size` is a string or `null`: a size id from the size taxonomy, lower-case (`"xs"`, `"s"`, `"m"`, `"l"`, `"xl"`, `"xxl"`).
- Validate it against the taxonomy's size ids, or at least `^[a-z0-9-]{1,16}$`.
- Existing models need no migration (`null`).

**Done when:** you add a model with Usual size **S**, reload Models, and the card shows "Size S · …".

## 2. Settings: `contact.whatsapp` and `social.facebook`

**Client request:** a WhatsApp "talk to a person" button, and Facebook beside the other social icons.

**Frontend (done):**
- Dashboard → Settings → Contact has **WhatsApp number**, saved as `contact.whatsapp` in international format such as `"+49 151 23456789"`, or `""`.
- Dashboard → Settings → Social has **Facebook**, saved as `social.facebook` (a URL or `""`).
- The storefront hides the WhatsApp button and the Facebook icon while these are empty.

**Server:**
- The live `GET /api/v1/storefront/settings` does not return either key yet. That may only be because nobody has saved them.
- If settings are validated with a strict schema, these keys are **silently stripped on save**. Please add them:

```js
contact.whatsapp: z.string().max(32).optional().default("")   // digits, spaces, + only
social.facebook:  z.string().url().or(z.literal("")).optional().default("")
```

**Done when:** you save both in the dashboard, and `GET /api/v1/storefront/settings` returns them.

> **Waiting on the client (as of 18 Nov 2026):** the client hasn't provided the correct social media links yet. The current Instagram, Pinterest and TikTok values may be placeholders, and Facebook is empty. Staff will enter the real links in Dashboard → Settings → Social once they arrive. **The server only needs to accept and return the keys; don't seed or hard-code any URLs.** Test with any URL and clear it afterwards.

## 3. Owner's name and address: Impressum only

**Client request:** *"I would prefer my name to appear only in the Impressum, where legally required."* The same goes for the postal address. The owner also asked that internal business matters stay private.

**Frontend (done):**
- New `/impressum` page. It is now the only page that renders the owner's name and address.
- The footer GPSR line is removed.
- Privacy, Terms and the withdrawal form name the business and link to the Impressum.
- The contact page's address block is removed.
- The home page's structured data no longer includes the address.
- The product page gets a "Product safety" panel: trade name, safety email, and a link to the Impressum.

**Server:**
1. **Stored data.** `settings.gpsr.manufacturer` is still `"Belioras – Online Boutique (Belindah Ongessa)"`. Change it to `"Belioras – Online Boutique"`, in the live settings and in any seed or default. Staff can also do this in Dashboard → Settings → GPSR.
2. **Public settings route.** `GET /api/v1/storefront/settings` still serves `contact.boutique`, `contact.boutiqueParts` and `gpsr.address` to anyone. The storefront no longer reads them, so please **omit those three from the public (storefront) response**. Keep them on the admin route. They're only used for display today, so nothing on the storefront breaks.
3. **Email templates and PDFs.** Check every template in the notifications module (order confirmation, shipped, refund, welcome, newsletter, and the others in doc 12 → Emails) for the owner's name or the postal address in headers or footers. Use the business name and support email instead.
   - **Exception:** the **invoice and credit note** must keep the seller's full name and address. German VAT law (§14 UStG) requires it, so leave those as they are.

**Done when:**
- The public settings JSON contains no personal name and no street address.
- A test order's emails show neither.

## 4. Chat assistant: no server work, one dependency

**Frontend (done):** a shopping assistant runs as a **Netlify Function** (`netlify/functions/chat.mjs`, Google Gemini). It answers from the FAQ and policies and searches products by calling:

```
GET {API_ORIGIN}/api/v1/storefront/products     (unauthenticated)
```

- It keeps the result for 5 minutes per function instance, and reads `name, slug, price, images, stock, status, tags, description, details, colorways`.
- **Please keep that route public and those fields stable.** If you add rate limiting, the function makes at most about one request per 5 minutes per instance.
- The Gemini key lives in Netlify (`GEMINI_API_KEY`), not on the API server.

## 5. Size guides

- `GET /api/v1/storefront/size-guides` returns `{ garment: null, footwear: null, hair: null }` on live. The storefront therefore falls back to its bundled defaults (`src/data/sizeCharts.json`), which works. Please confirm a dashboard save (`PUT /admin/size-guides/:type`) round-trips, so edits made in the dashboard actually appear.
- The old default `garment.garmentImage` (`https://ik.imagekit.io/sbgenu6wj/Belioras/image.png`) returns **404**.
  - The storefront now shows a drawn measuring figure whenever the image is empty or fails to load, so nothing is broken for shoppers.
  - If the server seeds `garmentImage` with that URL, set it to `""`.

## 5b. Products without a colour: the hidden "As shown" colour

**Client request:** colour must not be required when uploading products.

**Frontend (done):**
- A product saved with no colour gets a real colour `{ id: "as-shown", name: "As shown", family: "metallic" }`. The dashboard creates it once, on first need.
- Its photos and per-size stock live under that colourway, so stock, cart and orders work unchanged.
- The storefront hides it everywhere: there's no colour picker, it's left out of colour filters, and cart, checkout, order history and invoice show no colour label.

**Server:**
- Nothing is required for it to work.
- But order lines will carry `color: "As shown"`. Where the server writes a colour into **emails or invoice PDFs**, skip it when it is `"As shown"` (compare case-insensitively), as the storefront does (`shownColor()` in `src/utils/productColors.js`).

## 6. New storefront pages: reserved slugs

Two new storefront routes: **`/impressum`** and **`/size-guide`**. They're added to the client's `RESERVED_SLUGS` ([menuTargets.js](../src/utils/menuTargets.js)). If the server also validates menu-item or category slugs against a reserved list, add both there, so a menu page can't take those addresses.

## 7. Per-product manufacturer (GPSR) and returnability

**Client request:** Belioras sells; it does not manufacture. The product page must not call the shop the "Manufacturer".

**Frontend (done):**
- The product form has a **Product safety** section: manufacturer or brand, contact (email or website), postal address, and safety warnings (one per line).
- The product page's Product safety panel shows the piece's manufacturer (when set), then the shop as **Sold by**, the safety email and the Impressum link.
- Settings → Product safety: the field is relabelled **Seller name**. It is still stored as `gpsr.manufacturer`, so no settings change is needed.
- Shipping & returns on the product page is built from `settings.shipping.zones` and links to `/shipping-policy` and `/return-and-refund-policy`. The returns line depends on whether the piece is returnable.

**Server:**

| Endpoint | Change |
|---|---|
| `POST /api/v1/admin/products`, `PATCH /api/v1/admin/products/:id` | Accept `manufacturer` and `safetyWarnings` |
| `GET` admin and storefront products (list and one) | Return `manufacturer`, `safetyWarnings` and `isNonReturnable` |

```js
manufacturer:   z.object({
  name:    z.string().max(160),
  address: z.string().max(300),
  contact: z.string().max(200),   // an email or a website
}).nullable().optional()          // null clears it
safetyWarnings: z.array(z.string().max(300)).max(20).optional().default([])
```

- `isNonReturnable` is already sent on save but the storefront list does not return it. Until it does, the storefront treats every `collectionId: "hair"` piece as non-returnable (`isNonReturnable()` in `src/utils/checkout.js`). The checkout's pre-purchase notice depends on this too.
- Existing products need no migration (`null` / `[]`).

**Done when:** you save a product with a manufacturer and a warning, and `GET /api/v1/storefront/products` returns both.

## 8. Photo order

Staff can now reorder a product's photos by dragging, or with the arrow buttons. The first photo leads in the shop. The order is the order of `colorways[].images` (and `images`) in the save. **Please make sure the server stores and returns those arrays in the order sent**, with no sorting by upload time or id.

**Done when:** you move the third photo first, save, reload, and it stays first.

The same goes for the **order of `colorways`**. Staff can now choose which colour comes first (arrows or drag on the colour chips, or the star on a photo). The first colourway is the colour the product page opens on, and its first photo is the product card. Please store and return `colorways` in the order sent, with no sorting by colour id or name.

**Done when:** on a product in Black and Red, you move Red first, save, reload the edit page, and Red is still first; the storefront card shows the red photo.

---

## Frontend-only changes, no server work (for context)

- Footer: the Shop column is removed; the size guides moved under Support; social links are icon-only.
- Checkout:
  - The pay button shows the euro amount.
  - A note says orders are charged in EUR when another display currency is chosen.
  - **Please confirm the payment provider is charged in EUR.**
- The "perks" strip is removed from the home page.
- New illustrated guides: foot measuring, hair length on the body, and a body measuring figure.
- Lint clean-up: providers split out of the context files.
