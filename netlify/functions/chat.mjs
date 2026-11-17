/* Netlify Function: the Belioras shopping assistant
 *
 * POST /.netlify/functions/chat  { messages: [{ role: "user"|"assistant", content }] }
 *   -> { reply, products: [{ name, slug, price, image, inStock }] }
 *
 * The Gemini key lives only here (GEMINI_API_KEY in Netlify's environment),
 * never in the browser. GEMINI_MODEL overrides the model without a code change.
 */
import { ApiError, GoogleGenAI } from "@google/genai";

import { FAQ_GROUPS } from "../../src/data/faq.js";
import { BUSINESS, PAYMENT_METHODS, SHIPPING_ZONES } from "../../src/pages/legal/legalDetails.js";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const MAX_MESSAGES = 20;
const MAX_CHARS = 1000;
const MAX_TOOL_ROUNDS = 3;
const CATALOGUE_TTL_MS = 5 * 60 * 1000;

const HUMAN_FALLBACK =
  "I can't help with that one here. For anything I can't answer, tap “Talk to a person” to reach our team on WhatsApp, or write to us through the contact page.";

/* Store facts. The owner's name and postal address are deliberately absent:
   at her request they appear only in the Impressum. */
const STORE_FACTS = [
  `Store: ${BUSINESS.name}, an online luxury boutique for dresses, hair (wigs, extensions) and accessories, based in Kaiserslautern, Germany. Website: ${BUSINESS.site}.`,
  `Customer support email: ${BUSINESS.support}. Contact page: /contact-us. Order tracking: /order-tracking.`,
  `Payment methods: ${PAYMENT_METHODS.join("; ")}. Prices are in euros and include VAT; other currencies on the site are for display only.`,
  "Shipping:",
  ...SHIPPING_ZONES.map((z) => `- ${z.zone}: cost ${z.cost}, free ${z.free}, delivery ${z.time}.`),
  "Useful pages: /shipping-policy, /return-and-refund-policy, /hair-length-guide, /shoe-size-guide, /faq, /impressum.",
  "FAQ:",
  ...FAQ_GROUPS.flatMap((g) => g.items.map((i) => `Q: ${i.q}\nA: ${i.a}`)),
].join("\n");

export const SYSTEM_INSTRUCTION = `You are the Belioras Concierge, the shopping assistant on the Belioras website.

Voice: warm, polished and brief, like a boutique assistant. Two to four short sentences unless the shopper asks for detail. Plain text only (no markdown headings or tables). Reply in the shopper's language.

What you do:
- Answer questions about orders, shipping, returns, payment, sizing and care using ONLY the store facts below. Never invent policies, prices, delivery times or stock.
- Help shoppers find pieces: call search_products whenever they describe something they want (a style, colour, category or budget). Mention at most three results by name and price in euros; the website shows product cards for them, so don't paste links.
- If the facts don't cover a question, for problems with a specific order, complaints, or when the shopper asks for a person, say so honestly and suggest "Talk to a person" (WhatsApp) or the contact page.

Privacy: never name the owner or give a postal address. If asked who owns Belioras or where it is located, say the legal details are in the Impressum (/impressum).

Stay on topic: politely decline anything unrelated to Belioras and shopping there.

Store facts:
${STORE_FACTS}`;

const SEARCH_TOOL = {
  name: "search_products",
  description:
    "Search the Belioras catalogue for pieces that are currently on sale. Use for any request to find, recommend or check a product.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Keywords, e.g. 'black wig', 'satin midi dress', 'white'." },
      maxPrice: { type: "number", description: "Optional upper price limit in euros." },
    },
    required: ["query"],
    additionalProperties: false,
  },
};

/* Catalogue, cached per function instance */

let catalogue = { at: 0, items: [] };

