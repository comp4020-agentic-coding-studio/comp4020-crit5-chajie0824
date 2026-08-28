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

export function ringCapacity(minSeparation: number): number {
  return Math.floor(TAU / minSeparation);
}

export function isRingFull(existingCount: number, minSeparation: number): boolean {
  return existingCount >= ringCapacity(minSeparation);
}
