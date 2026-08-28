import { describe, expect, it } from "vitest";
import {
  TAU,
  angularDistance,
  collides,
  isRingFull,
  largestGap,
  normalizeAngle,
} from "../orbit.ts";

// The one rule this week's spec asks for a focused test on: a newly-launched
// satellite must not land within minSeparation of one already on the ring.

describe("normalizeAngle", () => {
  it("leaves an in-range angle untouched", () => {
    expect(normalizeAngle(1)).toBeCloseTo(1);
  });

  it("wraps a negative angle into [0, TAU)", () => {
    expect(normalizeAngle(-0.5)).toBeCloseTo(TAU - 0.5);
  });

  it("wraps an angle past TAU back into range", () => {
    expect(normalizeAngle(TAU + 1)).toBeCloseTo(1);
  });
});

describe("angularDistance", () => {
  it("is zero between an angle and itself", () => {
    expect(angularDistance(1.2, 1.2)).toBeCloseTo(0);
  });

  it("takes the short way around the wraparound seam", () => {
    // 0.05 and TAU - 0.05 are only 0.1 apart going through 0, not ~TAU apart.
    expect(angularDistance(0.05, TAU - 0.05)).toBeCloseTo(0.1);
  });
});

describe("collides", () => {
  it("is false against an empty ring", () => {
    expect(collides([], 0, 0.3)).toBe(false);
  });

  it("is true landing exactly on an existing satellite", () => {
    expect(collides([1.0], 1.0, 0.3)).toBe(true);
  });

  it("is true landing inside the separation threshold", () => {
    expect(collides([1.0], 1.2, 0.3)).toBe(true);
  });

  it("is false landing exactly at the separation threshold", () => {
    // Boundary is exclusive: exactly minSeparation apart is a legal fit.
    // 0.25 and 1.25 are exact in binary floating point, so this isn't
    // sensitive to the rounding a value like 0.3 would introduce.
    expect(collides([1.0], 1.25, 0.25)).toBe(false);
  });

  it("is false landing just outside the separation threshold", () => {
    expect(collides([1.0], 1.31, 0.3)).toBe(false);
  });

  it("catches a collision across the 0/TAU wraparound seam", () => {
    expect(collides([0.02], TAU - 0.02, 0.1)).toBe(true);
  });

  it("checks against every existing satellite, not just the first", () => {
    expect(collides([0.5, 2.5, 4.5], 2.6, 0.3)).toBe(true);
    expect(collides([0.5, 2.5, 4.5], 3.5, 0.3)).toBe(false);
  });
});

describe("largestGap", () => {
  it("is the whole ring when empty", () => {
    expect(largestGap([])).toBeCloseTo(TAU);
  });

  it("is the whole ring with just one satellite", () => {
    expect(largestGap([0])).toBeCloseTo(TAU);
  });

  it("finds the largest of several gaps, wraparound included", () => {
    // Gaps of 2, 2 and (TAU - 4) between 0, 2 and 4 --- the wraparound gap
    // back to 0 is the biggest one.
    expect(largestGap([0, 2, 4])).toBeCloseTo(TAU - 4);
  });
});

describe("isRingFull", () => {
  // Real play never spaces satellites evenly, so fullness has to come from
  // the actual widest remaining gap, not a fixed count.

  it("is false while a wide gap remains", () => {
    expect(isRingFull([0], 1)).toBe(false);
  });

  it("is false when the largest gap exactly fits one more satellite", () => {
    // Two satellites opposite each other split the ring into two gaps of
    // exactly 2x minSeparation --- a satellite dropped in the middle of
    // either sits exactly minSeparation from both, a legal tight fit.
    expect(isRingFull([0, Math.PI], Math.PI / 2)).toBe(false);
  });

  it("is true once every remaining gap is too tight for another satellite", () => {
    expect(isRingFull([0, 2, 4], 1.2)).toBe(true);
  });

  it("is false for the same layout with a more forgiving separation", () => {
    expect(isRingFull([0, 2, 4], 1.0)).toBe(false);
  });
});
