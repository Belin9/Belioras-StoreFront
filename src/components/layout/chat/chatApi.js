/* Chat: talks to the Netlify Function in netlify/functions/chat.mjs */

const ENDPOINT = "/.netlify/functions/chat";

// The function accepts at most 20 turns; older ones are dropped here first.
const MAX_TURNS = 20;

export class ChatUnavailableError extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind; // "busy" | "unavailable"
  }
}

/** Sends the conversation, returns `{ reply, products }`. */
export async function sendChat(messages) {
  let turns = messages.slice(-MAX_TURNS).map(({ role, content }) => ({ role, content }));
  // A conversation must open with the shopper.
  while (turns.length && turns[0].role !== "user") turns = turns.slice(1);

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: turns }),
    });
  } catch {
    throw new ChatUnavailableError("unavailable");
  }

  if (res.status === 429) throw new ChatUnavailableError("busy");
  if (!res.ok) throw new ChatUnavailableError("unavailable");

  const data = await res.json().catch(() => null);
  if (!data?.reply) throw new ChatUnavailableError("unavailable");
  return { reply: data.reply, products: Array.isArray(data.products) ? data.products : [] };
}

/** wa.me wants the number as digits only, country code first. */
export function whatsappHref(number, text = "Hi Belioras, I have a question.") {
  const digits = String(number ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
