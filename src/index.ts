/**
 * @jscad/builder — ergonomic JSCAD wrapper
 *
 * Entry point. Import createBuilder and unit constructors from here:
 *
 *   import { createBuilder, mm, cm, deg } from '@jscad/builder'
 *   const { cuboid, translate, rotate, place, pipe } = createBuilder({ coordinateUnit: 'mm' })
 *
 * Core concepts:
 * - `createBuilder({ coordinateUnit })` returns a full set of bound functions.
 *   Raw numbers passed as dimensions are interpreted as the configured unit.
 *   `Measure` values (`mm()`, `cm()`, `ft()`, etc.) always convert precisely.
 * - Transform functions (translate, rotate, colorize, scale) are curried:
 *     translate({ x, y, z })(obj)  — or used directly inside pipe()
 * - Boolean functions (union, subtract, intersect) are curried the same way.
 * - `rotate()` accepts angles as raw radians or `deg()` / `rad()` `Angle` values.
 *   Length values (`mm()`, `cm()`, etc.) are rejected by the type system there.
 * - Dimension arguments accept raw numbers or `Length` values (`mm()`, `cm()`, etc.).
 *   Angle values (`deg()`, `rad()`) are rejected by the type system there.
 * - `place()` resolves relative positioning analytically (no remeasurement).
 * - `rotate()` rotates around the object's own center by default.
 * - `pipe()` composes curried functions left-to-right.
 */

// Factory — the primary entry point
export { createBuilder } from "./factory";
export type { BuilderConfig, Builder } from "./factory";

// Types
export type { Dim, Bounds, JscadObject, AnyGeom, Origin } from "./types";
export type { PlaceOptions } from "./place";
export type { DimResolver } from "./primitives";

// Unit value constructors
export {
  μm,
  mm,
  cm,
  m,
  km,
  inch,
  ft,
  yd,
  mile,
  deg,
  rad,
} from "@fea-lib/values";

// Unit converters and guards
export {
  isLength,
  isAngle,
  isMeasure,
  formatMeasure,
  // deprecated compat aliases
  isNumberWithUnit,
  formatValueWithUnit,
} from "@fea-lib/values";

// Unit types — length
export type {
  Micrometers,
  Millimeters,
  Centimeters,
  Meters,
  Kilometers,
  Inches,
  Feet,
  Yards,
  Miles,
} from "@fea-lib/values";

// Unit types — angle
export type { Degrees, Radians } from "@fea-lib/values";

// Core union and subtype types, coordinate unit
export type { Length, Angle, Measure, Unit } from "@fea-lib/values";

// Deprecated aliases (kept for backward compat)
export type {
  /** @deprecated Use Measure */ NumberWithUnit,
  /** @deprecated Use Inches */ Inch,
} from "@fea-lib/values";

// fromGeom is unit-agnostic (reads raw JSCAD geometry) so it can stay as a flat export
export { fromGeom } from "./primitives";

// pipe is also unit-agnostic
export { pipe } from "./pipe";
