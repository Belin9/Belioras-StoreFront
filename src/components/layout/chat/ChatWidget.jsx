/* Layout Component: ChatWidget — the Belioras Concierge launcher and panel */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MessageCircle, Send, X } from "lucide-react";

import { useCurrency } from "../../../context/CurrencyContext";
import { cn } from "../../../utils/cn";
import { ChatUnavailableError, sendChat, whatsappHref } from "./chatApi";
import WhatsAppIcon from "./WhatsAppIcon";

const STORAGE_KEY = "belioras:chat";
const MAX_CHARS = 1000;

const STARTERS = ["How long does shipping take?", "How do returns work?", "Help me find a wig", "Which size should I choose?"];

const UNAVAILABLE = {
  busy: "I'm a little busy right now. Please try again in a moment",
  unavailable: "Chat isn't available right now",
};

// sessionStorage can throw (private mode, blocked storage): the chat simply
// starts fresh in that case.
function loadMessages() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    /* storage unavailable */
  }
}

/** Round launcher button, rendered inside the bottom-right stack. */
export function ChatLauncher({ open, onToggle, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="belioras-chat"
      aria-label={open ? "Close chat" : "Chat with Belioras"}
      title={open ? "Close chat" : "Chat with us"}
      className="liquid-hover flex size-12 items-center justify-center rounded-full border border-gold-500/30 bg-espresso text-gold-400 shadow-large transition-colors hover:text-gold-300"
    >
      {open ? <X className="liquid-icon size-5" aria-hidden="true" /> : <MessageCircle className="liquid-icon size-5" aria-hidden="true" />}
    </button>
  );
}

/** The conversation panel. Bottom sheet on phones, a card beside the launcher on larger screens. */
export function ChatPanel({ open, onClose, whatsapp }) {
  const { format } = useCurrency();
  const [messages, setMessages] = useState(loadMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const waHref = whatsappHref(whatsapp);

  useEffect(() => saveMessages(messages), [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending, problem, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function send(text) {
    const content = text.trim().slice(0, MAX_CHARS);
    if (!content || sending) return;

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setProblem(null);
    setSending(true);
    try {
      const { reply, products } = await sendChat(next);
      setMessages((m) => [...m, { role: "assistant", content: reply, products }]);
    } catch (err) {
      setProblem(err instanceof ChatUnavailableError ? err.kind : "unavailable");
    } finally {
      setSending(false);
    }
  }

  return (
    <section
      id="belioras-chat"
      role="dialog"
      aria-label="Belioras Concierge chat"
      className={cn(
        open ? "flex" : "hidden",
        "fixed z-[70] flex-col overflow-hidden bg-ivory-50 text-espresso shadow-large",
        "inset-x-0 bottom-0 h-[85dvh] rounded-t-2xl border-t border-gold-500/20",
        "sm:inset-x-auto sm:right-6 sm:h-[560px] sm:max-h-[calc(100dvh-8rem)] sm:w-[380px] sm:rounded-2xl sm:border",
        "sm:bottom-[calc(5.5rem+var(--consent-bar-height,0px))]",
      )}
    >
      <header className="flex items-center justify-between gap-3 bg-espresso px-5 py-4 text-ivory-50">
        <div>
          <p className="font-display text-lg tracking-wide">Belioras Concierge</p>
          <p className="text-[11px] text-ivory-50/60">Here to help, any time</p>
        </div>
        <div className="flex items-center gap-1">
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[11px] uppercase tracking-[0.14em] text-[#25D366] hover:bg-ivory-50/10"
            >
              <WhatsAppIcon className="size-4" />
              <span className="hidden sm:inline">Talk to a person</span>
              <span className="sm:hidden">Person</span>
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex size-11 items-center justify-center rounded-full text-ivory-50/70 hover:bg-ivory-50/10 hover:text-ivory-50"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
        <Bubble role="assistant">
          Welcome to Belioras. Ask me about shipping, returns or sizing, or tell me what you're looking for.
        </Bubble>

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-gold-500/40 px-3 py-1.5 text-[12px] text-espresso transition-colors hover:border-gold-700 hover:text-gold-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="space-y-2">
            <Bubble role={m.role}>{m.content}</Bubble>
            {m.products?.length > 0 && (
              <ul className="space-y-2">
                {m.products.slice(0, 3).map((p) => (
                  <li key={p.slug}>
                    <Link
                      to={`/product/${p.slug}`}
                      onClick={() => window.matchMedia("(max-width: 639px)").matches && onClose()}
                      className="flex items-center gap-3 border border-umber-50 bg-white/60 p-2 transition-colors hover:border-gold-500"
                    >
                      {p.image && <img src={p.image} alt="" loading="lazy" className="size-14 shrink-0 object-cover" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-espresso">{p.name}</span>
                        <span className="block text-[12px] text-espresso-soft">
                          {format(p.price)}
                          {!p.inStock && " · Sold out"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {sending && (
          <p className="flex items-center gap-2 text-[12px] text-espresso-soft">
            <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Concierge is typing…
          </p>
        )}

        {problem && (
          <div className="border border-gold-500/30 bg-gold-50 p-3 text-[13px] leading-relaxed text-espresso">
            {UNAVAILABLE[problem]}.{" "}
            {waHref ? (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="text-gold-700 underline underline-offset-2">
                Message us on WhatsApp
              </a>
            ) : (
              <Link to="/contact-us" onClick={onClose} className="text-gold-700 underline underline-offset-2">
                Write to us
              </Link>
            )}{" "}
            and a person will help.
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex items-end gap-2 border-t border-umber-50 bg-ivory-50 p-3"
      >
        <label htmlFor="belioras-chat-input" className="sr-only">
          Your message
        </label>
        <textarea
          id="belioras-chat-input"
          ref={inputRef}
          rows={1}
          value={draft}
          maxLength={MAX_CHARS}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          placeholder="Ask the concierge…"
          className="max-h-28 min-h-11 flex-1 resize-none border border-umber-100 bg-white px-3 py-2.5 text-[14px] text-espresso placeholder:text-espresso/40 focus:border-gold-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          className="flex size-11 shrink-0 items-center justify-center bg-espresso text-gold-400 transition-opacity disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function Bubble({ role, children }) {
  const mine = role === "user";
  return (
    <p
      className={cn(
        "max-w-[85%] whitespace-pre-line px-4 py-2.5 text-[14px] leading-relaxed",
        mine ? "ml-auto bg-espresso text-ivory-50" : "bg-white text-espresso shadow-sm",
      )}
    >
      {children}
    </p>
  );
}
