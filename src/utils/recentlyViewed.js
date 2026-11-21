/**
 * The pieces this shopper opened last, newest first, kept in this browser
 * only. Every read and write is guarded: private windows and blocked storage
 * simply mean no rail, never an error.
 */
const KEY = "belioras:recentlyViewed";
const MAX = 12;

export function readRecentlyViewed() {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberViewed(id) {
  if (!id) return;
  try {
    const next = [id, ...readRecentlyViewed().filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable: nothing to remember.
  }
}
