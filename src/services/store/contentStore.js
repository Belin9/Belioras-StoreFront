/**
 * Content store — the persistence layer behind dashboard-editable content.
 *
 * Deliberately a plain module rather than a React context. Services read it
 * synchronously via getState(); the storefront never imports it directly and
 * never imports ContentContext. That keeps the swap to a real API contained to
 * the service modules, and keeps content reads out of the React render path.
 *
 * Seeds live in src/data/*.json. Admin edits live in localStorage. The two are
 * reconciled by the `rev` marker each seed file carries:
 *
 *   stored.rev !== seed.rev  →  the seed's shape changed under us; discard the
 *                               stored copy wholesale rather than merging two
 *                               incompatible structures.
 *   stored.rev === seed.rev  →  merge per item id, so the seed supplies the
 *                               canonical item list and any newly added fields
 *                               while stored supplies the admin's edits.
 */

import navigationSeed from "../../data/navigation.json";
import taxonomySeed from "../../data/taxonomy.json";
import heroSeed from "../../data/heroSlides.json";
import instagramSeed from "../../data/instagram.json";
import settingsSeed from "../../data/settings.json";
import catalogSeed from "../../data/catalogSeed";
import ordersSeed from "../../data/ordersSeed";
import activitySeed from "../../data/activitySeed";
import emailsSeed from "../../data/emailsSeed";
import modelsSeed from "../../data/modelsSeed";
import { migrateNavigation, migrateProduct } from "../catalog/legacyTypes";
import transactionsSeed from "../../data/transactionsSeed";
import colorsSeed from "../../data/colorsSeed";
import categoriesSeed from "../../data/categoriesSeed";
import usersSeed from "../../data/usersSeed";
import rolesSeed from "../../data/rolesSeed";
import { couponsSeed } from "../../data/couponsSeed";
import { reviewsSeed } from "../../data/reviewsSeed";
import { campaignsSeed, newsletterSettingsSeed, subscribersSeed } from "../../data/newsletterSeed";

/* KEY PREFIX */
const KEY_PREFIX = "belioras:content:";

/**
 * One localStorage key per domain rather than a single blob: a shape change in
 * hero slides must not invalidate the navigation tree, and per-domain keys are
 * far easier to inspect and clear while debugging.
 *
 * `collection` names the array that carries `id`-bearing items to merge. A
 * domain without one (settings) is merged shallowly instead.
 */

const DOMAINS = {
  navigation: {
    seed: navigationSeed,
    collection: "items",
    // Server-owned: a mirror `navigationApi` refreshes from `/navigation`, read
    // synchronously when a URL is resolved to its catalogue page.
    mirror: true,
    // Flat-type links became Subcategory filters (see legacyTypes.js).
    upgrade: {
      from: navigationSeed.rev - 1,
      run: (stored) => ({ ...stored, items: migrateNavigation(stored.items, getState("categories").items) }),
    },
  },
  taxonomy: { seed: taxonomySeed, collection: null },
  hero: { seed: heroSeed, collection: "slides" },
  instagram: { seed: instagramSeed, collection: "posts" },
  settings: { seed: settingsSeed, collection: null },
  // The size guides used to live here. They do not any more: they are the first
  // resource owned by the API rather than this store, and keeping a second
  // localStorage copy of measurements that someone can edit in the dashboard
  // would reintroduce the two-sources problem they were moved to fix. The
  // bundled tables in src/data/sizeCharts.json are now only the floor under a
  // read that reaches neither the API nor the browser's cache.
  // Catalogue and orders were the two domains the dashboard actually needed
  // and the only two it never had: every product and order edit lived in
  // component state and was gone on reload. They are ordinary domains here —
  // the same rev reconciliation, the same per-item merge.
  products: {
    seed: catalogSeed,
    collection: "items",
    // Server-owned: a mirror `productSync` refreshes from `/products`. Every
    // storefront read, the stock maths and the in-use guards read it
    // synchronously.
    mirror: true,
    // A product's flat `type` became a Subcategory tag (see legacyTypes.js).
    upgrade: {
      from: catalogSeed.rev - 1,
      run: (stored) => ({
        ...stored,
        items: (stored.items ?? []).map((p) => migrateProduct(p, getState("categories").items)),
      }),
    },
  },
  // The lists products choose from, managed under Categories & Colours.
  // Server-owned like categories: a mirror `colorsApi` refreshes from
  // `/taxonomy/colors`, read synchronously by every product expansion.
  colors: { seed: colorsSeed, collection: "items", mirror: true },
  // A mirror of the server's list, not an editable copy: `categoriesApi`
  // overwrites it after every API read or write so the synchronous readers
  // (search, reports, the size usage count, menu checks) keep working and a
  // reload offline still has the last list. `mirror` skips the seed merge —
  // the server's order and deletions are the truth, not the bundle's.
  categories: { seed: categoriesSeed, collection: "items", mirror: true },
  orders: { seed: ordersSeed, collection: "items" },
  // Discount codes. Global-only — no per-product/category scoping.
  coupons: { seed: couponsSeed, collection: "items" },
  // Product reviews. status: pending | published | hidden — only published is ever shown on the storefront.
  reviews: { seed: reviewsSeed, collection: "items" },
  // Payments and refunds against those orders. Read-only today; registered here
  // so checkout can record a payment once a provider is connected.
  transactions: { seed: transactionsSeed, collection: "items" },
  users: { seed: usersSeed, collection: "items" },
  // Dashboard roles and what each may see or change (Team → Roles).
  roles: { seed: rolesSeed, collection: "items" },
  // Who did what in the dashboard, and when: sign-ins, role changes and every edit staff make.
  activity: { seed: activitySeed, collection: "items" },
  // Every email the shop sends, queued for the backend mailer (notifications module).
  emails: { seed: emailsSeed, collection: "items" },
  // The models in the photographs, with their measurements (Sizes & Guides → Models).
  models: { seed: modelsSeed, collection: "items" },
  // The Belioras Letter: who has consented, what was sent, and the welcome email.
  subscribers: { seed: subscribersSeed, collection: "items" },
  campaigns: { seed: campaignsSeed, collection: "items" },
  newsletter: { seed: newsletterSettingsSeed, collection: null },
};

