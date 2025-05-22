import { I as IterableContainer } from './IterableContainer-CtfinwiH.d.ts';
import { T as TuplePrefix, a as TupleParts } from './TupleParts-Dxfru0nv.d.ts';
import { C as CoercedArray } from './CoercedArray-DRz3tqda.d.ts';

/**
 * The union of all possible ways to write a tuple as [...left, ...right].
 */
type TupleSplits<T extends IterableContainer> = T extends unknown ? FixedTupleSplits<TuplePrefix<T>, [
    ...CoercedArray<TupleParts<T>["item"]>,
    ...TupleParts<T>["suffix"]
]> | {
    left: [
        ...TuplePrefix<T>,
        ...CoercedArray<TupleParts<T>["item"]>
    ];
    right: [
        ...CoercedArray<TupleParts<T>["item"]>,
        ...TupleParts<T>["suffix"]
    ];
} | (FixedTupleSplits<TupleParts<T>["suffix"]> extends infer U ? U extends {
    left: infer L extends ReadonlyArray<unknown>;
    right: infer R;
} ? {
    left: [
        ...TuplePrefix<T>,
        ...CoercedArray<TupleParts<T>["item"]>,
        ...L
    ];
    right: R;
} : never : never) : never;
/**
 * Helper type for `TupleSplits`, for tuples without rest params.
 */
type FixedTupleSplits<L extends IterableContainer, R extends IterableContainer = []> = {
    left: L;
    right: R;
} | (L extends readonly [] ? never : L extends readonly [...infer LHead, infer LTail] ? FixedTupleSplits<LHead, [LTail, ...R]> : L extends readonly [...infer LHead, (infer LTail)?] ? FixedTupleSplits<LHead, [LTail?, ...R]> : never);

export type { TupleSplits as T };
