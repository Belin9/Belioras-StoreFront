/* Admin Dashboard Page: Products - ProductFormPhotoVideos */
import { useState } from "react";
import { Link2, Play, X } from "lucide-react";

import { cn } from "@/utils/cn";

/**
 * The piece's clips, beside its photos in the same card. One clip per colour
 * (or one for the piece when it has no colours); it plays second in the
 * gallery, after the lead photo, with that colour's first photo as its still.
 * Videos are dropped into the same box as photos; a link can be pasted too.
 */
export default function ProductFormPhotoVideos({ videos, onVideosChange, swatches, photos, uploading, onAddLink }) {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const realIds = swatches.map((s) => s.id);
  const entries = Object.entries(videos ?? {});
  if (!entries.length && !uploading) {
    return <LinkAdder link={link} setLink={setLink} error={error} setError={setError} onAdd={onAddLink} />;
  }

  const firstPhoto = (colorId) => photos.find((p) => p.colorId === colorId)?.url;
  const retag = (from, to) =>
    onVideosChange((prev) => {
      const next = { ...prev };
      const clip = next[from];
      delete next[from];
      next[to] = { ...clip, poster: firstPhoto(to) ?? clip.poster ?? null };
      return next;
    });
  const remove = (key) =>
    onVideosChange((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  return (
    <div className="space-y-3">
      <p className="input-label">Video</p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
        {entries.map(([key, clip]) => {
          const tagged = swatches.find((s) => s.id === key);
          const untagged = realIds.length > 0 && !tagged;
          return (
            <li key={key} className="border border-umber-50 bg-white">
              <div className="relative">
                <video src={clip.url} poster={clip.poster ?? firstPhoto(key) ?? undefined} muted loop playsInline className="aspect-[3/4] w-full bg-ivory-200 object-cover" />
                <span aria-hidden="true" className="absolute left-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-espresso/85 text-gold-400">
                  <Play className="size-3 translate-x-px fill-current" />
                </span>
                <button
                  type="button"
                  onClick={() => remove(key)}
                  aria-label="Remove this video"
                  className="absolute right-1 top-1 flex size-7 items-center justify-center bg-espresso/85 text-ivory-50 transition-colors hover:bg-error"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              {realIds.length > 0 && (
                <div className="px-1 pb-1.5 pt-1">
                  <div role="group" aria-label="Colour this video shows" className="flex flex-wrap items-center">
                    {swatches.map((s) => {
                      const on = key === s.id;
                      const taken = !on && videos[s.id];
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={Boolean(taken)}
                          aria-pressed={on}
                          title={taken ? `${s.name} already has a video` : s.name}
                          onClick={() => !on && retag(key, s.id)}
                          className="flex size-8 items-center justify-center disabled:opacity-30"
                        >
                          <span
                            aria-hidden="true"
                            className={cn("size-5 border transition", on ? "border-espresso ring-1 ring-espresso ring-offset-1" : "border-umber-100 opacity-55 hover:opacity-100")}
                            style={{ backgroundColor: s.hex }}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className={cn("truncate px-1 text-[10px]", untagged ? "text-gold-700" : "text-espresso")}>{tagged?.name ?? "Tag its colour"}</p>
                </div>
              )}
            </li>
          );
        })}
        {uploading && (
          <li className="flex aspect-[3/4] items-center justify-center border border-dashed border-umber-100 text-[11px] text-espresso-soft">Uploading video…</li>
        )}
      </ul>
      <LinkAdder link={link} setLink={setLink} error={error} setError={setError} onAdd={onAddLink} />
    </div>
  );
}

/** "or paste a link to an MP4", for clips already hosted elsewhere. */
function LinkAdder({ link, setLink, error, setError, onAdd }) {
  const add = () => {
    const url = link.trim();
    if (!/^https:\/\/\S+$/i.test(url)) return setError("Paste a full https:// link to the video file.");
    const problem = onAdd(url);
    if (problem) return setError(problem);
    setError("");
    setLink("");
  };
  return (
    <div>
      <div className="flex max-w-xl items-center gap-2 border border-umber-100 bg-white pl-3 focus-within:border-espresso">
        <Link2 className="size-4 shrink-0 text-espresso/40" aria-hidden="true" />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Or paste a link to a video (MP4)"
          aria-label="Video link"
          className="min-h-10 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
        />
        <button type="button" onClick={add} className="h-10 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-800 hover:text-espresso">
          Add
        </button>
      </div>
      {error && <p role="alert" className="mt-1 text-[12px] text-error">{error}</p>}
    </div>
  );
}
