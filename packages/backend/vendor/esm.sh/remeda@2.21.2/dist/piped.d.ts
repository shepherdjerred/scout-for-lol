/**
 * A dataLast version of `pipe` that could be used to provide more complex
 * computations to functions that accept a function as a param (like `map`,
 * `filter`, `groupBy`, etc.).
 *
 * The first function must be always annotated. Other functions are
 * automatically inferred.
 *
 * @signature
 *    R.piped(...ops)(data);
 * @example
 *    R.filter(
 *      [{ a: 1 }, { a: 2 }, { a: 3 }],
 *      R.piped(
 *        R.prop('a'),
 *        (x) => x % 2 === 0,
 *      ),
 *    ); // => [{ a: 2 }]
 * @category Function
 */
declare function piped<A, B>(op1: (input: A) => B): (value: A) => B;
declare function piped<A, B, C>(op1: (input: A) => B, op2: (input: B) => C): (value: A) => C;
declare function piped<A, B, C, D>(op1: (input: A) => B, op2: (input: B) => C, op3: (input: C) => D): (value: A) => D;
declare function piped<A, B, C, D, E>(op1: (input: A) => B, op2: (input: B) => C, op3: (input: C) => D, op4: (input: D) => E): (value: A) => E;
declare function piped<A, B, C, D, E, F>(op1: (input: A) => B, op2: (input: B) => C, op3: (input: C) => D, op4: (input: D) => E, op5: (input: E) => F): (value: A) => F;
declare function piped<A, B, C, D, E, F, G>(op1: (input: A) => B, op2: (input: B) => C, op3: (input: C) => D, op4: (input: D) => E, op5: (input: E) => F, op6: (input: F) => G): (value: A) => G;
declare function piped<A, B, C, D, E, F, G, H>(op1: (input: A) => B, op2: (input: B) => C, op3: (input: C) => D, op4: (input: D) => E, op5: (input: E) => F, op6: (input: F) => G, op7: (input: G) => H): (value: A) => H;

export { piped };
