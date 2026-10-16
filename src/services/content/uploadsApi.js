/* Uploads */
import { http } from "@/api/client";
import { resourcePath, routes } from "@/api/routes";

/**
 * Sends one photo or video to the server and answers `{ url, kind, … }`.
 *
 * The URL is permanent and works for everyone: ImageKit's CDN when the server
 * is configured for it, `/api/uploads/…` otherwise. That URL — never a `blob:`
 * one — is what a product, menu tile or fit model saves.
 *
 * `folder` groups files on ImageKit: "products", "menu" or "models".
 */
export function uploadFile(file, { folder = "products", name } = {}) {
  const form = new FormData();
  form.append("folder", folder);
  form.append("file", file, name ?? file.name ?? "upload");
  return http.post(resourcePath(routes.uploads, "staff"), form, { realm: "staff", timeout: 5 * 60 * 1000 });
}
