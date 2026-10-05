import { useRef, useState } from "react";

/**
 * Drag-to-reorder for a list, by a handle. The handle is the only thing that
 * drags, so text in the row's inputs can still be selected; the whole row is
 * where it drops. `onMove(from, to)` receives indexes. Arrows stay beside it
 * for keyboards and phones.
 */
export function useDragReorder(onMove) {
  const from = useRef(null);
  const [over, setOver] = useState(null);

  const end = () => {
    from.current = null;
    setOver(null);
  };

  return {
    over,
    handleProps: (index) => ({
      draggable: true,
      onDragStart: (e) => {
        from.current = index;
        e.dataTransfer.effectAllowed = "move";
        const row = e.currentTarget.closest("[data-drag-row]");
        if (row) e.dataTransfer.setDragImage(row, 16, 16);
      },
      onDragEnd: end,
    }),
    rowProps: (index) => ({
      "data-drag-row": "",
      onDragOver: (e) => {
        if (from.current === null) return;
        e.preventDefault();
        setOver(index);
      },
      onDrop: (e) => {
        e.preventDefault();
        if (from.current !== null && from.current !== index) onMove(from.current, index);
        end();
      },
    }),
  };
}

/** Moves one entry to another position, the rest keeping their order. `null` when the move is a no-op or out of range. */
export function reorder(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return null;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
