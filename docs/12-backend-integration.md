# 12 — Backend Integration: Flows and Contracts

Every flow in the shop already runs end to end on the mock layer, in the order the real system will run it. Wiring the backend means replacing each service function's body with a call to the endpoint named here. The screens do not change.

## How the swap works

- **The seam is `src/services/`.** Components only call service functions, which return promises (`mockApi`). Each function below keeps its name and return shape and swaps its body for `api.get/post/…` from `src/api/client.js`. That client already handles the `/api/v1` prefix, timeouts, token refresh and the separate customer and staff sessions.
- **Data fetching:** TanStack Query is installed for caching, refetching and invalidation. Adopt it page by page, replacing `useAsyncData`. Zod and `@hookform/resolvers` are installed for validating responses and forms against one schema.
- **The mock store** (`services/store/contentStore.js`, persisted to localStorage) goes away module by module. `API_NAMESPACES` in `src/api/routes.js` lists the backend modules; add each live endpoint to `routes` as it ships.
- **Rule for the server:** every rule a service enforces here (permissions, ownership, stock, coupon limits, refund caps) must be enforced again on the server. The browser's checks are for the user's benefit, not for security.

## What the first swap (staff sign-in) cost

Wiring `atelier.jsx` to the API was not one function body. Three things a
mock session had been hiding, worth knowing before the next module moves:

- **Nothing can be persisted.** The access token is memory-only
  (`src/api/tokens.js`) and the refresh token is an httpOnly cookie, so a page
  load arrives with no session and rebuilds it from the cookie. Every auth
  context therefore needs a boot state, and every route guard needs to tell
  "signed out" from "not yet asked" — `useStaffSession` exposes `booting` and
  `RequireAuth` renders nothing while it is true. Skipping this bounces a
  signed-in admin to `/atelier` on every refresh.
- **A session hook per door, not a `transport` option on one hook.** The
  shopper's session is still mock-backed and stored; the staff session is not.
  A single hook with a switch would let a provider choose which door it is, and
  a staff token reaching a shopper request is the bug the realm split exists to
  prevent. So: `useAuthSession` (customer, mock) and `useStaffSession` (staff,
  HTTP).
- **Modules that used to read storage no longer can.** `currentActor()` read
  `localStorage["belioras:auth:staff"]` to attribute activity-log entries and
  gate audited writes. It now reads a registry the staff session publishes
  (`services/auth/staffRegistry.js`). Expect the same of any other module that
  reached into the session by hand.
- `role` now comes from the server on the user object, which is what lets
  `isAdminRole()` pass a real login — it is the one field the dashboard cannot
  invent for itself.


## What the size guides cost

The second swap, and the first piece of content rather than identity. Worth
recording because the shape, not the transport, was the work:

- **The blob had to be split.** The guides were one document with five
  sections — `garment`, `international`, `footwear`, `hair`, and one shared
  `howToMeasure` holding all three sets of steps. They are now three documents,
  one per guide, each carrying its own steps. Saving the garment guide no
  longer touches the hair guide's instructions, and the international
  conversions live with the body measurements they are read with.
- **Saving was not atomic before, and that was the actual bug.** The garment
  dialog made three calls against shared keys, the other two made two. A
  failure halfway through left new measurements beside the old instructions,
  and one person's save could overwrite another's. Each guide is now one
  `PUT` that either lands whole or does not land, which is only possible
  because the guide is one document. A rejected save leaves the previous guide
  exactly as it was — there is a test for it.
- **Three shapes, three schemas.** A hair length and a shoe conversion are not
  the same document with fields left off, so the server validates each against
  its own zod schema, matched to the `:type` in the path. Posting a hair guide
  to `/garment` is a 400 rather than a well-formed document stored under the
  wrong name. A reversed body range (`[96, 88]`) is refused too: it sorts fine
  and reads as nonsense.