function storageKey(domain) {
  return `${KEY_PREFIX}${domain}`;
}

function readStored(domain) {
  try {

    const raw = window.localStorage.getItem(storageKey(domain));
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Private mode, disabled storage, or corrupt JSON — fall back to the seed.
    return null;
  }
}

function writeStored(domain, state) {
  try {
    window.localStorage.setItem(storageKey(domain), JSON.stringify(state));
  } catch {
    // Storage unavailable or over quota; the in-memory state is still correct
    // for this session.
  }
}

/**
 * Merges a stored collection over its seed, keyed by `id`.
 *
 * Seed order wins, so reordering or adding items in a release reaches everyone.
 * Stored fields win per item, so an admin's edits survive. Items the admin
 * added (not present in the seed) are appended.
 */

export function hydrateCollection(seedItems = [], storedItems = [], key = "id") {

  const storedById = new Map(storedItems.map((item) => [item[key], item]));

  const merged = seedItems.map((seedItem) => {

    const stored = storedById.get(seedItem[key]);
    storedById.delete(seedItem[key]);
    return stored ? { ...seedItem, ...stored } : seedItem;
  });

  return [...merged, ...storedById.values()];
}

function hydrate(domain) {
  const { seed, collection } = DOMAINS[domain];

  let stored = readStored(domain);

  if (!stored) return seed;
  if (stored.rev !== seed.rev) {
    // A domain may carry one `upgrade` from the previous rev, so a shape
    // change keeps an admin's edits instead of discarding them wholesale.
    const { upgrade } = DOMAINS[domain];
    if (!upgrade || stored.rev !== upgrade.from) return seed;
    stored = { ...upgrade.run(stored), rev: seed.rev };
    writeStored(domain, stored);
  }

  if (DOMAINS[domain].mirror) return { ...seed, ...stored, rev: seed.rev };

  if (!collection) return { ...seed, ...stored, rev: seed.rev };

  return {
    ...seed,
    ...stored,
    rev: seed.rev,
    [collection]: hydrateCollection(seed[collection], stored[collection]),
  };
}

const state = {};
let version = 0;

const listeners = new Set();

function ensure(domain) {
  if (!(domain in state)) state[domain] = hydrate(domain);
  return state[domain];
}

/** Synchronous read. Safe during first paint — returns the seed if nothing is stored. */
export function getState(domain) {
  if (!DOMAINS[domain]) throw new Error(`Unknown content domain: ${domain}`);
  return ensure(domain);
}

/**
 * Applies `updater` to a domain, persists the result, and notifies subscribers.
 *
 * `silent` persists without notifying. It is for mirroring a server read into
 * a domain: readers keyed on `version` re-run their read when it moves, so a
 * read that announced itself would trigger itself again, forever.
 */
export function setState(domain, updater, { silent = false } = {}) {

  const next = typeof updater === "function" ? updater(getState(domain)) : updater;
  state[domain] = next;
  writeStored(domain, next);
  if (silent) return next;
  version += 1;
  listeners.forEach((listener) => listener());
  return next;
}

/** Drops admin edits for a domain and returns to the shipped seed. */
export function resetDomain(domain) {
  try {
    window.localStorage.removeItem(storageKey(domain));
  } catch {
    // nothing to remove
  }
  delete state[domain];
  version += 1;
  listeners.forEach((listener) => listener());
  return getState(domain);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Notifies subscribers without writing any domain.
 *
 * The size list is the first resource to live on the server, so its writes no
 * longer go through `setState` — and that used to be the only thing that moved
 * `version`. Six storefront components read sizes keyed on that number, so a
 * rename would have saved and then left every cart, filter and packing slip in
 * the tab showing the old name.
 *
 * This is the decoupling the counter was built for: it is a signal, not the
 * content, so a write that happened somewhere else can announce itself without
 * pretending to own a local domain. It deliberately does not touch `state` or
 * `localStorage` — nothing here is cached, because the server is the only copy.
 */
export function bumpVersion() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/**
 * Monotonic counter, not the content itself. Components pass this into
 * useAsyncData's deps so a dashboard edit re-runs their service call — which
 * keeps the coupling between storefront and content layer to a single number.
 */

export function getVersion() {
  return version;
}

/* CONTENT DOMAINS */
export const CONTENT_DOMAINS = Object.keys(DOMAINS);
