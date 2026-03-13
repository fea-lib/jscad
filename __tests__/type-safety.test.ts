/**
 * Compile-time type-safety assertions.
 *
 * These tests contain no runtime assertions — they exist solely to verify that
 * the TypeScript compiler rejects invalid argument combinations at compile time.
 *
 * Each `@ts-expect-error` comment asserts that the following line IS a type
 * error. If the error disappears (i.e. the type system becomes too permissive),
 * TypeScript will flag the `@ts-expect-error` itself, causing the build to fail.
 *
 * The `noop` helper prevents the expressions from being DCE'd while ensuring
 * nothing is actually executed (the functions are never called at runtime).
 */
import { describe, it } from "vitest";
import { createBuilder } from "../src/factory";
import { cm, deg, mm } from "@fea-lib/values";
import type { JscadObject } from "../src/types";

const { cuboid, rotate, translate, subtract, scission, extrudeLinear, circle } =
  createBuilder({ coordinateUnit: "mm" });

/** Captures the type of a function for compile-time checking without calling it. */
const check = <T>(_fn: () => T) => {};

describe("type safety — Length vs Angle discrimination", () => {
  it("rotate() rejects Length values at compile time", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });

    // A length value must not be accepted where an Angle is expected.
    // @ts-expect-error — mm() is a Length, not an Angle
    check(() => rotate({ x: mm(90) })(b));

    // @ts-expect-error — cm() is a Length, not an Angle
    check(() => rotate({ y: cm(45) })(b));
  });

  it("cuboid() rejects Angle values at compile time", () => {
    // An angle value must not be accepted where a Dim (number | Length) is expected.
    // @ts-expect-error — deg() is an Angle, not a Dim
    check(() => cuboid({ size: { x: deg(10) } }));

    // @ts-expect-error — deg() is an Angle, not a Dim
    check(() => cuboid({ size: { y: deg(20) } }));
  });
});

// ---------------------------------------------------------------------------
// Array-overload narrowing
// ---------------------------------------------------------------------------

describe("type safety — array overload narrowing", () => {
  it("single-object overload returns JscadObject (not array)", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    // TypeScript should narrow the return type to JscadObject
    const result: JscadObject = translate({ x: 5 })(b);
    check(() => result);
  });

  it("array overload returns JscadObject[]", () => {
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 20, y: 20, z: 20 } });
    // TypeScript should narrow the return type to JscadObject[]
    const result: JscadObject[] = translate({ x: 5 })([a, b]);
    check(() => result);
  });

  it("subtract() single overload returns JscadObject", () => {
    const base = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const hole = cuboid({ size: { x: 5, y: 5, z: 5 } });
    const result: JscadObject = subtract(hole)(base);
    check(() => result);
  });

  it("subtract() array overload returns JscadObject[]", () => {
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 20, y: 20, z: 20 } });
    const hole = cuboid({ size: { x: 5, y: 5, z: 5 } });
    const result: JscadObject[] = subtract(hole)([a, b]);
    check(() => result);
  });

  it("extrudeLinear() array overload returns JscadObject[]", () => {
    const a = circle({ radius: 5 });
    const b = circle({ radius: 10 });
    const result: JscadObject[] = extrudeLinear({ height: 20 })([a, b]);
    check(() => result);
  });

  it("scission() single overload returns JscadObject[]", () => {
    const b = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const result: JscadObject[] = scission(b);
    check(() => result);
  });

  it("scission() array overload returns JscadObject[][]", () => {
    const a = cuboid({ size: { x: 10, y: 10, z: 10 } });
    const b = cuboid({ size: { x: 20, y: 20, z: 20 } });
    const result: JscadObject[][] = scission([a, b]);
    check(() => result);
  });
});
