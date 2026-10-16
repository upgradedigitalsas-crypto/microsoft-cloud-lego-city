// Shared street plan: rendered roads, patrols, deliveries and minimap use one ring.
export const BOULEVARD = Array.from({ length: 32 }, (_, i) => {
  const a = i * Math.PI * 2 / 32;
  return [Math.cos(a) * 96, Math.sin(a) * 73];
});
export function roadAccess(x, z) {
  let best = 0, distance = Infinity;
  BOULEVARD.forEach(([rx, rz], i) => { const d = Math.hypot(rx - x, rz - z); if (d < distance) { distance = d; best = i; } });
  const point = BOULEVARD[best];
  const dx = x - point[0], dz = z - point[1], length = Math.hypot(dx, dz) || 1;
  return { index: best, point, dock: [point[0] + dx / length * 6, point[1] + dz / length * 6] };
}
export function streetRoute(from, to) {
  const n = BOULEVARD.length, forward = (to - from + n) % n;
  const direction = forward <= n / 2 ? 1 : -1;
  const result = [BOULEVARD[from]];
  while (from !== to) { from = (from + direction + n) % n; result.push(BOULEVARD[from]); }
  return result;
}
export function inLake(x, z) { return Math.hypot(x / 31, z / 24) < 1 + 0.08 * Math.sin(Math.atan2(z, x) * 3); }
