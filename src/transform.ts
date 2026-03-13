import modeling from "@jscad/modeling";
import type { Dim, Vec3, JscadObject, AnyGeom } from "./types";
import type { Angle } from "@fea-lib/values";
import { isAngle, rad } from "@fea-lib/values";
import { boundsFromGeom, r5, type DimResolver } from "./primitives";

/** Resolve an Angle (number in radians, or a Measure in deg/rad) to radians. */
function resolveAngle(a: Angle): number {
  if (!isAngle(a)) return a;
  return (rad(a) as unknown as { value: number }).value;
}

const {
  transforms: {
    translate: jscadTranslate,
    translateX: jscadTranslateX,
    translateY: jscadTranslateY,
    translateZ: jscadTranslateZ,
    rotate: jscadRotate,
    rotateX: jscadRotateX,
    rotateY: jscadRotateY,
    rotateZ: jscadRotateZ,
    scale: jscadScale,
    scaleX: jscadScaleX,
    scaleY: jscadScaleY,
    scaleZ: jscadScaleZ,
    mirror: jscadMirror,
    mirrorX: jscadMirrorX,
    mirrorY: jscadMirrorY,
    mirrorZ: jscadMirrorZ,
    center: jscadCenter,
    centerX: jscadCenterX,
    centerY: jscadCenterY,
    centerZ: jscadCenterZ,
    align: jscadAlign,
    transform: jscadTransform,
  },
  colors: { colorize: jscadColorize },
} = modeling;

// ---------------------------------------------------------------------------
// translate
// ---------------------------------------------------------------------------

/**
 * Named angle vector — each axis accepts a raw number in radians or a
 * `Measure` produced by `deg()` / `rad()`. All axes are optional (default 0).
 */
export type AngleVec3 = { x?: Angle; y?: Angle; z?: Angle };

/**
 * Returns a curried translate() function bound to the given resolver.
 *
 * translate({ x, y, z })(obj) shifts all geometry by the delta.
 * Each axis is optional — omitted axes default to 0.
 * Bounds are updated analytically — O(1), no JSCAD measurement call.
 *
 * @example
 * const { translate } = createBuilder({ coordinateUnit: 'mm' })
 * pipe(cuboid({ size: { x: 50, y: 100, z: 30 } }), translate({ x: 10, z: 50 }))
 */
