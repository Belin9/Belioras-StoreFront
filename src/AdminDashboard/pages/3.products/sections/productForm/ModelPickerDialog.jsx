/* Admin Dashboard Page: Products - ModelPickerDialog */
import { useState } from "react";
import { Check, EyeOff, Search } from "lucide-react";

import Modal from "@/components/common/Modal";
import { cn } from "@/utils/cn";
import { sizeLabel } from "@/utils/sizeLabel";

/**
 * Every model as a face and a name, so staff pick the person they see in the
 * photos rather than a name in a list. "Not shown" clears the choice.
 */
export default function ModelPickerDialog({ open, onClose, models, value, onPick, taxonomy }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? models.filter((m) => m.name?.toLowerCase().includes(q)) : models;

  return (
    <Modal open={open} onClose={onClose} title="Choose the model" width="max-w-3xl">
      {models.length > 8 && (
        <label className="relative mb-4 block">
          <span className="sr-only">Search models</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-espresso-soft" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name" className="input pl-9" />
        </label>
      )}

      <div role="radiogroup" aria-label="Model" className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3 md:grid-cols-4">
        {!q && (
          <Card selected={!value} onClick={() => onPick("")} name="Not shown" detail="No model on the page">
            <span className="flex size-full items-center justify-center bg-umber-50 text-espresso/40">
              <EyeOff className="size-7" aria-hidden="true" />
            </span>
          </Card>
        )}
        {shown.map((m) => (
          <Card
            key={m.id}
            selected={value === m.id}
            onClick={() => onPick(m.id)}
            name={m.name}
            detail={[m.heightCm && `${m.heightCm} cm`, m.size && `Size ${sizeLabel(taxonomy, m.size)}`].filter(Boolean).join(" · ")}
          >
            <ModelFace model={m} />
          </Card>
        ))}
        {q && shown.length === 0 && <p className="col-span-full py-6 text-center text-[13px] text-espresso-soft">No model called &ldquo;{query}&rdquo;.</p>}
      </div>
    </Modal>
  );
}

function Card({ selected, onClick, name, detail, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-2 border bg-white px-3 pb-3 pt-4 text-center transition",
        selected ? "border-espresso ring-1 ring-espresso" : "border-umber-50 hover:border-espresso/50",
      )}
    >
      <span className="relative size-20 overflow-hidden rounded-full sm:size-24">{children}</span>
      {selected && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-espresso text-ivory-50">
          <Check className="size-3" aria-hidden="true" />
        </span>
      )}
      <span className="w-full truncate text-[13px] font-medium text-espresso">{name}</span>
      {detail && <span className="-mt-1.5 w-full truncate text-[11px] text-espresso-soft">{detail}</span>}
    </button>
  );
}

/** Her photo in a circle, or her initial on a tinted tile without one. */
export function ModelFace({ model, className }) {
  if (model?.photo) return <img src={model.photo} alt="" className={cn("size-full object-cover object-top", className)} />;
  return (
    <span className={cn("flex size-full items-center justify-center bg-gold-500/15 font-display text-2xl text-espresso", className)}>
      {(model?.name ?? "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}
