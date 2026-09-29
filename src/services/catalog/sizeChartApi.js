/* Size Guide Service */

import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath, routes } from "@/api/routes";
import { readCachedGuides, writeCachedGuides } from "./sizeGuideCache";
import { audited } from "../auth/audited";
import bundledGuides from "@/data/sizeCharts.json";

/**
 * The size reference tables.
 *
 * These lived in three places at once: the garment table inside product.jsx, the
 * footwear table byte-identically in both product.jsx and
 * shoe-size-guide.jsx, and the hair tables only on their own page. A fourth,
 * incompatible garment chart sat unused in dresses.json. One document backs the
 * product-page modal and both standalone guides, so they cannot disagree about
 * what a size means.
 *
 * Server-side they are three documents, one per guide, rather than the old blob
 * of five shared sections. The difference is in how they are written: a guide
 * used to be saved as two or three separate calls against shared keys, so a save
 * could apply half of itself — new measurements against the old instructions —
 * and editing one guide could overwrite what someone had just saved to another.
 * Each guide is now one document, replaced by one `PUT`, which either lands
 * whole or does not land.
 *
 * Reads fall back in three steps — API, then IndexedDB, then the tables bundled
 * with the app — because a shopper checking whether a size will fit is a poor
 * place to discover the network is down. Writes never fall back. See below.
 */

export const GUIDE_TYPES = ["garment", "footwear", "hair"];

/** The shipped tables, as the app bundled them. The floor under the other two. */
function bundled() {
  const guides = structuredClone(bundledGuides);
  // `rev` is the content store's shape marker, and this domain has left that
  // store — it is dropped so it cannot be mistaken for a guide field.
  delete guides.rev;
  return guides;
}

/** True when the API answered with something a shopper can actually be shown. */
function usable(guides) {
  if (!guides || typeof guides !== "object") return false;
  return GUIDE_TYPES.every((type) => {
    const guide = guides[type];
    if (!guide || typeof guide !== "object") return false;
    // The three hold different tables; rows is two of them, lengths the third.
    return Array.isArray(guide.rows ?? guide.lengths);
  });
}

/**
 * The three size guides, for the storefront and the dashboard alike.
 *
 * Both get the same document, so what a shopkeeper previews is what a shopper
 * sees. `realm` picks the boundary: the dashboard reads through `admin`, so its
 * read is authenticated like the rest of its work, while the storefront reads
 * the public route, because a shopper looking up a size has no account.
 */
export async function getSizeCharts({ realm = "customer" } = {}) {
  try {
    const guides = await http.get(resourcePath(routes.sizeGuides.list, realm), { realm });
    if (!usable(guides)) throw new ApiError("Size guides came back incomplete.", 502);

    // A confirmed read is the only thing that refreshes the offline copy. The
    // server's record is kept whole, `updatedAt` included, so a dashboard that
    // later reads this offline still knows when a guide was last edited.
    writeCachedGuides(guides);
    return guides;
  } catch (err) {
    const cached = await readCachedGuides();
    if (usable(cached)) return cached;

    // A 401 or 403 is an answer, not an outage. Falling back would show a
    // visitor tables the server has said they may not have, and would hide a
    // real session problem behind a page that looks fine.
    if (err?.status === 401 || err?.status === 403) throw err;

    // The shipped tables, which have never been edited and so carry no
    // `updatedAt` — which is exactly what "Shipped version" on the card means.
    return bundled();
  }
}

async function saveSizeGuide$raw(type, guide) {
  if (!GUIDE_TYPES.includes(type)) throw new ApiError(`"${type}" is not a size guide.`, 404);

  // No fallback on the way back. An admin who is told "saved" must be able to
  // close the tab and mean it, so a failed save throws and the editor stays open
  // with the work still in it.
  const saved = await http.put(resourcePath(routes.sizeGuides.guide, "staff", { type }), guide, {
    realm: "staff",
  });

  // Refresh only this guide, over whatever we last knew about the other two. The
  // save returned one guide, not three, and overwriting the rest with the
  // bundled tables would quietly undo recent edits the next read served.
  const cached = await readCachedGuides();
  const base = usable(cached) ? cached : bundled();
  writeCachedGuides({ ...base, [type]: saved });
  return saved;
}

async function resetSizeCharts$raw() {
  const guides = await http.post(resourcePath(routes.sizeGuides.reset, "staff"), undefined, {
    realm: "staff",
  });
  writeCachedGuides(guides);
  return guides;
}

/* Recorded in the staff activity log. */
export const saveSizeGuide = audited(
  "sizes",
  ([type]) => `Edited the ${type} size guide`,
  saveSizeGuide$raw,
);
export const resetSizeCharts = audited(
  "sizes",
  () => "Reset the size guides to defaults",
  resetSizeCharts$raw,
);