export function makeTranslate(resolve: DimResolver) {
  return function translate(
    v: Vec3,
  ): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const dx = resolve(v.x ?? 0);
      const dy = resolve(v.y ?? 0);
      const dz = resolve(v.z ?? 0);
      return {
        geom: obj.geom.map((g) => jscadTranslate([dx, dy, dz], g as any) as AnyGeom),
        bounds: {
          min: [r5(obj.bounds.min[0] + dx), r5(obj.bounds.min[1] + dy), r5(obj.bounds.min[2] + dz)],
          max: [r5(obj.bounds.max[0] + dx), r5(obj.bounds.max[1] + dy), r5(obj.bounds.max[2] + dz)],
        },
        origin: {
          x: r5(obj.origin.x + dx),
          y: r5(obj.origin.y + dy),
          z: r5(obj.origin.z + dz),
        },
      };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried translateX() function.
 * Shifts all geometry along the X axis.
 */
export function makeTranslateX(resolve: DimResolver) {
  return function translateX(d: Dim): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const dx = resolve(d);
      return {
        geom: obj.geom.map((g) => jscadTranslateX(dx, g as any) as AnyGeom),
        bounds: {
          min: [r5(obj.bounds.min[0] + dx), obj.bounds.min[1], obj.bounds.min[2]],
          max: [r5(obj.bounds.max[0] + dx), obj.bounds.max[1], obj.bounds.max[2]],
        },
        origin: { x: r5(obj.origin.x + dx), y: obj.origin.y, z: obj.origin.z },
      };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried translateY() function.
 * Shifts all geometry along the Y axis.
 */
export function makeTranslateY(resolve: DimResolver) {
  return function translateY(d: Dim): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const dy = resolve(d);
      return {
        geom: obj.geom.map((g) => jscadTranslateY(dy, g as any) as AnyGeom),
        bounds: {
          min: [obj.bounds.min[0], r5(obj.bounds.min[1] + dy), obj.bounds.min[2]],
          max: [obj.bounds.max[0], r5(obj.bounds.max[1] + dy), obj.bounds.max[2]],
        },
        origin: { x: obj.origin.x, y: r5(obj.origin.y + dy), z: obj.origin.z },
      };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried translateZ() function.
 * Shifts all geometry along the Z axis.
 */
export function makeTranslateZ(resolve: DimResolver) {
  return function translateZ(d: Dim): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const dz = resolve(d);
      return {
        geom: obj.geom.map((g) => jscadTranslateZ(dz, g as any) as AnyGeom),
        bounds: {
          min: [obj.bounds.min[0], obj.bounds.min[1], r5(obj.bounds.min[2] + dz)],
          max: [obj.bounds.max[0], obj.bounds.max[1], r5(obj.bounds.max[2] + dz)],
        },
        origin: { x: obj.origin.x, y: obj.origin.y, z: r5(obj.origin.z + dz) },
      };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

// ---------------------------------------------------------------------------
// rotate
// ---------------------------------------------------------------------------

/**
 * Apply a full XYZ rotation matrix to a named origin point and return the
 * rotated named point. Uses the same convention as JSCAD's rotate():
 *   Rx then Ry then Rz (intrinsic XYZ / extrinsic ZYX order).
 */
function rotateOrigin(
  ox: number, oy: number, oz: number,
  rx: number, ry: number, rz: number,
): { x: number; y: number; z: number } {
  // Rx
  let x = ox;
  let y = Math.cos(rx) * oy - Math.sin(rx) * oz;
  let z = Math.sin(rx) * oy + Math.cos(rx) * oz;
  // Ry
  const x2 =  Math.cos(ry) * x + Math.sin(ry) * z;
  const z2 = -Math.sin(ry) * x + Math.cos(ry) * z;
  x = x2; z = z2;
  // Rz
  const x3 = Math.cos(rz) * x - Math.sin(rz) * y;
  const y3 = Math.sin(rz) * x + Math.cos(rz) * y;
  return { x: r5(x3), y: r5(y3), z: r5(z2) };
}

/**
 * Returns a curried rotate() function.
 *
 * Rotates geometry around its own center by default.
 * Unlike JSCAD's raw rotate() which spins around the world origin, this
 * wrapper translates the object to the origin, rotates, then translates back.
 *
 * Bounds are remeasured after rotation because extents genuinely change
 * (a 50×200×30 box rotated 90° has different width/depth).
 *
 * @param angles - { x?, y?, z? } — each element is either a raw number in
 *   radians or a `Measure` produced by `deg()` / `rad()`. Omitted axes default to 0.
 * @param opts.around - 'center' (default) or 'corner' (JSCAD default behaviour)
 *
 * @example
 * const { rotate } = createBuilder({ coordinateUnit: 'mm' })
 * pipe(pax, rotate({ x: deg(90) }))
 * pipe(pax, rotate({ y: Math.PI / 2 }))  // raw radians still work
 */
export function makeRotate() {
  return function rotate(
    angles: AngleVec3,
    opts: { around?: "center" | "corner" } = {},
  ): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const around = opts.around ?? "center";
    const single = (obj: JscadObject): JscadObject => {
      const resolved: [number, number, number] = [
        resolveAngle(angles.x ?? 0),
        resolveAngle(angles.y ?? 0),
        resolveAngle(angles.z ?? 0),
      ];
      if (around === "corner") {
        const rotated = obj.geom.map((g) => jscadRotate(resolved, g as any) as AnyGeom);
        const newOrigin = rotateOrigin(obj.origin.x, obj.origin.y, obj.origin.z, resolved[0], resolved[1], resolved[2]);
        return { geom: rotated, bounds: boundsFromGeom(rotated), origin: newOrigin };
      }

      // Rotate around center: shift to origin, rotate, shift back
      const cx = (obj.bounds.min[0] + obj.bounds.max[0]) / 2;
      const cy = (obj.bounds.min[1] + obj.bounds.max[1]) / 2;
      const cz = (obj.bounds.min[2] + obj.bounds.max[2]) / 2;

      const rotated = obj.geom.map((g) => {
        const shifted = jscadTranslate([-cx, -cy, -cz], g as any);
        const rotatedG = jscadRotate(resolved, shifted as any);
        return jscadTranslate([cx, cy, cz], rotatedG as any) as AnyGeom;
      });

      // origin: shift to center, rotate, shift back
      const shifted = rotateOrigin(
        obj.origin.x - cx, obj.origin.y - cy, obj.origin.z - cz,
        resolved[0], resolved[1], resolved[2],
      );
      const newOrigin = { x: r5(shifted.x + cx), y: r5(shifted.y + cy), z: r5(shifted.z + cz) };

      return { geom: rotated, bounds: boundsFromGeom(rotated), origin: newOrigin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried rotateX() function.
 *
 * @param angle - rotation angle (raw radians or deg()/rad())
 * @param opts.around - 'center' (default) or 'corner' (JSCAD default)
 */
export function makeRotateX() {
  return function rotateX(
    angle: Angle,
    opts: { around?: "center" | "corner" } = {},
  ): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const around = opts.around ?? "center";
    const single = (obj: JscadObject): JscadObject => {
      const rad = resolveAngle(angle);
      if (around === "corner") {
        const rotated = obj.geom.map((g) => jscadRotateX(rad, g as any) as AnyGeom);
        const newOrigin = rotateOrigin(obj.origin.x, obj.origin.y, obj.origin.z, rad, 0, 0);
        return { geom: rotated, bounds: boundsFromGeom(rotated), origin: newOrigin };
      }
      const cx = (obj.bounds.min[0] + obj.bounds.max[0]) / 2;
      const cy = (obj.bounds.min[1] + obj.bounds.max[1]) / 2;
      const cz = (obj.bounds.min[2] + obj.bounds.max[2]) / 2;
      const rotated = obj.geom.map((g) => {
        const shifted = jscadTranslate([-cx, -cy, -cz], g as any);
        const r = jscadRotateX(rad, shifted as any);
        return jscadTranslate([cx, cy, cz], r as any) as AnyGeom;
      });
      const shifted = rotateOrigin(obj.origin.x - cx, obj.origin.y - cy, obj.origin.z - cz, rad, 0, 0);
      return { geom: rotated, bounds: boundsFromGeom(rotated), origin: { x: r5(shifted.x + cx), y: r5(shifted.y + cy), z: r5(shifted.z + cz) } };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried rotateY() function.
 *
 * @param angle - rotation angle (raw radians or deg()/rad())
 * @param opts.around - 'center' (default) or 'corner' (JSCAD default)
 */
export function makeRotateY() {
  return function rotateY(
    angle: Angle,
    opts: { around?: "center" | "corner" } = {},
  ): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const around = opts.around ?? "center";
    const single = (obj: JscadObject): JscadObject => {
      const rad = resolveAngle(angle);
      if (around === "corner") {
        const rotated = obj.geom.map((g) => jscadRotateY(rad, g as any) as AnyGeom);
        const newOrigin = rotateOrigin(obj.origin.x, obj.origin.y, obj.origin.z, 0, rad, 0);
        return { geom: rotated, bounds: boundsFromGeom(rotated), origin: newOrigin };
      }
      const cx = (obj.bounds.min[0] + obj.bounds.max[0]) / 2;
      const cy = (obj.bounds.min[1] + obj.bounds.max[1]) / 2;
      const cz = (obj.bounds.min[2] + obj.bounds.max[2]) / 2;
      const rotated = obj.geom.map((g) => {
        const shifted = jscadTranslate([-cx, -cy, -cz], g as any);
        const r = jscadRotateY(rad, shifted as any);
        return jscadTranslate([cx, cy, cz], r as any) as AnyGeom;
      });
      const shifted = rotateOrigin(obj.origin.x - cx, obj.origin.y - cy, obj.origin.z - cz, 0, rad, 0);
      return { geom: rotated, bounds: boundsFromGeom(rotated), origin: { x: r5(shifted.x + cx), y: r5(shifted.y + cy), z: r5(shifted.z + cz) } };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried rotateZ() function.
 *
 * @param angle - rotation angle (raw radians or deg()/rad())
 * @param opts.around - 'center' (default) or 'corner' (JSCAD default)
 */
export function makeRotateZ() {
  return function rotateZ(
    angle: Angle,
    opts: { around?: "center" | "corner" } = {},
  ): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const around = opts.around ?? "center";
    const single = (obj: JscadObject): JscadObject => {
      const rad = resolveAngle(angle);
      if (around === "corner") {
        const rotated = obj.geom.map((g) => jscadRotateZ(rad, g as any) as AnyGeom);
        const newOrigin = rotateOrigin(obj.origin.x, obj.origin.y, obj.origin.z, 0, 0, rad);
        return { geom: rotated, bounds: boundsFromGeom(rotated), origin: newOrigin };
      }
      const cx = (obj.bounds.min[0] + obj.bounds.max[0]) / 2;
      const cy = (obj.bounds.min[1] + obj.bounds.max[1]) / 2;
      const cz = (obj.bounds.min[2] + obj.bounds.max[2]) / 2;
      const rotated = obj.geom.map((g) => {
        const shifted = jscadTranslate([-cx, -cy, -cz], g as any);
        const r = jscadRotateZ(rad, shifted as any);
        return jscadTranslate([cx, cy, cz], r as any) as AnyGeom;
      });
      const shifted = rotateOrigin(obj.origin.x - cx, obj.origin.y - cy, obj.origin.z - cz, 0, 0, rad);
      return { geom: rotated, bounds: boundsFromGeom(rotated), origin: { x: r5(shifted.x + cx), y: r5(shifted.y + cy), z: r5(shifted.z + cz) } };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

// ---------------------------------------------------------------------------
// scale
// ---------------------------------------------------------------------------

/**
 * Named scale vector — each axis is a plain number scalar. All axes optional,
 * defaulting to 1 when omitted.
 */
export type ScaleVec3 = { x?: number; y?: number; z?: number };

/**
 * Returns a curried scale() function.
 *
 * Scales geometry by { x, y, z }. Omitted axes default to 1.
 * Bounds are updated analytically from the scale factors — O(1).
 * Note: scale is applied relative to the world origin, so [0,0,0] stays fixed.
 *
 * @example
 * const { scale } = createBuilder({ coordinateUnit: 'mm' })
 * pipe(myBox, scale({ x: 2 }))  // double the width only
 */
export function makeScale() {
  return function scale(
    v: ScaleVec3,
  ): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const sx = v.x ?? 1;
      const sy = v.y ?? 1;
      const sz = v.z ?? 1;
      return {
        geom: obj.geom.map((g) => jscadScale([sx, sy, sz], g as any) as AnyGeom),
        bounds: {
          min: [r5(obj.bounds.min[0] * sx), r5(obj.bounds.min[1] * sy), r5(obj.bounds.min[2] * sz)],
          max: [r5(obj.bounds.max[0] * sx), r5(obj.bounds.max[1] * sy), r5(obj.bounds.max[2] * sz)],
        },
        origin: { x: r5(obj.origin.x * sx), y: r5(obj.origin.y * sy), z: r5(obj.origin.z * sz) },
      };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried scaleX() function.
 * Scales geometry along the X axis only.
 */
export function makeScaleX() {
  return function scaleX(factor: number): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => ({
      geom: obj.geom.map((g) => jscadScaleX(factor, g as any) as AnyGeom),
      bounds: {
        min: [r5(obj.bounds.min[0] * factor), obj.bounds.min[1], obj.bounds.min[2]],
        max: [r5(obj.bounds.max[0] * factor), obj.bounds.max[1], obj.bounds.max[2]],
      },
      origin: { x: r5(obj.origin.x * factor), y: obj.origin.y, z: obj.origin.z },
    });
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried scaleY() function.
 * Scales geometry along the Y axis only.
 */
export function makeScaleY() {
  return function scaleY(factor: number): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => ({
      geom: obj.geom.map((g) => jscadScaleY(factor, g as any) as AnyGeom),
      bounds: {
        min: [obj.bounds.min[0], r5(obj.bounds.min[1] * factor), obj.bounds.min[2]],
        max: [obj.bounds.max[0], r5(obj.bounds.max[1] * factor), obj.bounds.max[2]],
      },
      origin: { x: obj.origin.x, y: r5(obj.origin.y * factor), z: obj.origin.z },
    });
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried scaleZ() function.
 * Scales geometry along the Z axis only.
 */
export function makeScaleZ() {
  return function scaleZ(factor: number): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => ({
      geom: obj.geom.map((g) => jscadScaleZ(factor, g as any) as AnyGeom),
      bounds: {
        min: [obj.bounds.min[0], obj.bounds.min[1], r5(obj.bounds.min[2] * factor)],
        max: [obj.bounds.max[0], obj.bounds.max[1], r5(obj.bounds.max[2] * factor)],
      },
      origin: { x: obj.origin.x, y: obj.origin.y, z: r5(obj.origin.z * factor) },
    });
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

// ---------------------------------------------------------------------------
// mirror
// ---------------------------------------------------------------------------

/**
 * Named numeric 3-axis vector used for mirror origin/normal (plain numbers, not Dim).
 * All axes optional, defaulting to 0.
 */
export type NumVec3 = { x?: number; y?: number; z?: number };

/**
 * Returns a curried mirror() function.
 * Mirrors geometry across an arbitrary plane defined by origin and normal.
 * Bounds are remeasured after mirroring.
 *
 * @example
 * mirror({ normal: { x: 1 } })(obj)  // mirror across YZ plane
 */
export function makeMirror() {
  return function mirror(opts: {
    origin?: NumVec3;
    normal?: NumVec3;
  }): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const jscadOpts = {
        origin: opts.origin
          ? [opts.origin.x ?? 0, opts.origin.y ?? 0, opts.origin.z ?? 0] as [number, number, number]
          : undefined,
        normal: opts.normal
          ? [opts.normal.x ?? 0, opts.normal.y ?? 0, opts.normal.z ?? 0] as [number, number, number]
          : undefined,
      };
      const mirrored = obj.geom.map((g) => jscadMirror(jscadOpts, g as any) as AnyGeom);
      return { geom: mirrored, bounds: boundsFromGeom(mirrored), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried mirrorX() function.
 * Mirrors geometry across the YZ plane (negates X coordinates).
 */
export function makeMirrorX() {
  return function mirrorX(): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const mirrored = obj.geom.map((g) => jscadMirrorX(g as any) as AnyGeom);
      return { geom: mirrored, bounds: boundsFromGeom(mirrored), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried mirrorY() function.
 * Mirrors geometry across the XZ plane (negates Y coordinates).
 */
export function makeMirrorY() {
  return function mirrorY(): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const mirrored = obj.geom.map((g) => jscadMirrorY(g as any) as AnyGeom);
      return { geom: mirrored, bounds: boundsFromGeom(mirrored), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried mirrorZ() function.
 * Mirrors geometry across the XY plane (negates Z coordinates).
 */
export function makeMirrorZ() {
  return function mirrorZ(): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const mirrored = obj.geom.map((g) => jscadMirrorZ(g as any) as AnyGeom);
      return { geom: mirrored, bounds: boundsFromGeom(mirrored), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

// ---------------------------------------------------------------------------
// center
// ---------------------------------------------------------------------------

/**
 * Named boolean axes selector for center(). All axes optional, defaulting to false.
 */
export type BoolVec3 = { x?: boolean; y?: boolean; z?: boolean };

/**
 * Returns a curried center() function.
 * Centers the object at the world origin on the specified axes.
 * Bounds are remeasured after centering.
 *
 * @example
 * center({ axes: { x: true, y: true, z: true } })(obj)  // center on all axes
 */
export function makeCenter() {
  return function center(opts: {
    axes?: BoolVec3;
    relativeTo?: NumVec3;
  }): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const jscadOpts = {
        axes: opts.axes
          ? [opts.axes.x ?? false, opts.axes.y ?? false, opts.axes.z ?? false] as [boolean, boolean, boolean]
          : undefined,
        relativeTo: opts.relativeTo
          ? [opts.relativeTo.x ?? 0, opts.relativeTo.y ?? 0, opts.relativeTo.z ?? 0] as [number, number, number]
          : undefined,
      };
      const centered = obj.geom.map((g) => jscadCenter(jscadOpts, g as any) as AnyGeom);
      return { geom: centered, bounds: boundsFromGeom(centered), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried centerX() function.
 * Centers geometry on the X axis.
 */
export function makeCenterX() {
  return function centerX(): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const centered = obj.geom.map((g) => jscadCenterX(g as any) as AnyGeom);
      return { geom: centered, bounds: boundsFromGeom(centered), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried centerY() function.
 * Centers geometry on the Y axis.
 */
export function makeCenterY() {
  return function centerY(): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const centered = obj.geom.map((g) => jscadCenterY(g as any) as AnyGeom);
      return { geom: centered, bounds: boundsFromGeom(centered), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

/**
 * Returns a curried centerZ() function.
 * Centers geometry on the Z axis.
 */
export function makeCenterZ() {
  return function centerZ(): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const centered = obj.geom.map((g) => jscadCenterZ(g as any) as AnyGeom);
      return { geom: centered, bounds: boundsFromGeom(centered), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

// ---------------------------------------------------------------------------
// align
// ---------------------------------------------------------------------------

/**
 * Named nullable-number vector for align's relativeTo. All axes optional.
 */
export type NullableNumVec3 = { x?: number | null; y?: number | null; z?: number | null };

/**
 * Returns a curried align() function.
 *
 * Aligns one or more objects relative to each other or to an absolute position.
 *
 * @param opts.modes      - alignment mode per axis: 'min', 'center', 'max', 'none'
 * @param opts.relativeTo - optional absolute { x?, y?, z? } target coordinates
 * @param opts.grouped    - if true, treats all geometries as a single group
 *
 * @example
 * align({ modes: ['center', 'min', 'none'] })(obj)  // center on X, align min on Y
 */
export function makeAlign() {
  return function align(opts: {
    modes?: Array<"center" | "max" | "min" | "none">;
    relativeTo?: NullableNumVec3;
    grouped?: boolean;
  }): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const jscadOpts = {
        modes: opts.modes,
        relativeTo: opts.relativeTo
          ? [opts.relativeTo.x ?? null, opts.relativeTo.y ?? null, opts.relativeTo.z ?? null] as [number | null, number | null, number | null]
          : undefined,
        grouped: opts.grouped,
      };
      const aligned = obj.geom.map((g) => jscadAlign(jscadOpts as any, g as any) as AnyGeom);
      return { geom: aligned, bounds: boundsFromGeom(aligned), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

// ---------------------------------------------------------------------------
// transform (raw matrix)
// ---------------------------------------------------------------------------

/**
 * Returns a curried transform() function.
 * Applies a raw 4×4 column-major matrix to all geometry.
 * Bounds are remeasured after the transform.
 *
 * @param matrix - 16-element column-major matrix (row-major from the user's perspective)
 *
 * @example
 * import { mat4 } from '@jscad/modeling'
 * transform(mat4.fromXRotation(mat4.create(), Math.PI / 4))(obj)
 */
export function makeTransform() {
  return function transform(
    matrix: readonly number[],
  ): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const transformed = obj.geom.map((g) => jscadTransform(matrix as any, g as any) as AnyGeom);
      return { geom: transformed, bounds: boundsFromGeom(transformed), origin: obj.origin };
    };
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}

// ---------------------------------------------------------------------------
// colorize
// ---------------------------------------------------------------------------

/**
 * Returns a curried colorize() function.
 *
 * Applies a color to all geometry. Bounds are unchanged — O(1).
 *
 * @param color - RGB or RGBA array, e.g. [1, 0, 0, 0.7]
 *
 * @example
 * const { colorize } = createBuilder({ coordinateUnit: 'mm' })
 * pipe(myBox, colorize([1, 1, 1]))
 */
export function makeColorize() {
  return function colorize(
    color: [number, number, number] | [number, number, number, number],
  ): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => ({
      geom: obj.geom.map((g) => jscadColorize(color, g as any) as AnyGeom),
      bounds: obj.bounds,
      origin: obj.origin,
    });
    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}