- **The public read is a separate file from the staff read.** A shopper opening
  a size guide has no account, so mounting the staff router under
  `/storefront` would have put `authenticate` in front of it and 401ed every
  visitor. Two files also mean a write can never be added to the public
  surface by accident.
- **Fallbacks, and where they stop.** Reads go API → IndexedDB → the tables
  bundled with the app, because a shopper checking a size is a poor place to
  meet a network error. Writes fall back not at all: an admin told "saved"
  must be able to close the tab and mean it. A 401/403 is treated as an
  answer rather than an outage, so a session problem surfaces instead of
  hiding behind the shipped tables.
- **The audit row records the edit, not the measurements.** A size guide
  describes bodies, so `AuditLog` gets the type and a row count and nothing
  else. `audit()` moved out of `auth.service.js` to
  `features/audit/audit.js`, since the second feature needing it is the sign it
  was never auth's alone.
- **What did not move here:** the size *list* (`taxonomy.size`). The next section
  is that.


## What the size list cost

The size list is the list of sizes that exist — "M", "EU 38 · UK 3 · US 5",
"One Size" — as distinct from the guide tables that explain what each one
measures. It is separate on purpose, and the two are allowed to disagree.

- **Fifteen call sites read it, and none of them were edited.** `getTaxonomy()`
  hands out `{ color, size }` and the shop facet, the cart, the wardrobe, order
  lines, packing slips and the invoice all read `taxonomy.size.values` from it.
  Rather than convert fifteen components, `getTaxonomy` now merges the server's
  list in behind the same shape. The whole migration is invisible above the
  service layer, which is the point: nothing in the app should be able to tell
  where the list came from.
- **Colours stayed put, and that was a decision rather than an omission.**
  `taxonomy.dimensions.color` is the 12 *filter families*; `colors.items` is the
  20 boutique colours, and each one's `family` points at a family id. That join
  feeds the storefront colour facet, the search panel's colour chips, the
  Colours dialog and every mega-menu `filter:color` link — and colours are on
  the hot path of *every* product read. Moving them is a real job with a much
  wider blast radius than sizes, so `getTaxonomy` replaces only the `size` half
  and leaves `color` on the local store.
- **The id is a public contract, so it is immutable.** It is a key in a
  product's `colorways[].stock` object, a segment of a bookmarked
  `?size=eu38,m`, and the input to `sizeChartKind.js`'s regexes that decide which
  guide a product opens. So a rename sends only a name, the server's `PATCH`
  body is `strict()` and refuses an `id` or a `position` outright, and there is
  no "update id" call anywhere. A `200` that quietly ignored a re-pointed id
  would have been the worst possible failure here: invisible in the UI, and it
  would orphan every stock row holding it.
- **A deleted id is never reissued.** Deleting a size does not un-reference it —
  the products that carried it still do. Reusing the id would silently re-point
  all of them, and their stock, at a different size. The server records spent ids
  in `FreedId`, with a unique index so two racing creates cannot both claim one,
  and the client re-reads the list after every write so the offline copy matches.
- **The delete guard is weaker than it was, and it should be said plainly.** The
  dashboard still refuses to delete a size a category offers or a product
  carries — but the server cannot check that, because it has no `Product`
  model; the catalogue lives in this browser's localStorage. So the
  guard holds for whoever holds the catalogue and for nobody else. What the
  server does guarantee is the spent id, which bounds how badly an unguarded
  delete can go. The guard moves server-side when products do.
- **Writes stopped bumping the content version, so something had to.** Six
  storefront components read sizes keyed on `contentStore`'s version counter, and
  it used to move only because `setState` did. A server-side write does not go
  through `setState`, so a rename would have saved and then left every cart and
  slip in the tab showing the old name. `bumpVersion()` announces the write
  without touching any local domain — the counter was always a signal, not the
  content, which is what made it usable here.
