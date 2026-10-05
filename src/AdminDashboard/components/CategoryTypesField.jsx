/* Admin Dashboard: CategoryTypesField */
import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, X } from "lucide-react";

import Button from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { reorder, useDragReorder } from "../lib/useDragReorder";
import IconAction from "./IconAction";

/**
 * The types within a category: rename in place, reorder, remove, or add a new
 * one. Their order is the order a product's Type picker and the shop filter
 * list them in.
 */
export default function CategoryTypesField({ types, onChange }) {
  const [draft, setDraft] = useState("");
  const move = (from, to) => {
    const next = reorder(types, from, to);
    if (next) onChange(next);
  };
  const drag = useDragReorder(move);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    onChange([...types, { id: null, name }]);
    setDraft("");
  };

  return (
    <div>
      <p className="input-label">Types</p>
      <p className="mb-2.5 text-[12px] leading-relaxed text-espresso-soft">
        What a product in this category is tagged with, such as Heels or Handbags. A product picks one, and the
        menu can link to it.
      </p>

      {types.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {types.map((type, i) => (
            <li
              key={type.id ?? `new-${i}`}
              {...drag.rowProps(i)}
              className={cn("flex items-center gap-1", drag.over === i && "bg-gold-500/5 outline outline-1 outline-gold-500")}
            >
              <span
                {...drag.handleProps(i)}
                title="Drag to reorder"
                aria-hidden="true"
                className="hidden cursor-grab touch-none text-espresso/30 hover:text-espresso active:cursor-grabbing sm:block"
              >
                <GripVertical className="size-4" />
              </span>
              <input
                value={type.name}
                aria-label={`Type ${i + 1} name`}
                onChange={(e) => onChange(types.map((t, j) => (j === i ? { ...t, name: e.target.value } : t)))}
                className="input h-10 min-w-0 flex-1 py-2 text-[13px]"
              />
              <IconAction label={`Move ${type.name} earlier`} icon={ChevronUp} disabled={i === 0} onClick={() => move(i, i - 1)} />
              <IconAction
                label={`Move ${type.name} later`}
                icon={ChevronDown}
                disabled={i === types.length - 1}
                onClick={() => move(i, i + 1)}
              />
              <button
                type="button"
                aria-label={`Remove ${type.name}`}
                onClick={() => onChange(types.filter((_, j) => j !== i))}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-espresso/40 transition-colors hover:text-error liquid-hover"
              >
                <X className="liquid-icon size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          aria-label="New type name"
          placeholder="Add a type, such as Heels"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="input h-10 flex-1 py-2 text-[13px]"
        />
        <Button variant="secondary" icon={Plus} onClick={add} disabled={!draft.trim()} className="h-10">
          Add
        </Button>
      </div>
    </div>
  );
}
