/**
 * operations.ts — Extrusions, expansions, hulls, modifiers, scission, and text.
 *
 * These are higher-level operations that transform or combine JscadObjects.
 * All curried functions follow the same pattern: operation(opts)(obj).
 */
import modeling from "@jscad/modeling";
import type { JscadObject, AnyGeom } from "./types";
import { boundsFromGeom } from "./primitives";

const {
  extrusions: {
    extrudeLinear: jscadExtrudeLinear,
    extrudeRotate: jscadExtrudeRotate,
    extrudeRectangular: jscadExtrudeRectangular,
    extrudeHelical: jscadExtrudeHelical,
    extrudeFromSlices: jscadExtrudeFromSlices,
    project: jscadProject,
  },
  expansions: {
    expand: jscadExpand,
    offset: jscadOffset,
  },
  hulls: {
    hull: jscadHull,
    hullChain: jscadHullChain,
  },
  modifiers: {
    generalize: _jscadGeneralize,
    snap: _jscadSnap,
    retessellate: jscadRetessellate,
  },
  booleans: {
    scission: jscadScission,
  },
  text: {
    vectorChar: jscadVectorChar,
    vectorText: jscadVectorText,
  },
} = modeling;

// generalize and snap are exported as named (not default) exports in their .d.ts files,
// so TypeScript resolves the destructured value as the module namespace rather than the
// function. Cast to the actual callable signature to restore type safety.
const jscadGeneralize = _jscadGeneralize as unknown as (
  options: { snap?: boolean; simplify?: boolean; triangulate?: boolean },
  geometry: any
) => any;
const jscadSnap = _jscadSnap as unknown as (geometry: any) => any;

// ---------------------------------------------------------------------------
// Extrusions
// ---------------------------------------------------------------------------

/**
 * Returns a curried extrudeLinear() function.
 *
 * Extrudes a 2D shape (Geom2 or Path2) linearly along the Z axis to produce
 * a 3D solid. Bounds are measured after extrusion.
 *
 * @param opts.height     - extrusion height along Z
 * @param opts.twistAngle - optional twist angle in radians
 * @param opts.twistSteps - number of twist steps
 *
 * @example
 * pipe(circle({ radius: 20 }), extrudeLinear({ height: 50 }))
 */
export function makeExtrudeLinear() {
  return function extrudeLinear(opts: {
    height?: number;
    twistAngle?: number;
    twistSteps?: number;
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const extruded = obj.geom.map((g) => jscadExtrudeLinear(opts, g as any) as AnyGeom);
      return { geom: extruded, bounds: boundsFromGeom(extruded), origin: obj.origin };
    };
  };
}

/**
 * Returns a curried extrudeRotate() function.
 *
 * Revolves a 2D shape (Geom2) around the Z axis to produce a 3D solid.
 *
 * @param opts.angle      - sweep angle in radians (default 2π = full revolution)
 * @param opts.startAngle - start angle in radians
 * @param opts.segments   - number of facets
 *
 * @example
 * pipe(rectangle({ size: [10, 40] }), extrudeRotate({ segments: 32 }))
 */
export function makeExtrudeRotate() {
  return function extrudeRotate(opts?: {
    angle?: number;
    startAngle?: number;
    overflow?: "cap";
    segments?: number;
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const extruded = obj.geom.map((g) => jscadExtrudeRotate(opts ?? {}, g as any) as AnyGeom);
      return { geom: extruded, bounds: boundsFromGeom(extruded), origin: obj.origin };
    };
  };
}

/**
 * Returns a curried extrudeRectangular() function.
 *
 * Extrudes a 2D shape or path with a rectangular cross-section, producing
 * hollow walls.
 *
 * @param opts.size     - wall thickness
 * @param opts.height   - extrusion height
 * @param opts.corners  - corner style: 'edge', 'chamfer', 'round'
 * @param opts.segments - facets for rounded corners
 *
 * @example
 * pipe(rectangle({ size: [50, 30] }), extrudeRectangular({ size: 2, height: 10 }))
 */
export function makeExtrudeRectangular() {
  return function extrudeRectangular(opts?: {
    size?: number;
    height?: number;
    corners?: "edge" | "chamfer" | "round";
    segments?: number;
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const extruded = obj.geom.map((g) => jscadExtrudeRectangular(opts ?? {}, g as any) as AnyGeom);
      return { geom: extruded, bounds: boundsFromGeom(extruded), origin: obj.origin };
    };
  };
}

