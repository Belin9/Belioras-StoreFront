/**
 * The edits one menu item supports, as pure functions over its columns, links
 * and tiles. Each hands a patch back up, so components stay declarative.
 */

import { reorder } from "../../../lib/useDragReorder";

export { reorder };

function swap(list, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return null;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function makeRootEditor(root, onPatch) {
  const sections = root.sections ?? [];
  const tiles = root.tiles ?? [];
  const sectionById = (id) => sections.find((s) => s.id === id);

  const patchSection = (sectionId, patch) =>
    onPatch({ sections: sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)) });

  return {
    // A renamed item shows as written, so it stops following its translation key.
    rename: (label) => onPatch({ label, i18nKey: undefined }),

    patchSection,

    addSection: () =>
      onPatch({
        sections: [...sections, { id: `${root.id}-col-${Date.now().toString(36)}`, title: "New column", items: [] }],
      }),

    removeSection: (sectionId) => onPatch({ sections: sections.filter((s) => s.id !== sectionId) }),

    /** Arrows beside dragging: they work by keyboard and on a phone. */
    moveSection: (index, delta) => {
      const next = swap(sections, index, delta);
      if (next) onPatch({ sections: next });
    },

    reorderSections: (from, to) => {
      const next = reorder(sections, from, to);
      if (next) onPatch({ sections: next });
    },

    reorderItems: (sectionId, from, to) => {
      const items = reorder(sectionById(sectionId).items, from, to);
      if (items) patchSection(sectionId, { items });
    },

    patchItem: (sectionId, itemId, patch) =>
      patchSection(sectionId, {
        items: sectionById(sectionId).items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
      }),

    moveItem: (sectionId, index, delta) => {
      const items = swap(sectionById(sectionId).items, index, delta);
      if (items) patchSection(sectionId, { items });
    },

    removeItem: (sectionId, itemId) =>
      patchSection(sectionId, { items: sectionById(sectionId).items.filter((i) => i.id !== itemId) }),

    patchTile: (tileId, patch) => onPatch({ tiles: tiles.map((t) => (t.id === tileId ? { ...t, ...patch } : t)) }),

    removeTile: (tileId) => onPatch({ tiles: tiles.filter((t) => t.id !== tileId) }),
  };
}
