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
