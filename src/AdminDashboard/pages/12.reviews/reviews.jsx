/* Admin Dashboard Page: Reviews - reviews */
import { useMemo, useState } from "react";
import { Star } from "lucide-react";

import { useToast } from "@/context/ToastContext";
import { useAsyncData } from "@/hooks/useAsyncData";
import { STATUS_TONES } from "@/AdminDashboard/lib/constants";
import { cn } from "@/utils/cn";
import { getAllProducts } from "@/services/catalog/productsApi";
import { getAllReviews, hideReview, publishReview, replyToReview } from "@/services/catalog/reviewsApi";
import RatingStars from "@/components/shared/RatingStars";
import DashListToolbar from "../../components/DashListToolbar";
import DashTable from "../../components/DashTable";
import ExportButton from "../../components/ExportButton";
import { usePageSize } from "../../lib/usePageSize";
import { useTabParam } from "../../lib/useTabParam";
import ReviewsDetailModal from "./sections/reviewsTable/ReviewsDetailModal";

const TABS = [
  ["all", "All"],
  ["pending", "Pending"],
  ["published", "Published"],
  ["hidden", "Hidden"],
];

const STATUS_LABEL = { pending: "Pending", published: "Published", hidden: "Hidden" };
const STATUS_TONE = { pending: "pending", published: "positive", hidden: "neutral" };

const EXPORT_COLUMNS = [
  ["date", "Date"], ["product", "Product"], ["rating", "Rating"], ["title", "Title"], ["body", "Review"],
  ["name", "Name"], [(r) => STATUS_LABEL[r.status] ?? r.status, "Status"],
];

const columns = [
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row: r }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-espresso">{r.original.product}</p>
        {r.original.title && <p className="truncate text-[11px] text-espresso-soft">{r.original.title}</p>}
      </div>
    ),
  },
  { accessorKey: "rating", header: "Rating", cell: ({ row: r }) => <RatingStars rating={r.original.rating} /> },
  { accessorKey: "name", header: "By", cell: ({ row: r }) => <span className="text-espresso-soft">{r.original.name}</span> },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row: r }) => (
      <span className={cn("whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", STATUS_TONES[STATUS_TONE[r.original.status]])}>
        {STATUS_LABEL[r.original.status] ?? r.original.status}
      </span>
    ),
  },
  { accessorKey: "date", header: "Date", cell: ({ row: r }) => <span className="whitespace-nowrap text-espresso-soft">{r.original.date}</span> },
];

export default function DashReviews() {
  const { toast } = useToast();
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);

  const { data: reviews, loading } = useAsyncData(getAllReviews, [revision]);
  const { data: products } = useAsyncData(getAllProducts, []);

  // The product's name on each row, so search and the export can use it.
  const rows = useMemo(() => {
    const names = new Map((products ?? []).map((p) => [p.id, p.name]));
    return (reviews ?? []).map((r) => ({ ...r, product: names.get(r.productId) ?? r.productId }));
  }, [reviews, products]);

  // `?status=` rather than `?tab=`: the overview links here with it.
  const [tab, setTab] = useTabParam(TABS.map(([value]) => value), "status");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = usePageSize("reviews");
  const [viewing, setViewing] = useState(null);

  const visible = tab === "all" ? rows : rows.filter((r) => r.status === tab);
  const tabs = TABS.map(([value, label]) => ({
    value,
    label,
    count: value === "all" ? rows.length : rows.filter((r) => r.status === value).length,
  }));

  const withToast = async (fn, message) => {
    try {
      const updated = await fn();
      refresh();
      setViewing((v) => (v ? { ...updated, product: v.product } : v));
      toast(message, "success");
    } catch (err) {
      toast(err.message ?? "Could not update that review.", "error");
    }
  };

  return (
    <div className="space-y-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <DashListToolbar
        actions={<ExportButton columns={EXPORT_COLUMNS} rows={visible} filename="belioras-reviews.csv" />}
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
        tabsLabel="Reviews by status"
        query={query}
        onQueryChange={setQuery}
        placeholder="Search product, title or name…"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <DashTable
        columns={columns}
        data={visible}
        loading={loading}
        globalFilter={query}
        onRowClick={setViewing}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        fill
        unit={visible.length === 1 ? "review" : "reviews"}
        empty={{
          icon: Star,
          title: query ? "No reviews match" : "No reviews here",
          description: query ? "Try a different product or name." : "New reviews arrive pending and wait here for you.",
        }}
      />

      <ReviewsDetailModal
        review={viewing}
        productName={viewing?.product ?? null}
        onClose={() => setViewing(null)}
        onPublish={() => withToast(() => publishReview(viewing.id), "Review published.")}
        onHide={() => withToast(() => hideReview(viewing.id), "Review hidden.")}
        onReply={(text) => withToast(() => replyToReview(viewing.id, text), text ? "Reply posted." : "Reply removed.")}
      />
    </div>
  );
}
