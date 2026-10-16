/* Image Preparation */
import { uploadFile } from "@/services/content/uploadsApi";

export const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/* MAX BYTES */
export const MAX_BYTES = 10 * 1024 * 1024;

/* MAX EDGE */
export const MAX_EDGE = 1600;

export async function processImage(file) {

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

  const width = Math.round(bitmap.width * scale);

  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  return { blob, width, height, url: URL.createObjectURL(blob) };
}

/**
 * Shrinks a photo to at most 1600px in the browser, then uploads it. Answers
 * `{ url, width, height }` with the permanent URL to save.
 *
 * Resizing first keeps uploads small and fast on a phone connection; the
 * storefront still asks the CDN for the size each place needs.
 */
export async function uploadImage(file, { folder = "products" } = {}) {
  const { blob, width, height, url: preview } = await processImage(file);
  try {
    const name = `${String(file.name ?? "photo").replace(/\.[^.]+$/, "")}.jpg`;
    const stored = await uploadFile(blob, { folder, name });
    return { url: stored.url, width, height };
  } finally {
    URL.revokeObjectURL(preview);
  }
}
