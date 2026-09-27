/* Staff Activity Log */
import { mockApi } from "@/api/mock";
import { getState, setState } from "../store/contentStore";
import { currentStaff } from "./staffRegistry";

/** The log keeps the most recent entries; a backend would page and archive instead. */
const MAX_ENTRIES = 2000;

/**
 * Who is signed in to the dashboard right now.
 *
 * Read from the staff session, which publishes the server's user here on every
 * change. It used to read the staff session back out of localStorage, which
 * stopped being true when the session moved to memory and became something the
 * browser re-establishes from a refresh cookie on boot.
 */
export function currentActor() {
  return currentStaff();
}

/**
 * Records one thing that happened in the dashboard. `section` is the
 * dashboard section it touched (see permissions.js), or "auth" for sign-ins;
 * `summary` is the sentence shown. Never throws — a log that breaks the action
 * it describes would be worse than no log.
 */
export function logActivity({ section, summary, actor = currentActor(), email = null, outcome = "ok" }) {
  try {
    const entry = {
      id: `act_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      actorEmail: actor?.email ?? email,
      actorRole: actor?.role ?? null,
      section,
      summary,
      outcome,
    };
    setState("activity", (state) => ({ ...state, items: [entry, ...state.items].slice(0, MAX_ENTRIES) }));
  } catch {
    /* logging must never break the action */
  }
}

/** Newest first. */
export function getActivity() {
  return mockApi(() => getState("activity").items.map((e) => ({ ...e })), 0);
}

/** When each person last signed in, keyed by user id. */
export function lastSignIns() {
  return mockApi(() => {
    const map = {};
    for (const e of getState("activity").items) {
      if (e.section === "auth" && e.summary === "Signed in" && e.actorId && !map[e.actorId]) map[e.actorId] = e.at;
    }
    return map;
  }, 0);
}