async function loadCatalogue() {
  if (Date.now() - catalogue.at < CATALOGUE_TTL_MS && catalogue.items.length) return catalogue.items;
  const origin = (process.env.API_ORIGIN || "").replace(/\/+$/, "");
  if (!origin) return [];
  const res = await fetch(`${origin}/api/v1/storefront/products`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`catalogue ${res.status}`);
  const body = await res.json();
  const items = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
  catalogue = { at: Date.now(), items: items.filter((p) => (p.status ?? "active") === "active") };
  return catalogue.items;
}

/** Lower-case without accents, so "elegance" finds "Élégance". */
const fold = (text) => String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

function haystack(p) {
  const colours = (p.colorways ?? []).map((c) => `${c?.name ?? ""} ${c?.color ?? ""} ${c?.colorName ?? ""}`);
  // Tags look like "subcat:shop-by-colour:white-dresses": keep the words.
  const tags = (p.tags ?? []).map((t) => String(t).split(":").pop().replace(/-/g, " "));
  return fold([p.name, p.description, ...(p.details ?? []), ...tags, ...colours].join(" "));
}

export async function searchProducts({ query = "", maxPrice } = {}) {
  const words = fold(query).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1);
  const items = await loadCatalogue();
  return items
    .filter((p) => maxPrice == null || Number(p.price) <= Number(maxPrice))
    .map((p) => {
      const text = haystack(p);
      // Plural-tolerant: "wigs" matches "wig" and vice versa.
      const score = words.filter((w) => text.includes(w) || text.includes(w.replace(/s$/, ""))).length;
      return { p, score };
    })
    .filter(({ score }) => score > 0 || words.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ p }) => ({
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      image: p.images?.[0] ?? null,
      inStock: Number(p.stock ?? 0) > 0,
    }));
}

/* Request handling */

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/** Only well-formed text turns, capped, so the endpoint can't be used as a free general-purpose model. */
function readMessages(body) {
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  const ok = messages.every(
    (m) =>
      (m?.role === "user" || m?.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0 &&
      m.content.length <= MAX_CHARS,
  );
  if (!ok || messages.at(-1).role !== "user") return null;
  return messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
}

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // Same-site only: the widget is the only intended caller.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return json(403, { error: "Forbidden" });

  if (!process.env.GEMINI_API_KEY) return json(503, { error: "unavailable" });

  let contents;
  try {
    contents = readMessages(await req.json());
  } catch {
    contents = null;
  }
  if (!contents) return json(400, { error: "Invalid conversation" });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const config = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: [SEARCH_TOOL] }],
    maxOutputTokens: 800,
  };

  const found = new Map();

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      const response = await ai.models.generateContent({ model, contents, config });
      const calls = response.functionCalls ?? [];

      if (calls.length === 0 || round === MAX_TOOL_ROUNDS) {
        const reply = (response.text ?? "").trim();
        // Cards only for the pieces the reply actually recommends.
        const named = [...found.values()].filter((p) => fold(reply).includes(fold(p.name)));
        return json(200, { reply: reply || HUMAN_FALLBACK, products: named.slice(0, 3) });
      }

      // Send the model's turn back exactly as received: Gemini 3 function-call
      // parts carry thought signatures that must be returned unchanged.
      const modelTurn = response.candidates?.[0]?.content;
      if (!modelTurn) return json(200, { reply: HUMAN_FALLBACK, products: [] });
      contents.push(modelTurn);

      const parts = [];
      for (const call of calls) {
        let result;
        if (call.name === "search_products") {
          try {
            const products = await searchProducts(call.args);
            products.forEach((p) => found.set(p.slug, p));
            result = { products: products.map(({ name, price, inStock }) => ({ name, priceEUR: price, inStock })) };
          } catch {
            result = { error: "The catalogue could not be reached right now." };
          }
        } else {
          result = { error: `Unknown function ${call.name}` };
        }
        parts.push({ functionResponse: { id: call.id, name: call.name, response: result } });
      }
      contents.push({ role: "user", parts });
    }
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 0;
    console.error("chat error", err?.name ?? "Error", status);
    if (status === 429) return json(429, { error: "busy" });
    return json(502, { error: "unavailable" });
  }

  return json(200, { reply: HUMAN_FALLBACK, products: [] });
}
