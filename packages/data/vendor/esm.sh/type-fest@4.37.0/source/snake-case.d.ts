import type {DelimiterCase} from './delimiter-case.d.ts';
import type {WordsOptions} from './words.d.ts';

/**
Convert a string literal to snake-case.

This can be useful when, for example, converting a camel-cased object property to a snake-cased SQL column name.

@example
```
import type {SnakeCase} from 'type-fest';

// Simple

const someVariable: SnakeCase<'fooBar'> = 'foo_bar';
const someVariableNoSplitOnNumbers: SnakeCase<'p2pNetwork', {splitOnNumbers: false}> = 'p2p_network';

// Advanced

type SnakeCasedProperties<T> = {
	[K in keyof T as SnakeCase<K>]: T[K]
};

interface ModelProps {
	isHappy: boolean;
	fullFamilyName: string;
	foo: number;
}

const dbResult: SnakeCasedProperties<ModelProps> = {
	'is_happy': true,
	'full_family_name': 'Carla Smith',
	foo: 123
};
```

@category Change case
@category Template literal
*/
export type SnakeCase<
	Value,
	Options extends WordsOptions = {splitOnNumbers: false},
> = DelimiterCase<Value, '_', Options>;
