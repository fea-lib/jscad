import { describe, it, expect } from "vitest";
import { createBuilder } from "../src/factory";
import { cm, deg } from "@fea-lib/values";

const { cuboid, translate, rotate, colorize, scale } = createBuilder({
  coordinateUnit: "cm",
});

describe("translate()", () => {
  it("shifts bounds by the delta — O(1) no remeasurement needed", () => {
    const b = cuboid({ size: { x: cm(50), y: cm(100), z: cm(30) } });
    const moved = translate({ x: cm(10), y: cm(20), z: cm(5) })(b);

    expect(moved.bounds.min).toEqual([10, 20, 5]);
    expect(moved.bounds.max).toEqual([60, 120, 35]);
  });

  it("accepts raw numbers as cm", () => {
    const b = cuboid({ size: { x: 40, y: 80, z: 20 } });
    const moved = translate({ x: 10, z: 5 })(b);

    expect(moved.bounds.min[0]).toBe(10);
    expect(moved.bounds.min[2]).toBe(5);
  });

  it("omitted axes default to 0 (no movement on that axis)", () => {
    const b = cuboid({ size: { x: 50, y: 50, z: 50 } });
    const moved = translate({ x: 10 })(b);

    expect(moved.bounds.min[0]).toBe(10);
    expect(moved.bounds.min[1]).toBe(0); // unchanged
    expect(moved.bounds.min[2]).toBe(0); // unchanged
  });

  it("can translate by 0 (no-op)", () => {
    const b = cuboid({ size: { x: 50, y: 50, z: 50 } });
    const moved = translate({ x: 0, y: 0, z: 0 })(b);

    expect(moved.bounds.min).toEqual([0, 0, 0]);
    expect(moved.bounds.max).toEqual([50, 50, 50]);
  });

  it("translates each geom piece", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const moved = translate({ x: 5, y: 5, z: 5 })(b);
    expect(moved.geom).toHaveLength(1);
  });
});

describe("rotate()", () => {
  describe("around center (default)", () => {
    it("rotates 90° around Y — bounds swap width and depth", () => {
      const b = cuboid({ size: { x: 50, y: 10, z: 30 } });
      const rotated = rotate({ y: Math.PI / 2 })(b);

      const w = rotated.bounds.max[0] - rotated.bounds.min[0];
      const d = rotated.bounds.max[2] - rotated.bounds.min[2];

      expect(w).toBeCloseTo(30, 4);
      expect(d).toBeCloseTo(50, 4);
    });

    it("keeps the object center at the same location after rotation", () => {
      const b = cuboid({ size: { x: 50, y: 10, z: 30 } });
      const cx = (b.bounds.min[0] + b.bounds.max[0]) / 2;
      const cy = (b.bounds.min[1] + b.bounds.max[1]) / 2;
      const cz = (b.bounds.min[2] + b.bounds.max[2]) / 2;

      const rotated = rotate({ y: Math.PI / 2 })(b);
      const rcx = (rotated.bounds.min[0] + rotated.bounds.max[0]) / 2;
      const rcy = (rotated.bounds.min[1] + rotated.bounds.max[1]) / 2;
      const rcz = (rotated.bounds.min[2] + rotated.bounds.max[2]) / 2;

      expect(rcx).toBeCloseTo(cx, 4);
      expect(rcy).toBeCloseTo(cy, 4);
      expect(rcz).toBeCloseTo(cz, 4);
    });

    it("360° rotation restores original bounds", () => {
      const b = cuboid({ size: { x: 50, y: 10, z: 30 } });
      const rotated = rotate({ y: 2 * Math.PI })(b);

      expect(rotated.bounds.min[0]).toBeCloseTo(b.bounds.min[0], 3);
      expect(rotated.bounds.min[1]).toBeCloseTo(b.bounds.min[1], 3);
      expect(rotated.bounds.min[2]).toBeCloseTo(b.bounds.min[2], 3);
      expect(rotated.bounds.max[0]).toBeCloseTo(b.bounds.max[0], 3);
      expect(rotated.bounds.max[1]).toBeCloseTo(b.bounds.max[1], 3);
      expect(rotated.bounds.max[2]).toBeCloseTo(b.bounds.max[2], 3);
    });
  });

  describe("around corner (opt-out)", () => {
    it("with { around: 'corner' }, min corner stays at origin for an origin-anchored box", () => {
      const b = cuboid({ size: { x: 50, y: 10, z: 30 } });
      const rotated = rotate({ y: Math.PI / 2 }, { around: "corner" })(b);

      expect(rotated.bounds.min[2]).toBeCloseTo(-50, 3);
    });
  });

  describe("deg() angle values", () => {
    it("deg(90) around Y produces same result as Math.PI/2 radians", () => {
      const b = cuboid({ size: { x: 50, y: 10, z: 30 } });
      const byDeg = rotate({ y: deg(90) })(b);
      const byRad = rotate({ y: Math.PI / 2 })(b);

      expect(byDeg.bounds.max[0]).toBeCloseTo(byRad.bounds.max[0], 4);
      expect(byDeg.bounds.max[2]).toBeCloseTo(byRad.bounds.max[2], 4);
    });

    it("deg(360) restores original bounds", () => {
      const b = cuboid({ size: { x: 50, y: 10, z: 30 } });
      const rotated = rotate({ y: deg(360) })(b);

      expect(rotated.bounds.min[0]).toBeCloseTo(b.bounds.min[0], 3);
      expect(rotated.bounds.max[2]).toBeCloseTo(b.bounds.max[2], 3);
    });
  });
});

