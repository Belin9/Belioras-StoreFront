/* Admin Dashboard: colour family helpers */

/* Nearest filter colour to a swatch, compared in CIELAB so "close" means
   close to the eye (plain RGB distance calls many browns red). */
function toLab(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
  });
  const xyz = [
    (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047,
    r * 0.2126 + g * 0.7152 + b * 0.0722,
    (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883,
  ].map((v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116));
  return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
}

export function nearestFamily(hex, families) {
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? "")) return "";
  const target = toLab(hex);
  let best = { id: "", d: Infinity };
  for (const f of families) {
    if (!/^#[0-9a-f]{6}$/i.test(f.hex ?? "")) continue;
    const lab = toLab(f.hex);
    const d = Math.hypot(lab[0] - target[0], lab[1] - target[1], lab[2] - target[2]);
    if (d < best.d) best = { id: f.id, d };
  }
  return best.id;
}
