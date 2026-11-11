/* Admin Dashboard Page: Home - HomeTileCard */
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";

import Field from "@/components/ui/Field";
import { ACCEPT, uploadImage } from "@/AdminDashboard/lib/imageUpload";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/utils/cn";

const ACTION = "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors disabled:pointer-events-none disabled:opacity-40";

/** One home page tile: its photo, name, tagline and the menu page it opens. */
export default function HomeTileCard({ tile, index, total, pages, editable, onChange, onMove, onRemove }) {
  const inputRef = useRef(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const linked = pages.some((p) => p.url === tile.url);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file, { folder: "home" });
      onChange({ image: url });
      toast("Photo added. Save the tiles to show it in the shop.", "success");
    } catch (err) {
      toast(err?.status ? err.message : `${file.name} could not be uploaded. Try a JPEG, PNG or WebP.`, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <li className="flex flex-col gap-4 border border-umber-50 bg-white p-4 sm:flex-row">
      <div className="w-full shrink-0 sm:w-36">
        <button
          type="button"
          disabled={!editable || uploading}
          onClick={() => inputRef.current?.click()}
          aria-label={tile.image ? `Replace the photo for ${tile.name || "this tile"}` : `Add a photo for ${tile.name || "this tile"}`}
          className="group relative block w-full overflow-hidden border border-umber-50 bg-ivory-300 disabled:cursor-default"
        >
          {tile.image ? (
            <img src={tile.image} alt="" className="aspect-[3/4] w-full object-cover" />
          ) : (
            <span className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 border border-dashed border-umber-100 text-[11px] text-espresso-soft">
              <ImagePlus className="size-5" aria-hidden="true" />
              Add a photo
            </span>
          )}
          {uploading && <span className="absolute inset-0 flex items-center justify-center bg-ivory-50/80 text-[11px] text-espresso">Uploading…</span>}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <p className="mt-1.5 text-[11px] text-espresso-soft">Portrait, 3:4. Shown cropped to fill.</p>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Name" required>
            <input className="input" value={tile.name} maxLength={60} disabled={!editable} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
          <Field label="Tagline">
            <input className="input" value={tile.tagline ?? ""} maxLength={80} disabled={!editable} onChange={(e) => onChange({ tagline: e.target.value })} />
          </Field>
        </div>

        <Field
          label="Opens"
          required
          error={tile.url && !linked ? "That page is no longer in the mega menu, so the shop is leaving this tile out. Choose another." : undefined}
          helper="Any menu item, or a link in one of its columns."
        >
          <select className="input" value={linked ? tile.url : ""} disabled={!editable} onChange={(e) => onChange({ url: e.target.value })}>
            <option value="" disabled>
              Choose a page
            </option>
            {pages.map((p) => (
              <option key={`${p.id}-${p.url}`} value={p.url}>
                {p.context === "Menu item" ? p.name : `${p.context} › ${p.name}`}
              </option>
            ))}
          </select>
        </Field>

        {editable && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            <button type="button" className={cn(ACTION, "text-espresso-soft hover:text-espresso")} disabled={index === 0} onClick={() => onMove(-1)}>
              <ArrowUp className="size-3.5" aria-hidden="true" />
              Move up
            </button>
            <button type="button" className={cn(ACTION, "text-espresso-soft hover:text-espresso")} disabled={index === total - 1} onClick={() => onMove(1)}>
              <ArrowDown className="size-3.5" aria-hidden="true" />
              Move down
            </button>
            <button type="button" className={cn(ACTION, "text-espresso-soft hover:text-error")} disabled={total === 1} onClick={onRemove}>
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
