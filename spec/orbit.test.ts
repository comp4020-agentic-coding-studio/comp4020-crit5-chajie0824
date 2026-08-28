import { describe, expect, it } from "vitest";
import {
  TAU,
  angularDistance,
  collides,
  isRingFull,
  normalizeAngle,
  ringCapacity,
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
    expect(collides([1.0], 1.3, 0.3)).toBe(false);
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

describe("ringCapacity / isRingFull", () => {
  it("fits fewer satellites as the separation grows", () => {
    expect(ringCapacity(Math.PI)).toBeLessThan(ringCapacity(0.3));
  });

  it("is not full below capacity", () => {
    expect(isRingFull(2, 1)).toBe(false);
  });

  it("is full once the count reaches capacity", () => {
    expect(isRingFull(ringCapacity(1), 1)).toBe(true);
  });
});
