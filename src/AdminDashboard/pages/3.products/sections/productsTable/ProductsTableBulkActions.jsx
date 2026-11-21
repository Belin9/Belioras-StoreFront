/* Admin Dashboard Page: Products - ProductsTableBulkActions */
import Button from "../../../../../components/ui/Button";

const LABELS = [
  ["isNew:true", "Mark as new"],
  ["isNew:false", "Remove new"],
  ["featured:true", "Feature"],
  ["featured:false", "Unfeature"],
  ["bestseller:true", "Mark bestseller"],
  ["bestseller:false", "Remove bestseller"],
  ["limited:true", "Mark limited"],
  ["limited:false", "Remove limited"],
];

const SALES = [10, 15, 20, 25, 30, 40, 50];

/** What can be done to every selected piece at once. */
export default function BulkActionsBar({ count, onSetStatus, onSetLabel, onSale, onDelete, onClear }) {
  if (count === 0) return null;

  // A select resets to its prompt after each choice, so it reads as a menu.
  const menu = (onPick) => (e) => {
    const v = e.target.value;
    e.target.value = "";
    if (v) onPick(v);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border border-gold-500/40 bg-gold-500/5 px-4 py-3">
      <p className="text-[12px] text-espresso">{count} selected</p>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => onSetStatus("active")}>
          Publish
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onSetStatus("draft")}>
          Move to draft
        </Button>
        <select aria-label="Set a label" defaultValue="" onChange={menu((v) => { const [k, on] = v.split(":"); onSetLabel(k, on === "true"); })} className="input h-9 w-auto py-0 text-[12px]">
          <option value="" disabled>Labels…</option>
          {LABELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select aria-label="Sale" defaultValue="" onChange={menu((v) => onSale(v === "end" ? null : Number(v)))} className="input h-9 w-auto py-0 text-[12px]">
          <option value="" disabled>Sale…</option>
          {SALES.map((p) => <option key={p} value={p}>{p}% off</option>)}
          <option value="end">End sale</option>
        </select>
        <Button size="sm" variant="secondary" onClick={onDelete} className="text-error">
          Delete
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
