/**
 * End-to-end scenario tests.
 *
 * These tests exercise realistic multi-step workflows to verify that bounds,
 * origins, and placements compose correctly across several operations.
 */
import { describe, it, expect } from "vitest";
import { createBuilder, cm, deg } from "../src/index";

describe("Scenario: three cuboids placed sequentially along the Z axis", () => {
  /**
   * Setup:
   *   - first:  20×20×30 cm cuboid, translated 10 cm along Z from the origin
   *   - second: 20×20×30 cm cuboid, placed flush after first (gap = 0)
   *   - third:  20×20×30 cm cuboid, placed after second with a 10 cm gap
   */
  const { cuboid, translate, place } = createBuilder({ coordinateUnit: "cm" });
  const size = { x: 20, y: 20, z: 30 };

  const first  = translate({ z: 10 })(cuboid({ size }));
  const second = place({ after: first })(cuboid({ size }));
  const third  = place({ after: second, gap: cm(10) })(cuboid({ size }));

  describe("first — translated 10 cm along Z", () => {
    it("bounds.min = [0, 0, 10]", () => {
      expect(first.bounds.min).toEqual([0, 0, 10]);
    });
    it("bounds.max = [20, 20, 40]", () => {
      expect(first.bounds.max).toEqual([20, 20, 40]);
    });
    it("origin = {x:0, y:0, z:10}", () => {
      expect(first.origin).toEqual({ x: 0, y: 0, z: 10 });
    });
  });

  describe("second — placed flush after first (gap = 0)", () => {
    it("bounds.min[2] equals first.bounds.max[2]", () => {
      expect(second.bounds.min[2]).toBeCloseTo(first.bounds.max[2]);
    });
    it("bounds.min = [0, 0, 40]", () => {
      expect(second.bounds.min).toEqual([0, 0, 40]);
    });
    it("bounds.max = [20, 20, 70]", () => {
      expect(second.bounds.max).toEqual([20, 20, 70]);
    });
    it("origin = {x:0, y:0, z:40}", () => {
      expect(second.origin).toEqual({ x: 0, y: 0, z: 40 });
    });
    it("X and Y extents are unchanged", () => {
      expect(second.bounds.min[0]).toBeCloseTo(0);
      expect(second.bounds.min[1]).toBeCloseTo(0);
      expect(second.bounds.max[0]).toBeCloseTo(20);
      expect(second.bounds.max[1]).toBeCloseTo(20);
    });
  });

  describe("third — placed after second with 10 cm gap", () => {
    it("bounds.min[2] equals second.bounds.max[2] + 10", () => {
      expect(third.bounds.min[2]).toBeCloseTo(second.bounds.max[2] + 10);
    });
    it("bounds.min = [0, 0, 80]", () => {
      expect(third.bounds.min).toEqual([0, 0, 80]);
    });
    it("bounds.max = [20, 20, 110]", () => {
      expect(third.bounds.max).toEqual([20, 20, 110]);
    });
    it("origin = {x:0, y:0, z:80}", () => {
      expect(third.origin).toEqual({ x: 0, y: 0, z: 80 });
    });
    it("X and Y extents are unchanged", () => {
      expect(third.bounds.min[0]).toBeCloseTo(0);
      expect(third.bounds.min[1]).toBeCloseTo(0);
      expect(third.bounds.max[0]).toBeCloseTo(20);
      expect(third.bounds.max[1]).toBeCloseTo(20);
    });
  });
});

describe("Scenario: three cuboids rotated 90° on Y, then placed sequentially along Z", () => {
  /**
   * A 30×20×20 cm cuboid rotated 90° around Y has its X and Z extents swapped,
   * producing the same 20×20×30 cm footprint as scenario 1. After rotation the
   * geometry is re-pinned to the origin with place({ at: {x:0,y:0,z:0} }) so
   * the subsequent translate / place chain is identical to scenario 1.
   *
   * Expected bounds and origins are therefore the same as scenario 1:
   *   first  — bounds [0,0,10]→[20,20,40]
   *   second — bounds [0,0,40]→[20,20,70]
   *   third  — bounds [0,0,80]→[20,20,110]
   */
  const { cuboid, rotate, translate, place } = createBuilder({ coordinateUnit: "cm" });

  // Rotate a 30×20×20 cuboid 90° around Y, then pin its min corner to [0,0,0].
  const atOrigin = { at: { x: cm(0), y: cm(0), z: cm(0) } };
  const makeObj = () =>
    place(atOrigin)(rotate({ y: deg(90) })(cuboid({ size: { x: 30, y: 20, z: 20 } })));

  const first  = translate({ z: 10 })(makeObj());
  const second = place({ after: first })(makeObj());
  const third  = place({ after: second, gap: cm(10) })(makeObj());

  describe("first — rotated cuboid translated 10 cm along Z", () => {
    it("bounds.min = [0, 0, 10]", () => {
      expect(first.bounds.min).toEqual([0, 0, 10]);
    });
    it("bounds.max = [20, 20, 40]", () => {
      expect(first.bounds.max).toEqual([20, 20, 40]);
    });
    it("origin.z = 40 (min corner after rotation and translation)", () => {
      expect(first.origin.z).toEqual(40);
    });
  });

  describe("second — placed flush after first (gap = 0)", () => {
    it("bounds.min[2] equals first.bounds.max[2]", () => {
      expect(second.bounds.min[2]).toEqual(first.bounds.max[2]);
    });
    it("bounds.min = [0, 0, 40]", () => {
      expect(second.bounds.min).toEqual([0, 0, 40]);
    });
    it("bounds.max = [20, 20, 70]", () => {
      expect(second.bounds.max).toEqual([20, 20, 70]);
    });
  });

  describe("third — placed after second with 10 cm gap", () => {
    it("bounds.min[2] equals second.bounds.max[2] + 10", () => {
      expect(third.bounds.min[2]).toEqual(second.bounds.max[2] + 10);
    });
    it("bounds.min = [0, 0, 80]", () => {
      expect(third.bounds.min).toEqual([0, 0, 80]);
    });
    it("bounds.max = [20, 20, 110]", () => {
      expect(third.bounds.max).toEqual([20, 20, 110]);
    });
  });
});
