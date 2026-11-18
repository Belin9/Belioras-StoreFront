import { useState } from "react";

import BodyFigure from "./figures/BodyFigure";

/**
 * The "how to measure" picture for clothing. A photo set in the dashboard
 * (Sizes & Guides > Dresses sizing) is shown when there is one and it loads;
 * otherwise the drawn figure is, so the guide never shows a broken image.
 */
export default function SizeChartFigure({ src, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <BodyFigure className={className} />;

  return (
    <img
      src={src}
      alt="A woman standing, labelled with where to measure the bust, waist, hip and inside leg"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-auto w-full max-w-[220px] object-contain ${className}`}
    />
  );
}
