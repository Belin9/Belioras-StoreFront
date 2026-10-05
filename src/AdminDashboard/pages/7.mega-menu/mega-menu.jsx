/* Admin Dashboard Page: Mega-menu - mega-menu */
import { useState } from "react";

import { Save } from "lucide-react";

import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useContentVersion } from "@/context/ContentContext";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getStaffCategories } from "@/services/catalog/categoriesApi";
import { getNavigationForEditing, getTaxonomy, resetNavigation, updateNavigation } from "@/services/catalog/navigationApi";
import { getProducts } from "@/services/catalog/productsApi";
import { useDragReorder } from "../../lib/useDragReorder";
import MegaMenuHeader from "./sections/MegaMenuHeader";
import MegaMenuItem from "./sections/MegaMenuItem";
import MegaMenuPickers from "./sections/MegaMenuPickers";
import { applyPick } from "./sections/megaMenuActions";
import { makeRootEditor, reorder } from "./sections/megaMenuEdits";
import { emptyLinks, moveRootIn, patchRootIn, removeRootIn, totalLinks } from "./sections/megaMenuTree";

export default function DashMegaMenu() {
  const { toast } = useToast();
  const version = useContentVersion();

  const { data: stored, loading } = useAsyncData(getNavigationForEditing, [version]);
  const navigation = stored?.items;
  const { data: products } = useAsyncData(getProducts, [version]);
  const { data: categories } = useAsyncData(getStaffCategories, [version]);
  const { data: taxonomy } = useAsyncData(getTaxonomy, []);

  // null means "not edited yet, show what loaded". `baseVersion` is the menu
  // version the first edit was made on: a save names it, so if someone else
  // saved in the meantime the server refuses rather than overwriting them.
  // It is captured once, because the stored menu can refresh mid-edit.
  const [edits, setEditsState] = useState(null);
  const [baseVersion, setBaseVersion] = useState(null);
  const setEdits = (tree) => {
    if (tree === null) setBaseVersion(null);
    else if (edits === null) setBaseVersion(stored?.version ?? null);
    setEditsState(tree);
  };
  const draft = edits ?? navigation ?? [];
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [openRoot, setOpenRoot] = useState(null);
  // `n` remounts a picker, so each opening starts from what it is editing.
  const [picker, setPicker] = useState({ request: null, n: 0 });

  const rootDrag = useDragReorder((from, to) => setEdits(reorder(draft, from, to) ?? draft));

  const lookups = { categories: categories ?? [], taxonomy: taxonomy ?? {}, products: products ?? [] };
  const dirty = Boolean(edits) && JSON.stringify(edits) !== JSON.stringify(navigation);
  const editorFor = (root) => makeRootEditor(root, (patch) => setEdits(patchRootIn(draft, root.id, patch)));
  const onPick = (request) => setPicker((p) => ({ request, n: p.n + 1 }));
  const closePicker = () => setPicker((p) => ({ ...p, request: null }));

  const applyResult = (result) => {
    const { tree, openRoot: opened } = applyPick(draft, picker.request, result);
    setEdits(tree);
    if (opened) setOpenRoot(opened);
    closePicker();
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateNavigation(draft, baseVersion ?? stored?.version);
      setEdits(null);
      toast("Menu saved. The shop is showing it now.", "success");
    } catch (err) {
      toast(err.message ?? "Could not save the menu.", "error");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setConfirmReset(false);
    try {
      await resetNavigation();
      setEdits(null);
      toast("Menu restored to the original version.", "success");
    } catch (err) {
      toast(err.message ?? "Could not restore the menu.", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <MegaMenuHeader
        itemCount={draft.length}
        linkCount={totalLinks(draft)}
        dirty={dirty}
        saving={saving}
        empty={emptyLinks(draft, products)}
        onRestore={() => setConfirmReset(true)}
        onAdd={() => onPick({ mode: "item" })}
        onSave={save}
      />

      <p className="max-w-3xl text-[12px] leading-relaxed text-espresso-soft">
        Every menu item and link is chosen from your categories, types, filters and labels, so it always leads to real
        pieces. Addresses are created for you. Nothing changes in the shop until you press Save menu.
      </p>

      <ul className="space-y-3">
        {draft.map((root, i) => (
          <li key={root.id} {...rootDrag.rowProps(i)} className={rootDrag.over === i ? "outline outline-2 outline-gold-500/60" : undefined}>
            <MegaMenuItem
              root={root}
              index={i}
              total={draft.length}
              open={openRoot === root.id}
              onToggle={() => setOpenRoot(openRoot === root.id ? null : root.id)}
              onMove={(delta) => setEdits(moveRootIn(draft, i, delta))}
              onRemove={() => setPendingRemove(root)}
              editor={editorFor(root)}
              lookups={lookups}
              onPick={onPick}
              drag={rootDrag}
            />
          </li>
        ))}
      </ul>

      {dirty && (
        <div
          role="status"
          className="sticky bottom-0 z-20 -mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-espresso/15 bg-ivory-50/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10"
        >
          <p className="text-[13px] text-espresso">
            <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-gold-500" />
            You have unsaved changes. The shop isn&rsquo;t showing them yet.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEdits(null)} disabled={saving}>
              Discard
            </Button>
            <Button icon={Save} onClick={save} loading={saving}>
              Save menu
            </Button>
          </div>
        </div>
      )}

      <MegaMenuPickers picker={picker} draft={draft} lookups={lookups} onClose={closePicker} onSave={applyResult} />

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => {
          setEdits(removeRootIn(draft, pendingRemove.id));
          setPendingRemove(null);
        }}
        title={`Remove ${pendingRemove?.label ?? "this item"} from the menu?`}
        description="Its columns, links and tiles go with it. Nothing changes in the shop until you press Save menu."
        confirmLabel="Remove"
      />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={reset}
        title="Restore the original menu?"
        description="Every change made here is discarded and the menu returns to the version the site shipped with. This cannot be undone."
        confirmLabel="Restore"
      />
    </div>
  );
}