- **The fallback chain is the same one the guides use** — API → IndexedDB → the
  bundled list — and for a sharper reason. The list is not just a filter panel:
  it is what `sizeLabel` resolves a shopper's cart, wardrobe and packing slip
  through. A missing list does not fail visibly, it degrades quietly and wrongly,
  printing the uppercased id where a name should be. Writes still never fall
  back, since a permanent id that half-landed is worse than one that plainly
  failed.
- **The shipped twelve are pinned, and verified byte-identical** to the ids the
  client had, including the `eu36`–`eu41` spelling that `sizeChartKind`'s
  `/^eu\d+$/` depends on. The seed re-uses the *same* slug rules the client's
  `slugify` did, because a write moving to this server must not silently change
  the id scheme.
- **The guide/list drift is reported, not fixed.** The garment guide has an
  `XXL` row with no size in the list, and the list has EU sizes and One Size the
  garment guide has no row for. That is a content decision about what the shop
  actually sells, so it is left visible rather than reconciled by a refactor.


## What categories cost

- **Same id contract as sizes.** `categoriesApi.js` now talks to
  `/taxonomy/categories`; the server derives and owns ids, keeps type and
  subcategory ids across renames, and spends deleted category ids.
- **The local `categories` domain became a mirror.** Five places read categories
  synchronously (`reportsApi`, `sizesApi.sizeUsage`, `productCatalog.searchProducts`,
  `navigationApi`, the menu checks in `categoriesApi`), so rather than make them
  async, every API read and write is written into the domain. It is registered
  with `mirror: true`, which skips the seed merge on hydrate — otherwise a
  reload would bring back deleted seed categories and undo a reorder until the
  first fetch. Reads mirror with `setState(..., { silent: true })`: readers keyed
  on the content version re-run their read when it moves, so a read that
  announced itself would loop. Writes notify as usual.
- **Fallback is API → the mirror** (which starts as the bundled seed). No
  IndexedDB store this time — the mirror is already persisted.
- **The in-use guards stay client-side**: products in a category, a type on a
  product, a subcategory type tagged on a product, and Mega Menu links. They
  move to the server with products.
- **Order** is `PUT /order` with the full id list; subcategories and their
  types are ordered by array position in the category itself.
- **Flat category types were removed.** Types live only inside subcategories.
  A product's old `type` became a `subcat:<sub>:<type>` tag and a menu
  `{ kind: "type" }` link became a subcategory filter with the same URL —
  `services/catalog/legacyTypes.js` does both, for the seed files (rewritten
  once) and for stored browser data (the `upgrade` hook on the `products` and
  `navigation` domains, so admin edits survive the rev bump). Hair's flat
  "Wigs" type had no subcategory twin and was dropped; every wig already
  carried a Wigs subcategory tag.

## What colours cost

- **Same contract and mirror as categories** (`/taxonomy/colors`, domain
  registered `mirror: true`). Every product read resolves colourways through
  `colorIndex()` synchronously, so the mirror is what keeps those reads instant.
- **The storefront never asked for colours**, so `syncColors()` runs once in
  `main.jsx`. A read notifies only when the list actually changed — pages keyed
  on the content version re-run their reads, and an always-notifying read would
  loop.
- **The delete guard (a colour still on a product) stays client-side** until
  products move.

## What the mega menu cost

- **One document, saved whole** (`/navigation` → `{ items, version }`), because
  the editor already saved the whole tree at once. The `navigation` domain is a
  mirror (`mirror: true`), and keeps its `upgrade` hook for old stored menus.
- **A save names the version the editor started from.** `mega-menu.jsx`
  captures it on the first edit, not at save time — the stored menu can refresh
  mid-edit, and sending the fresh version would defeat the check. A stale save
  is a 409 telling the editor to reload.
- **Catalogue URLs wait for the menu.** `syncNavigation()` runs at boot, and
  `getCatalog`, `getFeaturedCollection` and `getSiblingLeaves` await it, so a
  deep link to a page added since this browser last looked resolves instead of
  404ing on the stale mirror.
