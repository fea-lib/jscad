# Coordinate Precision: Design Decision and Implementation

## Problem

IEEE 754 floating-point arithmetic produces epsilon noise in coordinates after
trigonometric operations. A cuboid rotated exactly 90° around Y produces origin
and bounds values like `-1.7763568394002505e-15` instead of `0`. These values
are mathematically correct (within machine epsilon of zero) but make exact
equality assertions impossible, forcing tests to use `toBeCloseTo` instead of
`toEqual`.

The noise compounds: if a rotated object is then translated or placed, the
epsilon value propagates into every downstream coordinate. Even though no single
step introduces visible error, the accumulated values are meaningless for any
real-world use case.

---

## Design decision

**Round every coordinate value to 5 decimal places at the point it is produced.**

This is implemented by the `r5` helper in `src/primitives.ts`:

```ts
export function r5(n: number): number {
  return Math.round(n * 100000) / 100000;
}
```

### Why 5 decimal places?

The precision was chosen to satisfy the most demanding consumer 3D-printing
technology while remaining well within the representable range of `Float32`:

| Technology | Typical tolerance |
|---|---|
| FDM (filament) | ±0.2 mm |
| SLA/MSLA resin | ±0.01–0.02 mm |
| Industrial SLS | ±0.1 mm |

5 decimal places = 0.00001 in whatever coordinate unit is configured. In
millimetres that is 10 nm — four orders of magnitude below the finest consumer
printer. In centimetres it is 0.1 µm. This is effectively lossless for any
geometry that could be manufactured or rendered.

`Float32` (used by Three.js buffers and WebGL) has ~7 significant decimal
digits. 5 decimal places leaves 2 digits for the integer part before precision
is exhausted, which covers objects up to ±99 in the configured coordinate unit —
sufficient for the library's typical metre/centimetre/millimetre workflows.

### Why `Math.round(n * 100000) / 100000` and not `parseFloat(n.toFixed(5))`?

`toFixed` returns a `string`, requiring a `parseFloat` round-trip. The
multiply-round-divide path is significantly faster and stays in the numeric
domain throughout. Both produce identical results for normal coordinate values.

### Why not configure the precision?

The precision is independent of `coordinateUnit`. The choice of decimal places
is a physical constant (derived from manufacturing tolerances), not a
user-tunable parameter. Exposing it as configuration would add API surface
without benefit.

---

## Scope: where rounding is applied

Rounding happens **at the point values are produced**, not at the point they are
consumed. There are two distinct production paths:

### 1. `boundsFromGeom` family (`src/primitives.ts`)

`boundsFromGeom3`, `boundsFromGeom2`, and `boundsFromGeom` all call JSCAD's
`measureBoundingBox`. The raw bounding-box numbers are rounded before being
placed into the returned `Bounds` object.

These functions are used by:
- All primitive constructors (`cuboid`, `sphere`, `cylinder`, etc.)
- All operations that remeasure geometry after transformation: `rotate`,
  `mirror`, `extrude*`, `expand`, `hull`, `hullChain`, booleans, `scission`

### 2. Analytical transform paths (`src/transform.ts`)

`translate`, `translateX/Y/Z`, `scale`, `scaleX/Y/Z` do **not** call
`boundsFromGeom` — they compute the new bounds and origin by direct arithmetic
on existing values (e.g. `bounds.min[0] + dx`). `r5` is applied to each
computed coordinate before it is stored.

`rotate`, `rotateX/Y/Z`, `rotateZ` use `rotateOrigin()` for the `origin` field.
`r5` is applied inside `rotateOrigin` on the return value, and again on the
final `shifted.x + cx` / `shifted.y + cy` / `shifted.z + cz` addition in the
`center` rotation path.

### Not rounded

- The `geom` array — raw JSCAD geometry objects are never modified. Rounding
  applies only to the metadata (`bounds`, `origin`) that the wrapper maintains.
- `mergeBounds` — combines two already-rounded `Bounds` values; the `Math.min`
  / `Math.max` of two rounded numbers is already rounded.
- The `gap` argument to `place()` — this is a user-supplied `Dim` value; it
  will be rounded if/when it flows through an analytical transform.

---

## Effect on tests

After rounding, coordinates that were previously `≈ 0` are exactly `0`, and
coordinates that were previously `≈ 20` are exactly `20`. This allows scenario
tests involving rotated geometry to use `toEqual` instead of `toBeCloseTo`:

```ts
// Before rounding
expect(first.bounds.min[0]).toBeCloseTo(0);  // -1.78e-15 ≈ 0

// After rounding
expect(first.bounds.min).toEqual([0, 0, 10]); // exactly [0, 0, 10]
```

All 136 tests use strict `toEqual` / `toBe` assertions. No `toBeCloseTo`
remains in the test suite.
