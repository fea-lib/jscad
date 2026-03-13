import type { Unit, Angle } from "@fea-lib/values";
import type { Dim, Vec3, Vec2, JscadObject, AnyGeom } from "./types";
import type { PlaceOptions } from "./place";
import {
  createDimResolver,
  makeCuboid, makeCube, makeCylinder, makeCylinderElliptic, makeEllipsoid,
  makeGeodesicSphere, makePolyhedron, makeRoundedCuboid, makeRoundedCylinder,
  makeSphere, makeTorus,
  makeCircle, makeEllipse, makePolygon, makeRectangle, makeRoundedRectangle,
  makeSquare, makeStar, makeTriangle,
  makeArc, makeLine,
  fromGeom,
} from "./primitives";
import {
  makeTranslate, makeTranslateX, makeTranslateY, makeTranslateZ,
  makeRotate, makeRotateX, makeRotateY, makeRotateZ,
  makeScale, makeScaleX, makeScaleY, makeScaleZ,
  makeMirror, makeMirrorX, makeMirrorY, makeMirrorZ,
  makeCenter, makeCenterX, makeCenterY, makeCenterZ,
  makeAlign, makeTransform,
  makeColorize,
  type AngleVec3, type ScaleVec3, type NumVec3, type BoolVec3, type NullableNumVec3,
} from "./transform";
import { makeUnion, makeSubtract, makeIntersect } from "./boolean";
import {
  makeExtrudeLinear, makeExtrudeRotate, makeExtrudeRectangular, makeExtrudeHelical,
  makeExtrudeFromSlices, makeProject,
  makeExpand, makeOffset,
  makeHull, makeHullChain,
  makeGeneralize, makeSnap, makeRetessellate,
  makeScission,
  makeVectorChar, makeVectorText,
} from "./operations";
import { makePlace } from "./place";
import { pipe } from "./pipe";

export type { PlaceOptions };

/**
 * Configuration for createBuilder.
 */
export type BuilderConfig = {
  /**
   * The unit that raw numbers (plain `number`) are interpreted as.
   * `Length` values (mm(), cm(), ft(), inch(), etc.) are always converted
   * precisely regardless of this setting.
   *
   * @example
   * createBuilder({ coordinateUnit: 'mm' })
   * // cuboid({ size: { x: 50, y: 100, z: 30 } }) → 50mm × 100mm × 30mm
   *
   * createBuilder({ coordinateUnit: 'inch' })
   * // cuboid({ size: { x: 2, y: 4, z: 1 } }) → 2" × 4" × 1"
   */
  coordinateUnit: Unit;
};

// Angle opts type used in multiple rotate variants
type RotateOpts = { around?: "center" | "corner" };

/**
 * Overloaded function type: single object → T, array → T[].
 * The single-object overload is listed last so that TypeScript's `infer R`
 * in PipeReturn resolves to T (not T[]), keeping pipe() chains type-safe.
 */
type Multi<T> = ((objs: JscadObject[]) => T[]) & ((obj: JscadObject) => T);

/**
 * The full set of builder functions returned by createBuilder.
 * All functions are bound to the configured coordinateUnit.
 *
 * Naming matches @jscad/modeling exactly.
 */
