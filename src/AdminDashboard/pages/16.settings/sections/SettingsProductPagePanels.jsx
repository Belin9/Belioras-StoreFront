/* Admin Dashboard Page: Settings - SettingsProductPagePanels */
import { useRef, useState } from "react";
import { Bold, ChevronDown, Clock, Leaf, List, RotateCcw, Star, Truck } from "lucide-react";

import Panel from "@/AdminDashboard/components/Panel";
import Switch from "@/AdminDashboard/components/Switch";
import RichText from "@/components/shared/RichText";
import { cn } from "@/utils/cn";
import { TRUST_ICONS, TRUST_ICON_LABELS } from "@/utils/trustIcons";

const POLICIES = [
  { name: "productShipping", show: "shipping", label: "Shipping Policy", icon: Truck, where: "Every product, under the live shipping rates" },
  { name: "productPreOrder", show: "preOrder", label: "Pre-Order Policy", icon: Clock, where: "Only pieces switched to Pre-order" },
  { name: "productReturns", show: "returns", label: "Return & Refund Policy", icon: RotateCcw, where: "Every product, under the piece's own returns line" },
  { name: "productResponsible", show: "responsible", label: "Responsible Production", icon: Leaf, where: "Every product" },
];

/**
 * The short lines under Add to bag: a preview of how they look on the
 * product page, then one compact row per line (pick an icon, type the text).
 */
