import { describe, it, expect } from "vitest";
import { createBuilder } from "../src/factory";
import { cm } from "@fea-lib/values";

const { cuboid, translate, rotate, colorize, place, pipe } = createBuilder({
  coordinateUnit: "cm",
});

describe("pipe()", () => {
  it("returns the value unchanged with no functions", () => {
    expect(pipe(42)).toBe(42);
  });

  it("applies a single function", () => {
    expect(pipe(2, (x: number) => x * 3)).toBe(6);
  });

  it("composes functions left-to-right", () => {
    const result = pipe(
      1,
      (x: number) => x + 1, // 2
      (x: number) => x * 2, // 4
      (x: number) => x - 1, // 3
    );
    expect(result).toBe(3);
  });

  it("works with builder functions", () => {
    const result = pipe(
      cuboid({ size: { x: cm(50), y: cm(200), z: cm(30) } }),
      rotate({ y: Math.PI / 2 }),
      translate({ x: cm(10), z: cm(50) }),
    );

    expect(result.bounds.min[0]).toBeDefined();
    expect(result.bounds.min[2]).toBeDefined();
    expect(result.bounds.max[0]).toBeGreaterThan(result.bounds.min[0]);
    expect(result.bounds.max[1]).toBeGreaterThan(result.bounds.min[1]);
    expect(result.bounds.max[2]).toBeGreaterThan(result.bounds.min[2]);
  });

  it("composes builder + place for full relative positioning workflow", () => {
    const pax = cuboid({ size: { x: cm(58), y: cm(236), z: cm(35) } });

    const shelf = pipe(
      cuboid({ size: { x: cm(40), y: cm(30), z: cm(20) } }),
      place({ after: pax, gap: cm(3) }),
    );

    expect(shelf.bounds.min[2]).toBeCloseTo(pax.bounds.max[2] + 3);
  });
});
