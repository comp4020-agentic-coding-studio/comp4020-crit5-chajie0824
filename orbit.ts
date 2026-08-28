// Pure ring geometry, kept apart from rendering and input so the one rule the
// game lives or dies by --- can a new satellite share the ring without
// touching another one --- has nothing to do with canvas or timing in it.

export const TAU = Math.PI * 2;

export function normalizeAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU;
}

// The short way around the circle between two angles, so a satellite near 0
// and one near TAU register as neighbours instead of as far apart.
export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, TAU - diff);
}

// The boundary is exclusive: landing exactly minSeparation away is a legal,
// tight fit, not a collision.
export function collides(
  existingAngles: number[],
  newAngle: number,
  minSeparation: number,
): boolean {
  return existingAngles.some(
    (angle) => angularDistance(angle, newAngle) < minSeparation,
  );
}

// The widest gap between neighbouring satellites, wraparound included. TAU
// (the whole ring) when there's nothing on it yet, or just one satellite.
export function largestGap(existingAngles: number[]): number {
  if (existingAngles.length === 0) return TAU;
  const sorted = existingAngles.map(normalizeAngle).sort((a, b) => a - b);
  let max = 0;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    const gap = i === sorted.length - 1 ? TAU - sorted[i] + sorted[0] : next - sorted[i];
    max = Math.max(max, gap);
  }
  return max;
}

// Full means no gap left is wide enough to fit another satellite anywhere
// inside it --- not a fixed count, since real play never spaces satellites
// evenly. A gap fits one more exactly when it's 2x minSeparation: split down
// the middle, a new satellite sits exactly minSeparation from each neighbour.
export function isRingFull(existingAngles: number[], minSeparation: number): boolean {
  return largestGap(existingAngles) < minSeparation * 2;
}
