/* Size List Cache */

/**
 * The last size list this browser saw, in IndexedDB.
 *
 * The same two rules as `sizeGuideCache`, and for a sharper reason. The size
 * list is not just a filter panel: it is what a shopper's cart, wardrobe, order
 * and packing slip resolve their sizes *by id* through, on pages that are
 * frequently open and frequently offline. A stale or missing list does not
 * merely hide a filter — it prints "EU38" where a name should be, because
 * `sizeLabel` falls back to the uppercased id when it cannot resolve one.
 *
 * So:
 *
 *   1. It is written only from a successful API read or write, never from the
 *      fallback. A cache of a fallback is a cache of a fallback.
 *   2. It is never the answer to a *write*. A size that could not be saved
 *      fails loudly, because the id it would have had is permanent and a
 *      dashboard that reported success for a save that did not land is worse
 *      than one that shows the error.
 *
 * Best-effort throughout: no IndexedDB (private mode, a test runner) means
 * `null` and the next fallback. Cache trouble is never worth breaking a page.
 */

const DB_NAME = "belioras";
const DB_VERSION = 1;
const STORE = "sizes";
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

/** The last list the API returned, in order, or `null` if there are none or it failed. */
export function readCachedSizes() {
  return transact("readonly", (store) => store.get(RECORD))
    .then((record) => record?.sizes ?? null)
    .catch(() => null);
}

/** Replaces the cached list. Called only after the API has confirmed it. */
export function writeCachedSizes(sizes) {
  return transact("readwrite", (store) => store.put({ sizes, savedAt: new Date().toISOString() }, RECORD))
    .then(() => sizes)
    .catch(() => null);
}
