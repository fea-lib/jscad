import type Geom3 from "@jscad/modeling/src/geometries/geom3/type";
import type Geom2 from "@jscad/modeling/src/geometries/geom2/type";
import type Path2 from "@jscad/modeling/src/geometries/path2/type";
import type { Length } from "@fea-lib/values";

/**
 * A scalar dimension — either a raw number (interpreted as the builder's
 * configured coordinate unit) or a unit-tagged `Length` value that is
 * normalised to the configured unit internally.
 *
 * Angle values (`deg()`, `rad()`) are intentionally excluded: passing an
 * angle where a length is expected is a compile-time type error.
 *
 * @example
 * cuboid({ size: { x: 50, y: 100, z: cm(3) } })   // mix raw and explicit units freely
 */
export type Dim = number | Length;

/**
 * Named 3-axis vector where each axis accepts a `Dim` (raw number or tagged Length).
 * All axes are optional and default to 0 when omitted.
 *
 * @example
 * translate({ x: mm(10), z: cm(5) })(obj)   // y defaults to 0
 */
export type Vec3 = { x?: Dim; y?: Dim; z?: Dim };

/**
 * Named 2-axis vector where each axis accepts a `Dim` (raw number or tagged Length).
 * All axes are optional and default to 0 when omitted.
 *
 * @example
 * circle({ center: { x: mm(10) } })   // y defaults to 0
 */
export type Vec2 = { x?: Dim; y?: Dim };

/**
 * Axis-aligned bounding box stored in the builder's coordinate unit.
 * `min` = bottom-left-front corner, `max` = top-right-back corner.
 */
export type Bounds = {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
};

/**
 * Named logical anchor point of a JscadObject, in the builder's coordinate unit.
 *
 * `origin` tracks the object's original reference corner through transforms:
 * it is set to `{ x: 0, y: 0, z: 0 }` when a primitive is first constructed,
 * and is kept in sync with every subsequent `translate()` and `rotate()`.
 *
 * `place({ at: ... })` pins `bounds.min` to the target coordinate, not `origin`.
 */
export type Origin = { x: number; y: number; z: number };

/**
 * The underlying raw JSCAD geometry — 3D solid, 2D shape, or 2D path.
 */
export type AnyGeom = Geom3 | Geom2 | Path2;

/**
 * Core wrapper type. All builder functions accept and return `JscadObject`.
 * - `geom`  : the underlying JSCAD geometry (one or more pieces, any type)
 * - `bounds`: cached bounding box, updated analytically on every operation
 *             so `measureBoundingBox()` is only called at construction time.
 * - `origin`: tracks the original reference corner through transforms; set to
 *             `{ x: 0, y: 0, z: 0 }` at construction and kept in sync by
 *             `translate()` and `rotate()`. Not used by `place({ at: ... })`,
 *             which pins `bounds.min` directly.
 *
 * 2D geometries (Geom2, Path2) store z-bounds as [0, 0].
 */
export type JscadObject = {
  readonly geom: AnyGeom[];
  readonly bounds: Bounds;
  readonly origin: Origin;
};
