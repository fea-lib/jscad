# Implementation Instructions: `@fea-lib/jscad-builder`

## Purpose

An ergonomic TypeScript wrapper around `@jscad/modeling` that adds:

- **Unit-aware dimensions** — raw numbers are interpreted as the configured
  coordinate unit; `Length` values (`mm()`, `cm()`, `inch()`, etc.) are always
  converted precisely.
- **Analytical bounds** — a cached `Bounds` object is maintained through every
  transform so `measureBoundingBox()` is called at most once (at construction
  time).
- **Analytical placement** — `place()` resolves relative positioning (before,
  after, above, below, beside, leftOf) into a single `translate()` call, with
  optional gap and per-axis alignment.
- **Curried transforms** — all transform, boolean, and operation functions return
  an overloaded function: `((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[])`,
  expressed via the `Multi<JscadObject>` helper type in `factory.ts`. Passing a
  single `JscadObject` returns a `JscadObject`; passing a `JscadObject[]` maps
  independently over each element and returns `JscadObject[]`. Both forms work
  seamlessly inside `pipe()`. `scission` is special: single input returns
  `JscadObject[]`, array input returns `JscadObject[][]`.
- **Named vectors** — `Vec3` / `Vec2` / `AngleVec3` use object keys (`x`, `y`,
  `z`) rather than positional arrays. Omitted axes default to 0.

This library is a **copy-paste library**. Users own the code. No npm publish,
no build step.

---

## Repository layout

```
/
├── src/
│   ├── index.ts        ← public barrel: re-exports everything
│   ├── types.ts        ← Dim, Vec3, Vec2, Bounds, Origin, JscadObject, AnyGeom
│   ├── factory.ts      ← createBuilder(), BuilderConfig, Builder
│   ├── primitives.ts   ← DimResolver, all primitive make* functions, fromGeom, bounds helpers
│   ├── transform.ts    ← all transform make* functions
│   ├── boolean.ts      ← makeUnion, makeSubtract, makeIntersect
│   ├── operations.ts   ← extrusions, expansions, hulls, modifiers, scission, text
│   ├── place.ts        ← PlaceOptions, makePlace()
│   └── pipe.ts         ← pipe()
├── __tests__/
│   ├── primitives.test.ts
│   ├── transform.test.ts
│   ├── boolean.test.ts (new — not yet in the source)
│   ├── operations.test.ts
│   ├── place.test.ts
│   └── pipe.test.ts
├── package.json
├── dependencies.json
├── install.sh
├── tsconfig.json
└── README.md
```

---

## `package.json`

```json
{
  "name": "@fea-lib/jscad-builder",
  "version": "1.0.0",
  "description": "Ergonomic JSCAD wrapper with unit-aware dimensions, analytical bounds, and analytical placement.",
  "type": "module",
  "main": "src/index.ts",
  "peerDependencies": {
    "@jscad/modeling": "^2.12.6"
  }
}
```

> `@jscad/modeling` is a peer dependency — it stays in the user's project.
> It is **not** vendored into the library.

---

## `dependencies.json`

```json
{
  "peerLibraries": [
    {
      "repo": "https://github.com/fea-lib/values",
      "installPath": "@fea-lib/values"
    }
  ]
}
```

---

## `install.sh`

Same mechanism as `@fea-lib/values`. Clones this repo, then recursively
fetches peer libraries declared in `dependencies.json` (which triggers
`@fea-lib/values`'s own `install.sh`).

```bash
#!/usr/bin/env bash
# Usage: ./install.sh <target-dir>
#
# Installs @fea-lib/jscad-builder into <target-dir>/@fea-lib/jscad-builder/
# and recursively installs declared peer libraries (@fea-lib/values).
#
# Example:
#   ./install.sh ./src/libs
#
# After running, add to your tsconfig.json compilerOptions.paths:
#   "@fea-lib/jscad-builder": ["<target-dir>/@fea-lib/jscad-builder/src/index.ts"]
#   "@fea-lib/values":        ["<target-dir>/@fea-lib/values/src/index.ts"]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:?Usage: ./install.sh <target-dir>}"

# Read library name from package.json
NAME=$(node -e "process.stdout.write(require('$SCRIPT_DIR/package.json').name)")
INSTALL_PATH="$TARGET_DIR/$NAME"

echo "Installing $NAME into $INSTALL_PATH ..."

# Clone repo into target (shallow, no history)
REPO_URL="https://github.com/fea-lib/jscad-builder"
TMP=$(mktemp -d)
git clone --depth=1 "$REPO_URL" "$TMP/repo" --quiet
mkdir -p "$INSTALL_PATH"
rsync -a --exclude="install.sh" --exclude=".git" "$TMP/repo/" "$INSTALL_PATH/"
rm -rf "$TMP"

# Recursively install peer libraries
DEPS_FILE="$INSTALL_PATH/dependencies.json"
if [ -f "$DEPS_FILE" ]; then
  PEER_COUNT=$(node -e "
    const d = require('$DEPS_FILE');
    process.stdout.write(String((d.peerLibraries || []).length));
  ")
  for i in $(seq 0 $((PEER_COUNT - 1))); do
    PEER_INSTALL_SH=$(node -e "
      const d = require('$DEPS_FILE');
      const p = d.peerLibraries[$i];
      process.stdout.write(p.repo + '/raw/main/install.sh');
    ")
    PEER_TMP=$(mktemp)
    curl -fsSL "$PEER_INSTALL_SH" -o "$PEER_TMP"
    bash "$PEER_TMP" "$TARGET_DIR"
    rm "$PEER_TMP"
  done
fi

echo ""
echo "Done. Add the following to your tsconfig.json compilerOptions.paths:"
echo "  \"$NAME\": [\"$INSTALL_PATH/src/index.ts\"]"
echo "  (peer libs will have printed their own paths above)"
```

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@fea-lib/values": ["../values/src/index.ts"]
    }
  },
  "include": ["src", "__tests__"]
}
```

The `paths` entry assumes both libraries are installed side-by-side inside the
same parent directory (the copy-paste convention). If the user installs into
`src/libs/`, the layout would be:

```
src/libs/
  @fea-lib/
    values/         ← @fea-lib/values
    jscad-builder/  ← @fea-lib/jscad-builder (this repo)
