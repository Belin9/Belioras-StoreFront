/* Size Guide Cache */

/**
 * The last size guides this browser saw, in IndexedDB.
 *
 * The size guide sits on a product page and on two standalone pages, which is
 * the worst place to discover the network is down: a shopper mid-purchase
 * looking at whether a size will fit. So a read that cannot reach the API falls
 * back to the last thing that did, and failing that to the tables the app
 * shipped with.
 *
 * Two rules keep this from becoming a second source of truth:
 *
 *   1. It is written only from a successful API read or write, never from the
 *      fallback. A cache of a fallback is a cache of a fallback.
 *   2. It is never the answer to a *write*. A save that cannot reach the server
 *      fails loudly and keeps the editor open, because an admin who is told
 *      "saved" must be able to close the tab and mean it.
 *
 * Everything here is best-effort. A browser with IndexedDB disabled, in private
 * mode, or running these under a test runner without a DOM, simply gets `null`
 * and moves on to the next fallback. Cache trouble is never worth breaking a
 * page over.
 */

const DB_NAME = "belioras";
const DB_VERSION = 1;
const STORE = "sizeGuides";
const RECORD = "current";

/** Opens the database once and reuses the handle. */
let handle;

function open() {
  if (handle) return handle;
  handle = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("no IndexedDB"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((err) => {
    // Do not retry a failed open on every render.
    handle = null;
    throw err;
  });
  return handle;
}

function transact(mode, run) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = run(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(request?.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

/** The last guides the API returned, or `null` if there are none or it failed. */
export function readCachedGuides() {
  return transact("readonly", (store) => store.get(RECORD))
    .then((record) => record?.guides ?? null)
    .catch(() => null);
}

/** Replaces the cached guides. Called only after the API has confirmed them. */
export function writeCachedGuides(guides) {
  return transact("readwrite", (store) => store.put({ guides, savedAt: new Date().toISOString() }, RECORD))
    .then(() => guides)
    .catch(() => null);
}
