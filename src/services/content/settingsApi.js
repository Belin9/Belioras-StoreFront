import { http } from "@/api/client";
import { accessToken } from "@/api/tokens";
import { resourcePath, routes } from "@/api/routes";
import { getState, setState } from "../store/contentStore";
import { audited } from "../auth/audited";

/**
 * Store settings, on the server: shipping zones, VAT, the invoice prefix and
 * seller details, contact and storefront copy. The server prices orders and
 * prints invoices from its copy, so that is the one that counts.
 *
 * Mirrored into the local `settings` domain, which a dozen places read
 * synchronously (announcements, contact, the checkout summary…). The
 * dashboard's low-stock line lives in that domain too and is kept on every
 * write. Reads fall back to the mirror; writes never do.
 */

function mirror(value, { notify = false } = {}) {
  const { inventory } = getState("settings");
  const next = { ...getState("settings"), ...value, ...(inventory ? { inventory } : {}) };
  const changed = JSON.stringify(next) !== JSON.stringify(getState("settings"));
  setState("settings", next, { silent: !(notify || changed) });
  return structuredClone(next);
}

export async function getSettings() {
  const realm = accessToken("staff") ? "staff" : "customer";
  try {
    return mirror(await http.get(resourcePath(routes.settings, realm), { realm }));
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) throw err;
    return structuredClone(getState("settings"));
  }
}

let synced = null;

/** Once per page load, so the synchronous readers have the server's settings. Never rejects. */
export function syncSettings() {
  if (!synced) synced = getSettings().catch(() => null);
  return synced;
}

/**
 * Merge a patch into settings, section by section, so two people editing
 * different panels do not overwrite each other's work.
 */
async function updateSettings$raw(patch) {
  const saved = await http.patch(resourcePath(routes.settings, "staff"), patch, { realm: "staff" });
  return mirror(saved, { notify: true });
}

/* Recorded in the staff activity log. */
export const updateSettings = audited((patch) => (Object.keys(patch ?? {}).every((k) => k === "shipping") ? "shipping" : "settings"), () => "Saved store settings", updateSettings$raw);
