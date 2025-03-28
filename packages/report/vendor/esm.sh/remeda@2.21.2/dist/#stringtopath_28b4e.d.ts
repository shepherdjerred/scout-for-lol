type StringToPath<T extends string> = string extends T ? never
  : T extends "" ? []
  : T extends `${infer Head}[${infer Nest}].${infer Tail}`
    ? [...StringToPath<Head>, Nest, ...StringToPath<Tail>]
  : T extends `${infer Head}[${infer Nest}]` ? [...StringToPath<Head>, Nest]
  : T extends `${infer Head}.${infer Tail}`
    ? [...StringToPath<Head>, ...StringToPath<Tail>]
  : [T];
/**
 * Converts a path string to an array of string keys (including array index
 * access keys).
 *
 * ! IMPORTANT: Attempting to pass a simple `string` type will result in the
 * result being inferred as `never`. This is intentional to help with type-
 * safety as this function is primarily intended to help with other "object path
 * access" functions like `pathOr` or `setPath`.
 *
 * @param path - A string path.
 * @signature R.stringToPath(path)
 * @example
 *   R.stringToPath('a.b[0].c') // => ['a', 'b', '0', 'c']
 * @dataFirst
 * @category Utility
 */
declare function stringToPath<Path extends string>(
  path: Path,
): StringToPath<Path>;

export { stringToPath };
