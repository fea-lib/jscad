import { describe, it, expect } from "vitest";
import { createBuilder } from "../src/factory";

const { cuboid, sphere, union, subtract, intersect, scission, pipe } =
  createBuilder({ coordinateUnit: "mm" });

describe("union()", () => {
  it("merges geometry into a single geom", () => {
    const a = cuboid({ size: { x: 50, y: 50, z: 50 } });
    const b = cuboid({ size: { x: 20, y: 20, z: 20 } });
    const result = pipe(a, union(b));
    expect(result.geom).toHaveLength(1);
  });

  it("expands bounds to cover both objects", () => {
    const a = cuboid({ size: { x: 50, y: 50, z: 50 } });
    const b = cuboid({ size: { x: 100, y: 100, z: 100 } });
    const result = pipe(a, union(b));
    expect(result.bounds.max[0]).toBeGreaterThanOrEqual(100);
    expect(result.bounds.max[1]).toBeGreaterThanOrEqual(100);
    expect(result.bounds.max[2]).toBeGreaterThanOrEqual(100);
  });
});

describe("subtract()", () => {
  it("cuts geometry and produces a single geom", () => {
    const base = cuboid({ size: { x: 100, y: 100, z: 100 } });
    const hole = sphere({ radius: 20 });
    const result = pipe(base, subtract(hole));
    expect(result.geom).toHaveLength(1);
  });

  it("preserves the base bounds (conservative)", () => {
    const base = cuboid({ size: { x: 100, y: 100, z: 100 } });
    const hole = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const result = pipe(base, subtract(hole));
    expect(result.bounds.max[0]).toBeCloseTo(base.bounds.max[0]);
    expect(result.bounds.max[1]).toBeCloseTo(base.bounds.max[1]);
    expect(result.bounds.max[2]).toBeCloseTo(base.bounds.max[2]);
  });
});

describe("intersect()", () => {
  it("keeps only the overlapping region as a single geom", () => {
    const a = cuboid({ size: { x: 100, y: 100, z: 100 } });
    const b = cuboid({ size: { x: 60, y: 60, z: 60 } });
    const result = pipe(a, intersect(b));
    expect(result.geom).toHaveLength(1);
  });

  it("bounds are the intersection of both objects' bounds", () => {
    const a = cuboid({ size: { x: 100, y: 100, z: 100 } });
    const b = cuboid({ size: { x: 60, y: 60, z: 60 } });
    const result = pipe(a, intersect(b));
    // intersection max should be no larger than the smaller cube
    expect(result.bounds.max[0]).toBeLessThanOrEqual(60);
    expect(result.bounds.max[1]).toBeLessThanOrEqual(60);
    expect(result.bounds.max[2]).toBeLessThanOrEqual(60);
  });
});

describe("scission()", () => {
  it("splits a union of two non-touching spheres into two parts", () => {
    const { translateX } = createBuilder({ coordinateUnit: "mm" });
    const a = sphere({ radius: 10 });
    const b = pipe(sphere({ radius: 10 }), translateX(200));
    const merged = pipe(a, union(b));
    const parts = scission(merged);
    expect(parts.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Array-input overloads
// ---------------------------------------------------------------------------

describe("subtract() — array input", () => {
  it("returns an array of the same length", () => {
    const a = cuboid({ size: { x: 100, y: 100, z: 100 } });
    const b = cuboid({ size: { x: 50, y: 50, z: 50 } });
    const hole = sphere({ radius: 10 });
    const result = subtract(hole)([a, b]);
    expect(result).toHaveLength(2);
  });

  it("applies the subtraction to each element independently", () => {
    const a = cuboid({ size: { x: 100, y: 100, z: 100 } });
    const b = cuboid({ size: { x: 50, y: 50, z: 50 } });
    const hole = sphere({ radius: 5 });
    const result = subtract(hole)([a, b]);
    // Each result should still be a JscadObject with geom
    expect(result[0]!.geom).toHaveLength(1);
    expect(result[1]!.geom).toHaveLength(1);
  });
});

describe("union() — array input", () => {
  it("returns an array of the same length", () => {
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 20, y: 20, z: 20 } });
    const extra = sphere({ radius: 5 });
    const result = union(extra)([a, b]);
    expect(result).toHaveLength(2);
  });
});

describe("intersect() — array input", () => {
  it("returns an array of the same length", () => {
    const a = cuboid({ size: { x: 100, y: 100, z: 100 } });
    const b = cuboid({ size: { x: 80, y: 80, z: 80 } });
    const clip = cuboid({ size: { x: 60, y: 60, z: 60 } });
    const result = intersect(clip)([a, b]);
    expect(result).toHaveLength(2);
  });
});

describe("scission() — array input", () => {
  it("returns JscadObject[][] (one array per input)", () => {
    const { translateX } = createBuilder({ coordinateUnit: "mm" });
    // Two separate merged objects
    const make = () => {
      const a = sphere({ radius: 10 });
      const b = pipe(sphere({ radius: 10 }), translateX(200));
      return pipe(a, union(b));
    };
    const merged1 = make();
    const merged2 = make();
    const result = scission([merged1, merged2]);
    // Should return an array of two arrays
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(2);
  });
});
