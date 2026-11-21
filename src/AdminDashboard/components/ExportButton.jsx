/* Admin Dashboard: ExportButton */
import { Download } from "lucide-react";

import Button from "@/components/ui/Button";
import { downloadCsv, toCsv } from "../lib/csv";

/**
 * "Export CSV" for a list: downloads the rows on screen (after tabs and
 * filters), with `columns` as `[[key or (row) => value, header], …]`.
 * Placed in the page header beside View store.
 */
export default function ExportButton({ columns, rows, filename }) {
  return (
    <Button
      icon={Download}
      size="sm"
      variant="secondary"
      className="h-10"
      disabled={!rows?.length}
      onClick={() => downloadCsv(toCsv(columns, rows), filename)}
    >
      Export<span className="hidden sm:inline"> CSV</span>
    </Button>
  );
}
