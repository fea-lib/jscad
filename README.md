# @fea-lib/jscad

Ergonomic JSCAD wrapper. Unit-aware dimensions, analytical bounds, analytical placement.

## What's included

- **Unit-aware dimensions** — all size/radius/height params accept a plain `number` (interpreted as your `coordinateUnit`) *or* a tagged `Length` value (`mm()`, `cm()`, `inch()`, etc.) that is converted precisely regardless of the coordinate unit.
- **Analytical bounds** — every `JscadObject` carries a `bounds` property (`{ min, max }`) computed at construction time with O(1) arithmetic. No geometry traversal.
- **Analytical placement** — `place()` positions objects using `bounds`, not the JSCAD geometry tree.
- **Curried transforms** — all transforms return `(obj) => obj` so they compose naturally with `pipe()`.
- **Full JSCAD surface** — primitives, transforms, booleans, extrusions, expansions, hulls, modifiers, text utilities.

## Dependencies

| Package | Role |
|---|---|
| `@jscad/modeling` | JSCAD geometry kernel (peer dep — install separately) |
| `@fea-lib/values` | Unit-tagged value constructors and converters (copy-paste peer dep) |

## Install

This is a **copy-paste library** — you own the source. No npm publish.

```bash
# Install into src/libs/ (adjust path as needed)
curl -fsSL https://github.com/fea-lib/jscad/raw/main/install.sh | bash -s src/libs
```

Or run the bundled script directly if you already have a local clone:

```bash
./install.sh src/libs
```

This copies the source into `src/libs/@fea-lib/jscad/` and recursively installs `@fea-lib/values` into `src/libs/@fea-lib/values/`.

Install the JSCAD kernel via npm (or your package manager):

```bash
npm install @jscad/modeling
```

## Add to tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@fea-lib/jscad":   ["src/libs/@fea-lib/jscad/src/index.ts"],
      "@fea-lib/values":        ["src/libs/@fea-lib/values/src/index.ts"]
    }
  }
}
```

Both libraries are installed side-by-side, so the relative path from `jscad` to `values` is always `../values/`.

## Quick start

```ts
import { createBuilder } from '@fea-lib/jscad'
import { mm, cm } from '@fea-lib/values'

const { cuboid, cylinder, translate, rotate, subtract, pipe } =
  createBuilder({ coordinateUnit: 'mm' })

// All plain numbers are millimetres; Length values convert automatically
const body = cuboid({ size: { x: 200, y: 100, z: 50 } })

const hole = pipe(
  cylinder({ height: 60, radius: mm(10) }),
  translate({ x: 100, y: 50 }),
)