/**
 * Returns a curried extrudeHelical() function.
 *
 * Extrudes a 2D shape (Geom2) along a helical path.
 *
 * @param opts.pitch  - vertical distance per revolution
 * @param opts.height - total height of the helix
 * @param opts.angle  - total sweep angle in radians
 *
 * @example
 * pipe(square({ size: 5 }), extrudeHelical({ pitch: 10, height: 50 }))
 */
export function makeExtrudeHelical() {
  return function extrudeHelical(opts?: {
    angle?: number;
    startAngle?: number;
    pitch?: number;
    height?: number;
    endOffset?: number;
    segmentsPerRotation?: number;
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const extruded = obj.geom.map((g) => jscadExtrudeHelical(opts ?? {}, g as any) as AnyGeom);
      return { geom: extruded, bounds: boundsFromGeom(extruded), origin: obj.origin };
    };
  };
}

/**
 * Returns a curried extrudeFromSlices() function.
 *
 * Extrudes between a sequence of arbitrary cross-section slices, each
 * generated by the callback. The most general and flexible extrusion.
 *
 * @param opts.numberOfSlices - number of slices along the extrusion
 * @param opts.capStart       - cap the start (default true)
 * @param opts.capEnd         - cap the end (default true)
 * @param opts.callback       - per-slice transform function
 *
 * @example
 * pipe(circle({ radius: 20 }), extrudeFromSlices({
 *   numberOfSlices: 10,
 *   callback: (progress, _i, base) =>
 *     transforms.translateZ(progress * 100, base),
 * }))
 */
export function makeExtrudeFromSlices() {
  return function extrudeFromSlices(opts: {
    numberOfSlices?: number;
    capStart?: boolean;
    capEnd?: boolean;
    close?: boolean;
    callback?: (progress: number, index: number, base: any) => any;
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const extruded = obj.geom.map((g) => jscadExtrudeFromSlices(opts, g) as AnyGeom);
      return { geom: extruded, bounds: boundsFromGeom(extruded), origin: obj.origin };
    };
  };
}

/**
 * Returns a curried project() function.
 *
 * Projects a 3D solid back onto the XY plane, returning a 2D outline.
 *
 * @param opts.axis   - projection axis (default [0, 0, 1])
 * @param opts.origin - origin of the projection plane
 *
 * @example
 * pipe(sphere({ radius: 20 }), project({}))
 */
export function makeProject() {
  return function project(opts?: {
    axis?: [number, number, number];
    origin?: [number, number, number];
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const projected = obj.geom.map((g) => jscadProject(opts ?? {}, g as any) as unknown as AnyGeom);
      return { geom: projected, bounds: boundsFromGeom(projected), origin: obj.origin };
    };
  };
}

// ---------------------------------------------------------------------------
// Expansions
// ---------------------------------------------------------------------------

/**
 * Returns a curried expand() function.
 *
 * Expands (inflates) or contracts (deflates) geometry by a delta value.
 * Works on 2D and 3D geometry.
 *
 * @param opts.delta    - expansion amount (negative = contraction)
 * @param opts.corners  - corner style for 2D: 'edge', 'chamfer', 'round'
 * @param opts.segments - facets for rounded corners
 *
 * @example
 * pipe(rectangle({ size: [50, 30] }), expand({ delta: 5, corners: 'round', segments: 16 }))
 */
export function makeExpand() {
  return function expand(opts: {
    delta?: number;
    corners?: "edge" | "chamfer" | "round";
    segments?: number;
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const expanded = obj.geom.map((g) => jscadExpand(opts, g as any) as unknown as AnyGeom);
      return { geom: expanded, bounds: boundsFromGeom(expanded), origin: obj.origin };
    };
  };
}

/**
 * Returns a curried offset() function.
 *
 * Offsets a 2D geometry or path outward (positive delta) or inward (negative).
 *
 * @param opts.delta    - offset distance
 * @param opts.corners  - corner style: 'edge', 'chamfer', 'round'
 * @param opts.segments - facets for rounded corners
 *
 * @example
 * pipe(circle({ radius: 20 }), offset({ delta: 5 }))
 */
export function makeOffset() {
  return function offset(opts: {
    delta?: number;
    corners?: "edge" | "chamfer" | "round";
    segments?: number;
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const offsetted = obj.geom.map((g) => jscadOffset(opts, g as any) as AnyGeom);
      return { geom: offsetted, bounds: boundsFromGeom(offsetted), origin: obj.origin };
    };
  };
}

// ---------------------------------------------------------------------------
// Hulls
// ---------------------------------------------------------------------------

/**
 * Returns a curried hull() function.
 *
 * Computes the convex hull of the base object together with all `others`.
 * Bounds are remeasured after hull computation.
 *
 * @example
 * const { hull } = createBuilder({ coordinateUnit: 'mm' })
 * pipe(sphere({ radius: 10 }), hull(sphere({ radius: 5 })))
 */
