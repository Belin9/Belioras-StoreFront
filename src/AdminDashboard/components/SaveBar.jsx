/* Admin Dashboard: SaveBar */
import { Check } from "lucide-react";

import Button from "@/components/ui/Button";
import { cn } from "@/utils/cn";

/**
 * The one "unsaved changes" bar every editing page uses, pinned to the bottom
 * of the scrolling page while something has changed. Pass `onSave`, or leave
 * it out inside a <form> and the Save button submits the form.
 */
export default function SaveBar({
  dirty,
  saving = false,
  onSave,
  onDiscard,
  saveLabel = "Save changes",
  message = "You have unsaved changes. The shop isn’t showing them yet.",
  className,
}) {
  if (!dirty) return null;

  return (
    <div
      role="status"
      className={cn(
        "sticky bottom-0 z-30 -mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-espresso/15 bg-ivory-50/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10",
        className,
      )}
    >
      <p className="text-[13px] text-espresso">
        <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-gold-500" />
        {message}
      </p>
      <div className="flex gap-2">
        {onDiscard && (
          <Button variant="ghost" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
        )}
        <Button
          type={onSave ? "button" : "submit"}
          icon={Check}
          onClick={onSave}
          loading={saving}
          className="bg-espresso text-ivory-50 hover:bg-espresso-600"
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