- **Target checks stay client-side** (`menuProblem`): whether a link's category,
  filter or product still exists needs the catalogue. The server checks shape,
  names and addresses.

## Orders and payment

Payment is confirmed only by the payment provider. **Nobody marks an order paid by hand**: the dashboard has no control for it, and `updateOrderStatus` refuses it.

| Step | Today (mock) | With the backend |
|---|---|---|
| Customer pays | `checkoutApi.placeOrder(payload, { method })`: `createOrder`, then `paymentsApi.charge` (simulated), then `ordersApi.confirmPayment` | `POST /checkout` creates the order (status `to-pay`, stock held) and returns a Stripe Checkout or PayPal session. The customer pays on the provider's page, and the browser waits for the order to turn paid. |
| Payment succeeds | `confirmPayment(orderId, charge)` | **Webhook** `POST /payments/webhook` (`payment_intent.succeeded` / PayPal `PAYMENT.CAPTURE.COMPLETED`): record the charge transaction, set status `to-ship`, assign the next invoice number, queue `order-confirmation`. This must be idempotent: a webhook can arrive twice. |
| Payment fails | `ordersApi.failPayment(orderId, reason)` | Webhook `payment_failed`: record the failed transaction and queue `payment-failed`. The order stays `to-pay`, and pending orders expire after a set time, which releases their stock. |
| Staff ship | `updateOrderStatus(id, "shipped", { trackingRef, carrier })`: deducts stock, queues `order-shipped` | `POST /orders/:id/ship` |
| Delivered | `updateOrderStatus(id, "to-review")`: queues `order-delivered` | `POST /orders/:id/deliver`, or a carrier webhook |
| Staff cancel | `cancelOrder(id)`: unpaid orders just close; paid orders get a full refund and credit note first | `POST /orders/:id/cancel` |
| Customer cancels (before shipping) | `cancelMyOrder(id, { userId })`: same rules, ownership checked | `POST /me/orders/:id/cancel` |
| Refund | `refundOrder(id, { lines, includeShipping, amount, reason, restock })`: refund transaction, credit note, optional restock, queues `refund` | `POST /orders/:id/refunds`: calls the provider's refund API. The refund is final when the provider's `refund.succeeded` webhook arrives. |

**Statuses:** `to-pay` (payment pending) → `to-ship` (paid) → `shipped` → `to-review` (delivered). `cancelled` and `refunded` end the order. Allowed moves are in `utils/orderStatus.js#nextStatuses`, which the server should mirror.

**Money rules:**
- Prices include VAT. Order tax is extracted from the total (`utils/checkout.js`).
- A refund can never exceed charged minus refunded (`paymentsApi.paymentsFor`).
- Each line is refunded at what was actually paid for it, after the order's discount (`ordersApi.refundQuote`).

## Invoices and credit notes

- Invoice number `{prefix}-{year}-{0001}` is issued once, at payment. It is sequential per year, never reused and never skipped (German GoBD). The server must allocate it atomically, not the browser.
- A refund issues a credit note `{prefix}-CN-{year}-{0001}` against the invoice. Invoices are never edited after issue.
- Both render from `ordersApi.getInvoice(id, as, creditNumber?)` at `/invoice/:id` (and `?credit=…`). They are readable by staff or by the order's owner. On the server, generate the PDF from the same data and attach it to the email.
- The seller's name, address, VAT ID and tax number come from Settings → Invoices. **The VAT ID must be set before launch.**

## Emails

The server sends every email, from a Belioras address, through an email service such as Postmark, Resend or SES. Switch off Stripe's own receipts so customers get one email, not two.

Today each flow calls `notifications/emailsApi.queueEmail({ type, to, subject, orderId, data })`. The dashboard shows the queue under **Activity log → Email outbox**, together with the full list of types and their triggers (`EMAIL_TYPES`). On the server, the same calls become jobs for the notifications module; `data` is what each template needs.

