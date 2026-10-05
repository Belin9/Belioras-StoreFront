import productsSeed from "./products.json";
import hairSeed from "./hair.json";
import accessoriesSeed from "./accessories.json";
import catalogExtraSeed from "./catalogExtra.json";

/**
 * The catalogue seed, as one revisioned collection.
 *
 * The 39 products live across four files for provenance — products/hair/
 * accessories are the originally authored fixtures, catalogExtra is the
 * inventory carried over from the design prototype. The content store needs a
 * single `{rev, items}` document per domain, so the join happens here rather
 * than inside productsApi, which now reads the store instead of the files.
 *
 * Bump `rev` whenever the product shape changes. Stored admin edits are then
 * discarded wholesale rather than merged into a structure they no longer fit.
 */
export default {
  rev: 16,
  items: [...productsSeed, ...hairSeed, ...accessoriesSeed, ...catalogExtraSeed],
};
