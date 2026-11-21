/**
 * The size for a shopper's body measurements, from the garment size guide.
 *
 * Each measurement given (any one is enough) finds its nearest row; when they
 * land on different sizes the larger one wins, as the guide advises ("between
 * sizes, we suggest the larger"). All values in cm. Returns
 * { size, exact, between } or null when nothing was given or the guide is empty.
 */
export function findSize(rows, measurements) {
  if (!rows?.length) return null;
  const given = ["bust", "waist", "hip"].filter((k) => Number.isFinite(measurements[k]) && measurements[k] > 0);
  if (!given.length) return null;

  const distance = (v, [lo, hi]) => (v < lo ? lo - v : v > hi ? v - hi : 0);
  const nearest = given.map((k) => {
    let best = 0;
    rows.forEach((row, i) => {
      if (row[k] && distance(measurements[k], row[k]) <= distance(measurements[k], rows[best][k] ?? [0, 0])) {
        // Ties go to the later (larger) row: a value on the boundary of two sizes takes the larger.
        best = i;
      }
    });
    return best;
  });

  const index = Math.max(...nearest);
  const row = rows[index];
  const exact = given.every((k) => row[k] && distance(measurements[k], row[k]) === 0);
  return { size: row.size, exact, between: new Set(nearest).size > 1 };
}

export const CM_PER_INCH = 2.54;
