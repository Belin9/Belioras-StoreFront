/* Storefront Figure: HairLengthFigure
 *
 * Where each hair length falls on the body, seen from behind. The marks come
 * from the hair guide's own rows (sizeCharts.hair.lengths), so a length added
 * or relabelled in the dashboard moves here too.
 */

// Body landmarks on the drawing, top to bottom (y in the 0–400 viewBox).
const LANDMARKS = [
  ["below mid-back", 222],
  ["mid-back", 196],
  ["below shoulder", 136],
  ["shoulder", 118],
  ["collarbone", 102],
  ["armpit", 160],
  ["below waist", 292],
  ["waist", 256],
  ["hip", 312],
  ["chin", 86],
];

const TOP = 86;
const BOTTOM = 330;

/** y for a row: its landmark if named, else spaced by inches between its neighbours. */
function positions(lengths) {
  const known = lengths.map((row) => {
    const falls = String(row.falls ?? "").toLowerCase();
    // Longest names first, so "below mid-back" is not read as "mid-back".
    const hit = LANDMARKS.find(([name]) => falls.includes(name));
    return hit ? hit[1] : null;
  });

  return known.map((y, i) => {
    if (y != null) return y;
    const prev = known.slice(0, i).findLastIndex((v) => v != null);
    const next = known.findIndex((v, j) => j > i && v != null);
    const y0 = prev >= 0 ? known[prev] : TOP;
    const y1 = next >= 0 ? known[next] : BOTTOM;
    const in0 = prev >= 0 ? lengths[prev].in : lengths[0].in - 2;
    const in1 = next >= 0 ? lengths[next].in : lengths.at(-1).in + 2;
    const t = in1 === in0 ? 0.5 : (lengths[i].in - in0) / (in1 - in0);
    return Math.round(y0 + (y1 - y0) * t);
  });
}

export default function HairLengthFigure({ lengths = [], className = "" }) {
  const rows = lengths.filter((r) => Number.isFinite(Number(r?.in)));
  const ys = positions(rows);

  return (
    <figure className={className}>
      <svg viewBox="0 0 340 360" role="img" aria-labelledby="hair-figure-title" className="h-auto w-full max-w-[420px]">
        <title id="hair-figure-title">
          {`A woman seen from behind, marked where each hair length falls: ${rows.map((r) => `${r.in} inches at the ${r.falls}`).join(", ")}`}
        </title>

        {/* Silhouette from behind */}
        <g className="fill-gold-50 stroke-espresso" strokeWidth="2" strokeLinejoin="round">
          <path d="M98 84L98 98C72 100 48 106 42 120C38 132 40 168 44 198C48 224 62 238 64 254C66 270 54 298 52 340L168 340C166 298 154 270 156 254C158 238 172 224 176 198C180 168 182 132 178 120C172 106 148 100 122 98L122 84Z" />
          <ellipse cx="110" cy="50" rx="29" ry="35" />
        </g>
        {/* Hair parting and crown, so it reads as the back of the head */}
        <path d="M110 16C104 30 104 46 110 62" className="fill-none stroke-espresso/40" strokeWidth="1.5" />

        {/* Where each length falls */}
        {rows.map((row, i) => (
          <g key={`${row.in}-${row.falls}`}>
            <line x1="34" y1={ys[i]} x2="196" y2={ys[i]} className="stroke-gold-600" strokeWidth="1.25" strokeDasharray="4 3" />
            <circle cx="196" cy={ys[i]} r="2.5" className="fill-gold-700" />
            <text x="204" y={ys[i] + 4} fontSize="12" className="fill-espresso">
              <tspan fontWeight="600">{`${row.in}″`}</tspan>
              <tspan className="fill-espresso-soft">{`  ${row.falls}`}</tspan>
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-3 max-w-[420px] text-[12px] leading-relaxed text-espresso-soft">
        Lengths are for straight hair, measured from the crown. Curly and kinky textures sit shorter: see the texture
        allowance.
      </figcaption>
    </figure>
  );
}