const result = pipe(body, subtract(hole))
// result.bounds → analytical, no geometry traversal
```

## API reference

### `createBuilder(config)`

```ts
createBuilder({ coordinateUnit: 'mm' | 'cm' | 'm' | 'km' | 'inch' | 'ft' | 'yd' | 'mile' | 'μm' })
```

Returns a `Builder` object with all functions below, bound to the configured `coordinateUnit`.

---

### Primitives (3D)

| Function | Description |
|---|---|
| `cuboid({ size, center? })` | Axis-aligned box. Origin at bottom-left-front. |
| `cube({ size?, center? })` | Equal-sided box. |
| `sphere({ radius?, center?, segments? })` | UV sphere. |
| `cylinder({ height?, radius?, center?, segments? })` | Circular cylinder. |
| `cylinderElliptic(opts)` | Elliptic / tapered cylinder. |
| `ellipsoid({ radius?, center?, segments? })` | Ellipsoid. |
| `geodesicSphere({ radius?, frequency? })` | Geodesic (triangle mesh) sphere. |
| `roundedCuboid({ size?, roundRadius?, center?, segments? })` | Box with rounded edges. |
| `roundedCylinder({ height?, radius?, roundRadius?, center?, segments? })` | Cylinder with hemispherical caps. |
| `torus({ innerRadius?, outerRadius?, ... })` | Torus (donut). |
| `polyhedron({ points, faces, ... })` | Polyhedron from explicit points and faces. |

All dimension params (`Dim`) accept `number` or a `Length` value.

---

### Primitives (2D)

| Function | Description |
|---|---|
| `circle({ radius?, center?, ... })` | 2D circle. |
| `ellipse({ radius?, center?, ... })` | 2D ellipse. |
| `rectangle({ size?, center? })` | 2D rectangle. |
| `square({ size?, center? })` | 2D square. |
| `roundedRectangle({ size?, roundRadius?, ... })` | 2D rectangle with rounded corners. |
| `polygon({ points, ... })` | 2D polygon from points. |
| `star({ outerRadius?, innerRadius?, vertices?, ... })` | 2D star polygon. |
| `triangle({ type?, values? })` | 2D triangle (SSS, SAS, etc.). |

---

### Path primitives

| Function | Description |
|---|---|
| `arc({ radius?, startAngle?, endAngle?, ... })` | 2D arc path. |
| `line(points)` | 2D line from ordered `[x, y]` points. |

---

### `fromGeom`

```ts
fromGeom(geom: Geom3 | Geom2 | Path2): JscadObject
```

Wraps a raw JSCAD geometry object. Bounds are computed by traversing the geometry once.

---

### Transforms

All transforms are **curried**: they return `(obj: JscadObject) => JscadObject`.

| Function | Description |
|---|---|
| `translate({ x?, y?, z? })` | Translate. Omitted axes → 0. |
| `translateX(d)` / `translateY(d)` / `translateZ(d)` | Single-axis translate. |
| `rotate({ x?, y?, z? }, opts?)` | Rotate (radians or `deg()`/`rad()`). Default: around center. |
| `rotateX(a)` / `rotateY(a)` / `rotateZ(a)` | Single-axis rotate. |
| `scale({ x?, y?, z? })` | Scale. Omitted axes → 1. |
| `scaleX(f)` / `scaleY(f)` / `scaleZ(f)` | Single-axis scale. |
| `mirror({ origin?, normal? })` | Mirror across arbitrary plane. |
| `mirrorX()` / `mirrorY()` / `mirrorZ()` | Mirror across YZ/XZ/XY plane. |
| `center({ axes?, relativeTo? })` | Center on specified axes. |
| `centerX()` / `centerY()` / `centerZ()` | Center on single axis. |
| `align({ modes?, relativeTo?, grouped? })` | Align using min/max/center/none modes. |
| `transform(matrix)` | Apply raw 4×4 matrix. |
| `colorize(color)` | Apply RGBA color. |

---

### Booleans

All boolean operations are **curried** (except `scission`).

| Function | Description |
|---|---|
| `union(...others)` | Merge objects. Bounds expand to cover all inputs. |
| `subtract(...cutouts)` | Cut objects out. Bounds remain those of the base. |
| `intersect(...others)` | Keep shared volume. Bounds shrink to intersection. |
| `scission(obj)` | Split multi-body geometry → `JscadObject[]`. |

---

### Extrusions

All curried: `(opts) => (obj) => obj`.

| Function | Description |
|---|---|
| `extrudeLinear({ height?, twistAngle?, twistSteps? })` | Extrude 2D along Z. |
| `extrudeRotate({ angle?, startAngle?, segments? })` | Revolve 2D around Z. |
| `extrudeRectangular(opts)` | Extrude with rectangular cross-section. |
| `extrudeHelical(opts)` | Extrude along helical path. |
| `extrudeFromSlices(opts)` | Extrude between arbitrary slices. |
| `project(opts?)` | Project 3D solid onto XY plane. |

---

### Expansions

| Function | Description |
|---|---|
| `expand({ delta?, corners?, segments? })` | Inflate / deflate geometry. |
| `offset({ delta?, corners?, segments? })` | Offset 2D path or geometry. |

---

### Hulls

| Function | Description |
|---|---|
| `hull(...others)` | Convex hull of base and others. |
| `hullChain(...others)` | Pairwise convex hull chain. |

---

### Modifiers

| Function | Description |
|---|---|
| `generalize({ snap?, simplify?, triangulate? })` | Snap/simplify/triangulate geometry. |
| `snap()` | Snap vertices to epsilon grid. |
| `retessellate()` | Merge coplanar polygons. |

---

### `place(opts)`

Curried: `place(opts)(obj)`.

Position an object using absolute or relative placement options derived from its bounds. Avoids raw coordinate arithmetic.

```ts
const shelf = pipe(
  cuboid({ size: { x: 800, y: 300, z: 20 } }),
  place({ x: { align: 'center', relativeTo: wall } }),
)
```

---

### `pipe(...fns)`

Left-to-right function composition.

```ts
pipe(sphere({ radius: 20 }), translateX(50), colorize([1, 0, 0]))
```

---

### Unit value constructors (re-exported from `@fea-lib/values`)

`mm`, `cm`, `m`, `km`, `μm`, `inch`, `ft`, `yd`, `mile` — length constructors.  
`deg`, `rad` — angle constructors.

```ts
import { mm, cm, deg } from '@fea-lib/jscad'

cuboid({ size: { x: cm(50), y: mm(200), z: inch(3) } })
rotateZ(deg(45))
```

---

## Design notes

### Analytical bounds

Every `JscadObject` carries `bounds: { min: [x,y,z], max: [x,y,z] }` computed analytically at construction time. Transforms update bounds with arithmetic — never by traversing the geometry tree. This enables placement logic (`place()`) and spatial queries in O(1).

### Curried functions

Transforms and booleans are curried so they slot directly into `pipe()`:

```ts
pipe(base, translate({ x: 100 }), subtract(hole), colorize([0.8, 0.8, 0.8]))
```

### `Dim` and `Unit`

`Dim = number | Length`. When a `Dim` is a `number`, it is interpreted as `coordinateUnit`. When it is a `Length` value (e.g. `mm(50)`), it is converted to `coordinateUnit` precisely regardless of what `coordinateUnit` is.

### Coordinate unit vs explicit Length values

```ts
const { cuboid } = createBuilder({ coordinateUnit: 'cm' })

cuboid({ size: { x: 50, y: cm(50), z: mm(500) } })
// All three → 50 cm
```

Plain `50` is 50 cm because `coordinateUnit` is `'cm'`.  
`cm(50)` is explicitly 50 cm.  
`mm(500)` is 500 mm = 50 cm — converted automatically.
