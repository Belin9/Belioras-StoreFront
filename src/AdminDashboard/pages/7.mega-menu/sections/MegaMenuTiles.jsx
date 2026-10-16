/* Admin Dashboard Page: Mega-menu - MegaMenuTiles */
import { useRef } from "react";
import { Plus } from "lucide-react";

import { ACCEPT, uploadImage } from "@/AdminDashboard/lib/imageUpload";
import { useToast } from "@/context/ToastContext";
import { resolveTile } from "@/services/catalog/navigationApi";
import { describeTarget } from "@/utils/menuTargetText";

const ACTION = "text-[11px] uppercase tracking-[0.14em] transition-colors";

/** Up to two photo tiles shown beside the links, on wide screens. */
export default function MegaMenuTiles({ root, editor, lookups, onPick }) {
  const tiles = root.tiles ?? [];

  return (
    <section className="border border-umber-50 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="input-label mb-0">Feature tiles</p>
          <p className="text-[12px] text-espresso-soft">Up to two photos beside the links, shown on wide screens.</p>
        </div>
        {tiles.length < 2 && (
          <button type="button" onClick={() => onPick({ mode: "tile", rootId: root.id })} className={`${ACTION} inline-flex items-center gap-1.5 text-gold-700 hover:text-espresso`}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add tile
          </button>
        )}
      </div>

      {tiles.length === 0 ? (
        <p className="text-[13px] text-espresso-soft">No tiles. The dropdown shows its links only.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {tiles.map((tile) => (
            <TileCard key={tile.id} tile={tile} root={root} editor={editor} lookups={lookups} onPick={onPick} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TileCard({ tile, root, editor, lookups, onPick }) {
  const inputRef = useRef(null);
  const { toast } = useToast();
  const shown = resolveTile(tile, lookups.products);

  const replace = async (file) => {
    if (!file) return;
    try {
      const { url } = await uploadImage(file, { folder: "menu" });
      editor.patchTile(tile.id, { image: url });
      toast("Photo added. Save the menu to show it in the shop.", "success");
    } catch (err) {
      toast(err?.status ? err.message : `${file.name} could not be uploaded. Try a JPEG, PNG or WebP.`, "error");
    }
  };

  return (
    <li className="flex gap-3">
      <div className="w-24 shrink-0">
        {shown.image ? (
          <img src={shown.image} alt="" className="aspect-[3/4] w-full border border-umber-50 object-cover" />
        ) : (
          <div className="flex aspect-[3/4] w-full items-center justify-center border border-dashed border-umber-100 text-center text-[11px] text-espresso-soft">
            No photo
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <input
          value={tile.title}
          onChange={(e) => editor.patchTile(tile.id, { title: e.target.value })}
          aria-label="Tile title"
          className="input h-10 w-full py-2 text-[13px]"
        />
        <p className="text-[12px] text-espresso-soft">
          Links to <span className="text-espresso">{describeTarget(tile.target, lookups)}</span>
        </p>
        <p className="text-[11px] text-espresso-soft">
          {tile.image ? "Uploaded photo" : tile.target?.kind === "product" ? "Using the product's photo" : "Using the first piece's photo"}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <button type="button" onClick={() => onPick({ mode: "tile", rootId: root.id, tileId: tile.id, initial: tile })} className={`${ACTION} text-gold-700 hover:text-espresso`}>
            Change link
          </button>
          <button type="button" onClick={() => inputRef.current?.click()} className={`${ACTION} text-espresso-soft hover:text-espresso`}>
            Upload photo
          </button>
          {tile.image && (
            <button type="button" onClick={() => editor.patchTile(tile.id, { image: null })} className={`${ACTION} text-espresso-soft hover:text-espresso`}>
              Use automatic photo
            </button>
          )}
          <button type="button" onClick={() => editor.removeTile(tile.id)} className={`${ACTION} text-espresso-soft hover:text-error`}>
            Remove
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          aria-label={`Upload a photo for ${tile.title}`}
          className="sr-only"
          onChange={(e) => {
            replace(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
    </li>
  );
}