export function makeHull() {
  return function hull(...others: JscadObject[]): (base: JscadObject) => JscadObject {
    return (base) => {
      const allGeoms = [...base.geom, ...others.flatMap((o) => o.geom)];
      const result = [jscadHull(...(allGeoms as any[])) as AnyGeom];
      return { geom: result, bounds: boundsFromGeom(result), origin: base.origin };
    };
  };
}

/**
 * Returns a curried hullChain() function.
 *
 * Applies convex hull pairwise along a chain of shapes.
 * hullChain(a, b, c) = hull(a,b) ∪ hull(b,c).
 *
 * @example
 * pipe(sphere({ radius: 10 }), hullChain(sphere({ radius: 5 })))
 */
export function makeHullChain() {
  return function hullChain(...others: JscadObject[]): (base: JscadObject) => JscadObject {
    return (base) => {
      const allGeoms = [...base.geom, ...others.flatMap((o) => o.geom)];
      const result = [jscadHullChain(...(allGeoms as any[])) as AnyGeom];
      return { geom: result, bounds: boundsFromGeom(result), origin: base.origin };
    };
  };
}

// ---------------------------------------------------------------------------
// Modifiers
// ---------------------------------------------------------------------------

/**
 * Returns a curried generalize() function.
 *
 * Cleans up geometry by snapping, simplifying, or triangulating polygons.
 *
 * @param opts.snap       - snap vertex coordinates to a grid
 * @param opts.simplify   - remove duplicate/degenerate polygons
 * @param opts.triangulate - triangulate all polygons
 *
 * @example
 * pipe(myObj, generalize({ snap: true, simplify: true }))
 */
export function makeGeneralize() {
  return function generalize(opts: {
    snap?: boolean;
    simplify?: boolean;
    triangulate?: boolean;
  }): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const cleaned = obj.geom.map((g) => jscadGeneralize(opts, g as any) as AnyGeom);
      return { geom: cleaned, bounds: obj.bounds, origin: obj.origin };
    };
  };
}

/**
 * Returns a curried snap() function.
 *
 * Snaps all vertex coordinates to the geometry's internal epsilon grid.
 * Useful for fixing near-coincident vertices after complex operations.
 *
 * @example
 * pipe(myObj, snap())
 */
export function makeSnap() {
  return function snap(): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const snapped = obj.geom.map((g) => jscadSnap(g as any) as AnyGeom);
      return { geom: snapped, bounds: obj.bounds, origin: obj.origin };
    };
  };
}

/**
 * Returns a curried retessellate() function.
 *
 * Merges coplanar polygons to reduce the polygon count. Only applies to Geom3.
 * Useful after boolean operations that produce many small coplanar faces.
 *
 * @example
 * pipe(myObj, retessellate())
 */
export function makeRetessellate() {
  return function retessellate(): (obj: JscadObject) => JscadObject {
    return (obj) => {
      const retess = obj.geom.map((g) => jscadRetessellate(g as any) as AnyGeom);
      return { geom: retess, bounds: obj.bounds, origin: obj.origin };
    };
  };
}

// ---------------------------------------------------------------------------
// Scission (boolean)
// ---------------------------------------------------------------------------

/**
 * Splits a self-intersecting or multi-body geometry into separate parts.
 *
 * Unlike the other boolean operations, scission is NOT curried — it takes
 * a JscadObject and returns an array of JscadObjects (one per body found).
 *
 * @example
 * const parts = scission(union(sphereA, sphereB))
 */
export function makeScission() {
  return function scission(obj: JscadObject): JscadObject[] {
    const parts = jscadScission(...(obj.geom as any[]));
    return parts.map((g: AnyGeom) => {
      const bounds = boundsFromGeom([g]);
      return {
        geom: [g],
        bounds,
        origin: { x: bounds.min[0], y: bounds.min[1], z: bounds.min[2] },
      };
    });
  };
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/**
 * Returns segments for a single ASCII character as a raw data structure.
 * This is a utility — it does not return a JscadObject; use the result
 * with `line()` or `polygon()` to create geometry.
 *
 * @example
 * const { segments } = vectorChar('A')
 * // segments is an Array<Array<[x, y]>>
 */
export function makeVectorChar() {
  return jscadVectorChar;
}

/**
 * Returns segments for an ASCII string as a raw data structure.
 * Use the result with `line()` or polygon paths to create geometry.
 *
 * @example
 * const lines = vectorText('Hello')
 * // lines is an Array<Array<[x, y]>>
 */
export function makeVectorText() {
  return jscadVectorText;
}
