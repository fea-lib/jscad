import type { Dim, Vec3, JscadObject } from "./types";
import type { DimResolver } from "./primitives";

/**
 * Options for place(). At least one positioning key must be provided.
 *
 * Axis semantics (matching the existing codebase convention):
 *   x — left/right (width)
 *   y — bottom/top (height)
 *   z — front/back (depth)
 *
 * Relative options resolve to an absolute translate() using the reference
 * object's bounds, then apply optional gap and alignment.
 */
export type PlaceOptions = {
  /**
   * Absolute position. Pass null for any axis to leave it unchanged.
   * The object's min corner is placed at the given coordinate.
   *
   * @example place({ at: { x: mm(10), z: mm(50) } })(shelf)
   */
  at?: { x?: Dim | null; y?: Dim | null; z?: Dim | null };

  /**
   * Place after `ref` along the Z axis (ref.bounds.max[2] + gap).
   */
  after?: JscadObject;

  /**
   * Place before `ref` along the Z axis (ref.bounds.min[2] - obj.size[2] - gap).
   */
  before?: JscadObject;

  /**
   * Place above `ref` along the Y axis (ref.bounds.max[1] + gap).
   */
  above?: JscadObject;

  /**
   * Place below `ref` along the Y axis (ref.bounds.min[1] - obj.size[1] - gap).
   */
  below?: JscadObject;

  /**
   * Place beside `ref` along the X axis (ref.bounds.max[0] + gap).
   */
  beside?: JscadObject;

  /**
   * Place left of `ref` along the X axis (ref.bounds.min[0] - obj.size[0] - gap).
   */
  leftOf?: JscadObject;

  /**
   * Extra spacing added to any relative positioning.
   */
  gap?: Dim;

  /**
   * Fine-grained alignment of the object within the reference on each axis.
   * Only meaningful when used together with a relative positioning key.
   *
   *   'start'  — align min edges  (default)
   *   'center' — align centers
   *   'end'    — align max edges
   */
  align?: {
    x?: "start" | "center" | "end";
    y?: "start" | "center" | "end";
    z?: "start" | "center" | "end";
  };
};

/**
 * Returns a curried place() function bound to the given DimResolver.
 *
 * All positioning is resolved to a single translate() call so bounds stay
 * analytically correct — no re-measurement needed.
 *
 * @example absolute:
 * place({ at: { x: mm(10), z: mm(50) } })(shelf)
 *
 * @example relative — shelf placed immediately after desk on the Z axis:
 * place({ after: desk, gap: mm(3) })(shelf)
 *
 * @example with pipe:
 * pipe(
 *   box(80, 30, 20),
 *   rotate({ y: Math.PI / 2 }),
 *   place({ after: desk, gap: mm(3), align: { x: 'start', y: 'start' } }),
 * )
 */
export function makePlace(resolve: DimResolver, translateFn: (v: Vec3) => (obj: JscadObject) => JscadObject) {
  return function place(opts: PlaceOptions): ((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[]) {
    const single = (obj: JscadObject): JscadObject => {
      const gap = opts.gap !== undefined ? resolve(opts.gap) : 0;

      const objW = obj.bounds.max[0] - obj.bounds.min[0];
      const objH = obj.bounds.max[1] - obj.bounds.min[1];
      const objD = obj.bounds.max[2] - obj.bounds.min[2];

      // Start from current position (no change unless overridden).
      // All modes work in bounds.min space.
      let tx = obj.bounds.min[0];
      let ty = obj.bounds.min[1];
      let tz = obj.bounds.min[2];

      // --- Absolute positioning (at) — pins bounds.min ---
      if (opts.at !== undefined) {
        const { x: ax, y: ay, z: az } = opts.at;
        if (ax != null) tx = resolve(ax);
        if (ay != null) ty = resolve(ay);
        if (az != null) tz = resolve(az);
      }

      // --- Relative: after (Z+) ---
      if (opts.after !== undefined) {
        tz = opts.after.bounds.max[2] + gap;
      }

      // --- Relative: before (Z-) ---
      if (opts.before !== undefined) {
        tz = opts.before.bounds.min[2] - objD - gap;
      }

      // --- Relative: above (Y+) ---
      if (opts.above !== undefined) {
        ty = opts.above.bounds.max[1] + gap;
      }

      // --- Relative: below (Y-) ---
      if (opts.below !== undefined) {
        ty = opts.below.bounds.min[1] - objH - gap;
      }

      // --- Relative: beside (X+) ---
      if (opts.beside !== undefined) {
        tx = opts.beside.bounds.max[0] + gap;
      }

      // --- Relative: leftOf (X-) ---
      if (opts.leftOf !== undefined) {
        tx = opts.leftOf.bounds.min[0] - objW - gap;
      }

      // --- Reference-object fallback for unspecified axes ---
      // When a relative positioning key is given, axes that the user did not
      // explicitly provide (neither via `at` nor via `null`) inherit the
      // reference object's bounds.min on those axes, so you don't have to
      // repeat coordinates that are "the same as the reference".
      //
      // Explicit `at` values always win. `null` in `at` means "leave as-is"
      // (current position), which also overrides the fallback.
      const ref =
        opts.after ??
        opts.before ??
        opts.above ??
        opts.below ??
        opts.beside ??
        opts.leftOf;

      if (ref !== undefined) {
        const userAt = opts.at ?? {};
        // X: after/before/above/below don't set X — fall back to ref unless user specified
        if (opts.beside === undefined && opts.leftOf === undefined) {
          if (userAt.x === undefined) tx = ref.bounds.min[0];
        }
        // Y: after/before/beside/leftOf don't set Y — fall back to ref unless user specified
        if (opts.above === undefined && opts.below === undefined) {
          if (userAt.y === undefined) ty = ref.bounds.min[1];
        }
        // Z: above/below/beside/leftOf don't set Z — fall back to ref unless user specified
        if (opts.after === undefined && opts.before === undefined) {
          if (userAt.z === undefined) tz = ref.bounds.min[2];
        }
      }

      // --- Alignment overrides (applied after primary axis is set) ---
      if (ref !== undefined && opts.align !== undefined) {
        const { x: ax, y: ay, z: az } = opts.align;
        const refW = ref.bounds.max[0] - ref.bounds.min[0];
        const refH = ref.bounds.max[1] - ref.bounds.min[1];
        const refD = ref.bounds.max[2] - ref.bounds.min[2];

        if (ax !== undefined) {
          if (ax === "start") tx = ref.bounds.min[0];
          else if (ax === "center") tx = ref.bounds.min[0] + (refW - objW) / 2;
          else if (ax === "end") tx = ref.bounds.max[0] - objW;
        }
        if (ay !== undefined) {
          if (ay === "start") ty = ref.bounds.min[1];
          else if (ay === "center") ty = ref.bounds.min[1] + (refH - objH) / 2;
          else if (ay === "end") ty = ref.bounds.max[1] - objH;
        }
        if (az !== undefined) {
          if (az === "start") tz = ref.bounds.min[2];
          else if (az === "center") tz = ref.bounds.min[2] + (refD - objD) / 2;
          else if (az === "end") tz = ref.bounds.max[2] - objD;
        }
      }

      // Compute the delta from the object's current position and delegate to translate()
      const dx = tx - obj.bounds.min[0];
      const dy = ty - obj.bounds.min[1];
      const dz = tz - obj.bounds.min[2];

      return translateFn({ x: dx, y: dy, z: dz })(obj);
    };

    return (objOrObjs: JscadObject | JscadObject[]) =>
      Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs) as any;
  };
}