describe("colorize()", () => {
  it("does not change bounds", () => {
    const b = cuboid({ size: { x: 50, y: 100, z: 30 } });
    const colored = colorize([1, 0, 0])(b);
    expect(colored.bounds).toEqual(b.bounds);
  });

  it("applies color to geom", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const colored = colorize([1, 0, 0, 0.5])(b);
    expect(colored.geom[0]!.color).toBeDefined();
  });
});

describe("scale()", () => {
  it("scales bounds analytically", () => {
    const b = cuboid({ size: { x: 10, y: 20, z: 30 } });
    const scaled = scale({ x: 2, y: 1, z: 0.5 })(b);

    expect(scaled.bounds.max[0]).toBeCloseTo(20);
    expect(scaled.bounds.max[1]).toBeCloseTo(20);
    expect(scaled.bounds.max[2]).toBeCloseTo(15);
  });

  it("omitted scale axes default to 1", () => {
    const b = cuboid({ size: { x: 10, y: 20, z: 30 } });
    const scaled = scale({ x: 3 })(b);

    expect(scaled.bounds.max[0]).toBeCloseTo(30);
    expect(scaled.bounds.max[1]).toBeCloseTo(20); // unchanged
    expect(scaled.bounds.max[2]).toBeCloseTo(30); // unchanged
  });
});

describe("mirrorX/Y/Z()", () => {
  it("mirrorX negates X coordinates", () => {
    const { mirrorX } = createBuilder({ coordinateUnit: "cm" });
    const b = cuboid({ size: { x: 10, y: 20, z: 30 } });
    const mirrored = mirrorX()(b);
    // bounds should be remeasured — object is now on the negative X side
    expect(mirrored.geom).toHaveLength(1);
    expect(mirrored.bounds.max[0] - mirrored.bounds.min[0]).toBeCloseTo(10, 3);
  });

  it("mirrorY negates Y coordinates", () => {
    const { mirrorY } = createBuilder({ coordinateUnit: "cm" });
    const b = cuboid({ size: { x: 10, y: 20, z: 30 } });
    const mirrored = mirrorY()(b);
    expect(mirrored.bounds.max[1] - mirrored.bounds.min[1]).toBeCloseTo(20, 3);
  });

  it("mirrorZ negates Z coordinates", () => {
    const { mirrorZ } = createBuilder({ coordinateUnit: "cm" });
    const b = cuboid({ size: { x: 10, y: 20, z: 30 } });
    const mirrored = mirrorZ()(b);
    expect(mirrored.bounds.max[2] - mirrored.bounds.min[2]).toBeCloseTo(30, 3);
  });
});

describe("rotateX/Y/Z()", () => {
  const { rotateX, rotateY, rotateZ } = createBuilder({ coordinateUnit: "cm" });

  it("rotateY(PI/2) swaps X and Z extents", () => {
    const b = cuboid({ size: { x: 50, y: 10, z: 30 } });
    const rotated = rotateY(Math.PI / 2)(b);
    const w = rotated.bounds.max[0] - rotated.bounds.min[0];
    const d = rotated.bounds.max[2] - rotated.bounds.min[2];
    expect(w).toBeCloseTo(30, 3);
    expect(d).toBeCloseTo(50, 3);
  });

  it("rotateX(PI/2) swaps Y and Z extents", () => {
    const b = cuboid({ size: { x: 10, y: 20, z: 30 } });
    const rotated = rotateX(Math.PI / 2)(b);
    const h = rotated.bounds.max[1] - rotated.bounds.min[1];
    const d = rotated.bounds.max[2] - rotated.bounds.min[2];
    expect(h).toBeCloseTo(30, 3);
    expect(d).toBeCloseTo(20, 3);
  });

  it("rotateZ(PI/2) swaps X and Y extents", () => {
    const b = cuboid({ size: { x: 40, y: 10, z: 5 } });
    const rotated = rotateZ(Math.PI / 2)(b);
    const w = rotated.bounds.max[0] - rotated.bounds.min[0];
    const h = rotated.bounds.max[1] - rotated.bounds.min[1];
    expect(w).toBeCloseTo(10, 3);
    expect(h).toBeCloseTo(40, 3);
  });
});

describe("centerX/Y/Z()", () => {
  const { centerX, centerY, centerZ } = createBuilder({ coordinateUnit: "cm" });

  it("centerX centers the object on the X axis", () => {
    const b = cuboid({ size: { x: 20, y: 10, z: 10 } });
    const centered = centerX()(b);
    const cx = (centered.bounds.min[0] + centered.bounds.max[0]) / 2;
    expect(cx).toBeCloseTo(0, 4);
  });

  it("centerY centers the object on the Y axis", () => {
    const b = cuboid({ size: { x: 10, y: 30, z: 10 } });
    const centered = centerY()(b);
    const cy = (centered.bounds.min[1] + centered.bounds.max[1]) / 2;
    expect(cy).toBeCloseTo(0, 4);
  });

  it("centerZ centers the object on the Z axis", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 40 } });
    const centered = centerZ()(b);
    const cz = (centered.bounds.min[2] + centered.bounds.max[2]) / 2;
    expect(cz).toBeCloseTo(0, 4);
  });
});