| Type | Trigger |
|---|---|
| `order-confirmation` | Payment webhook succeeded (with the invoice). Staff can resend it. |
| `payment-failed` | Payment webhook failed |
| `order-shipped` / `order-delivered` | Ship or deliver |
| `order-cancelled` / `refund` | Cancel or refund (with the credit note) |
| `welcome` / `password-reset` | Register, forgot password (sent only if the account exists; the response is the same either way) |
| `team-invitation` | Invite or renew an invitation (link `/atelier/invite?token=…`) |
| `newsletter-confirm` / `newsletter-welcome` / `campaign` | Newsletter double opt-in, confirmation, campaign send (one per subscriber, each with its unsubscribe token) |
| `contact-received` | Contact form, to client care, with reply-to set to the shopper |

## Staff, roles and the activity log

- **Roles** (`roles` domain, `authRoles.js`): each dashboard section is `none`, `view` or `edit`. Enforce this on every staff endpoint.
  - The mock checks it in `services/auth/audited.js` before each write.
  - Nobody grants beyond their own access.
  - Nobody changes their own role.
  - The last Administrator can't be removed.
  - **The server now stores and returns the role id** (`User.role`, a plain
    string), which is what the dashboard reads to decide what to show. The
    per-section matrix is **still the client's to edit**, and the server holds
    no copy of it — the first capability guard on the server, `requireRole`,
    takes its list at the call site. Size-guide writes are the one place it is
    applied (`requireRole("content", "staff", "super-admin")`), so a role with
    no edit on Sizes & Guides is refused a write even if the screen offers the
    button; the other three rules below are still unchecked by the API, and
    `audited.js` remains UX for them. Treat `audited.js`'s check as UX until the
    capability guards land. A role change must also clear that user's Redis
    session cache entry, or the old role keeps being served for up to
    `SESSION_CACHE_TTL`.
- **Invitations** create an account with no password and a single-use token (`addTeamMember`, `getInvite`, `acceptInvite`). The token belongs in the email, never in an API list response. The mock returns it to the dashboard for the "copy link" button.
  - **For now the admin sets the password directly** and there is no invite on
    the server; the invite flow is the intended replacement and reuses the same
    shapes. Until then `/atelier/invite` is still mock-only, and the
    `addTeamMember`/`getInvite`/`acceptInvite` calls are still the local store.
- **Activity log** (`activityApi.logActivity`): sign-ins, failed sign-ins and every staff write, with actor, section and summary. On the server, write it in the same transaction as the change.
  - The server already records `REGISTER`/`LOGIN`/`LOGOUT`/`REFRESH` in
    `AuditLog`; the client's own activity list is still the local store. The two
    are not merged yet.


## Other flows

- **Stock:** placed orders hold stock; shipping deducts it; refunds with "back on the shelf" return it. Every change goes through `inventory/stockLedger.applyStockChanges`, which writes a movement row. Keep that ledger on the server.
- **Coupons:** `assertCouponRedeemable` runs twice, at "Apply" and again when the order is placed. It covers expiry, minimum order, total uses and uses per customer. Cancelled and refunded orders give a use back.
- **Reports** (`reportsApi.getReports(period)`) are read-only aggregates. Move them to server queries once the data is there.

## Product video

- Each colourway may carry `video: { url, poster }`, and the product carries `modelFit: { heightCm, size }`. The storefront reads them through `productColorways.expandColorways` (`colorVideos`) and `utils/productColors.videoForColor`.
- Uploads in the product form are held in the browser for now. With the backend, `POST /media/videos` stores the file with the photos (ImageKit, Mux or Cloudinary), transcodes it to web MP4 (about 720p, under 5 MB), and returns the `url` and a `poster`.
- The sample clips come from Mixkit's free library (Mixkit licence, commercial use allowed). Re-host them on your own media storage before launch rather than linking to Mixkit's servers.
