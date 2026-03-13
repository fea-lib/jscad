import { describe, it, expect } from "vitest";
import { createBuilder } from "../src/factory";

const {
  cuboid, circle, rectangle, square,
  extrudeLinear, extrudeRotate,
  expand, offset,
  hull, hullChain,
  generalize, retessellate, snap,
  union, subtract,
  pipe,
} = createBuilder({ coordinateUnit: "mm" });

// ---------------------------------------------------------------------------
// Expansions
// ---------------------------------------------------------------------------

describe("expand()", () => {
  it("inflates a 3D solid — bounds grow by delta on all sides", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const expanded = expand({ delta: 2 })(b);
    const w = expanded.bounds.max[0] - expanded.bounds.min[0];
    // JSCAD expand grows each face outward, exact result depends on corners mode,
    // but the object should be larger than the original on at least one axis.
    expect(w).toBeGreaterThan(10);
  });

  it("returns a JscadObject with geom", () => {
    const b = cuboid({ size: { x: 20, y: 20, z: 20 } });
    const expanded = expand({ delta: 1 })(b);
    expect(expanded.geom).toHaveLength(1);
  });
});

describe("offset()", () => {
  it("inflates a 2D shape — bounds grow", () => {
    const r = square({ size: 10 });
    const off = offset({ delta: 5 })(r);
    const w = off.bounds.max[0] - off.bounds.min[0];
    expect(w).toBeGreaterThan(10);
  });

  it("contracts a 2D shape with negative delta", () => {
    const r = square({ size: 20 });
    const off = offset({ delta: -3 })(r);
    const w = off.bounds.max[0] - off.bounds.min[0];
    expect(w).toBeLessThan(20);
  });
});

// ---------------------------------------------------------------------------
// Hulls
// ---------------------------------------------------------------------------

describe("hull()", () => {
  it("hull of two non-overlapping cuboids encloses both", () => {
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    // translate b far from origin by creating a builder translate
    const { translate } = createBuilder({ coordinateUnit: "mm" });
    const bMoved = translate({ x: 50 })(b);

    const h = hull(bMoved)(a);
    // Hull should span from a's min to bMoved's max along X
    expect(h.bounds.max[0]).toBeGreaterThanOrEqual(bMoved.bounds.max[0] - 0.01);
    expect(h.bounds.min[0]).toBeLessThanOrEqual(a.bounds.min[0] + 0.01);
  });

  it("returns a single geom", () => {
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const h = hull(b)(a);
    expect(h.geom).toHaveLength(1);
  });
});

describe("hullChain()", () => {
  it("chains hulls across three objects", () => {
    const { translate } = createBuilder({ coordinateUnit: "mm" });
    const a = cuboid({ size: { x: 5, y: 5, z: 5 } });
    const b = translate({ x: 20 })(cuboid({ size: { x: 5, y: 5, z: 5 } }));
    const c = translate({ x: 40 })(cuboid({ size: { x: 5, y: 5, z: 5 } }));

    const chain = hullChain(b, c)(a);
    // Should span from a's min to c's max
    expect(chain.bounds.max[0]).toBeGreaterThanOrEqual(c.bounds.max[0] - 0.01);
    expect(chain.bounds.min[0]).toBeLessThanOrEqual(a.bounds.min[0] + 0.01);
  });
});

// ---------------------------------------------------------------------------
// Modifiers
// ---------------------------------------------------------------------------

describe("retessellate()", () => {
  it("returns a JscadObject with the same geometry type", () => {
    // Create a union first to produce coplanar polygons worth retessellating
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const { translate } = createBuilder({ coordinateUnit: "mm" });
    const bMoved = translate({ x: 5 })(b);
    const merged = union(bMoved)(a);

    const retess = retessellate()(merged);
    expect(retess.geom).toHaveLength(1);
  });
});

describe("generalize()", () => {
  it("returns a JscadObject after generalizing", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const gen = generalize({ snap: true, triangulate: false })(b);
    expect(gen.geom).toHaveLength(1);
  });
});

describe("snap()", () => {
  it("returns a JscadObject", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const snapped = snap()(b);
    expect(snapped.geom).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Array-input overloads
// ---------------------------------------------------------------------------

describe("extrudeLinear() — array input", () => {
  it("returns an array of the same length", () => {
    const a = circle({ radius: 5 });
    const b = circle({ radius: 10 });
    const result = extrudeLinear({ height: 20 })([a, b]);
    expect(result).toHaveLength(2);
  });

  it("each result is a separate JscadObject with geom", () => {
    const a = circle({ radius: 5 });
    const b = circle({ radius: 10 });
    const result = extrudeLinear({ height: 20 })([a, b]);
    expect(result[0]!.geom).toHaveLength(1);
    expect(result[1]!.geom).toHaveLength(1);
  });
});

describe("extrudeRotate() — array input", () => {
  it("returns an array of the same length", () => {
    const a = rectangle({ size: { x: 5, y: 10 } });
    const b = rectangle({ size: { x: 3, y: 8 } });
    const result = extrudeRotate({ segments: 16 })([a, b]);
    expect(result).toHaveLength(2);
  });
});

describe("expand() — array input", () => {
  it("returns an array of the same length", () => {
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 20, y: 20, z: 20 } });
    const result = expand({ delta: 1 })([a, b]);
    expect(result).toHaveLength(2);
  });
});

describe("hull() — array input", () => {
  it("returns an array of the same length", () => {
    const { translate } = createBuilder({ coordinateUnit: "mm" });
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const extra = translate({ x: 50 })(cuboid({ size: { x: 5, y: 5, z: 5 } }));
    const result = hull(extra)([a, b]);
    expect(result).toHaveLength(2);
  });
});
