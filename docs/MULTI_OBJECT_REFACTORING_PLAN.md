# Refactoring Plan: Multi-Object Support

Reference design document: `MULTI_OBJECT_DESIGN.md`

---

## Scope

Add `JscadObject[]` overloads to all array-capable functions so that every
function accepting `JscadObject` in its pipe slot also accepts `JscadObject[]`
and maps independently over each element.

No new types. No changes to `JscadObject`. No changes to primitives or `pipe`.

---

## Tickets

### T-01 — `src/transform.ts`: overload all transform functions

**Files:** `src/transform.ts`

For each of the 23 transform functions, add a second overload on the inner
(curried) function so that `(obj: JscadObject) => JscadObject` becomes
`((obj: JscadObject) => JscadObject) & ((objs: JscadObject[]) => JscadObject[])`.

The implementation pattern is identical for all:

```ts
// extract the single-object logic into an inner function
const single = (obj: JscadObject): JscadObject => { /* existing body */ };
// return a dispatching wrapper
return (objOrObjs: JscadObject | JscadObject[]) =>
  Array.isArray(objOrObjs) ? objOrObjs.map(single) : single(objOrObjs);
```

**Functions to update** (all in `src/transform.ts`):

- `makeTranslate` → `translate`
- `makeTranslateX` → `translateX`
- `makeTranslateY` → `translateY`
- `makeTranslateZ` → `translateZ`
- `makeRotate` → `rotate`
- `makeRotateX` → `rotateX`
- `makeRotateY` → `rotateY`
- `makeRotateZ` → `rotateZ`
- `makeScale` → `scale`
- `makeScaleX` → `scaleX`
- `makeScaleY` → `scaleY`
- `makeScaleZ` → `scaleZ`
- `makeMirror` → `mirror`
- `makeMirrorX` → `mirrorX`
- `makeMirrorY` → `mirrorY`
- `makeMirrorZ` → `mirrorZ`
- `makeCenter` → `center`
- `makeCenterX` → `centerX`
- `makeCenterY` → `centerY`
- `makeCenterZ` → `centerZ`
- `makeAlign` → `align`
- `makeTransform` → `transform`
- `makeColorize` → `colorize`

**Acceptance criteria:**
- `translate(v)(obj)` returns `JscadObject` (TypeScript infers scalar)
- `translate(v)([a, b])` returns `JscadObject[]` (TypeScript infers array)
- Array output has the same length as array input
- Each element is transformed independently (no shared state)
- Existing single-object tests continue to pass

---

### T-02 — `src/boolean.ts`: overload pipe slot of union / subtract / intersect / scission

**Files:** `src/boolean.ts`

Same overload pattern as T-01 applied to the inner (base-accepting) function of
`makeUnion`, `makeSubtract`, and `makeIntersect`.

```ts
// union(...others)(base) stays unchanged for JscadObject
// union(...others)([a, b, c]) maps independently → JscadObject[]
```

Note: the "others" spread (`...others: JscadObject[]`) is unchanged — it already
accepts multiple objects. Only the downstream pipe slot gains the array overload.

`scission` is a special case: since it already returns `JscadObject[]` for a
single input, the array overload returns `JscadObject[][]` (one `JscadObject[]`
per input object).

**Functions to update:**

- `makeUnion` → `union`
- `makeSubtract` → `subtract`
- `makeIntersect` → `intersect`
- `makeScission` → `scission`

**Acceptance criteria:**
- `subtract(cutout)(base)` → `JscadObject` (unchanged)
- `subtract(cutout)([a, b, c])` → `[subtract(cutout)(a), subtract(cutout)(b), subtract(cutout)(c)]`
- `scission(obj)` → `JscadObject[]` (unchanged)
- `scission([a, b])` → `[scission(a), scission(b)]` i.e. `JscadObject[][]`

---

### T-03 — `src/operations.ts`: overload all array-capable operation functions

**Files:** `src/operations.ts`

Same overload pattern applied to all curried operation functions. Note:
`extrudeRotate` is excluded — the raw JSCAD function does not accept arrays and
operates on a single `Geom2` only.

**Functions to update:**

- `makeExtrudeLinear` → `extrudeLinear`
- `makeExtrudeRotate` → `extrudeRotate`
- `makeExtrudeRectangular` → `extrudeRectangular`
- `makeExtrudeHelical` → `extrudeHelical`
- `makeExtrudeFromSlices` → `extrudeFromSlices`
- `makeProject` → `project`
- `makeExpand` → `expand`
- `makeOffset` → `offset`
- `makeGeneralize` → `generalize`
- `makeSnap` → `snap`
- `makeRetessellate` → `retessellate`

**Not updated:**
- `makeScission` — single geometry in, `JscadObject[]` out (semantically
  meaningless on a collection input)
- `makeHull` / `makeHullChain` — covered by T-04

**Acceptance criteria:**
- `extrudeLinear(opts)([circle1, circle2])` → `[Geom3, Geom3]` (two independent extrusions)
- `extrudeRotate(opts)` still only accepts `JscadObject` (no array overload)
- Existing operation tests continue to pass

---

### T-04 — `src/operations.ts`: overload pipe slot of hull / hullChain

**Files:** `src/operations.ts`

Same overload pattern as T-02, applied to `makeHull` and `makeHullChain`.

```ts
// hull(...others)(base)      → JscadObject   (unchanged)
// hull(...others)([a, b, c]) → JscadObject[] (maps independently)
```

**Functions to update:**

- `makeHull` → `hull`
- `makeHullChain` → `hullChain`

