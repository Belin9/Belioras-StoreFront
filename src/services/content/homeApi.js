/* Home Page Tiles */
import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath } from "@/api/routes";
import { audited } from "../auth/audited";

/**
 * The photo tiles under "Explore the Collection" on the home page, on the
 * server. Each is a photo, a name, a tagline and the mega-menu page it opens.
 *
 * The list is saved whole, naming the `version` the editor loaded: if someone
 * else saved in between, the server refuses (409) rather than overwriting
 * them. A tile can only open a page that is in the mega menu; one whose page
 * was later removed from the menu comes back `linked: false` here and is left
 * out of the shop until its link is chosen again.
 */

export const MAX_TILES = 6;

/** The tiles as the shop shows them. Never rejects: no tiles is better than a broken home page. */
export function getHomeTiles() {
  return http.get(resourcePath("home/tiles", "customer"), { realm: "customer" }).catch(() => []);
}

/** Every tile, with the version a save must name, for the dashboard. */
export function getHomeTilesForEditing() {
  return http.get(resourcePath("home/tiles", "staff"), { realm: "staff" });
}

/** The form's checks first, in the words the editor needs; the server repeats them. */
function body(tiles) {
  if (!tiles.length) throw new ApiError("Keep at least one tile.", 422);
  if (tiles.length > MAX_TILES) throw new ApiError(`Up to ${MAX_TILES} tiles.`, 422);
  return tiles.map((tile, i) => {
    const name = String(tile.name ?? "").trim();
    if (!name) throw new ApiError(`Tile ${i + 1} needs a name.`, 422);
    if (!tile.image) throw new ApiError(`Add a photo to “${name}”.`, 422);
    if (!tile.url) throw new ApiError(`Choose which page “${name}” opens.`, 422);
    return { id: tile.id, name, tagline: String(tile.tagline ?? "").trim(), image: tile.image, url: tile.url };
  });
}

async function saveHomeTiles$raw(tiles, version) {
  if (!version) throw new ApiError("The tiles couldn't be loaded from the server, so they can't be saved. Reload the page and try again.", 503);
  return http.put(resourcePath("home/tiles", "staff"), { tiles: body(tiles), version }, { realm: "staff" });
}

export const saveHomeTiles = audited("home", () => "Saved the home page tiles", saveHomeTiles$raw);
