/* Admin Dashboard Page: Products - ProductFormPublish */
import Button from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { publishLabels } from "./publishLabels";

/** Status and the save buttons, on large screens. `bare` drops its own card, inside Publish and price. */
export default function ProductFormPublish({ isEdit, status, submitting, hasDraft, onDiscardDraft, onSave, bare = false, className }) {
  const labels = publishLabels(isEdit, status);

  return (
    <section className={cn(!bare && "border border-umber-50 bg-ivory-50 p-5", className)}>
      <p className="flex items-center gap-2 text-[12px] text-espresso-soft">
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", labels.live ? "bg-success" : "bg-umber-100")} />
        {labels.state}
      </p>

      <div className="mt-4 grid gap-2">
        <Button loading={submitting} onClick={() => onSave("active")} className="w-full bg-espresso text-ivory-50 hover:bg-espresso-600">
          {labels.primary}
        </Button>
        <Button variant={labels.live ? "ghost" : "secondary"} disabled={submitting} onClick={() => onSave("draft")} className="w-full">
          {labels.secondary}
        </Button>
      </div>

      {hasDraft && (
        <button type="button" onClick={onDiscardDraft} className="mt-3 text-[11px] uppercase tracking-[0.14em] text-espresso-soft underline underline-offset-4 transition-colors hover:text-error">
          Discard draft
        </button>
      )}
    </section>
  );
}
