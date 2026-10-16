/* Admin Dashboard Page: Products - ProductFormVideo */
import { useRef, useState } from "react";
import { Link2, Trash2, Upload } from "lucide-react";

import IconAction from "@/AdminDashboard/components/IconAction";
import { uploadFile } from "@/services/content/uploadsApi";
import FormSection from "./ProductFormSection";

const ACCEPT = "video/mp4,video/webm,video/quicktime";
const MAX_MB = 100;

/** One colour's clip: its preview, or a link / an upload to add one. */
function ColourVideo({ swatch, video, poster, onChange }) {
  const fileRef = useRef(null);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const addLink = () => {
    const url = link.trim();
    if (!/^https:\/\/\S+$/i.test(url)) return setError("Paste a full https:// link to the video file.");
    setError("");
    setLink("");
    onChange({ url, poster: poster ?? null });
  };

  const upload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) return setError("Choose an MP4, WebM or MOV file.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`That file is over ${MAX_MB} MB. Shorten or compress it first.`);
    setError("");
    setUploading(true);
    try {
      const stored = await uploadFile(file, { folder: "products" });
      onChange({ url: stored.url, poster: poster ?? null, name: file.name, uploaded: true });
    } catch (err) {
      setError(err?.message ?? "The video could not be uploaded. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-umber-50 bg-white p-4">
      <p className="mb-3 flex items-center gap-2 text-[13px] text-espresso">
        <span aria-hidden="true" className="size-3 rounded-full border border-umber-100" style={{ backgroundColor: swatch.hex ?? "#ccc" }} />
        {swatch.name}
      </p>

      {video ? (
        <div className="flex items-start gap-4">
          <video src={video.url} poster={video.poster ?? undefined} muted loop playsInline controls className="aspect-[3/4] w-32 shrink-0 bg-ivory-200 object-cover" />
          <div className="min-w-0 flex-1 space-y-1 text-[12px] text-espresso-soft">
            <p className="truncate text-espresso">{video.name ?? video.url}</p>
            <p>{video.uploaded ? "Uploaded." : "From a link."}</p>
            <p>Plays silently and loops on the product page, after the first photo.</p>
          </div>
          <IconAction label={`Remove the ${swatch.name} video`} icon={Trash2} destructive onClick={() => onChange(null)} />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 border border-umber-100 pl-3 focus-within:border-espresso">
              <Link2 className="size-4 shrink-0 text-espresso/40" aria-hidden="true" />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
                placeholder="https://… link to an MP4"
                aria-label={`Video link for ${swatch.name}`}
                className="min-h-10 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              />
              <button type="button" onClick={addLink} className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-800 hover:text-espresso">
                Add
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-10 items-center gap-2 border border-umber-100 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-espresso transition-colors hover:border-espresso disabled:opacity-50"
            >
              <Upload className="size-3.5" aria-hidden="true" /> {uploading ? "Uploading…" : "Upload"}
            </button>
            <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          </div>
          {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}

/**
 * Optional: a short clip of the piece on the model, per colour — what a
 * photograph can't say, how it moves. A piece can have photos only.
 */
export default function ProductFormVideo({ colors, colorIds, videos, onVideosChange, photos }) {
  const byId = new Map(colors.map((c) => [c.id, c]));
  const firstPhoto = (colorId) => photos.find((p) => p.colorId === colorId)?.url ?? null;

  return (
    <FormSection
      title="Video (optional)"
      hint="Optional. A 6 to 15 second silent clip per colour, portrait (3:4 or 9:16). It sits second in the gallery, after the lead photo, and uses that colour's first photo as its still."
    >
      {colorIds.length === 0 ? (
        <p className="text-[13px] text-espresso-soft">Choose the piece&rsquo;s colours first; each can have its own clip.</p>
      ) : (
        <div className="space-y-3">
          {colorIds.map((id) => (
            <ColourVideo
              key={id}
              swatch={byId.get(id) ?? { id, name: id }}
              video={videos[id] ?? null}
              poster={firstPhoto(id)}
              onChange={(v) => onVideosChange((prev) => {
                const next = { ...prev };
                if (v) next[id] = v;
                else delete next[id];
                return next;
              })}
            />
          ))}
        </div>
      )}

    </FormSection>
  );
}
