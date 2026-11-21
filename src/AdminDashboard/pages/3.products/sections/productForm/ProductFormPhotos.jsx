/* Admin Dashboard Page: Products - ProductFormPhotos */
import FormSection from "./ProductFormSection";
import ProductFormDropzone from "./ProductFormDropzone";
import { AS_SHOWN_ID } from "@/utils/productColors";

/**
 * Photos come first: upload everything, then tag each with the colour it
 * shows. Each colour's photos become its gallery on the product page.
 */
export default function ProductFormPhotos({ photos, onChange, colors, colorIds, onColorIdsChange, onImageProgress }) {
  const byId = new Map(colors.map((c) => [c.id, c]));
  // Tagging only matters when the piece comes in real colours; without them
  // every photo belongs to the hidden "As shown" colour on save.
  const realIds = colorIds.filter((id) => id !== AS_SHOWN_ID);
  const swatches = realIds.map((id) => byId.get(id) ?? { id, name: id, hex: "#ccc" });
  const untagged = photos.filter((p) => !realIds.includes(p.colorId)).length;

  // What the shop leads with: the first photo of the first colour (the
  // product card, and the page's opening photo), or simply the first photo.
  const leadIndex = realIds.length ? Math.max(0, photos.findIndex((p) => p.colorId === realIds[0])) : 0;

  // The star: this photo first, and its colour first, so it becomes the card.
  const makeLead = (index) => {
    const photo = photos[index];
    onChange([photo, ...photos.filter((_, i) => i !== index)]);
    if (onColorIdsChange && realIds.includes(photo.colorId) && realIds[0] !== photo.colorId) {
      onColorIdsChange([photo.colorId, ...colorIds.filter((id) => id !== photo.colorId)]);
    }
  };

  return (
    <FormSection title="Photos" hint="Upload every photo of the piece. If you add colours below, tag each photo with the colour it shows. The photo marked Lead is the product card; the star makes another one lead.">
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
      />

      {untagged > 0 && realIds.length > 0 && (
        <p className="border-l-2 border-gold-500 py-1 pl-3 text-[12px] text-espresso-soft">
          {untagged} {untagged === 1 ? "photo is" : "photos are"} not tagged with a colour yet.
        </p>
      )}
    </FormSection>
  );
}