export type Builder = {
  // ---- 3D Primitives ----

  /** Axis-aligned box (arbitrary dimensions). Origin at bottom-left-front. */
  cuboid: (opts: { size: Vec3; center?: Vec3 }) => JscadObject;
  /** Axis-aligned cube (equal side lengths). */
  cube: (opts?: { size?: Dim; center?: Vec3 }) => JscadObject;
  /** Circular cylinder. */
  cylinder: (opts?: { center?: Vec3; height?: Dim; radius?: Dim; segments?: number }) => JscadObject;
  /** Elliptic (optionally tapered) cylinder. */
  cylinderElliptic: (opts?: { center?: Vec3; height?: Dim; startRadius?: Vec2; endRadius?: Vec2; startAngle?: number; endAngle?: number; segments?: number }) => JscadObject;
  /** Ellipsoid. */
  ellipsoid: (opts?: { center?: Vec3; radius?: Vec3; segments?: number }) => JscadObject;
  /** Geodesic sphere (triangle mesh). */
  geodesicSphere: (opts?: { radius?: Dim; frequency?: number }) => JscadObject;
  /** Polyhedron from explicit points and faces. Points are raw [Dim, Dim, Dim] tuples. */
  polyhedron: (opts: { points: [Dim, Dim, Dim][]; faces: number[][]; colors?: ([number, number, number] | [number, number, number, number])[]; orientation?: "outward" | "inward" }) => JscadObject;
  /** Box with rounded edges. */
  roundedCuboid: (opts?: { center?: Vec3; size?: Vec3; roundRadius?: Dim; segments?: number }) => JscadObject;
  /** Cylinder with rounded (hemispherical) caps. */
  roundedCylinder: (opts?: { center?: Vec3; height?: Dim; radius?: Dim; roundRadius?: Dim; segments?: number }) => JscadObject;
  /** UV sphere. */
  sphere: (opts?: { center?: Vec3; radius?: Dim; segments?: number }) => JscadObject;
  /** Torus (donut). */
  torus: (opts?: { innerRadius?: Dim; outerRadius?: Dim; innerSegments?: number; outerSegments?: number; innerRotation?: number; outerRotation?: number; startAngle?: number }) => JscadObject;

  // ---- 2D Primitives ----

  /** 2D circle. */
  circle: (opts?: { center?: Vec2; radius?: Dim; startAngle?: number; endAngle?: number; segments?: number }) => JscadObject;
  /** 2D ellipse. */
  ellipse: (opts?: { center?: Vec2; radius?: Vec2; startAngle?: number; endAngle?: number; segments?: number }) => JscadObject;
  /** 2D polygon from points (single or multi-contour). Points are raw [Dim, Dim] tuples. */
  polygon: (opts: { points: [Dim, Dim][] | [Dim, Dim][][]; paths?: number[] | number[][]; orientation?: "counterclockwise" | "clockwise" }) => JscadObject;
  /** 2D rectangle. */
  rectangle: (opts?: { center?: Vec2; size?: Vec2 }) => JscadObject;
  /** 2D rectangle with rounded corners. */
  roundedRectangle: (opts?: { center?: Vec2; size?: Vec2; roundRadius?: Dim; segments?: number }) => JscadObject;
  /** 2D square (equal side lengths). */
  square: (opts?: { center?: Vec2; size?: Dim }) => JscadObject;
  /** 2D star polygon. */
  star: (opts?: { center?: Vec2; vertices?: number; density?: number; outerRadius?: Dim; innerRadius?: Dim; startAngle?: number }) => JscadObject;
  /** 2D triangle by construction type (SSS, SAS, etc.). */
  triangle: (opts?: { type?: "AAA" | "AAS" | "ASA" | "SAS" | "SSA" | "SSS"; values?: [number, number, number] }) => JscadObject;

  // ---- Path Primitives ----

  /** 2D arc path. */
  arc: (opts?: { center?: Vec2; radius?: Dim; startAngle?: number; endAngle?: number; segments?: number; makeTangent?: boolean }) => JscadObject;
  /** 2D line path from ordered points. Points are raw [Dim, Dim] tuples. */
  line: (points: [Dim, Dim][]) => JscadObject;

  // ---- Wrap raw JSCAD geometry ----

  /** Wrap raw JSCAD geometry (Geom3, Geom2, or Path2) in a JscadObject. */
  fromGeom: typeof fromGeom;

  // ---- Transforms ----

  /** Translate by { x?, y?, z? }. Omitted axes default to 0. Curried. */
  translate: (v: Vec3) => Multi<JscadObject>;
  /** Translate along X only. Curried. */
  translateX: (d: Dim) => Multi<JscadObject>;
  /** Translate along Y only. Curried. */
  translateY: (d: Dim) => Multi<JscadObject>;
  /** Translate along Z only. Curried. */
  translateZ: (d: Dim) => Multi<JscadObject>;

  /** Rotate by { x?, y?, z? } angles. Accepts raw radians or deg()/rad(). Omitted axes default to 0. Curried. Default: center. */
  rotate: (angles: AngleVec3, opts?: RotateOpts) => Multi<JscadObject>;
  /** Rotate around X axis. Curried. Default: center. */
  rotateX: (angle: Angle, opts?: RotateOpts) => Multi<JscadObject>;
  /** Rotate around Y axis. Curried. Default: center. */
  rotateY: (angle: Angle, opts?: RotateOpts) => Multi<JscadObject>;
  /** Rotate around Z axis. Curried. Default: center. */
  rotateZ: (angle: Angle, opts?: RotateOpts) => Multi<JscadObject>;

  /** Scale by { x?, y?, z? }. Omitted axes default to 1. Curried. */
  scale: (v: ScaleVec3) => Multi<JscadObject>;
  /** Scale along X only. Curried. */
  scaleX: (factor: number) => Multi<JscadObject>;
  /** Scale along Y only. Curried. */
  scaleY: (factor: number) => Multi<JscadObject>;
  /** Scale along Z only. Curried. */
  scaleZ: (factor: number) => Multi<JscadObject>;

  /** Mirror across arbitrary plane. Curried. */
  mirror: (opts: { origin?: NumVec3; normal?: NumVec3 }) => Multi<JscadObject>;
  /** Mirror across YZ plane (negate X). Curried (no args). */
  mirrorX: () => Multi<JscadObject>;
  /** Mirror across XZ plane (negate Y). Curried (no args). */
  mirrorY: () => Multi<JscadObject>;
  /** Mirror across XY plane (negate Z). Curried (no args). */
  mirrorZ: () => Multi<JscadObject>;

  /** Center on specified axes. Curried. */
  center: (opts: { axes?: BoolVec3; relativeTo?: NumVec3 }) => Multi<JscadObject>;
  /** Center on X axis. Curried (no args). */
  centerX: () => Multi<JscadObject>;
  /** Center on Y axis. Curried (no args). */
  centerY: () => Multi<JscadObject>;
  /** Center on Z axis. Curried (no args). */
  centerZ: () => Multi<JscadObject>;

  /** Align on axes using modes (min/max/center/none). Curried. */
  align: (opts: { modes?: Array<"center" | "max" | "min" | "none">; relativeTo?: NullableNumVec3; grouped?: boolean }) => Multi<JscadObject>;

  /** Apply a raw 4×4 matrix transform. Curried. */
  transform: (matrix: readonly number[]) => Multi<JscadObject>;

  /** Apply RGBA color. Curried. */
  colorize: (color: [number, number, number] | [number, number, number, number]) => Multi<JscadObject>;

  // ---- Booleans ----

  /** Boolean union. Curried. */
  union: (...others: JscadObject[]) => Multi<JscadObject>;
  /** Boolean subtract. Curried. */
  subtract: (...cutouts: JscadObject[]) => Multi<JscadObject>;
  /** Boolean intersection. Curried. */
  intersect: (...others: JscadObject[]) => Multi<JscadObject>;
  /** Split multi-body geometry into separate parts. Single object → JscadObject[]. Array → JscadObject[][]. */
  scission: {
    (obj: JscadObject): JscadObject[];
    (objs: JscadObject[]): JscadObject[][];
  };

  // ---- Extrusions ----

  /** Extrude 2D shape linearly along Z. Curried. */
  extrudeLinear: (opts: { height?: number; twistAngle?: number; twistSteps?: number }) => Multi<JscadObject>;
  /** Revolve 2D shape around Z axis. Curried. */
  extrudeRotate: (opts?: { angle?: number; startAngle?: number; overflow?: "cap"; segments?: number }) => Multi<JscadObject>;
  /** Extrude 2D shape with rectangular cross-section. Curried. */
  extrudeRectangular: (opts?: { size?: number; height?: number; corners?: "edge" | "chamfer" | "round"; segments?: number }) => Multi<JscadObject>;
  /** Extrude 2D shape along a helical path. Curried. */
  extrudeHelical: (opts?: { angle?: number; startAngle?: number; pitch?: number; height?: number; endOffset?: number; segmentsPerRotation?: number }) => Multi<JscadObject>;
  /** Extrude between arbitrary cross-section slices. Curried. */
  extrudeFromSlices: (opts: { numberOfSlices?: number; capStart?: boolean; capEnd?: boolean; close?: boolean; callback?: (progress: number, index: number, base: any) => any }) => Multi<JscadObject>;
  /** Project 3D solid onto XY plane. Curried. */
  project: (opts?: { axis?: [number, number, number]; origin?: [number, number, number] }) => Multi<JscadObject>;

  // ---- Expansions ----

  /** Expand (inflate) or contract geometry by a delta. Curried. */
  expand: (opts: { delta?: number; corners?: "edge" | "chamfer" | "round"; segments?: number }) => Multi<JscadObject>;
  /** Offset a 2D geometry or path outward/inward. Curried. */
  offset: (opts: { delta?: number; corners?: "edge" | "chamfer" | "round"; segments?: number }) => Multi<JscadObject>;

  // ---- Hulls ----

  /** Convex hull of base and others. Curried. */
  hull: (...others: JscadObject[]) => Multi<JscadObject>;
  /** Pairwise convex hull chain. Curried. */
  hullChain: (...others: JscadObject[]) => Multi<JscadObject>;

  // ---- Modifiers ----

  /** Generalize geometry (snap/simplify/triangulate). Curried. */
  generalize: (opts: { snap?: boolean; simplify?: boolean; triangulate?: boolean }) => Multi<JscadObject>;
  /** Snap vertices to epsilon grid. Curried (no args). */
  snap: () => Multi<JscadObject>;
  /** Merge coplanar polygons (reduces polygon count). Curried (no args). */
  retessellate: () => Multi<JscadObject>;

  // ---- Place (builder-specific) ----

  /** Position using absolute or relative placement options. Curried. */
  place: (opts: PlaceOptions) => Multi<JscadObject>;

  // ---- Text utilities ----

  /** Raw vector segments for a single ASCII character. Not a JscadObject. */
  vectorChar: ReturnType<typeof makeVectorChar>;
  /** Raw vector segments for an ASCII string. Not a JscadObject. */
  vectorText: ReturnType<typeof makeVectorText>;

  // ---- Pipe ----

  /** Left-to-right function composition. */
  pipe: typeof pipe;
};

