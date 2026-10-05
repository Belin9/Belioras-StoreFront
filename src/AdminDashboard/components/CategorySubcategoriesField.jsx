/* Admin Dashboard: CategorySubcategoriesField */
import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, X } from "lucide-react";

import Button from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { reorder, useDragReorder } from "../lib/useDragReorder";
import IconAction from "./IconAction";

/**
 * A category's own "Shop by …" groups — Shop by Occasion, Shop by Fabric,
 * Shop by Colour, and so on — each holding whatever types the admin lists
 * under it. Products are tagged with these types (`subcat:<group>:<type>`),
 * and they become the shop's filter groups for the category and what Mega
 * Menu links can point at. Order here is the order a shopper sees them in.
 */
export default function CategorySubcategoriesField({ subcategories, onChange }) {
  const [draft, setDraft] = useState("");

  const move = (from, to) => {
    const next = reorder(subcategories, from, to);
    if (next) onChange(next);
  };
  const drag = useDragReorder(move);

  const patch = (i, next) => onChange(subcategories.map((s, j) => (j === i ? { ...s, ...next } : s)));

  const addSubcategory = () => {
    const name = draft.trim();
    if (!name) return;
    onChange([...subcategories, { id: null, name, types: [] }]);
    setDraft("");
  };

  return (
    <div>
      <p className="input-label">Subcategories</p>
      <p className="mb-2.5 text-[12px] leading-relaxed text-espresso-soft">
        This category's own "Shop by …" groups, such as Shop by Occasion or Shop by Fabric, and the types under
        each. They become the shop's filters for this category.
      </p>

      {subcategories.length > 0 && (
        <ul className="mb-3 space-y-3">
          {subcategories.map((sub, i) => (
            <SubcategoryCard
              key={sub.id ?? `new-${i}`}
              sub={sub}
              index={i}
              total={subcategories.length}
              drag={drag}
              onMove={move}
              onPatch={(next) => patch(i, next)}
              onRemove={() => onChange(subcategories.filter((_, j) => j !== i))}
            />
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          aria-label="New subcategory name"
          placeholder="Add a subcategory, such as Shop by Occasion"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSubcategory();
            }
          }}
          className="input h-10 flex-1 py-2 text-[13px]"
        />
        <Button variant="secondary" icon={Plus} onClick={addSubcategory} disabled={!draft.trim()} className="h-10">
          Add
        </Button>
      </div>
    </div>
  );
}

/** One "Shop by …" group: its name, its types (reorderable on their own), and a field to add one. */
function SubcategoryCard({ sub, index, total, drag, onMove, onPatch, onRemove }) {
  const [typeDraft, setTypeDraft] = useState("");

  const moveType = (from, to) => {
    const next = reorder(sub.types, from, to);
    if (next) onPatch({ types: next });
  };
  const typeDrag = useDragReorder(moveType);

  const addType = () => {
    const name = typeDraft.trim();
    if (!name) return;
    onPatch({ types: [...sub.types, { id: null, name }] });
    setTypeDraft("");
  };

  return (
    <li
      {...drag.rowProps(index)}
      className={cn("border bg-white p-3 transition-colors", drag.over === index ? "border-gold-500 bg-gold-500/5" : "border-umber-50")}
    >
      <div className="flex items-center gap-1">
        <span
          {...drag.handleProps(index)}
          title="Drag to reorder"
          aria-hidden="true"
          className="hidden cursor-grab touch-none text-espresso/30 hover:text-espresso active:cursor-grabbing sm:block"
        >
          <GripVertical className="size-4" />
        </span>
        <input
          value={sub.name}
          aria-label={`Subcategory ${index + 1} name`}
          onChange={(e) => onPatch({ name: e.target.value })}
          className="input h-10 min-w-0 flex-1 py-2 text-[13px] font-medium"
        />
        <IconAction label={`Move ${sub.name} earlier`} icon={ChevronUp} disabled={index === 0} onClick={() => onMove(index, index - 1)} />
        <IconAction
          label={`Move ${sub.name} later`}
          icon={ChevronDown}
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
        />
        <button
          type="button"
          aria-label={`Remove ${sub.name}`}
          onClick={onRemove}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-espresso/40 transition-colors hover:text-error liquid-hover"
        >
          <X className="liquid-icon size-4" aria-hidden="true" />
        </button>
      </div>

      {sub.types.length > 0 && (
        <ul className="mt-2 space-y-1.5 pl-4">
          {sub.types.map((type, ti) => (
            <li
              key={type.id ?? `new-${ti}`}
              {...typeDrag.rowProps(ti)}
              className={cn("flex items-center gap-1", typeDrag.over === ti && "bg-gold-500/5 outline outline-1 outline-gold-500")}
            >
              <span
                {...typeDrag.handleProps(ti)}
                title="Drag to reorder"
                aria-hidden="true"
                className="hidden cursor-grab touch-none text-espresso/30 hover:text-espresso active:cursor-grabbing sm:block"
              >
                <GripVertical className="size-3.5" />
              </span>
              <input
                value={type.name}
                aria-label={`${sub.name} type ${ti + 1} name`}
                onChange={(e) => onPatch({ types: sub.types.map((t, k) => (k === ti ? { ...t, name: e.target.value } : t)) })}
                className="input h-9 min-w-0 flex-1 py-1.5 text-[13px]"
              />
              <IconAction label={`Move ${type.name} earlier`} icon={ChevronUp} disabled={ti === 0} onClick={() => moveType(ti, ti - 1)} />
              <IconAction
                label={`Move ${type.name} later`}
                icon={ChevronDown}
                disabled={ti === sub.types.length - 1}
                onClick={() => moveType(ti, ti + 1)}
              />
              <button
                type="button"
                aria-label={`Remove ${type.name}`}
                onClick={() => onPatch({ types: sub.types.filter((_, k) => k !== ti) })}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-espresso/40 transition-colors hover:text-error liquid-hover"
              >
                <X className="liquid-icon size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex gap-2 pl-4">
        <input
          value={typeDraft}
          aria-label={`Add a type to ${sub.name}`}
          placeholder="Add a type, such as Satin Dresses"
          onChange={(e) => setTypeDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addType();
            }
          }}
          className="input h-9 flex-1 py-1.5 text-[13px]"
        />
        <Button type="button" variant="secondary" icon={Plus} onClick={addType} disabled={!typeDraft.trim()} className="h-9">
          Add
        </Button>
      </div>
    </li>
  );
}
