/* Storefront Figure: FootFigure
 *
 * How to measure a foot: the sole seen from below, with its length (heel to
 * the longest toe) and width (across the ball). Drawn inline so it needs no
 * image request and follows the palette.
 */
export default function FootFigure({ className = "" }) {
  return (
    <svg
      viewBox="0 0 220 280"
      role="img"
      aria-labelledby="foot-figure-title"
      className={`h-auto w-full max-w-[220px] ${className}`}
    >
      <title id="foot-figure-title">
        A foot seen from below, measured for length from the heel to the longest toe and for width across the ball of the foot
      </title>

      <rect x="1" y="1" width="218" height="278" rx="4" className="fill-gold-50 stroke-gold-500" strokeWidth="1.5" />

      {/* Sole and toes */}
      <g className="fill-white stroke-espresso" strokeWidth="2" strokeLinejoin="round">
        <path d="M98 256C74 256 64 238 66 216C68 196 72 180 68 158C64 136 58 116 62 96C66 76 82 64 102 64C122 64 136 74 138 94C140 112 134 128 132 148C130 170 132 188 132 212C132 238 120 256 98 256Z" />
        <ellipse cx="82" cy="46" rx="13" ry="16" />
        <ellipse cx="104" cy="41" rx="8" ry="10.5" />
        <ellipse cx="119" cy="47" rx="7" ry="9" />
        <ellipse cx="131" cy="57" rx="6" ry="8" />
        <ellipse cx="139" cy="70" rx="5" ry="7" />
      </g>

      {/* Length: heel to longest toe */}
      <g className="stroke-gold-700" strokeWidth="1.5">
        <line x1="74" y1="30" x2="172" y2="30" strokeDasharray="2 3" />
        <line x1="88" y1="256" x2="172" y2="256" strokeDasharray="2 3" />
        <line x1="166" y1="30" x2="166" y2="256" />
        <line x1="160" y1="30" x2="172" y2="30" />
        <line x1="160" y1="256" x2="172" y2="256" />
      </g>
      <text x="186" y="143" transform="rotate(90 186 143)" textAnchor="middle" className="fill-espresso" fontSize="12" fontWeight="600" letterSpacing="0.5">
        Length
      </text>

      {/* Width: across the ball */}
      <g className="stroke-gold-700" strokeWidth="1.5">
        <line x1="62" y1="100" x2="138" y2="100" strokeDasharray="3 3" />
        <line x1="62" y1="94" x2="62" y2="106" />
        <line x1="138" y1="94" x2="138" y2="106" />
      </g>
      <text x="100" y="118" textAnchor="middle" className="fill-espresso" fontSize="12" fontWeight="600" letterSpacing="0.5">
        Width
      </text>
    </svg>
  );
}
