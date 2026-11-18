/* Storefront Component: SizeChartHowTo */
import SizeChartFigure from "./SizeChartFigure";
import FootFigure from "./figures/FootFigure";
import HairLengthFigure from "./figures/HairLengthFigure";

/** The picture beside the steps: the body photo, the foot, or where hair falls. */
function Figure({ kind, figureSrc, hairLengths }) {
  if (kind === "footwear") return <FootFigure />;
  if (kind === "hair") return <HairLengthFigure lengths={hairLengths} className="w-full max-w-[300px]" />;
  return <SizeChartFigure src={figureSrc} />;
}

export default function SizeChartHowTo({ steps, kind = "garment", showFigure = true, figureSrc, hairLengths = [] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-start">
      {showFigure && (
        <div className="mx-auto sm:mx-0">
          <Figure kind={kind} figureSrc={figureSrc} hairLengths={hairLengths} />
        </div>
      )}

      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.term} className="flex gap-3 text-[13px] leading-relaxed">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brown-50 text-[11px] font-semibold tabular-nums text-espresso"
            >
              {i + 1}
            </span>
            <span className="text-espresso-soft">
              <strong className="font-semibold text-espresso">{step.term}. </strong>
              {step.text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
