import modeling from "@jscad/modeling";
import type { Bounds, JscadObject, AnyGeom } from "./types";
import { mergeBounds } from "./primitives";

const {
  booleans: {
    union: jscadUnion,
    subtract: jscadSubtract,
    intersect: jscadIntersect,
  },
} = modeling;

/**
 * Returns a curried union() function.
 *
 * Boolean union — merge one or more objects into the base object.
 * The resulting bounds are the aggregate of all inputs — O(1) arithmetic.
 *
 * @example
 * const { union } = createBuilder({ coordinateUnit: 'mm' })
 * pipe(wall, union(doorCutout, windowCutout))
 */
export function makeUnion() {
  return function union(
    ...others: JscadObject[]
  ): ((base: JscadObject) => JscadObject) & ((bases: JscadObject[]) => JscadObject[]) {
    const single = (base: JscadObject): JscadObject => {
      const allGeoms = [...base.geom, ...others.flatMap((o) => o.geom)];
      const bounds = others.reduce<Bounds>(
        (acc, o) => mergeBounds(acc, o.bounds),
        base.bounds,
      );
      return { geom: [jscadUnion(allGeoms as any) as AnyGeom], bounds, origin: base.origin };
    };
    return (baseOrBases: JscadObject | JscadObject[]) =>
      Array.isArray(baseOrBases) ? baseOrBases.map(single) : single(baseOrBases) as any;
  };
}

/**
 * Returns a curried subtract() function.
 *
 * Boolean subtract — cut one or more objects out of the base.
 * The bounds remain those of the base object (conservative) — O(1) arithmetic.
 *
 * @example
 * const { subtract } = createBuilder({ coordinateUnit: 'mm' })
 * pipe(wall, subtract(door, window))
 */
export function makeSubtract() {
  return function subtract(
    ...cutouts: JscadObject[]
  ): ((base: JscadObject) => JscadObject) & ((bases: JscadObject[]) => JscadObject[]) {
    const single = (base: JscadObject): JscadObject => {
      const allCutouts = cutouts.flatMap((o) => o.geom);
      return {
        geom: [jscadSubtract([...base.geom, ...allCutouts] as any) as AnyGeom],
        bounds: base.bounds,
        origin: base.origin,
      };
    };
    return (baseOrBases: JscadObject | JscadObject[]) =>
      Array.isArray(baseOrBases) ? baseOrBases.map(single) : single(baseOrBases) as any;
  };
}

/**
 * Returns a curried intersect() function.
 *
 * Boolean intersection — keep only the volume shared by the base and all others.
 * Bounds are the intersection of all individual bounds — O(1) arithmetic.
 *
 * @example
 * const { intersect } = createBuilder({ coordinateUnit: 'mm' })
 * pipe(shapeA, intersect(shapeB))
 */
export function makeIntersect() {
  return function intersect(
    ...others: JscadObject[]
  ): ((base: JscadObject) => JscadObject) & ((bases: JscadObject[]) => JscadObject[]) {
    const single = (base: JscadObject): JscadObject => {
      const allGeoms = [...base.geom, ...others.flatMap((o) => o.geom)];
      const bounds: Bounds = {
        min: [
          Math.max(base.bounds.min[0], ...others.map((o) => o.bounds.min[0])),
          Math.max(base.bounds.min[1], ...others.map((o) => o.bounds.min[1])),
          Math.max(base.bounds.min[2], ...others.map((o) => o.bounds.min[2])),
        ],
        max: [
          Math.min(base.bounds.max[0], ...others.map((o) => o.bounds.max[0])),
          Math.min(base.bounds.max[1], ...others.map((o) => o.bounds.max[1])),
          Math.min(base.bounds.max[2], ...others.map((o) => o.bounds.max[2])),
        ],
      };
      return { geom: [jscadIntersect(allGeoms as any) as AnyGeom], bounds, origin: base.origin };
    };
    return (baseOrBases: JscadObject | JscadObject[]) =>
      Array.isArray(baseOrBases) ? baseOrBases.map(single) : single(baseOrBases) as any;
  };
}
