import { http } from "@/api/client";
import { ApiError } from "@/api/error";
import { resourcePath } from "@/api/routes";

/**
 * The contact form, on the server: every message is kept and queued to client
 * care with the shopper's address to reply to. It resolves as `queued` — the
 * page still says plainly that email delivery is not connected yet, and gives
 * the mailbox to write to directly.
 */

export function sendMessage(payload) {
  const { name, email, subject, message } = payload ?? {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return Promise.reject(new ApiError("Please complete every required field.", 422));
  }
  return http.post(
    resourcePath("contact", "customer"),
    { name: name.trim(), email: email.trim(), subject: subject ?? "General", message: message.trim() },
    { realm: "customer" },
  );
}

/** Every message, newest first, for client care. */
export function getMessages() {
  return http.get(resourcePath("contact/messages", "staff"), { realm: "staff" });
}
