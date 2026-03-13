# Multi-Object Support: Design Summary

## Problem

Every wrapper function currently accepts exactly one `JscadObject` in its pipe
slot. In the original `@jscad/modeling`, all transform functions accept either a
single geometry or an array of geometries. This capability is missing from the
wrapper.

---

## JSCAD's behaviour (ground truth)

Two distinct behaviours exist at the raw JSCAD level:

| Operation category | Input | Output | Semantics |
|---|---|---|---|
| Transforms (`translate`, `rotate`, `scale`, `mirror`, `center`, `colorize`, `extrudeLinear`, …) | `Geom3` or `Geom3[]` | Same type and count as input | Each geometry transformed **independently** — no merging |
| Booleans & hulls (`union`, `subtract`, `intersect`, `hull`, `hullChain`) | `Geom3[]` | One `Geom3` | All geometries **merged** into a single solid (CSG) |

The array handling in transforms is implemented via `flatten(objects)` followed
by `.map()` — the array length is always preserved. This is unambiguously
**Option C** (map semantics) for transforms, and **Option B** (merge semantics)
for booleans.

---

## Considered alternatives

### Option A — `group()` function with flat `geom[]` merge

A `group(...objs): JscadObject` convenience that merges the `AnyGeom[]` arrays
of multiple `JscadObject`s into one. Additive, no type changes needed.

**Rejected because:** `JscadObject.geom` is already `AnyGeom[]`, so `group()`
would conflate two distinct concepts under one type:
1. A multi-body boolean result (e.g. after `scission`)
2. A grouped collection for transform convenience

These are semantically different but indistinguishable in the type system.

### Option B — `JscadGroup` as a distinct type

A `JscadGroup { children: JscadObject[] }` type, separate from `JscadObject`,
representing a collection of independent geometries (the wrapper-level
equivalent of JSCAD's `Geom3[]`).

**Partially accepted, then simplified:** A `JscadGroup` without additional
metadata (no `bounds`, no `origin`) is structurally identical to `JscadObject[]`
— it provides no additional information that a plain TypeScript array does not
already carry. Therefore `JscadGroup` is unnecessary as a named type.

### Option C — `JscadObject[]` overloads

All array-capable functions accept `JscadObject | JscadObject[]` in their pipe
slot and return the same type. Maps independently — same length in, same length
out. No merging.

**Selected.**

### Rejected: virtual/lazy `JscadGroup`

A `JscadGroup` that defers CSG merge until needed (lazy union). Rejected because
the added complexity (third type in `JscadNode = JscadObject | JscadGroup`)
outweighs the benefit. The caller can always call `union()` explicitly at the
moment it is needed.

---

## Final design

### Core principle

> Any function that accepts `JscadObject` in its pipe slot also accepts
> `JscadObject[]` and maps **independently** over each element.

One rule, no exceptions, no per-function special cases.

### Type model

No new types. `JscadObject` is unchanged. `JscadObject[]` is the native
TypeScript array — no wrapper type needed.

```
JSCAD raw          →  Wrapper
────────────────────────────────────────
Geom3              →  JscadObject
Geom3[]            →  JscadObject[]
union(g1,g2,...)   →  union(o1, o2, ...) → JscadObject
```

### Overload shape

Every affected function gains a second overload on its inner (curried) function:

```ts
// Before
translate(v: Vec3): (obj: JscadObject) => JscadObject

// After
translate(v: Vec3): ((obj: JscadObject) => JscadObject)
                  & ((objs: JscadObject[]) => JscadObject[])
```

Implementation dispatches on `Array.isArray`:

```ts
return (objOrObjs) => {
  if (Array.isArray(objOrObjs)) return objOrObjs.map(singleFn);
  return singleFn(objOrObjs);
}
```

### Behaviour per category

| Category | "others" / config slot | Pipe slot |
|---|---|---|
| Transforms | single config (`Vec3`, angle, …) | `JscadObject` or `JscadObject[]` |
| Booleans (`union`, `subtract`, `intersect`) | `...JscadObject[]` (unchanged) | `JscadObject` or `JscadObject[]` |
| Hulls (`hull`, `hullChain`) | `...JscadObject[]` (unchanged) | `JscadObject` or `JscadObject[]` |
| Extrusions / expansions / modifiers (incl. `extrudeRotate`) | single config opts | `JscadObject` or `JscadObject[]` |
| `scission` | — | `JscadObject` → `JscadObject[]` or `JscadObject[]` → `JscadObject[][]` |
| `place` | `PlaceOptions` | `JscadObject` or `JscadObject[]` — each placed **independently** using its own `bounds` |

### `place()` and positional functions with arrays

When `place()`, `center()`, or `align()` receive `JscadObject[]`, each object is
positioned independently using its **own** `bounds`. The group-level AABB is
never used. If the caller wants to treat the collection as a single unit for
positioning, they call `union()` first to collapse it into one `JscadObject`.

### `union` / `subtract` / `intersect` with array base

When a boolean receives `JscadObject[]` as its base, it maps independently —
consistent with every other function:

```ts
subtract(cutout)([a, b, c])
// → [subtract(cutout)(a), subtract(cutout)(b), subtract(cutout)(c)]
```

This is not ambiguous: the universal rule is "array in → map independently →
array out". The caller uses `union()` explicitly if they want to subtract from a
merged base.

---

## What is not changing

- `JscadObject` type — unchanged (`geom: AnyGeom[]`, `bounds`, `origin`)
- `pipe()` — unchanged; TypeScript inference handles `JscadObject[]` naturally
  once inner function types are updated
- `scission` input — stays single `JscadObject`
- `fromGeom` — stays single geometry in, single `JscadObject` out
- All primitive constructors — unchanged, always return `JscadObject`
