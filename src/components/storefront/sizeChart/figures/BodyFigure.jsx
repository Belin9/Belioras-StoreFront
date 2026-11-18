/* Storefront Figure: BodyFigure
 *
 * Where to measure for clothing: a figure seen from the front, with the tape
 * lines for bust, waist and hip, and the inside leg. Drawn inline in the
 * palette, matching the foot and hair figures.
 */
export default function BodyFigure({ className = "" }) {
  return (
    <svg viewBox="0 0 240 360" role="img" aria-labelledby="body-figure-title" className={`h-auto w-full max-w-[240px] ${className}`}>
      <title id="body-figure-title">
        A woman seen from the front, marked where to measure the bust, waist and hip, and the inside leg
      </title>

      {/* Figure */}
      <g className="fill-gold-50 stroke-espresso" strokeWidth="2" strokeLinejoin="round">
        <ellipse cx="96" cy="34" rx="20" ry="25" />
        <path d="M88 56L88 66C66 68 50 72 46 84C42 96 44 116 46 132L40 196L50 198L58 138C60 150 62 160 66 170C70 182 66 196 62 210C58 226 60 238 66 250L70 342L90 342L94 250L98 250L102 342L122 342L126 250C132 238 134 226 130 210C126 196 122 182 126 170C130 160 132 150 134 138L142 198L152 196L146 132C148 116 150 96 146 84C142 72 126 68 104 66L104 56Z" />
      </g>

      {/* Tape lines: bust, waist, hip */}
      <g className="fill-none stroke-gold-700" strokeWidth="1.75">
        <ellipse cx="96" cy="112" rx="38" ry="5" strokeDasharray="4 3" />
        <ellipse cx="96" cy="168" rx="30" ry="4.5" strokeDasharray="4 3" />
        <ellipse cx="96" cy="210" rx="35" ry="5" strokeDasharray="4 3" />
        {/* Inside leg: crotch to ankle */}
        <line x1="96" y1="252" x2="96" y2="338" />
        <line x1="90" y1="252" x2="102" y2="252" />
        <line x1="90" y1="338" x2="102" y2="338" />
      </g>

      {/* Labels */}
      <g className="stroke-gold-600" strokeWidth="1">
        <line x1="134" y1="112" x2="168" y2="112" />
        <line x1="126" y1="168" x2="168" y2="168" />
        <line x1="131" y1="210" x2="168" y2="210" />
        <line x1="96" y1="296" x2="168" y2="296" />
      </g>
      <g className="fill-espresso" fontSize="12" fontWeight="600" letterSpacing="0.5">
        <text x="172" y="116">Bust</text>
        <text x="172" y="172">Waist</text>
        <text x="172" y="214">Hip</text>
        <text x="172" y="300">Inside leg</text>
      </g>
    </svg>
  );
}
