import { IsLiteral, And, GreaterThan, IsNever, IsEqual, ReadonlyTuple, IsNumericLiteral } from 'https://esm.sh/type-fest@4.41.0/index.d.ts';
import { I as IterableContainer } from './IterableContainer-CtfinwiH.d.ts';
import { C as CoercedArray } from './CoercedArray-DRz3tqda.d.ts';
import { R as RemedaTypeError } from './RemedaTypeError-BIoNlKC-.d.ts';
import { a as TupleParts } from './TupleParts-Dxfru0nv.d.ts';

/**
 * We built our own version of Subtract instead of using type-fest's one
 * because we needed a simpler implementation that isn't as prone to excessive
 * recursion issues and that is clamped at 0 so that we don't need to handle
 * negative values using even more utilities.
 */
type ClampedIntegerSubtract<Minuend, Subtrahend, SubtrahendBag extends Array<unknown> = [], ResultBag extends Array<unknown> = []> = [...SubtrahendBag, ...ResultBag]["length"] extends Minuend ? ResultBag["length"] : SubtrahendBag["length"] extends Subtrahend ? ClampedIntegerSubtract<Minuend, Subtrahend, SubtrahendBag, [
    ...ResultBag,
    unknown
]> : ClampedIntegerSubtract<Minuend, Subtrahend, [
    ...SubtrahendBag,
    unknown
], ResultBag>;

type ArrayRequiredPrefix<T extends IterableContainer, N extends number> = IsLiteral<N> extends true ? T extends unknown ? ClampedIntegerSubtract<N, [
    ...TupleParts<T>["required"],
    ...TupleParts<T>["suffix"]
]["length"]> extends infer Remainder extends number ? Remainder extends 0 ? T : And<GreaterThan<Remainder, TupleParts<T>["optional"]["length"]>, IsNever<TupleParts<T>["item"]>> extends true ? RemedaTypeError<"ArrayRequiredPrefix", "The input tuple cannot satisfy the minimum", {
    type: never;
    metadata: [T, N];
}> : WithSameReadonly<T, [
    ...TupleParts<T>["required"],
    ...OptionalTupleRequiredPrefix<TupleParts<T>["optional"], Remainder>,
    ...ReadonlyTuple<TupleParts<T>["item"], ClampedIntegerSubtract<Remainder, TupleParts<T>["optional"]["length"]>>,
    ...CoercedArray<TupleParts<T>["item"]>,
    ...TupleParts<T>["suffix"]
]> : RemedaTypeError<"ArrayRequiredPrefix", "Remainder didn't compute to a number?!", {
    type: never;
    metadata: [T, N];
}> : RemedaTypeError<"ArrayRequiredPrefix", "Failed to distribute union?!", {
    type: never;
    metadata: T;
}> : RemedaTypeError<"ArrayRequiredPrefix", "Only literal minimums are supported!", {
    type: never;
    metadata: N;
}>;
type WithSameReadonly<Source, Destination> = IsEqual<Source, Readonly<Source>> extends true ? Readonly<Destination> : Destination;
type OptionalTupleRequiredPrefix<T extends Array<unknown>, N, Prefix extends Array<unknown> = []> = Prefix["length"] extends N ? [
    ...Prefix,
    ...Partial<T>
] : T extends readonly [infer Head, ...infer Rest] ? OptionalTupleRequiredPrefix<Rest, N, [...Prefix, Head]> : Prefix;

/**
 * Checks if the given array has at least the defined number of elements. When
 * the minimum used is a literal (e.g. `3`) the output is refined accordingly so
 * that those indices are defined when accessing the array even when using
 * typescript's 'noUncheckedIndexAccess'.
 *
 * @param data - The input array.
 * @param minimum - The minimum number of elements the array must have.
 * @returns True if the array's length is *at least* `minimum`. When `minimum`
 * is a literal value, the output is narrowed to ensure the first items are
 * guaranteed.
 * @signature
 *   R.hasAtLeast(data, minimum)
 * @example
 *   R.hasAtLeast([], 4); // => false
 *
 *   const data: number[] = [1,2,3,4];
 *   R.hasAtLeast(data, 1); // => true
 *   data[0]; // 1, with type `number`
 * @dataFirst
 * @category Array
 */
declare function hasAtLeast<T extends IterableContainer, N extends number>(data: IterableContainer | T, minimum: IsNumericLiteral<N> extends true ? N : never): data is ArrayRequiredPrefix<T, N>;
declare function hasAtLeast(data: IterableContainer, minimum: number): boolean;
/**
 * Checks if the given array has at least the defined number of elements. When
 * the minimum used is a literal (e.g. `3`) the output is refined accordingly so
 * that those indices are defined when accessing the array even when using
 * typescript's 'noUncheckedIndexAccess'.
 *
 * @param minimum - The minimum number of elements the array must have.
 * @returns True if the array's length is *at least* `minimum`. When `minimum`
 * is a literal value, the output is narrowed to ensure the first items are
 * guaranteed.
 * @signature
 *   R.hasAtLeast(minimum)(data)
 * @example
 *   R.pipe([], R.hasAtLeast(4)); // => false
 *
 *   const data = [[1,2], [3], [4,5]];
 *   R.pipe(
 *     data,
 *     R.filter(R.hasAtLeast(2)),
 *     R.map(([, second]) => second),
 *   ); // => [2,5], with type `number[]`
 * @dataLast
 * @category Array
 */
declare function hasAtLeast<N extends number>(minimum: IsNumericLiteral<N> extends true ? N : never): <T extends IterableContainer>(data: IterableContainer | T) => data is ArrayRequiredPrefix<T, N>;
declare function hasAtLeast(minimum: number): (data: IterableContainer) => boolean;

export { hasAtLeast };