/**
 * Create a builder instance configured for a specific coordinate unit.
 *
 * All dimension arguments (`Dim`) accept either a plain `number` (interpreted
 * as `coordinateUnit`) or a `Length` value (mm(), cm(), ft(), inch(), etc.)
 * which is always converted precisely.
 * Rotation angles (`Angle`) accept raw radians or deg()/rad() values.
 *
 * Function names match @jscad/modeling exactly (cuboid, cylinder, sphere, etc.).
 *
 * @example
 * import { createBuilder } from '@jscad/builder'
 *
 * const { cuboid, cylinder, translate, rotate, pipe } = createBuilder({ coordinateUnit: 'mm' })
 *
 * const desk = cuboid({ size: { x: 1200, y: 750, z: 600 } })  // 1200mm × 750mm × 600mm
 * const leg = pipe(
 *   cylinder({ height: 700, radius: 25 }),
 *   translate({ x: 25, z: 25 }),
 * )
 */
export function createBuilder(config: BuilderConfig): Builder {
  const { coordinateUnit } = config;
  const resolve = createDimResolver(coordinateUnit);

  const translate    = makeTranslate(resolve);
  const translateX   = makeTranslateX(resolve);
  const translateY   = makeTranslateY(resolve);
  const translateZ   = makeTranslateZ(resolve);
  const rotate       = makeRotate();
  const rotateX      = makeRotateX();
  const rotateY      = makeRotateY();
  const rotateZ      = makeRotateZ();
  const scale        = makeScale();
  const scaleX       = makeScaleX();
  const scaleY       = makeScaleY();
  const scaleZ       = makeScaleZ();
  const mirror       = makeMirror();
  const mirrorX      = makeMirrorX();
  const mirrorY      = makeMirrorY();
  const mirrorZ      = makeMirrorZ();
  const center       = makeCenter();
  const centerX      = makeCenterX();
  const centerY      = makeCenterY();
  const centerZ      = makeCenterZ();
  const align        = makeAlign();
  const transform    = makeTransform();
  const colorize     = makeColorize();
  const union        = makeUnion();
  const subtract     = makeSubtract();
  const intersect    = makeIntersect();
  const scission     = makeScission();
  const extrudeLinear      = makeExtrudeLinear();
  const extrudeRotate      = makeExtrudeRotate();
  const extrudeRectangular = makeExtrudeRectangular();
  const extrudeHelical     = makeExtrudeHelical();
  const extrudeFromSlices  = makeExtrudeFromSlices();
  const project      = makeProject();
  const expand       = makeExpand();
  const offset       = makeOffset();
  const hull         = makeHull();
  const hullChain    = makeHullChain();
  const generalize   = makeGeneralize();
  const snap         = makeSnap();
  const retessellate = makeRetessellate();
  const place        = makePlace(resolve, (v) => translate(v));
  const vectorChar   = makeVectorChar();
  const vectorText   = makeVectorText();

  // Primitives
  const cuboid            = makeCuboid(resolve);
  const cube              = makeCube(resolve);
  const cylinder          = makeCylinder(resolve);
  const cylinderElliptic  = makeCylinderElliptic(resolve);
  const ellipsoid         = makeEllipsoid(resolve);
  const geodesicSphere    = makeGeodesicSphere(resolve);
  const polyhedron        = makePolyhedron(resolve);
  const roundedCuboid     = makeRoundedCuboid(resolve);
  const roundedCylinder   = makeRoundedCylinder(resolve);
  const sphere            = makeSphere(resolve);
  const torus             = makeTorus(resolve);
  const circle            = makeCircle(resolve);
  const ellipse           = makeEllipse(resolve);
  const polygon           = makePolygon(resolve);
  const rectangle         = makeRectangle(resolve);
  const roundedRectangle  = makeRoundedRectangle(resolve);
  const square            = makeSquare(resolve);
  const star              = makeStar(resolve);
  const triangle          = makeTriangle();
  const arc               = makeArc(resolve);
  const line              = makeLine(resolve);

  return {
    // 3D
    cuboid, cube, cylinder, cylinderElliptic, ellipsoid,
    geodesicSphere, polyhedron, roundedCuboid, roundedCylinder, sphere, torus,
    // 2D
    circle, ellipse, polygon, rectangle, roundedRectangle, square, star, triangle,
    // Paths
    arc, line,
    // fromGeom
    fromGeom,
    // Transforms
    translate, translateX, translateY, translateZ,
    rotate, rotateX, rotateY, rotateZ,
    scale, scaleX, scaleY, scaleZ,
    mirror, mirrorX, mirrorY, mirrorZ,
    center, centerX, centerY, centerZ,
    align, transform, colorize,
    // Booleans
    union, subtract, intersect, scission,
    // Extrusions
    extrudeLinear, extrudeRotate, extrudeRectangular, extrudeHelical,
    extrudeFromSlices, project,
    // Expansions
    expand, offset,
    // Hulls
    hull, hullChain,
    // Modifiers
    generalize, snap, retessellate,
    // Place (builder-specific)
    place,
    // Text
    vectorChar, vectorText,
    // Pipe
    pipe,
  };
}
