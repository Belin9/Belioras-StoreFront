/* Storefront Component: SizeChart */
import { useId, useState } from "react";

import { useAsyncData } from "../../../hooks/useAsyncData";
import { getSizeCharts } from "../../../services/catalog/sizeChartApi";
import { useMeasurementUnit } from "./useMeasurementUnit";
import { sizeChartTabsFor } from "./sizeChartKind";
import SizeChartTabs from "./SizeChartTabs";
import SizeChartBodyTable from "./SizeChartBodyTable";
import SizeChartInternational from "./SizeChartInternational";
import SizeChartShoeTable from "./SizeChartShoeTable";
import { SizeChartHairLengths, SizeChartHairTextures } from "./SizeChartHairTable";
import SizeChartHowTo from "./SizeChartHowTo";

export default function SizeChart({ kind = "garment" }) {
  const { data: charts, loading } = useAsyncData(getSizeCharts, []);

  const tabs = sizeChartTabsFor(kind);
  const [active, setActive] = useState(tabs[0].id);
  const { unit, setUnit } = useMeasurementUnit();

  const idBase = useId();

  if (loading || !charts) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SizeChartTabs tabs={tabs} active={active} onChange={setActive} idBase={idBase} />

      <div
        role="tabpanel"
        id={`${idBase}-panel-${active}`}
        aria-labelledby={`${idBase}-tab-${active}`}
        tabIndex={0}
      >
        {active === "body" && (
          <SizeChartBodyTable garment={charts.garment} unit={unit} onUnitChange={setUnit} />
        )}
        {active === "international" && (
          <SizeChartInternational international={charts.garment?.international} />
        )}
        {active === "foot" && (
          <SizeChartShoeTable footwear={charts.footwear} unit={unit} onUnitChange={setUnit} />
        )}
        {active === "length" && (
          <SizeChartHairLengths hair={charts.hair} unit={unit} onUnitChange={setUnit} />
        )}
        {active === "texture" && <SizeChartHairTextures hair={charts.hair} />}
        {active === "measure" && (
          <SizeChartHowTo
            // Each guide carries its own steps, so there is no sibling table to
            // fall back to: the kind being viewed is the guide being read.
            steps={charts[kind]?.howTo ?? charts.garment?.howTo}
            // The body figure explains a garment measurement. It says nothing
            // useful about a foot or a weft, so those kinds get the steps alone.
            showFigure={kind === "garment"}
            figureSrc={charts.garment?.garmentImage}
          />
        )}
      </div>
    </div>
  );
}
