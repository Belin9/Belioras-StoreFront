/* Admin Dashboard Page: Home - home */
import { useState } from "react";
import { Plus } from "lucide-react";

import Button from "@/components/ui/Button";
import { useStaffAuth } from "@/context/auth/useAuthRealm";
import { useContentVersion } from "@/context/ContentContext";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getNavigationForEditing } from "@/services/catalog/navigationApi";
import SaveBar from "@/AdminDashboard/components/SaveBar";
import { MAX_TILES, getHomeTilesForEditing, saveHomeTiles } from "@/services/content/homeApi";
import { menuPages } from "../7.mega-menu/sections/megaMenuTree";
import HomeTileCard from "./sections/HomeTileCard";

const newId = () => `tile-${Math.random().toString(36).slice(2, 10)}`;

/**
 * The home page's photo tiles, under "Explore the Collection". Edited as one
 * list and saved together, naming the version first loaded, so a save never
 * silently overwrites someone else's.
 */
export default function DashHome() {
  const { toast } = useToast();
  const { canEdit } = useStaffAuth();
  const editable = canEdit("home");
  const contentVersion = useContentVersion();

  const { data: stored, loading, error, refresh } = useAsyncData(getHomeTilesForEditing, [contentVersion]);
  const { data: nav } = useAsyncData(getNavigationForEditing, [contentVersion]);
  const pages = nav?.items ? menuPages(nav.items) : [];

  // null means "not edited yet, show what loaded". `baseVersion` is captured
  // on the first edit, because the stored tiles can refresh mid-edit.
  const [edits, setEditsState] = useState(null);
  const [baseVersion, setBaseVersion] = useState(null);
  const [saving, setSaving] = useState(false);
  const loaded = stored?.tiles ?? [];
  const draft = edits ?? loaded;
  const dirty = Boolean(edits) && JSON.stringify(edits) !== JSON.stringify(loaded);

  const setEdits = (next) => {
    if (next === null) setBaseVersion(null);
    else if (edits === null) setBaseVersion(stored?.version ?? null);
    setEditsState(next);
  };
  const patch = (id, change) => setEdits(draft.map((t) => (t.id === id ? { ...t, ...change } : t)));
  const move = (i, delta) => {
    const next = [...draft];
    const [tile] = next.splice(i, 1);
    next.splice(i + delta, 0, tile);
    setEdits(next);
  };
  const add = () => setEdits([...draft, { id: newId(), name: "", tagline: "", image: null, url: "" }]);
  const remove = (id) => setEdits(draft.filter((t) => t.id !== id));

  const save = async () => {
    setSaving(true);
    try {
      await saveHomeTiles(draft, baseVersion ?? stored?.version);
      setEdits(null);
      await refresh();
      toast("Tiles saved. The home page is showing them now.", "success");
    } catch (err) {
      toast(err.message ?? "Could not save the tiles.", "error");
    } finally {
      setSaving(false);
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

  if (error) {
    return (
      <div className="border border-umber-50 bg-white p-6 text-[13px] text-espresso">
        <p>The home page tiles couldn&rsquo;t be loaded from the server.</p>
        <Button variant="ghost" className="mt-3" onClick={() => refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="font-display text-lg tracking-wide text-espresso">Collection tiles</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-espresso-soft">
            The photos under &ldquo;Explore the Collection&rdquo; on the home page, in this order. Each opens a page from
            your mega menu, so it always leads somewhere real. Up to {MAX_TILES}; three fill one row on a computer.
            Nothing changes in the shop until you save.
          </p>
        </div>
        {editable && draft.length < MAX_TILES && (
          <Button variant="ghost" icon={Plus} onClick={add}>
            Add tile
          </Button>
        )}
      </div>

      {!editable && (
        <p className="border border-umber-50 bg-ivory-100 px-4 py-3 text-[12px] text-espresso-soft">
          Your role can look at the home page tiles but not change them.
        </p>
      )}

      <ul className="space-y-3">
        {draft.map((tile, i) => (
          <HomeTileCard
            key={tile.id}
            tile={tile}
            index={i}
            total={draft.length}
            pages={pages}
            editable={editable}
            onChange={(change) => patch(tile.id, change)}
            onMove={(delta) => move(i, delta)}
            onRemove={() => remove(tile.id)}
          />
        ))}
      </ul>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setEdits(null)} saveLabel="Save tiles" />
    </div>
  );
}
