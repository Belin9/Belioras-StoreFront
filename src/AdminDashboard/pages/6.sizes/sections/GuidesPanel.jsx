/* Admin Dashboard Page: Sizes - GuidesPanel */
import { useState } from "react";
import { Eye, Footprints, Pencil, RotateCcw, Scissors, Shirt } from "lucide-react";

import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import SizeChart from "@/components/storefront/sizeChart/SizeChart";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { getSizeCharts, resetSizeCharts } from "@/services/catalog/sizeChartApi";
import GarmentGuideDialog from "./GarmentGuideDialog";
import FootwearGuideDialog from "./FootwearGuideDialog";
import HairGuideDialog from "./HairGuideDialog";

const CARDS = [
  { kind: "garment", title: "Dresses sizing", icon: Shirt, usedBy: "Dresses", blurb: "Body measurements, international equivalents, how to measure." },
  { kind: "footwear", title: "Footwear sizing", icon: Footprints, usedBy: "Shoes and heels", blurb: "EU, UK and US conversions, how to measure a foot." },
  { kind: "hair", title: "Hair sizing", icon: Scissors, usedBy: "Wigs and hair", blurb: "Lengths, how each texture wears, how it's measured." },
];

/** A glance at what the table holds, so the card says more than its title. */
function glance(kind, charts) {
  if (kind === "garment") {
    const sizes = (charts.garment?.rows ?? []).map((r) => r.size);
    return sizes.length ? `${sizes.length} sizes · ${sizes[0]}–${sizes.at(-1)}` : "No rows yet";
  }
  if (kind === "footwear") {
    const eu = (charts.footwear?.rows ?? []).map((r) => r.eu);
    return eu.length ? `${eu.length} sizes · EU ${eu[0]}–${eu.at(-1)}` : "No rows yet";
  }
  const inches = (charts.hair?.lengths ?? []).map((l) => l.in);
  return inches.length ? `${inches.length} lengths · ${inches[0]}–${inches.at(-1)} in` : "No rows yet";
}

const DIALOGS = { garment: GarmentGuideDialog, footwear: FootwearGuideDialog, hair: HairGuideDialog };

/** The measurement tables behind every "Size guide" a shopper opens. What you edit here is what they see. */
export default function GuidesPanel() {
  const { toast } = useToast();
  const { locale } = useLanguage();
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);

  // Read through the staff boundary, so this is an authenticated read like the
  // rest of the dashboard's work. An inline arrow is deliberate: the query key
  // is built from this function's source text, which is stable, whereas a fresh
  // function identity on every render would refetch endlessly.
  const { data: charts, loading } = useAsyncData(() => getSizeCharts({ realm: "staff" }), [revision]);
  const [editing, setEditing] = useState({ kind: null, n: 0 });
  const [preview, setPreview] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const openEdit = (kind) => setEditing((e) => ({ kind, n: e.n + 1 }));
  const closeEdit = () => setEditing((e) => ({ ...e, kind: null }));
  const EditDialog = DIALOGS[editing.kind];

  const doReset = async () => {
    setConfirmReset(false);
    await resetSizeCharts();
    refresh();
    toast("Size guides reset to their defaults.", "success");
  };

  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });

  if (loading || !charts) return <p className="text-[13px] text-espresso-soft">Loading…</p>;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-[13px] leading-relaxed text-espresso-soft">
          The tables behind &ldquo;Size guide&rdquo; on a product page, and the standalone hair-length and
          shoe-size guides. Edit one, then preview it exactly as a shopper sees it.
        </p>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="inline-flex shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-espresso-soft transition-colors hover:text-error"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset to defaults
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          // Each guide is its own document, so it carries its own edit date.
          // A guide that has never been saved has none, and shows as shipped.
          const edited = charts[c.kind]?.updatedAt;
          return (
            <div key={c.kind} className="flex flex-col border border-umber-50 bg-ivory-50 p-5">
              <Icon className="size-5 text-gold-700" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-3 font-display text-lg tracking-wide text-espresso">{c.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-espresso-soft">{c.blurb}</p>

              <dl className="mt-3 flex-1 space-y-1 border-t border-umber-50 pt-3 text-[12px]">
                <div className="flex justify-between gap-3"><dt className="text-espresso-soft">Table</dt><dd className="text-espresso">{glance(c.kind, charts)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-espresso-soft">Used by</dt><dd className="text-espresso">{c.usedBy}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-espresso-soft">Last edited</dt><dd className="text-espresso">{edited ? dateFmt.format(new Date(edited)) : "Shipped version"}</dd></div>
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => openEdit(c.kind)} className="btn btn-sm btn-secondary">
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                </button>
                <button type="button" onClick={() => setPreview(c.kind)} className="btn btn-sm btn-secondary">
                  <Eye className="size-3.5" aria-hidden="true" />
                  Preview
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {EditDialog && (
        <EditDialog
          key={editing.n}
          open={Boolean(editing.kind)}
          charts={charts}
          onClose={closeEdit}
          onSaved={() => {
            closeEdit();
            refresh();
          }}
        />
      )}

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} title="Size guide preview" width="max-w-2xl">
        {preview && <SizeChart kind={preview} />}
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={doReset}
        title="Reset the size guides to their defaults?"
        description="Every edit made to these tables is discarded and the shipped measurements return. This cannot be undone."
        confirmLabel="Reset to defaults"
      />
    </section>
  );
}