**Acceptance criteria:**
- `hull(extra)([a, b])` → `[hull(extra)(a), hull(extra)(b)]`

---

### T-05 — `src/place.ts`: overload pipe slot of place

**Files:** `src/place.ts`

Each object in the array is placed **independently** using its own `bounds` and
`origin`. The group-level AABB is not used.

**Functions to update:**

- `makePlace` → `place`

**Acceptance criteria:**
- `place(opts)([a, b])` → `[place(opts)(a), place(opts)(b)]`
- Each placed object uses its own `bounds.min`, not a merged AABB

---

### T-06 — `src/factory.ts`: update `Builder` type

**Files:** `src/factory.ts`

Update every entry in the `Builder` type that corresponds to a function updated
in T-01 through T-05.

Pattern:

```ts
// Before
translate: (v: Vec3) => (obj: JscadObject) => JscadObject;

// After
translate: (v: Vec3) => ((obj: JscadObject) => JscadObject)
                      & ((objs: JscadObject[]) => JscadObject[]);
```

All 37 affected entries must be updated. Entries that are not updated:
- `scission` — returns `JscadObject[]`, input stays `JscadObject`
- `extrudeRotate` — single object only
- All primitives — return `JscadObject`, no pipe slot
- `fromGeom` — unchanged
- `pipe` — unchanged
- `vectorChar` / `vectorText` — unchanged

**Acceptance criteria:**
- `Builder` type compiles without errors
- TypeScript correctly narrows return type based on argument type at call sites

---

### T-07 — `__tests__/transform.test.ts`: add array-input tests

**Files:** `__tests__/transform.test.ts`

Add a test block covering `JscadObject[]` input for a representative subset of
transforms. Full coverage of all 23 functions is not required — cover the
dispatch mechanism thoroughly with a few, then spot-check the rest.

**Required test cases:**

```
translate — array input returns array of same length
translate — each element independently translated (positions differ)
rotate    — array input returns array of same length
scale     — array input returns array of same length
colorize  — array input returns array of same length
mirrorX   — array input (no config args) returns array of same length
```

**Acceptance criteria:**
- All new tests pass
- Existing single-object tests unchanged and passing

---

### T-08 — `__tests__/boolean.test.ts`: add array-input tests

**Files:** `__tests__/boolean.test.ts`

Extend the existing boolean test file with array-input cases.

**Required test cases:**

```
subtract  — array base: returns array of same length
subtract  — each element subtracted independently
union     — array base: returns array of same length
intersect — array base: returns array of same length
scission  — array input: returns JscadObject[][] of same length
scission  — each element split independently
```

---

### T-09 — `__tests__/operations.test.ts`: add array-input tests

**Files:** `__tests__/operations.test.ts`

Spot-check array dispatch for operations.

**Required test cases:**

```
extrudeLinear  — array input returns array of same length
extrudeRotate  — array input returns array of same length
expand         — array input returns array of same length
hull           — array base: returns array of same length
```

---

### T-10 — `__tests__/place.test.ts`: add array-input tests

**Files:** `__tests__/place.test.ts`

**Required test cases:**

```
place — array input returns array of same length
place — each element placed using its own bounds (not merged AABB)
```

---

### T-11 — `__tests__/type-safety.test.ts`: add array overload type tests

**Files:** `__tests__/type-safety.test.ts`

Add `@ts-expect-error` and positive type assertions to confirm:

```
translate(v)(obj)        infers JscadObject      (not JscadObject[])
translate(v)([a, b])     infers JscadObject[]     (not JscadObject)
subtract(c)(obj)         infers JscadObject
subtract(c)([a, b])      infers JscadObject[]
extrudeRotate(opts)(obj)    infers JscadObject
extrudeRotate(opts)([a, b]) infers JscadObject[]
scission(obj)               infers JscadObject[]
scission([a, b])            infers JscadObject[][]
```

---

### T-12 — `docs/IMPLEMENTATION_PROMPT.md`: update to reflect new API

**Files:** `docs/IMPLEMENTATION_PROMPT.md`

Update the "Curried transforms" bullet in the Purpose section and the
`Builder` type entries in the Source file instructions section to reflect
the array overloads. No structural changes to the document.

---

## Implementation order

```
T-01  src/transform.ts        — transforms array overloads
T-02  src/boolean.ts          — boolean pipe-slot array overloads
T-03  src/operations.ts       — operation array overloads
T-04  src/operations.ts       — hull/hullChain pipe-slot array overloads
T-05  src/place.ts            — place array overload
T-06  src/factory.ts          — Builder type updates
T-07  __tests__/transform.test.ts
T-08  __tests__/boolean.test.ts
T-09  __tests__/operations.test.ts
T-10  __tests__/place.test.ts
T-11  __tests__/type-safety.test.ts
T-12  docs/IMPLEMENTATION_PROMPT.md
```

T-01 through T-05 are independent of each other and can be done in parallel.
T-06 depends on T-01 through T-05 (needs the final function signatures).
T-07 through T-11 depend on T-06.
T-12 can be done last.

---

## Definition of done

- `vitest run` passes with zero failures
- TypeScript compiles with zero errors (`tsc --noEmit`)
- `translate(v)(obj)` narrows to `JscadObject` at the call site
- `translate(v)([a, b])` narrows to `JscadObject[]` at the call site
- `extrudeRotate(opts)([a, b])` narrows to `JscadObject[]` at the call site
- `scission(obj)` narrows to `JscadObject[]` at the call site
- `scission([a, b])` narrows to `JscadObject[][]` at the call site
- `IMPLEMENTATION_PROMPT.md` reflects the updated API surface
