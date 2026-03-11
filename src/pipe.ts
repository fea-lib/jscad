/**
 * Threads output types left-to-right through a tuple of functions, resolving
 * to the return type of the last function (or T if the tuple is empty).
 */
type PipeReturn<T, Fns extends readonly unknown[]> = Fns extends readonly []
  ? T
  : Fns extends readonly [(arg: infer _) => infer R, ...infer Rest]
    ? PipeReturn<R, Rest>
    : never;

/**
 * For each function at index N in the tuple, constrains its argument to be the
 * return type of the function at index N-1 (or T for the first function).
 *
 * This is the key: Fns is inferred freely from the call site, then checked
 * against this mapped constraint. TypeScript surfaces a mismatch as an error
 * on the offending element rather than resolving everything to never.
 */
type PipeConstraint<T, Fns extends readonly unknown[]> = {
  readonly [K in keyof Fns]: K extends "0"
    ? (arg: T) => unknown
    : (
        arg: Fns[Exclude<K, "0">] extends (arg: infer _) => infer R ? R : never,
      ) => unknown;
};

/**
 * Left-to-right function composition.
 *
 * pipe(value, f, g, h) === h(g(f(value)))
 *
 * Fully generic — no fixed-arity overloads. TypeScript infers the chain type
 * from the rest args, then validates each step via PipeConstraint. You get a
 * type error on the exact mismatched step, not a collapse to never.
 *
 * @example
 *   const result = pipe(
 *     box(cm(50), cm(200), cm(30)),
 *     rotate([0, Math.PI / 2, 0]),
 *     translate([cm(10), cm(0), cm(50)]),
 *     colorize([1, 1, 1]),
 *   )
 */
export function pipe<T, Fns extends readonly ((arg: never) => unknown)[]>(
  value: T,
  ...fns: Fns & PipeConstraint<T, Fns>
): PipeReturn<T, Fns> {
  return (fns as unknown as Array<(x: unknown) => unknown>).reduce(
    (acc, fn) => fn(acc),
    value as unknown,
  ) as PipeReturn<T, Fns>;
}
