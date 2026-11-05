/* Models */
import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath } from "@/api/routes";
import { accessToken } from "@/api/tokens";
import { audited } from "../auth/audited";

/**
 * The models who wear the pieces, with the measurements a shopper compares
 * against their own — on the server. A product names its model and the size
 * she wears (`modelFit: { modelId, size }`); the product page shows her card
 * from that. A model on a product cannot be deleted, and a deleted model's id
 * is never reused.
 */

const realm = () => (accessToken("staff") ? "staff" : "customer");

export function getModels() {
  const r = realm();
  return http.get(resourcePath("models", r), { realm: r });
}

/** How many products each model appears on, keyed by id. */
export function modelUsage() {
  return http.get(resourcePath("models/usage", "staff"), { realm: "staff" });
}

/** The form's values as the server takes them, with the form's own checks first. */
function body(input = {}) {
  const name = String(input.name ?? "").trim();
  if (!name) throw new ApiError("Give the model a name.", 422);
  const cm = (v, label, min, max) => {
    if (v === "" || v == null) return null;
    const n = Math.round(Number(v));
    if (!(n >= min && n <= max)) throw new ApiError(`${label} should be between ${min} and ${max} cm.`, 422);
    return n;
  };
  return {
    name,
    photo: String(input.photo ?? "").trim() || null,
    heightCm: cm(input.heightCm, "Height", 140, 210),
    bustCm: cm(input.bustCm, "Bust", 60, 140),
    waistCm: cm(input.waistCm, "Waist", 45, 130),
    hipCm: cm(input.hipCm, "Hip", 60, 150),
  };
}

const createModel$raw = async (input) => http.post(resourcePath("models", "staff"), body(input), { realm: "staff" });
const updateModel$raw = async (id, input) => http.patch(resourcePath(`models/${encodeURIComponent(id)}`, "staff"), body(input), { realm: "staff" });
const deleteModel$raw = (id) => http.del(resourcePath(`models/${encodeURIComponent(id)}`, "staff"), { realm: "staff" });

export const createModel = audited("sizes", (_, r) => `Added the model ${r.name}`, createModel$raw);
export const updateModel = audited("sizes", (_, r) => `Updated the model ${r.name}`, updateModel$raw);
export const deleteModel = audited("sizes", (_, r) => `Removed the model ${r.name}`, deleteModel$raw);
