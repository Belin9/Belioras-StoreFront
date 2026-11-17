/* WhatsApp mark: a speech bubble with a handset, drawn inline (lucide has no brand icons). */
export default function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3a9 9 0 0 0-7.75 13.57L3 21l4.56-1.2A9 9 0 1 0 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        fill="currentColor"
        d="M9.2 8.3c.2-.4.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2.1.4 0 .6l-.4.6c-.1.2-.1.3 0 .5.6 1 1.4 1.8 2.4 2.4.2.1.4.1.5 0l.6-.5c.2-.2.4-.2.6-.1l1.6.7c.4.2.4.4.4.6v.5c0 .3-.1.6-.5.8-.5.3-1.2.5-1.9.4-1.2-.2-2.6-.9-3.9-2.2S8.9 11 8.7 9.9c-.1-.6.1-1.2.5-1.6z"
      />
    </svg>
  );
}