export function TrustRowPanel({ register, watch, setValue }) {
  const lines = watch("productTrust") ?? [];
  const shown = lines.filter((l) => l?.text?.trim());
  const on = watch("productShow.trust") !== false;

  return (
    <Panel
      title="Trust row"
      hint="Up to four short lines under Add to bag on every product page. Leave a line empty to hide just that line."
      action={
        <Switch
          checked={on}
          onChange={(v) => setValue("productShow.trust", v, { shouldDirty: true })}
          label="Show the trust row on product pages"
          text={on ? "Shown" : "Hidden"}
        />
      }
    >
      <div className={cn("space-y-4 transition-opacity", !on && "opacity-50")}>
      {!on && <p className="text-[12px] text-espresso-soft">Hidden on every product page. The lines are kept for when you turn it back on.</p>}
      <div className="border border-umber-50 bg-white px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-espresso-soft">Preview</p>
        {shown.length ? (
          <ul className="space-y-2">
            {shown.map((l, i) => {
              const Icon = TRUST_ICONS[l.icon] ?? Star;
              return (
                <li key={i} className="flex items-center gap-3 text-[12px] uppercase tracking-[0.12em] text-espresso">
                  <Icon className="size-4 shrink-0 text-espresso-soft" strokeWidth={1.5} aria-hidden="true" />
                  {l.text}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[12px] text-espresso-soft">No lines: the product page shows none.</p>
        )}
      </div>

      <ul className="space-y-2">
        {[0, 1, 2, 3].map((i) => {
          const current = lines[i]?.icon ?? "star";
          return (
            <li key={i} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <div role="radiogroup" aria-label={`Icon for line ${i + 1}`} className="flex shrink-0 border border-umber-100 bg-white">
                {Object.entries(TRUST_ICONS).map(([id, Icon]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={current === id}
                    title={TRUST_ICON_LABELS[id]}
                    aria-label={TRUST_ICON_LABELS[id]}
                    onClick={() => setValue(`productTrust.${i}.icon`, id, { shouldDirty: true })}
                    className={cn(
                      "flex size-10 items-center justify-center transition-colors",
                      current === id ? "bg-espresso text-ivory-50" : "text-espresso-soft hover:text-espresso",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <input
                {...register(`productTrust.${i}.text`)}
                aria-label={`Line ${i + 1}`}
                maxLength={60}
                placeholder={`Line ${i + 1}, e.g. Free shipping within Germany`}
                className="input h-10 min-w-0 flex-1"
              />
            </li>
          );
        })}
      </ul>
      </div>
    </Panel>
  );
}

/**
 * The policy rows in the product page's accordion, laid out like it: each
 * opens to its text, with Write and Preview, and Bold and Bullet buttons so
 * nobody has to remember the formatting.
 */
export function PolicyRowsPanel({ register, watch, setValue }) {
  const [open, setOpen] = useState(null);

  return (
    <Panel title="Policy rows" hint="The rows under Add to bag, in this order. Switch a row off to hide it and keep its text; an empty text also hides it.">
      <ul className="divide-y divide-umber-50 border border-umber-50 bg-white">
        {POLICIES.map((p) => {
          const text = watch(p.name) ?? "";
          const isOpen = open === p.name;
          const on = watch(`productShow.${p.show}`) !== false;
          const status = !on ? ["Off", "bg-umber-50 text-espresso-soft"] : text.trim() ? ["Shown", "bg-success/10 text-success"] : ["Empty", "bg-gold-500/15 text-gold-800"];
          return (
            <li key={p.name}>
              <div className="flex items-center gap-3 pr-4 transition-colors hover:bg-brown-50/40">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : p.name)}
                className={cn("flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 text-left", !on && "opacity-55")}
              >
                <p.icon className="size-[18px] shrink-0 text-espresso-soft" strokeWidth={1.4} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] text-espresso">{p.label}</span>
                  <span className="block truncate text-[11px] text-espresso-soft">{p.where}</span>
                </span>
                <span className={cn("shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]", status[1])}>{status[0]}</span>
                <ChevronDown className={cn("size-4 shrink-0 text-espresso-soft transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
              </button>
              <Switch
                checked={on}
                onChange={(v) => setValue(`productShow.${p.show}`, v, { shouldDirty: true })}
                label={`Show ${p.label} on product pages`}
              />
              </div>
              {isOpen && <PolicyEditor name={p.name} text={text} register={register} setValue={setValue} />}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function PolicyEditor({ name, text, register, setValue }) {
  const [mode, setMode] = useState("write");
  const area = useRef(null);
  const { ref, ...field } = register(name);

  // Wraps the selection in **…**, or starts the selected lines with "- ".
  const apply = (kind) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    let next;
    let caret;
    if (kind === "bold") {
      const picked = value.slice(a, b) || "bold text";
      next = `${value.slice(0, a)}**${picked}**${value.slice(b)}`;
      caret = a + picked.length + 4;
    } else {
      const start = value.lastIndexOf("\n", a - 1) + 1;
      const block = value.slice(start, b).split("\n").map((l) => (l.startsWith("- ") ? l : `- ${l}`)).join("\n");
      next = `${value.slice(0, start)}${block}${value.slice(b)}`;
      caret = start + block.length;
    }
    setValue(name, next, { shouldDirty: true });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const TAB = "px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors";

  return (
    <div className="border-t border-umber-50 bg-ivory-50 px-4 py-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Editor" className="flex border border-umber-100 bg-white">
          {["write", "preview"].map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={cn(TAB, mode === m ? "bg-espresso text-ivory-50" : "text-espresso-soft hover:text-espresso")}>
              {m === "write" ? "Write" : "Preview"}
            </button>
          ))}
        </div>
        {mode === "write" && (
          <div className="flex gap-1">
            <button type="button" onClick={() => apply("bold")} title="Bold" aria-label="Bold" className="flex size-8 items-center justify-center border border-umber-100 bg-white text-espresso-soft hover:text-espresso">
              <Bold className="size-3.5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => apply("bullet")} title="Bullet points" aria-label="Bullet points" className="flex size-8 items-center justify-center border border-umber-100 bg-white text-espresso-soft hover:text-espresso">
              <List className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {mode === "write" ? (
        <>
          <textarea
            {...field}
            ref={(el) => {
              ref(el);
              area.current = el;
            }}
            rows={10}
            className="input h-auto min-h-52 w-full resize-y py-3 leading-relaxed"
          />
          <p className="mt-1.5 text-[11px] text-espresso-soft">A blank line starts a new paragraph. Leave the text empty to hide this row.</p>
        </>
      ) : (
        <div className="min-h-52 border border-umber-50 bg-white px-4 py-3 text-sm text-espresso-soft">
          {text.trim() ? <RichText text={text} /> : <p>Empty: this row is hidden on the product page.</p>}
        </div>
      )}
    </div>
  );
}