```

Their root `tsconfig.json` must add matching paths for both:

```json
"paths": {
  "@fea-lib/values":        ["src/libs/@fea-lib/values/src/index.ts"],
  "@fea-lib/jscad-builder": ["src/libs/@fea-lib/jscad-builder/src/index.ts"]
}
```

---

## Source file instructions

Each source file is a **direct copy** of the corresponding file in
`apps/docs/src/@jscad/builder/` with one change applied throughout:

**All imports of `./measure` are replaced with `@fea-lib/values`.**

That is the only structural change. All logic, types, and exports remain
identical to the source.

The subsections below spell out the exact import lines to change in each file.

### `src/types.ts`

**Change:**
```ts
// Before
import type { Length } from "./measure";

// After
import type { Length } from "@fea-lib/values";
```

Everything else is unchanged.

---

### `src/primitives.ts`

**Change:**
```ts
// Before
import {
  isLength,
  toCm, toMm, toM, toKm, toμm, toInch, toFt, toYd, toMile,
  type Unit,
} from "./measure";

// After
import {
  isLength,
  toCm, toMm, toM, toKm, toμm, toInch, toFt, toYd, toMile,
  type Unit,
} from "@fea-lib/values";
```

Everything else is unchanged.

**Note on `Unit` type:** The `Unit` type used by `createDimResolver` and
`toBaseValue` now comes from `@fea-lib/values`. The values it contains
(`"μm"`, `"mm"`, `"cm"`, `"m"`, `"km"`, `"inch"`, `"ft"`, `"yd"`, `"mile"`)
are the **clean unit keys** introduced in `@fea-lib/values`. The `switch`
statement in `toBaseValue` already uses these keys — no further changes needed.

---

### `src/transform.ts`

**Change:**
```ts
// Before
import type { Angle } from "./measure";
import { isAngle, toRad } from "./measure";

// After
import type { Angle } from "@fea-lib/values";
import { isAngle, toRad } from "@fea-lib/values";
```

Everything else is unchanged.

---

### `src/factory.ts`

**Change:**
```ts
// Before
import type { Unit, Angle } from "./measure";

// After
import type { Unit, Angle } from "@fea-lib/values";
```

**Additional change — `Multi<T>` helper and `Builder` type:**

Add a `Multi<T>` helper above the `Builder` type:

```ts
type Multi<T> = ((obj: JscadObject) => T) & ((objs: JscadObject[]) => T[]);
```

All 37 entries in the `Builder` type that previously used
`(obj: JscadObject) => JscadObject` as a pipe-slot return type now use
`Multi<JscadObject>` instead. For example:

```ts
// Before
translate: (v: Vec3) => (obj: JscadObject) => JscadObject;
subtract: (...cutouts: JscadObject[]) => (obj: JscadObject) => JscadObject;

// After
translate: (v: Vec3) => Multi<JscadObject>;
subtract: (...cutouts: JscadObject[]) => Multi<JscadObject>;
```

`scission` is typed separately (not with `Multi`) because its array case
returns `JscadObject[][]`, not `JscadObject[]`:

```ts
scission: {
  (obj: JscadObject): JscadObject[];
  (objs: JscadObject[]): JscadObject[][];
};
```

---

### `src/boolean.ts`

No import changes needed. `boolean.ts` imports only from `./primitives` and
`./types`. Unchanged.

---

### `src/operations.ts`

No import changes needed. `operations.ts` imports only from `./primitives` and
`./types`. Unchanged.

---

### `src/place.ts`

No import changes needed. `place.ts` imports only from `./types` and
`./primitives`. Unchanged.

---

### `src/pipe.ts`

No import changes needed. `pipe.ts` has no external imports. Unchanged.

---

### `src/index.ts`

Replace all `"./measure"` references with `"@fea-lib/values"`:

```ts
// Before
export {
  μm, mm, cm, m, km, inch, ft, yd, mile, deg, rad,
} from "./measure";

