/* Admin Dashboard Page: Products - ProductFormPhotos */
import { useState } from "react";

import { useToast } from "@/context/ToastContext";
import { uploadFile } from "@/services/content/uploadsApi";
import { AS_SHOWN_ID } from "@/utils/productColors";
import FormSection from "./ProductFormSection";
import ProductFormDropzone from "./ProductFormDropzone";
import ProductFormPhotoVideos from "./ProductFormPhotoVideos";

const VIDEO_MAX_MB = 100;

/**
 * Photos come first: upload everything, then tag each with the colour it
 * shows. Each colour's photos become its gallery on the product page.
 */
export default function ProductFormPhotos({ photos, onChange, colors, colorIds, onColorIdsChange, onImageProgress, videos = {}, onVideosChange }) {
  const { toast } = useToast();
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const byId = new Map(colors.map((c) => [c.id, c]));
  // Tagging only matters when the piece comes in real colours; without them
  // every photo belongs to the hidden "As shown" colour on save.
  const realIds = colorIds.filter((id) => id !== AS_SHOWN_ID);
  const swatches = realIds.map((id) => byId.get(id) ?? { id, name: id, hex: "#ccc" });
  const untagged = photos.filter((p) => !realIds.includes(p.colorId)).length;

  // What the shop leads with: the first photo of the first colour (the
  // product card, and the page's opening photo), or simply the first photo.
  const leadIndex = realIds.length ? Math.max(0, photos.findIndex((p) => p.colorId === realIds[0])) : 0;

  // A clip goes to the first colour without one (or the piece, with no
  // colours); its tag can be changed under the clip.
  const freeSlot = () => {
    if (!realIds.length) return videos[AS_SHOWN_ID] ? null : AS_SHOWN_ID;
    return realIds.find((id) => !videos[id]) ?? null;
  };
  const noRoom = realIds.length ? "Every colour already has a video. Remove one first." : "This piece already has a video. Remove it first.";
  const posterFor = (key) => photos.find((p) => p.colorId === key)?.url ?? photos[0]?.url ?? null;

  const addVideoFiles = async (files) => {
    for (const file of files) {
      const slot = freeSlot();
      if (!slot) return toast(noRoom, "error");
      if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
        toast(`${file.name} is over ${VIDEO_MAX_MB} MB. Shorten or compress it first.`, "error");
        continue;
      }
      setUploadingVideo(true);
      try {
        const stored = await uploadFile(file, { folder: "products" });
        onVideosChange((prev) => ({ ...prev, [slot]: { url: stored.url, poster: posterFor(slot), name: file.name, uploaded: true } }));
        toast("Video added.", "success");
      } catch (err) {
        toast(err?.message ?? `${file.name} could not be uploaded.`, "error");
      } finally {
        setUploadingVideo(false);
      }
    }
  };

  const addVideoLink = (url) => {
    const slot = freeSlot();
    if (!slot) return noRoom;
    onVideosChange((prev) => ({ ...prev, [slot]: { url, poster: posterFor(slot) } }));
    return null;
  };

  // The star: this photo first, and its colour first, so it becomes the card.
  const makeLead = (index) => {
    const photo = photos[index];
    onChange([photo, ...photos.filter((_, i) => i !== index)]);
    if (onColorIdsChange && realIds.includes(photo.colorId) && realIds[0] !== photo.colorId) {
      onColorIdsChange([photo.colorId, ...colorIds.filter((id) => id !== photo.colorId)]);
    }
  };

  return (
    <FormSection title="Photos" hint="Photos and an optional short video (6–15 seconds, portrait) for each colour. Tag each with the colour it shows. The photo marked Lead is the product card; the star makes another one lead. A video plays second, after the lead photo.">
      <ProductFormDropzone
        images={photos}
        onChange={onChange}
        onProgress={onImageProgress}
        max={12}
        swatches={swatches}
        defaultColorId={realIds[0] ?? null}
        leadIndex={leadIndex}
        onMakeLead={makeLead}
        onTag={(index, colorId) => onChange(photos.map((p, i) => (i === index ? { ...p, colorId } : p)))}
        onVideoFiles={onVideosChange ? addVideoFiles : undefined}
      />

      {onVideosChange && (
        <ProductFormPhotoVideos
          videos={videos}
          onVideosChange={onVideosChange}
          swatches={swatches}
          photos={photos}
          uploading={uploadingVideo}
          onAddLink={addVideoLink}
        />
      )}

      {untagged > 0 && realIds.length > 0 && (
        <p className="border-l-2 border-gold-500 py-1 pl-3 text-[12px] text-espresso-soft">
          {untagged} {untagged === 1 ? "photo is" : "photos are"} not tagged with a colour yet.
        </p>
      )}
    </FormSection>
  );
}