export {
  isLength, isAngle, isMeasure,
  toμm, toMm, toCm, toM, toKm, toInch, toFt, toYd, toMile,
  toRad, toDeg, formatMeasure,
  isNumberWithUnit, formatValueWithUnit,
} from "./measure";

export type {
  Micrometers, Millimeters, Centimeters, Meters, Kilometers,
  Inches, Feet, Yards, Miles,
} from "./measure";

export type { Degrees, Radians } from "./measure";
export type { Length, Angle, Measure, Unit } from "./measure";
export type { NumberWithUnit, Inch } from "./measure";

// After
export {
  μm, mm, cm, m, km, inch, ft, yd, mile, deg, rad,
} from "@fea-lib/values";

export {
  isLength, isAngle, isMeasure,
  toμm, toMm, toCm, toM, toKm, toInch, toFt, toYd, toMile,
  toRad, toDeg, formatMeasure,
  isNumberWithUnit, formatValueWithUnit,
} from "@fea-lib/values";

export type {
  Micrometers, Millimeters, Centimeters, Meters, Kilometers,
  Inches, Feet, Yards, Miles,
} from "@fea-lib/values";

export type { Degrees, Radians } from "@fea-lib/values";
export type { Length, Angle, Measure, Unit } from "@fea-lib/values";
export type { NumberWithUnit, Inch } from "@fea-lib/values";
```

All other exports (`createBuilder`, `Builder`, `BuilderConfig`, `Dim`, `Bounds`,
`JscadObject`, `AnyGeom`, `Origin`, `PlaceOptions`, `DimResolver`, `fromGeom`,
`pipe`) remain exactly as in the original `index.ts`.

---

## Key design notes

### `Unit` type after migration

The `Unit` type (used by `BuilderConfig.coordinateUnit`) is now imported from
`@fea-lib/values`. Its values are clean identifiers:

```ts
type Unit = "μm" | "mm" | "cm" | "m" | "km" | "inch" | "ft" | "yd" | "mile";
```

Previously `"inch"` was already the public-facing value but the internal unit
string stored inside `Inches` objects was `'"'`. After the migration to
`@fea-lib/values`, the internal unit key is also `"inch"`, so everything is
consistent.

### `isMeasure` scope change

In the original `measure.ts`, `isMeasure` returns `true` for `Length | Degrees | Radians`.
In `@fea-lib/values`, `isMeasure` returns `true` for **all** measure categories
(including `Area`, `Volume`, `Money`). This is a superset — it is still safe
to use anywhere the original was used.

### No changes to logic

The only change in this library compared to the monorepo source is the import
paths. All algorithms, bounds computations, analytical placement logic, and
curried function patterns are copied verbatim.

---

## Tests

Copy the existing test files from
`apps/docs/src/@jscad/builder/__tests__/` into `__tests__/`:

- `measure.test.ts` → **not included** (measure is now `@fea-lib/values`; its
  tests live in the values repo)
- `primitives.test.ts` → copy as-is
- `transform.test.ts` → copy as-is
- `operations.test.ts` → copy as-is
- `place.test.ts` → copy as-is
- `pipe.test.ts` → copy as-is
- `type-safety.test.ts` → copy as-is

**Update imports in all copied test files:**
- `from "../measure"` → `from "@fea-lib/values"`
- `from "../../measure"` → `from "@fea-lib/values"` (if any)

Add one new test file:

**`__tests__/boolean.test.ts`** — cover `union`, `subtract`, `intersect`, and
`scission`. A minimal test suite:

```
1. union: result bounds encompass both inputs
2. union: geometry merges (jscad union called)
3. subtract: result bounds equal base bounds
4. intersect: result bounds are intersection of inputs
5. scission: returns array with one object per body
```

Use `vitest`. Test using actual JSCAD geometry (call `createBuilder`, make
real primitives) — do not mock JSCAD.

---

## Implementation order

1. `src/types.ts`
2. `src/pipe.ts`
3. `src/primitives.ts`
4. `src/transform.ts`
5. `src/boolean.ts`
6. `src/operations.ts`
7. `src/place.ts`
8. `src/factory.ts`
9. `src/index.ts`
10. Copy and update test files
11. `__tests__/boolean.test.ts` (new)
12. Run `vitest run` — all tests must pass
13. `install.sh`
14. `README.md`

---

## README structure

```
# @fea-lib/jscad-builder

Ergonomic JSCAD wrapper. Unit-aware dimensions, analytical bounds, analytical placement.

## What's included
## Dependencies
## Install
## Add to tsconfig.json
## Quick start
## API reference
  ### createBuilder(config)
  ### Primitives (3D)
  ### Primitives (2D)
  ### Path primitives
  ### fromGeom
  ### Transforms
  ### Booleans
  ### Extrusions
  ### Expansions
  ### Hulls
  ### Modifiers
  ### place()
  ### pipe()
  ### Unit value constructors (re-exported from @fea-lib/values)
## Design notes
  ### Analytical bounds
  ### Curried functions
  ### Dim and Unit
  ### Coordinate unit vs explicit Length values
```
