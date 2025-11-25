/**
 * Client
 **/

import * as runtime from "./runtime/library.js";
import $Types = runtime.Types; // general types
import $Public = runtime.Types.Public;
import $Utils = runtime.Types.Utils;
import $Extensions = runtime.Types.Extensions;
import $Result = runtime.Types.Result;

export type PrismaPromise<T> = $Public.PrismaPromise<T>;

/**
 * Model Subscription
 *
 */
export type Subscription = $Result.DefaultSelection<Prisma.$SubscriptionPayload>;
/**
 * Model Player
 *
 */
export type Player = $Result.DefaultSelection<Prisma.$PlayerPayload>;
/**
 * Model Account
 *
 */
export type Account = $Result.DefaultSelection<Prisma.$AccountPayload>;
/**
 * Model Competition
 *
 */
export type Competition = $Result.DefaultSelection<Prisma.$CompetitionPayload>;
/**
 * Model CompetitionParticipant
 *
 */
export type CompetitionParticipant = $Result.DefaultSelection<Prisma.$CompetitionParticipantPayload>;
/**
 * Model CompetitionSnapshot
 *
 */
export type CompetitionSnapshot = $Result.DefaultSelection<Prisma.$CompetitionSnapshotPayload>;
/**
 * Model ServerPermission
 *
 */
export type ServerPermission = $Result.DefaultSelection<Prisma.$ServerPermissionPayload>;
/**
 * Model GuildPermissionError
 *
 */
export type GuildPermissionError = $Result.DefaultSelection<Prisma.$GuildPermissionErrorPayload>;

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Subscriptions
 * const subscriptions = await prisma.subscription.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = "log" extends keyof ClientOptions
    ? ClientOptions["log"] extends Array<Prisma.LogLevel | Prisma.LogDefinition>
      ? Prisma.GetEvents<ClientOptions["log"]>
      : never
    : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["other"] };

  /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Subscriptions
   * const subscriptions = await prisma.subscription.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(
    eventType: V,
    callback: (event: V extends "query" ? Prisma.QueryEvent : Prisma.LogEvent) => void,
  ): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(
    arg: [...P],
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;

  $transaction<R>(
    fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel },
  ): $Utils.JsPromise<R>;

  $extends: $Extensions.ExtendsHook<
    "extends",
    Prisma.TypeMapCb<ClientOptions>,
    ExtArgs,
    $Utils.Call<
      Prisma.TypeMapCb<ClientOptions>,
      {
        extArgs: ExtArgs;
      }
    >
  >;

  /**
   * `prisma.subscription`: Exposes CRUD operations for the **Subscription** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Subscriptions
   * const subscriptions = await prisma.subscription.findMany()
   * ```
   */
  get subscription(): Prisma.SubscriptionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.player`: Exposes CRUD operations for the **Player** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Players
   * const players = await prisma.player.findMany()
   * ```
   */
  get player(): Prisma.PlayerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.account`: Exposes CRUD operations for the **Account** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Accounts
   * const accounts = await prisma.account.findMany()
   * ```
   */
  get account(): Prisma.AccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.competition`: Exposes CRUD operations for the **Competition** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Competitions
   * const competitions = await prisma.competition.findMany()
   * ```
   */
  get competition(): Prisma.CompetitionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.competitionParticipant`: Exposes CRUD operations for the **CompetitionParticipant** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more CompetitionParticipants
   * const competitionParticipants = await prisma.competitionParticipant.findMany()
   * ```
   */
  get competitionParticipant(): Prisma.CompetitionParticipantDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.competitionSnapshot`: Exposes CRUD operations for the **CompetitionSnapshot** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more CompetitionSnapshots
   * const competitionSnapshots = await prisma.competitionSnapshot.findMany()
   * ```
   */
  get competitionSnapshot(): Prisma.CompetitionSnapshotDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.serverPermission`: Exposes CRUD operations for the **ServerPermission** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more ServerPermissions
   * const serverPermissions = await prisma.serverPermission.findMany()
   * ```
   */
  get serverPermission(): Prisma.ServerPermissionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.guildPermissionError`: Exposes CRUD operations for the **GuildPermissionError** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more GuildPermissionErrors
   * const guildPermissionErrors = await prisma.guildPermissionError.findMany()
   * ```
   */
  get guildPermissionError(): Prisma.GuildPermissionErrorDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF;

  export type PrismaPromise<T> = $Public.PrismaPromise<T>;

  /**
   * Validator
   */
  export import validator = runtime.Public.validator;

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError;
  export import PrismaClientValidationError = runtime.PrismaClientValidationError;

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag;
  export import empty = runtime.empty;
  export import join = runtime.join;
  export import raw = runtime.raw;
  export import Sql = runtime.Sql;

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal;

  export type DecimalJsLike = runtime.DecimalJsLike;

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics;
  export type Metric<T> = runtime.Metric<T>;
  export type MetricHistogram = runtime.MetricHistogram;
  export type MetricHistogramBucket = runtime.MetricHistogramBucket;

  /**
   * Extensions
   */
  export import Extension = $Extensions.UserArgs;
  export import getExtensionContext = runtime.Extensions.getExtensionContext;
  export import Args = $Public.Args;
  export import Payload = $Public.Payload;
  export import Result = $Public.Result;
  export import Exact = $Public.Exact;

  /**
   * Prisma Client JS version: 6.19.0
   * Query Engine version: 2ba551f319ab1df4bc874a89965d8b3641056773
   */
  export type PrismaVersion = {
    client: string;
  };

  export const prismaVersion: PrismaVersion;

  /**
   * Utility Types
   */

  export import Bytes = runtime.Bytes;
  export import JsonObject = runtime.JsonObject;
  export import JsonArray = runtime.JsonArray;
  export import JsonValue = runtime.JsonValue;
  export import InputJsonObject = runtime.InputJsonObject;
  export import InputJsonArray = runtime.InputJsonArray;
  export import InputJsonValue = runtime.InputJsonValue;

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
     * Type of `Prisma.DbNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class DbNull {
      private DbNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.JsonNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class JsonNull {
      private JsonNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.AnyNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class AnyNull {
      private AnyNull: never;
      private constructor();
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull;

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull;

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull;

  type SelectAndInclude = {
    select: any;
    include: any;
  };

  type SelectAndOmit = {
    select: any;
    omit: any;
  };

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>;

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K;
  }[keyof T];

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K;
  };

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>;

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & (T extends SelectAndInclude
    ? "Please either choose `select` or `include`."
    : T extends SelectAndOmit
      ? "Please either choose `select` or `omit`."
      : {});

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & K;

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> = T extends object ? (U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U) : T;

  /**
   * Is T a Record?
   */
  type IsObject<T extends any> =
    T extends Array<any>
      ? False
      : T extends Date
        ? False
        : T extends Uint8Array
          ? False
          : T extends BigInt
            ? False
            : T extends object
              ? True
              : False;

  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O>; // With K possibilities
    }[K];

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;

  type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
  }[strict];

  type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown
    ? _Either<O, K, strict>
    : never;

  export type Union = any;

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
  } & {};

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

  export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<
    Overwrite<
      U,
      {
        [K in keyof U]-?: At<U, K>;
      }
    >
  >;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function
    ? A
    : {
        [K in keyof A]: A[K];
      } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
      ? (K extends keyof O ? { [P in K]: O[P] } & O : O) | ({ [P in keyof O as P extends K ? P : never]-?: O[P] } & O)
      : never
  >;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False;

  // /**
  // 1
  // */
  export type True = 1;

  /**
  0
  */
  export type False = 0;

  export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
  }[B];

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
      ? 1
      : 0;

  export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0;
      1: 1;
    };
    1: {
      0: 1;
      1: 1;
    };
  }[B1][B2];

  export type Keys<U extends Union> = U extends unknown ? keyof U : never;

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object
    ? {
        [P in keyof T]: P extends keyof O ? O[P] : never;
      }
    : never;

  type FieldPaths<T, U = Omit<T, "_avg" | "_sum" | "_count" | "_min" | "_max">> = IsObject<T> extends True ? U : T;

  type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<"OR", K>, Extends<"AND", K>>, Extends<"NOT", K>> extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
        ? never
        : K;
  }[keyof T];

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;

  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;

  export const ModelName: {
    Subscription: "Subscription";
    Player: "Player";
    Account: "Account";
    Competition: "Competition";
    CompetitionParticipant: "CompetitionParticipant";
    CompetitionSnapshot: "CompetitionSnapshot";
    ServerPermission: "ServerPermission";
    GuildPermissionError: "GuildPermissionError";
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName];

  export type Datasources = {
    db?: Datasource;
  };

  interface TypeMapCb<ClientOptions = {}>
    extends $Utils.Fn<{ extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<
      this["params"]["extArgs"],
      ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}
    >;
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions;
    };
    meta: {
      modelProps:
        | "subscription"
        | "player"
        | "account"
        | "competition"
        | "competitionParticipant"
        | "competitionSnapshot"
        | "serverPermission"
        | "guildPermissionError";
      txIsolationLevel: Prisma.TransactionIsolationLevel;
    };
    model: {
      Subscription: {
        payload: Prisma.$SubscriptionPayload<ExtArgs>;
        fields: Prisma.SubscriptionFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.SubscriptionFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.SubscriptionFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
          };
          findFirst: {
            args: Prisma.SubscriptionFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.SubscriptionFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
          };
          findMany: {
            args: Prisma.SubscriptionFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
          };
          create: {
            args: Prisma.SubscriptionCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
          };
          createMany: {
            args: Prisma.SubscriptionCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.SubscriptionCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
          };
          delete: {
            args: Prisma.SubscriptionDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
          };
          update: {
            args: Prisma.SubscriptionUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
          };
          deleteMany: {
            args: Prisma.SubscriptionDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.SubscriptionUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.SubscriptionUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
          };
          upsert: {
            args: Prisma.SubscriptionUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
          };
          aggregate: {
            args: Prisma.SubscriptionAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateSubscription>;
          };
          groupBy: {
            args: Prisma.SubscriptionGroupByArgs<ExtArgs>;
            result: $Utils.Optional<SubscriptionGroupByOutputType>[];
          };
          count: {
            args: Prisma.SubscriptionCountArgs<ExtArgs>;
            result: $Utils.Optional<SubscriptionCountAggregateOutputType> | number;
          };
        };
      };
      Player: {
        payload: Prisma.$PlayerPayload<ExtArgs>;
        fields: Prisma.PlayerFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.PlayerFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.PlayerFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>;
          };
          findFirst: {
            args: Prisma.PlayerFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.PlayerFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>;
          };
          findMany: {
            args: Prisma.PlayerFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[];
          };
          create: {
            args: Prisma.PlayerCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>;
          };
          createMany: {
            args: Prisma.PlayerCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.PlayerCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[];
          };
          delete: {
            args: Prisma.PlayerDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>;
          };
          update: {
            args: Prisma.PlayerUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>;
          };
          deleteMany: {
            args: Prisma.PlayerDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.PlayerUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.PlayerUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>[];
          };
          upsert: {
            args: Prisma.PlayerUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayerPayload>;
          };
          aggregate: {
            args: Prisma.PlayerAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregatePlayer>;
          };
          groupBy: {
            args: Prisma.PlayerGroupByArgs<ExtArgs>;
            result: $Utils.Optional<PlayerGroupByOutputType>[];
          };
          count: {
            args: Prisma.PlayerCountArgs<ExtArgs>;
            result: $Utils.Optional<PlayerCountAggregateOutputType> | number;
          };
        };
      };
      Account: {
        payload: Prisma.$AccountPayload<ExtArgs>;
        fields: Prisma.AccountFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.AccountFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.AccountFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>;
          };
          findFirst: {
            args: Prisma.AccountFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.AccountFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>;
          };
          findMany: {
            args: Prisma.AccountFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[];
          };
          create: {
            args: Prisma.AccountCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>;
          };
          createMany: {
            args: Prisma.AccountCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.AccountCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[];
          };
          delete: {
            args: Prisma.AccountDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>;
          };
          update: {
            args: Prisma.AccountUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>;
          };
          deleteMany: {
            args: Prisma.AccountDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.AccountUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.AccountUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[];
          };
          upsert: {
            args: Prisma.AccountUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>;
          };
          aggregate: {
            args: Prisma.AccountAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateAccount>;
          };
          groupBy: {
            args: Prisma.AccountGroupByArgs<ExtArgs>;
            result: $Utils.Optional<AccountGroupByOutputType>[];
          };
          count: {
            args: Prisma.AccountCountArgs<ExtArgs>;
            result: $Utils.Optional<AccountCountAggregateOutputType> | number;
          };
        };
      };
      Competition: {
        payload: Prisma.$CompetitionPayload<ExtArgs>;
        fields: Prisma.CompetitionFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.CompetitionFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.CompetitionFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>;
          };
          findFirst: {
            args: Prisma.CompetitionFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.CompetitionFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>;
          };
          findMany: {
            args: Prisma.CompetitionFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>[];
          };
          create: {
            args: Prisma.CompetitionCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>;
          };
          createMany: {
            args: Prisma.CompetitionCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.CompetitionCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>[];
          };
          delete: {
            args: Prisma.CompetitionDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>;
          };
          update: {
            args: Prisma.CompetitionUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>;
          };
          deleteMany: {
            args: Prisma.CompetitionDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.CompetitionUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.CompetitionUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>[];
          };
          upsert: {
            args: Prisma.CompetitionUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionPayload>;
          };
          aggregate: {
            args: Prisma.CompetitionAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateCompetition>;
          };
          groupBy: {
            args: Prisma.CompetitionGroupByArgs<ExtArgs>;
            result: $Utils.Optional<CompetitionGroupByOutputType>[];
          };
          count: {
            args: Prisma.CompetitionCountArgs<ExtArgs>;
            result: $Utils.Optional<CompetitionCountAggregateOutputType> | number;
          };
        };
      };
      CompetitionParticipant: {
        payload: Prisma.$CompetitionParticipantPayload<ExtArgs>;
        fields: Prisma.CompetitionParticipantFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.CompetitionParticipantFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.CompetitionParticipantFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>;
          };
          findFirst: {
            args: Prisma.CompetitionParticipantFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.CompetitionParticipantFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>;
          };
          findMany: {
            args: Prisma.CompetitionParticipantFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>[];
          };
          create: {
            args: Prisma.CompetitionParticipantCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>;
          };
          createMany: {
            args: Prisma.CompetitionParticipantCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.CompetitionParticipantCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>[];
          };
          delete: {
            args: Prisma.CompetitionParticipantDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>;
          };
          update: {
            args: Prisma.CompetitionParticipantUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>;
          };
          deleteMany: {
            args: Prisma.CompetitionParticipantDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.CompetitionParticipantUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.CompetitionParticipantUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>[];
          };
          upsert: {
            args: Prisma.CompetitionParticipantUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionParticipantPayload>;
          };
          aggregate: {
            args: Prisma.CompetitionParticipantAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateCompetitionParticipant>;
          };
          groupBy: {
            args: Prisma.CompetitionParticipantGroupByArgs<ExtArgs>;
            result: $Utils.Optional<CompetitionParticipantGroupByOutputType>[];
          };
          count: {
            args: Prisma.CompetitionParticipantCountArgs<ExtArgs>;
            result: $Utils.Optional<CompetitionParticipantCountAggregateOutputType> | number;
          };
        };
      };
      CompetitionSnapshot: {
        payload: Prisma.$CompetitionSnapshotPayload<ExtArgs>;
        fields: Prisma.CompetitionSnapshotFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.CompetitionSnapshotFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.CompetitionSnapshotFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>;
          };
          findFirst: {
            args: Prisma.CompetitionSnapshotFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.CompetitionSnapshotFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>;
          };
          findMany: {
            args: Prisma.CompetitionSnapshotFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>[];
          };
          create: {
            args: Prisma.CompetitionSnapshotCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>;
          };
          createMany: {
            args: Prisma.CompetitionSnapshotCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.CompetitionSnapshotCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>[];
          };
          delete: {
            args: Prisma.CompetitionSnapshotDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>;
          };
          update: {
            args: Prisma.CompetitionSnapshotUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>;
          };
          deleteMany: {
            args: Prisma.CompetitionSnapshotDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.CompetitionSnapshotUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.CompetitionSnapshotUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>[];
          };
          upsert: {
            args: Prisma.CompetitionSnapshotUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CompetitionSnapshotPayload>;
          };
          aggregate: {
            args: Prisma.CompetitionSnapshotAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateCompetitionSnapshot>;
          };
          groupBy: {
            args: Prisma.CompetitionSnapshotGroupByArgs<ExtArgs>;
            result: $Utils.Optional<CompetitionSnapshotGroupByOutputType>[];
          };
          count: {
            args: Prisma.CompetitionSnapshotCountArgs<ExtArgs>;
            result: $Utils.Optional<CompetitionSnapshotCountAggregateOutputType> | number;
          };
        };
      };
      ServerPermission: {
        payload: Prisma.$ServerPermissionPayload<ExtArgs>;
        fields: Prisma.ServerPermissionFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.ServerPermissionFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.ServerPermissionFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>;
          };
          findFirst: {
            args: Prisma.ServerPermissionFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.ServerPermissionFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>;
          };
          findMany: {
            args: Prisma.ServerPermissionFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>[];
          };
          create: {
            args: Prisma.ServerPermissionCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>;
          };
          createMany: {
            args: Prisma.ServerPermissionCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.ServerPermissionCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>[];
          };
          delete: {
            args: Prisma.ServerPermissionDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>;
          };
          update: {
            args: Prisma.ServerPermissionUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>;
          };
          deleteMany: {
            args: Prisma.ServerPermissionDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.ServerPermissionUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.ServerPermissionUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>[];
          };
          upsert: {
            args: Prisma.ServerPermissionUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ServerPermissionPayload>;
          };
          aggregate: {
            args: Prisma.ServerPermissionAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateServerPermission>;
          };
          groupBy: {
            args: Prisma.ServerPermissionGroupByArgs<ExtArgs>;
            result: $Utils.Optional<ServerPermissionGroupByOutputType>[];
          };
          count: {
            args: Prisma.ServerPermissionCountArgs<ExtArgs>;
            result: $Utils.Optional<ServerPermissionCountAggregateOutputType> | number;
          };
        };
      };
      GuildPermissionError: {
        payload: Prisma.$GuildPermissionErrorPayload<ExtArgs>;
        fields: Prisma.GuildPermissionErrorFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.GuildPermissionErrorFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.GuildPermissionErrorFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>;
          };
          findFirst: {
            args: Prisma.GuildPermissionErrorFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.GuildPermissionErrorFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>;
          };
          findMany: {
            args: Prisma.GuildPermissionErrorFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>[];
          };
          create: {
            args: Prisma.GuildPermissionErrorCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>;
          };
          createMany: {
            args: Prisma.GuildPermissionErrorCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.GuildPermissionErrorCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>[];
          };
          delete: {
            args: Prisma.GuildPermissionErrorDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>;
          };
          update: {
            args: Prisma.GuildPermissionErrorUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>;
          };
          deleteMany: {
            args: Prisma.GuildPermissionErrorDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.GuildPermissionErrorUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.GuildPermissionErrorUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>[];
          };
          upsert: {
            args: Prisma.GuildPermissionErrorUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPermissionErrorPayload>;
          };
          aggregate: {
            args: Prisma.GuildPermissionErrorAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateGuildPermissionError>;
          };
          groupBy: {
            args: Prisma.GuildPermissionErrorGroupByArgs<ExtArgs>;
            result: $Utils.Optional<GuildPermissionErrorGroupByOutputType>[];
          };
          count: {
            args: Prisma.GuildPermissionErrorCountArgs<ExtArgs>;
            result: $Utils.Optional<GuildPermissionErrorCountAggregateOutputType> | number;
          };
        };
      };
    };
  } & {
    other: {
      payload: any;
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
      };
    };
  };
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>;
  export type DefaultPrismaClient = PrismaClient;
  export type ErrorFormat = "pretty" | "colorless" | "minimal";
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources;
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string;
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    };
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null;
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig;
  }
  export type GlobalOmitConfig = {
    subscription?: SubscriptionOmit;
    player?: PlayerOmit;
    account?: AccountOmit;
    competition?: CompetitionOmit;
    competitionParticipant?: CompetitionParticipantOmit;
    competitionSnapshot?: CompetitionSnapshotOmit;
    serverPermission?: ServerPermissionOmit;
    guildPermissionError?: GuildPermissionErrorOmit;
  };

  /* Types for Logging */
  export type LogLevel = "info" | "query" | "warn" | "error";
  export type LogDefinition = {
    level: LogLevel;
    emit: "stdout" | "event";
  };

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T["level"] : T>;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;

  export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
  };

  export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
  };
  /* End Types for Logging */

  export type PrismaAction =
    | "findUnique"
    | "findUniqueOrThrow"
    | "findMany"
    | "findFirst"
    | "findFirstOrThrow"
    | "create"
    | "createMany"
    | "createManyAndReturn"
    | "update"
    | "updateMany"
    | "updateManyAndReturn"
    | "upsert"
    | "delete"
    | "deleteMany"
    | "executeRaw"
    | "queryRaw"
    | "aggregate"
    | "count"
    | "runCommandRaw"
    | "findRaw"
    | "groupBy";

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>;

  export type Datasource = {
    url?: string;
  };

  /**
   * Count Types
   */

  /**
   * Count Type PlayerCountOutputType
   */

  export type PlayerCountOutputType = {
    accounts: number;
    subscriptions: number;
    competitionParticipants: number;
    competitionSnapshots: number;
  };

  export type PlayerCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | PlayerCountOutputTypeCountAccountsArgs;
    subscriptions?: boolean | PlayerCountOutputTypeCountSubscriptionsArgs;
    competitionParticipants?: boolean | PlayerCountOutputTypeCountCompetitionParticipantsArgs;
    competitionSnapshots?: boolean | PlayerCountOutputTypeCountCompetitionSnapshotsArgs;
  };

  // Custom InputTypes
  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayerCountOutputType
     */
    select?: PlayerCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeCountAccountsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: AccountWhereInput;
  };

  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeCountSubscriptionsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: SubscriptionWhereInput;
  };

  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeCountCompetitionParticipantsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CompetitionParticipantWhereInput;
  };

  /**
   * PlayerCountOutputType without action
   */
  export type PlayerCountOutputTypeCountCompetitionSnapshotsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CompetitionSnapshotWhereInput;
  };

  /**
   * Count Type CompetitionCountOutputType
   */

  export type CompetitionCountOutputType = {
    participants: number;
    snapshots: number;
  };

  export type CompetitionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    participants?: boolean | CompetitionCountOutputTypeCountParticipantsArgs;
    snapshots?: boolean | CompetitionCountOutputTypeCountSnapshotsArgs;
  };

  // Custom InputTypes
  /**
   * CompetitionCountOutputType without action
   */
  export type CompetitionCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionCountOutputType
     */
    select?: CompetitionCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * CompetitionCountOutputType without action
   */
  export type CompetitionCountOutputTypeCountParticipantsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CompetitionParticipantWhereInput;
  };

  /**
   * CompetitionCountOutputType without action
   */
  export type CompetitionCountOutputTypeCountSnapshotsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CompetitionSnapshotWhereInput;
  };

  /**
   * Models
   */

  /**
   * Model Subscription
   */

  export type AggregateSubscription = {
    _count: SubscriptionCountAggregateOutputType | null;
    _avg: SubscriptionAvgAggregateOutputType | null;
    _sum: SubscriptionSumAggregateOutputType | null;
    _min: SubscriptionMinAggregateOutputType | null;
    _max: SubscriptionMaxAggregateOutputType | null;
  };

  export type SubscriptionAvgAggregateOutputType = {
    id: number | null;
    playerId: number | null;
  };

  export type SubscriptionSumAggregateOutputType = {
    id: number | null;
    playerId: number | null;
  };

  export type SubscriptionMinAggregateOutputType = {
    id: number | null;
    playerId: number | null;
    channelId: string | null;
    serverId: string | null;
    creatorDiscordId: string | null;
    createdTime: Date | null;
    updatedTime: Date | null;
  };

  export type SubscriptionMaxAggregateOutputType = {
    id: number | null;
    playerId: number | null;
    channelId: string | null;
    serverId: string | null;
    creatorDiscordId: string | null;
    createdTime: Date | null;
    updatedTime: Date | null;
  };

  export type SubscriptionCountAggregateOutputType = {
    id: number;
    playerId: number;
    channelId: number;
    serverId: number;
    creatorDiscordId: number;
    createdTime: number;
    updatedTime: number;
    _all: number;
  };

  export type SubscriptionAvgAggregateInputType = {
    id?: true;
    playerId?: true;
  };

  export type SubscriptionSumAggregateInputType = {
    id?: true;
    playerId?: true;
  };

  export type SubscriptionMinAggregateInputType = {
    id?: true;
    playerId?: true;
    channelId?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
  };

  export type SubscriptionMaxAggregateInputType = {
    id?: true;
    playerId?: true;
    channelId?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
  };

  export type SubscriptionCountAggregateInputType = {
    id?: true;
    playerId?: true;
    channelId?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
    _all?: true;
  };

  export type SubscriptionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscription to aggregate.
     */
    where?: SubscriptionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: SubscriptionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Subscriptions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Subscriptions
     **/
    _count?: true | SubscriptionCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: SubscriptionAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: SubscriptionSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: SubscriptionMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: SubscriptionMaxAggregateInputType;
  };

  export type GetSubscriptionAggregateType<T extends SubscriptionAggregateArgs> = {
    [P in keyof T & keyof AggregateSubscription]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubscription[P]>
      : GetScalarType<T[P], AggregateSubscription[P]>;
  };

  export type SubscriptionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubscriptionWhereInput;
    orderBy?: SubscriptionOrderByWithAggregationInput | SubscriptionOrderByWithAggregationInput[];
    by: SubscriptionScalarFieldEnum[] | SubscriptionScalarFieldEnum;
    having?: SubscriptionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: SubscriptionCountAggregateInputType | true;
    _avg?: SubscriptionAvgAggregateInputType;
    _sum?: SubscriptionSumAggregateInputType;
    _min?: SubscriptionMinAggregateInputType;
    _max?: SubscriptionMaxAggregateInputType;
  };

  export type SubscriptionGroupByOutputType = {
    id: number;
    playerId: number;
    channelId: string;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date;
    updatedTime: Date;
    _count: SubscriptionCountAggregateOutputType | null;
    _avg: SubscriptionAvgAggregateOutputType | null;
    _sum: SubscriptionSumAggregateOutputType | null;
    _min: SubscriptionMinAggregateOutputType | null;
    _max: SubscriptionMaxAggregateOutputType | null;
  };

  type GetSubscriptionGroupByPayload<T extends SubscriptionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubscriptionGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof SubscriptionGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], SubscriptionGroupByOutputType[P]>
          : GetScalarType<T[P], SubscriptionGroupByOutputType[P]>;
      }
    >
  >;

  export type SubscriptionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        playerId?: boolean;
        channelId?: boolean;
        serverId?: boolean;
        creatorDiscordId?: boolean;
        createdTime?: boolean;
        updatedTime?: boolean;
        player?: boolean | PlayerDefaultArgs<ExtArgs>;
      },
      ExtArgs["result"]["subscription"]
    >;

  export type SubscriptionSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      playerId?: boolean;
      channelId?: boolean;
      serverId?: boolean;
      creatorDiscordId?: boolean;
      createdTime?: boolean;
      updatedTime?: boolean;
      player?: boolean | PlayerDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["subscription"]
  >;

  export type SubscriptionSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      playerId?: boolean;
      channelId?: boolean;
      serverId?: boolean;
      creatorDiscordId?: boolean;
      createdTime?: boolean;
      updatedTime?: boolean;
      player?: boolean | PlayerDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["subscription"]
  >;

  export type SubscriptionSelectScalar = {
    id?: boolean;
    playerId?: boolean;
    channelId?: boolean;
    serverId?: boolean;
    creatorDiscordId?: boolean;
    createdTime?: boolean;
    updatedTime?: boolean;
  };

  export type SubscriptionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetOmit<
      "id" | "playerId" | "channelId" | "serverId" | "creatorDiscordId" | "createdTime" | "updatedTime",
      ExtArgs["result"]["subscription"]
    >;
  export type SubscriptionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };
  export type SubscriptionIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };
  export type SubscriptionIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };

  export type $SubscriptionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subscription";
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        playerId: number;
        channelId: string;
        serverId: string;
        creatorDiscordId: string;
        createdTime: Date;
        updatedTime: Date;
      },
      ExtArgs["result"]["subscription"]
    >;
    composites: {};
  };

  type SubscriptionGetPayload<S extends boolean | null | undefined | SubscriptionDefaultArgs> = $Result.GetResult<
    Prisma.$SubscriptionPayload,
    S
  >;

  type SubscriptionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    SubscriptionFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: SubscriptionCountAggregateInputType | true;
  };

  export interface SubscriptionDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["model"]["Subscription"]; meta: { name: "Subscription" } };
    /**
     * Find zero or one Subscription that matches the filter.
     * @param {SubscriptionFindUniqueArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubscriptionFindUniqueArgs>(
      args: SelectSubset<T, SubscriptionFindUniqueArgs<ExtArgs>>,
    ): Prisma__SubscriptionClient<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Subscription that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubscriptionFindUniqueOrThrowArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubscriptionFindUniqueOrThrowArgs>(
      args: SelectSubset<T, SubscriptionFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__SubscriptionClient<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Subscription that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindFirstArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubscriptionFindFirstArgs>(
      args?: SelectSubset<T, SubscriptionFindFirstArgs<ExtArgs>>,
    ): Prisma__SubscriptionClient<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Subscription that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindFirstOrThrowArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubscriptionFindFirstOrThrowArgs>(
      args?: SelectSubset<T, SubscriptionFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__SubscriptionClient<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Subscriptions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subscriptions
     * const subscriptions = await prisma.subscription.findMany()
     *
     * // Get first 10 Subscriptions
     * const subscriptions = await prisma.subscription.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.findMany({ select: { id: true } })
     *
     */
    findMany<T extends SubscriptionFindManyArgs>(
      args?: SelectSubset<T, SubscriptionFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;

    /**
     * Create a Subscription.
     * @param {SubscriptionCreateArgs} args - Arguments to create a Subscription.
     * @example
     * // Create one Subscription
     * const Subscription = await prisma.subscription.create({
     *   data: {
     *     // ... data to create a Subscription
     *   }
     * })
     *
     */
    create<T extends SubscriptionCreateArgs>(
      args: SelectSubset<T, SubscriptionCreateArgs<ExtArgs>>,
    ): Prisma__SubscriptionClient<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Subscriptions.
     * @param {SubscriptionCreateManyArgs} args - Arguments to create many Subscriptions.
     * @example
     * // Create many Subscriptions
     * const subscription = await prisma.subscription.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends SubscriptionCreateManyArgs>(
      args?: SelectSubset<T, SubscriptionCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Subscriptions and returns the data saved in the database.
     * @param {SubscriptionCreateManyAndReturnArgs} args - Arguments to create many Subscriptions.
     * @example
     * // Create many Subscriptions
     * const subscription = await prisma.subscription.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Subscriptions and only return the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends SubscriptionCreateManyAndReturnArgs>(
      args?: SelectSubset<T, SubscriptionCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Delete a Subscription.
     * @param {SubscriptionDeleteArgs} args - Arguments to delete one Subscription.
     * @example
     * // Delete one Subscription
     * const Subscription = await prisma.subscription.delete({
     *   where: {
     *     // ... filter to delete one Subscription
     *   }
     * })
     *
     */
    delete<T extends SubscriptionDeleteArgs>(
      args: SelectSubset<T, SubscriptionDeleteArgs<ExtArgs>>,
    ): Prisma__SubscriptionClient<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Subscription.
     * @param {SubscriptionUpdateArgs} args - Arguments to update one Subscription.
     * @example
     * // Update one Subscription
     * const subscription = await prisma.subscription.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends SubscriptionUpdateArgs>(
      args: SelectSubset<T, SubscriptionUpdateArgs<ExtArgs>>,
    ): Prisma__SubscriptionClient<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Subscriptions.
     * @param {SubscriptionDeleteManyArgs} args - Arguments to filter Subscriptions to delete.
     * @example
     * // Delete a few Subscriptions
     * const { count } = await prisma.subscription.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends SubscriptionDeleteManyArgs>(
      args?: SelectSubset<T, SubscriptionDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Subscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subscriptions
     * const subscription = await prisma.subscription.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends SubscriptionUpdateManyArgs>(
      args: SelectSubset<T, SubscriptionUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Subscriptions and returns the data updated in the database.
     * @param {SubscriptionUpdateManyAndReturnArgs} args - Arguments to update many Subscriptions.
     * @example
     * // Update many Subscriptions
     * const subscription = await prisma.subscription.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Subscriptions and only return the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends SubscriptionUpdateManyAndReturnArgs>(
      args: SelectSubset<T, SubscriptionUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Create or update one Subscription.
     * @param {SubscriptionUpsertArgs} args - Arguments to update or create a Subscription.
     * @example
     * // Update or create a Subscription
     * const subscription = await prisma.subscription.upsert({
     *   create: {
     *     // ... data to create a Subscription
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subscription we want to update
     *   }
     * })
     */
    upsert<T extends SubscriptionUpsertArgs>(
      args: SelectSubset<T, SubscriptionUpsertArgs<ExtArgs>>,
    ): Prisma__SubscriptionClient<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Subscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionCountArgs} args - Arguments to filter Subscriptions to count.
     * @example
     * // Count the number of Subscriptions
     * const count = await prisma.subscription.count({
     *   where: {
     *     // ... the filter for the Subscriptions we want to count
     *   }
     * })
     **/
    count<T extends SubscriptionCountArgs>(
      args?: Subset<T, SubscriptionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], SubscriptionCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Subscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends SubscriptionAggregateArgs>(
      args: Subset<T, SubscriptionAggregateArgs>,
    ): Prisma.PrismaPromise<GetSubscriptionAggregateType<T>>;

    /**
     * Group by Subscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends SubscriptionGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubscriptionGroupByArgs["orderBy"] }
        : { orderBy?: SubscriptionGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, SubscriptionGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetSubscriptionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Subscription model
     */
    readonly fields: SubscriptionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subscription.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubscriptionClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, PlayerDefaultArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Subscription model
   */
  interface SubscriptionFieldRefs {
    readonly id: FieldRef<"Subscription", "Int">;
    readonly playerId: FieldRef<"Subscription", "Int">;
    readonly channelId: FieldRef<"Subscription", "String">;
    readonly serverId: FieldRef<"Subscription", "String">;
    readonly creatorDiscordId: FieldRef<"Subscription", "String">;
    readonly createdTime: FieldRef<"Subscription", "DateTime">;
    readonly updatedTime: FieldRef<"Subscription", "DateTime">;
  }

  // Custom InputTypes
  /**
   * Subscription findUnique
   */
  export type SubscriptionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * Filter, which Subscription to fetch.
     */
    where: SubscriptionWhereUniqueInput;
  };

  /**
   * Subscription findUniqueOrThrow
   */
  export type SubscriptionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * Filter, which Subscription to fetch.
     */
    where: SubscriptionWhereUniqueInput;
  };

  /**
   * Subscription findFirst
   */
  export type SubscriptionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * Filter, which Subscription to fetch.
     */
    where?: SubscriptionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Subscriptions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Subscriptions.
     */
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[];
  };

  /**
   * Subscription findFirstOrThrow
   */
  export type SubscriptionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * Filter, which Subscription to fetch.
     */
    where?: SubscriptionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Subscriptions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Subscriptions.
     */
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[];
  };

  /**
   * Subscription findMany
   */
  export type SubscriptionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * Filter, which Subscriptions to fetch.
     */
    where?: SubscriptionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Subscriptions.
     */
    skip?: number;
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[];
  };

  /**
   * Subscription create
   */
  export type SubscriptionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * The data needed to create a Subscription.
     */
    data: XOR<SubscriptionCreateInput, SubscriptionUncheckedCreateInput>;
  };

  /**
   * Subscription createMany
   */
  export type SubscriptionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subscriptions.
     */
    data: SubscriptionCreateManyInput | SubscriptionCreateManyInput[];
  };

  /**
   * Subscription createManyAndReturn
   */
  export type SubscriptionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the Subscription
       */
      select?: SubscriptionSelectCreateManyAndReturn<ExtArgs> | null;
      /**
       * Omit specific fields from the Subscription
       */
      omit?: SubscriptionOmit<ExtArgs> | null;
      /**
       * The data used to create many Subscriptions.
       */
      data: SubscriptionCreateManyInput | SubscriptionCreateManyInput[];
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: SubscriptionIncludeCreateManyAndReturn<ExtArgs> | null;
    };

  /**
   * Subscription update
   */
  export type SubscriptionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * The data needed to update a Subscription.
     */
    data: XOR<SubscriptionUpdateInput, SubscriptionUncheckedUpdateInput>;
    /**
     * Choose, which Subscription to update.
     */
    where: SubscriptionWhereUniqueInput;
  };

  /**
   * Subscription updateMany
   */
  export type SubscriptionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subscriptions.
     */
    data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyInput>;
    /**
     * Filter which Subscriptions to update
     */
    where?: SubscriptionWhereInput;
    /**
     * Limit how many Subscriptions to update.
     */
    limit?: number;
  };

  /**
   * Subscription updateManyAndReturn
   */
  export type SubscriptionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the Subscription
       */
      select?: SubscriptionSelectUpdateManyAndReturn<ExtArgs> | null;
      /**
       * Omit specific fields from the Subscription
       */
      omit?: SubscriptionOmit<ExtArgs> | null;
      /**
       * The data used to update Subscriptions.
       */
      data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyInput>;
      /**
       * Filter which Subscriptions to update
       */
      where?: SubscriptionWhereInput;
      /**
       * Limit how many Subscriptions to update.
       */
      limit?: number;
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: SubscriptionIncludeUpdateManyAndReturn<ExtArgs> | null;
    };

  /**
   * Subscription upsert
   */
  export type SubscriptionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * The filter to search for the Subscription to update in case it exists.
     */
    where: SubscriptionWhereUniqueInput;
    /**
     * In case the Subscription found by the `where` argument doesn't exist, create a new Subscription with this data.
     */
    create: XOR<SubscriptionCreateInput, SubscriptionUncheckedCreateInput>;
    /**
     * In case the Subscription was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubscriptionUpdateInput, SubscriptionUncheckedUpdateInput>;
  };

  /**
   * Subscription delete
   */
  export type SubscriptionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    /**
     * Filter which Subscription to delete.
     */
    where: SubscriptionWhereUniqueInput;
  };

  /**
   * Subscription deleteMany
   */
  export type SubscriptionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscriptions to delete
     */
    where?: SubscriptionWhereInput;
    /**
     * Limit how many Subscriptions to delete.
     */
    limit?: number;
  };

  /**
   * Subscription without action
   */
  export type SubscriptionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
  };

  /**
   * Model Player
   */

  export type AggregatePlayer = {
    _count: PlayerCountAggregateOutputType | null;
    _avg: PlayerAvgAggregateOutputType | null;
    _sum: PlayerSumAggregateOutputType | null;
    _min: PlayerMinAggregateOutputType | null;
    _max: PlayerMaxAggregateOutputType | null;
  };

  export type PlayerAvgAggregateOutputType = {
    id: number | null;
  };

  export type PlayerSumAggregateOutputType = {
    id: number | null;
  };

  export type PlayerMinAggregateOutputType = {
    id: number | null;
    alias: string | null;
    discordId: string | null;
    serverId: string | null;
    creatorDiscordId: string | null;
    createdTime: Date | null;
    updatedTime: Date | null;
  };

  export type PlayerMaxAggregateOutputType = {
    id: number | null;
    alias: string | null;
    discordId: string | null;
    serverId: string | null;
    creatorDiscordId: string | null;
    createdTime: Date | null;
    updatedTime: Date | null;
  };

  export type PlayerCountAggregateOutputType = {
    id: number;
    alias: number;
    discordId: number;
    serverId: number;
    creatorDiscordId: number;
    createdTime: number;
    updatedTime: number;
    _all: number;
  };

  export type PlayerAvgAggregateInputType = {
    id?: true;
  };

  export type PlayerSumAggregateInputType = {
    id?: true;
  };

  export type PlayerMinAggregateInputType = {
    id?: true;
    alias?: true;
    discordId?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
  };

  export type PlayerMaxAggregateInputType = {
    id?: true;
    alias?: true;
    discordId?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
  };

  export type PlayerCountAggregateInputType = {
    id?: true;
    alias?: true;
    discordId?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
    _all?: true;
  };

  export type PlayerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Player to aggregate.
     */
    where?: PlayerWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PlayerWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Players from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Players.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Players
     **/
    _count?: true | PlayerCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: PlayerAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: PlayerSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: PlayerMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: PlayerMaxAggregateInputType;
  };

  export type GetPlayerAggregateType<T extends PlayerAggregateArgs> = {
    [P in keyof T & keyof AggregatePlayer]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlayer[P]>
      : GetScalarType<T[P], AggregatePlayer[P]>;
  };

  export type PlayerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayerWhereInput;
    orderBy?: PlayerOrderByWithAggregationInput | PlayerOrderByWithAggregationInput[];
    by: PlayerScalarFieldEnum[] | PlayerScalarFieldEnum;
    having?: PlayerScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PlayerCountAggregateInputType | true;
    _avg?: PlayerAvgAggregateInputType;
    _sum?: PlayerSumAggregateInputType;
    _min?: PlayerMinAggregateInputType;
    _max?: PlayerMaxAggregateInputType;
  };

  export type PlayerGroupByOutputType = {
    id: number;
    alias: string;
    discordId: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date;
    updatedTime: Date;
    _count: PlayerCountAggregateOutputType | null;
    _avg: PlayerAvgAggregateOutputType | null;
    _sum: PlayerSumAggregateOutputType | null;
    _min: PlayerMinAggregateOutputType | null;
    _max: PlayerMaxAggregateOutputType | null;
  };

  type GetPlayerGroupByPayload<T extends PlayerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PlayerGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof PlayerGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], PlayerGroupByOutputType[P]>
          : GetScalarType<T[P], PlayerGroupByOutputType[P]>;
      }
    >
  >;

  export type PlayerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<
    {
      id?: boolean;
      alias?: boolean;
      discordId?: boolean;
      serverId?: boolean;
      creatorDiscordId?: boolean;
      createdTime?: boolean;
      updatedTime?: boolean;
      accounts?: boolean | Player$accountsArgs<ExtArgs>;
      subscriptions?: boolean | Player$subscriptionsArgs<ExtArgs>;
      competitionParticipants?: boolean | Player$competitionParticipantsArgs<ExtArgs>;
      competitionSnapshots?: boolean | Player$competitionSnapshotsArgs<ExtArgs>;
      _count?: boolean | PlayerCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["player"]
  >;

  export type PlayerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        alias?: boolean;
        discordId?: boolean;
        serverId?: boolean;
        creatorDiscordId?: boolean;
        createdTime?: boolean;
        updatedTime?: boolean;
      },
      ExtArgs["result"]["player"]
    >;

  export type PlayerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        alias?: boolean;
        discordId?: boolean;
        serverId?: boolean;
        creatorDiscordId?: boolean;
        createdTime?: boolean;
        updatedTime?: boolean;
      },
      ExtArgs["result"]["player"]
    >;

  export type PlayerSelectScalar = {
    id?: boolean;
    alias?: boolean;
    discordId?: boolean;
    serverId?: boolean;
    creatorDiscordId?: boolean;
    createdTime?: boolean;
    updatedTime?: boolean;
  };

  export type PlayerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<
    "id" | "alias" | "discordId" | "serverId" | "creatorDiscordId" | "createdTime" | "updatedTime",
    ExtArgs["result"]["player"]
  >;
  export type PlayerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | Player$accountsArgs<ExtArgs>;
    subscriptions?: boolean | Player$subscriptionsArgs<ExtArgs>;
    competitionParticipants?: boolean | Player$competitionParticipantsArgs<ExtArgs>;
    competitionSnapshots?: boolean | Player$competitionSnapshotsArgs<ExtArgs>;
    _count?: boolean | PlayerCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type PlayerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {};
  export type PlayerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {};

  export type $PlayerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Player";
    objects: {
      accounts: Prisma.$AccountPayload<ExtArgs>[];
      subscriptions: Prisma.$SubscriptionPayload<ExtArgs>[];
      competitionParticipants: Prisma.$CompetitionParticipantPayload<ExtArgs>[];
      competitionSnapshots: Prisma.$CompetitionSnapshotPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        alias: string;
        discordId: string | null;
        serverId: string;
        creatorDiscordId: string;
        createdTime: Date;
        updatedTime: Date;
      },
      ExtArgs["result"]["player"]
    >;
    composites: {};
  };

  type PlayerGetPayload<S extends boolean | null | undefined | PlayerDefaultArgs> = $Result.GetResult<
    Prisma.$PlayerPayload,
    S
  >;

  type PlayerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    PlayerFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: PlayerCountAggregateInputType | true;
  };

  export interface PlayerDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["model"]["Player"]; meta: { name: "Player" } };
    /**
     * Find zero or one Player that matches the filter.
     * @param {PlayerFindUniqueArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlayerFindUniqueArgs>(
      args: SelectSubset<T, PlayerFindUniqueArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Player that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlayerFindUniqueOrThrowArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlayerFindUniqueOrThrowArgs>(
      args: SelectSubset<T, PlayerFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Player that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindFirstArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlayerFindFirstArgs>(
      args?: SelectSubset<T, PlayerFindFirstArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Player that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindFirstOrThrowArgs} args - Arguments to find a Player
     * @example
     * // Get one Player
     * const player = await prisma.player.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlayerFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PlayerFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Players that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Players
     * const players = await prisma.player.findMany()
     *
     * // Get first 10 Players
     * const players = await prisma.player.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const playerWithIdOnly = await prisma.player.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PlayerFindManyArgs>(
      args?: SelectSubset<T, PlayerFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;

    /**
     * Create a Player.
     * @param {PlayerCreateArgs} args - Arguments to create a Player.
     * @example
     * // Create one Player
     * const Player = await prisma.player.create({
     *   data: {
     *     // ... data to create a Player
     *   }
     * })
     *
     */
    create<T extends PlayerCreateArgs>(
      args: SelectSubset<T, PlayerCreateArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Players.
     * @param {PlayerCreateManyArgs} args - Arguments to create many Players.
     * @example
     * // Create many Players
     * const player = await prisma.player.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PlayerCreateManyArgs>(
      args?: SelectSubset<T, PlayerCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Players and returns the data saved in the database.
     * @param {PlayerCreateManyAndReturnArgs} args - Arguments to create many Players.
     * @example
     * // Create many Players
     * const player = await prisma.player.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Players and only return the `id`
     * const playerWithIdOnly = await prisma.player.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PlayerCreateManyAndReturnArgs>(
      args?: SelectSubset<T, PlayerCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Delete a Player.
     * @param {PlayerDeleteArgs} args - Arguments to delete one Player.
     * @example
     * // Delete one Player
     * const Player = await prisma.player.delete({
     *   where: {
     *     // ... filter to delete one Player
     *   }
     * })
     *
     */
    delete<T extends PlayerDeleteArgs>(
      args: SelectSubset<T, PlayerDeleteArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Player.
     * @param {PlayerUpdateArgs} args - Arguments to update one Player.
     * @example
     * // Update one Player
     * const player = await prisma.player.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PlayerUpdateArgs>(
      args: SelectSubset<T, PlayerUpdateArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Players.
     * @param {PlayerDeleteManyArgs} args - Arguments to filter Players to delete.
     * @example
     * // Delete a few Players
     * const { count } = await prisma.player.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PlayerDeleteManyArgs>(
      args?: SelectSubset<T, PlayerDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Players.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Players
     * const player = await prisma.player.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PlayerUpdateManyArgs>(
      args: SelectSubset<T, PlayerUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Players and returns the data updated in the database.
     * @param {PlayerUpdateManyAndReturnArgs} args - Arguments to update many Players.
     * @example
     * // Update many Players
     * const player = await prisma.player.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Players and only return the `id`
     * const playerWithIdOnly = await prisma.player.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PlayerUpdateManyAndReturnArgs>(
      args: SelectSubset<T, PlayerUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Create or update one Player.
     * @param {PlayerUpsertArgs} args - Arguments to update or create a Player.
     * @example
     * // Update or create a Player
     * const player = await prisma.player.upsert({
     *   create: {
     *     // ... data to create a Player
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Player we want to update
     *   }
     * })
     */
    upsert<T extends PlayerUpsertArgs>(
      args: SelectSubset<T, PlayerUpsertArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Players.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerCountArgs} args - Arguments to filter Players to count.
     * @example
     * // Count the number of Players
     * const count = await prisma.player.count({
     *   where: {
     *     // ... the filter for the Players we want to count
     *   }
     * })
     **/
    count<T extends PlayerCountArgs>(
      args?: Subset<T, PlayerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], PlayerCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Player.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends PlayerAggregateArgs>(
      args: Subset<T, PlayerAggregateArgs>,
    ): Prisma.PrismaPromise<GetPlayerAggregateType<T>>;

    /**
     * Group by Player.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends PlayerGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlayerGroupByArgs["orderBy"] }
        : { orderBy?: PlayerGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, PlayerGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetPlayerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Player model
     */
    readonly fields: PlayerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Player.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlayerClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    accounts<T extends Player$accountsArgs<ExtArgs> = {}>(
      args?: Subset<T, Player$accountsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null
    >;
    subscriptions<T extends Player$subscriptionsArgs<ExtArgs> = {}>(
      args?: Subset<T, Player$subscriptionsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null
    >;
    competitionParticipants<T extends Player$competitionParticipantsArgs<ExtArgs> = {}>(
      args?: Subset<T, Player$competitionParticipantsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null
    >;
    competitionSnapshots<T extends Player$competitionSnapshotsArgs<ExtArgs> = {}>(
      args?: Subset<T, Player$competitionSnapshotsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Player model
   */
  interface PlayerFieldRefs {
    readonly id: FieldRef<"Player", "Int">;
    readonly alias: FieldRef<"Player", "String">;
    readonly discordId: FieldRef<"Player", "String">;
    readonly serverId: FieldRef<"Player", "String">;
    readonly creatorDiscordId: FieldRef<"Player", "String">;
    readonly createdTime: FieldRef<"Player", "DateTime">;
    readonly updatedTime: FieldRef<"Player", "DateTime">;
  }

  // Custom InputTypes
  /**
   * Player findUnique
   */
  export type PlayerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * Filter, which Player to fetch.
     */
    where: PlayerWhereUniqueInput;
  };

  /**
   * Player findUniqueOrThrow
   */
  export type PlayerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * Filter, which Player to fetch.
     */
    where: PlayerWhereUniqueInput;
  };

  /**
   * Player findFirst
   */
  export type PlayerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * Filter, which Player to fetch.
     */
    where?: PlayerWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Players.
     */
    cursor?: PlayerWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Players from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Players.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Players.
     */
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[];
  };

  /**
   * Player findFirstOrThrow
   */
  export type PlayerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * Filter, which Player to fetch.
     */
    where?: PlayerWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Players.
     */
    cursor?: PlayerWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Players from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Players.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Players.
     */
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[];
  };

  /**
   * Player findMany
   */
  export type PlayerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * Filter, which Players to fetch.
     */
    where?: PlayerWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Players to fetch.
     */
    orderBy?: PlayerOrderByWithRelationInput | PlayerOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Players.
     */
    cursor?: PlayerWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Players from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Players.
     */
    skip?: number;
    distinct?: PlayerScalarFieldEnum | PlayerScalarFieldEnum[];
  };

  /**
   * Player create
   */
  export type PlayerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * The data needed to create a Player.
     */
    data: XOR<PlayerCreateInput, PlayerUncheckedCreateInput>;
  };

  /**
   * Player createMany
   */
  export type PlayerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Players.
     */
    data: PlayerCreateManyInput | PlayerCreateManyInput[];
  };

  /**
   * Player createManyAndReturn
   */
  export type PlayerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * The data used to create many Players.
     */
    data: PlayerCreateManyInput | PlayerCreateManyInput[];
  };

  /**
   * Player update
   */
  export type PlayerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * The data needed to update a Player.
     */
    data: XOR<PlayerUpdateInput, PlayerUncheckedUpdateInput>;
    /**
     * Choose, which Player to update.
     */
    where: PlayerWhereUniqueInput;
  };

  /**
   * Player updateMany
   */
  export type PlayerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Players.
     */
    data: XOR<PlayerUpdateManyMutationInput, PlayerUncheckedUpdateManyInput>;
    /**
     * Filter which Players to update
     */
    where?: PlayerWhereInput;
    /**
     * Limit how many Players to update.
     */
    limit?: number;
  };

  /**
   * Player updateManyAndReturn
   */
  export type PlayerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * The data used to update Players.
     */
    data: XOR<PlayerUpdateManyMutationInput, PlayerUncheckedUpdateManyInput>;
    /**
     * Filter which Players to update
     */
    where?: PlayerWhereInput;
    /**
     * Limit how many Players to update.
     */
    limit?: number;
  };

  /**
   * Player upsert
   */
  export type PlayerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * The filter to search for the Player to update in case it exists.
     */
    where: PlayerWhereUniqueInput;
    /**
     * In case the Player found by the `where` argument doesn't exist, create a new Player with this data.
     */
    create: XOR<PlayerCreateInput, PlayerUncheckedCreateInput>;
    /**
     * In case the Player was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlayerUpdateInput, PlayerUncheckedUpdateInput>;
  };

  /**
   * Player delete
   */
  export type PlayerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
    /**
     * Filter which Player to delete.
     */
    where: PlayerWhereUniqueInput;
  };

  /**
   * Player deleteMany
   */
  export type PlayerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Players to delete
     */
    where?: PlayerWhereInput;
    /**
     * Limit how many Players to delete.
     */
    limit?: number;
  };

  /**
   * Player.accounts
   */
  export type Player$accountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    where?: AccountWhereInput;
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[];
    cursor?: AccountWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[];
  };

  /**
   * Player.subscriptions
   */
  export type Player$subscriptionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null;
    where?: SubscriptionWhereInput;
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[];
    cursor?: SubscriptionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[];
  };

  /**
   * Player.competitionParticipants
   */
  export type Player$competitionParticipantsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    where?: CompetitionParticipantWhereInput;
    orderBy?: CompetitionParticipantOrderByWithRelationInput | CompetitionParticipantOrderByWithRelationInput[];
    cursor?: CompetitionParticipantWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: CompetitionParticipantScalarFieldEnum | CompetitionParticipantScalarFieldEnum[];
  };

  /**
   * Player.competitionSnapshots
   */
  export type Player$competitionSnapshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    where?: CompetitionSnapshotWhereInput;
    orderBy?: CompetitionSnapshotOrderByWithRelationInput | CompetitionSnapshotOrderByWithRelationInput[];
    cursor?: CompetitionSnapshotWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: CompetitionSnapshotScalarFieldEnum | CompetitionSnapshotScalarFieldEnum[];
  };

  /**
   * Player without action
   */
  export type PlayerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Player
     */
    select?: PlayerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Player
     */
    omit?: PlayerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayerInclude<ExtArgs> | null;
  };

  /**
   * Model Account
   */

  export type AggregateAccount = {
    _count: AccountCountAggregateOutputType | null;
    _avg: AccountAvgAggregateOutputType | null;
    _sum: AccountSumAggregateOutputType | null;
    _min: AccountMinAggregateOutputType | null;
    _max: AccountMaxAggregateOutputType | null;
  };

  export type AccountAvgAggregateOutputType = {
    id: number | null;
    playerId: number | null;
  };

  export type AccountSumAggregateOutputType = {
    id: number | null;
    playerId: number | null;
  };

  export type AccountMinAggregateOutputType = {
    id: number | null;
    alias: string | null;
    puuid: string | null;
    region: string | null;
    playerId: number | null;
    lastProcessedMatchId: string | null;
    lastMatchTime: Date | null;
    lastCheckedAt: Date | null;
    serverId: string | null;
    creatorDiscordId: string | null;
    createdTime: Date | null;
    updatedTime: Date | null;
  };

  export type AccountMaxAggregateOutputType = {
    id: number | null;
    alias: string | null;
    puuid: string | null;
    region: string | null;
    playerId: number | null;
    lastProcessedMatchId: string | null;
    lastMatchTime: Date | null;
    lastCheckedAt: Date | null;
    serverId: string | null;
    creatorDiscordId: string | null;
    createdTime: Date | null;
    updatedTime: Date | null;
  };

  export type AccountCountAggregateOutputType = {
    id: number;
    alias: number;
    puuid: number;
    region: number;
    playerId: number;
    lastProcessedMatchId: number;
    lastMatchTime: number;
    lastCheckedAt: number;
    serverId: number;
    creatorDiscordId: number;
    createdTime: number;
    updatedTime: number;
    _all: number;
  };

  export type AccountAvgAggregateInputType = {
    id?: true;
    playerId?: true;
  };

  export type AccountSumAggregateInputType = {
    id?: true;
    playerId?: true;
  };

  export type AccountMinAggregateInputType = {
    id?: true;
    alias?: true;
    puuid?: true;
    region?: true;
    playerId?: true;
    lastProcessedMatchId?: true;
    lastMatchTime?: true;
    lastCheckedAt?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
  };

  export type AccountMaxAggregateInputType = {
    id?: true;
    alias?: true;
    puuid?: true;
    region?: true;
    playerId?: true;
    lastProcessedMatchId?: true;
    lastMatchTime?: true;
    lastCheckedAt?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
  };

  export type AccountCountAggregateInputType = {
    id?: true;
    alias?: true;
    puuid?: true;
    region?: true;
    playerId?: true;
    lastProcessedMatchId?: true;
    lastMatchTime?: true;
    lastCheckedAt?: true;
    serverId?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
    _all?: true;
  };

  export type AccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Account to aggregate.
     */
    where?: AccountWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: AccountWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Accounts.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Accounts
     **/
    _count?: true | AccountCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: AccountAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: AccountSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: AccountMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: AccountMaxAggregateInputType;
  };

  export type GetAccountAggregateType<T extends AccountAggregateArgs> = {
    [P in keyof T & keyof AggregateAccount]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAccount[P]>
      : GetScalarType<T[P], AggregateAccount[P]>;
  };

  export type AccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccountWhereInput;
    orderBy?: AccountOrderByWithAggregationInput | AccountOrderByWithAggregationInput[];
    by: AccountScalarFieldEnum[] | AccountScalarFieldEnum;
    having?: AccountScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AccountCountAggregateInputType | true;
    _avg?: AccountAvgAggregateInputType;
    _sum?: AccountSumAggregateInputType;
    _min?: AccountMinAggregateInputType;
    _max?: AccountMaxAggregateInputType;
  };

  export type AccountGroupByOutputType = {
    id: number;
    alias: string;
    puuid: string;
    region: string;
    playerId: number;
    lastProcessedMatchId: string | null;
    lastMatchTime: Date | null;
    lastCheckedAt: Date | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date;
    updatedTime: Date;
    _count: AccountCountAggregateOutputType | null;
    _avg: AccountAvgAggregateOutputType | null;
    _sum: AccountSumAggregateOutputType | null;
    _min: AccountMinAggregateOutputType | null;
    _max: AccountMaxAggregateOutputType | null;
  };

  type GetAccountGroupByPayload<T extends AccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AccountGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof AccountGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], AccountGroupByOutputType[P]>
          : GetScalarType<T[P], AccountGroupByOutputType[P]>;
      }
    >
  >;

  export type AccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<
    {
      id?: boolean;
      alias?: boolean;
      puuid?: boolean;
      region?: boolean;
      playerId?: boolean;
      lastProcessedMatchId?: boolean;
      lastMatchTime?: boolean;
      lastCheckedAt?: boolean;
      serverId?: boolean;
      creatorDiscordId?: boolean;
      createdTime?: boolean;
      updatedTime?: boolean;
      player?: boolean | PlayerDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["account"]
  >;

  export type AccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        alias?: boolean;
        puuid?: boolean;
        region?: boolean;
        playerId?: boolean;
        lastProcessedMatchId?: boolean;
        lastMatchTime?: boolean;
        lastCheckedAt?: boolean;
        serverId?: boolean;
        creatorDiscordId?: boolean;
        createdTime?: boolean;
        updatedTime?: boolean;
        player?: boolean | PlayerDefaultArgs<ExtArgs>;
      },
      ExtArgs["result"]["account"]
    >;

  export type AccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        alias?: boolean;
        puuid?: boolean;
        region?: boolean;
        playerId?: boolean;
        lastProcessedMatchId?: boolean;
        lastMatchTime?: boolean;
        lastCheckedAt?: boolean;
        serverId?: boolean;
        creatorDiscordId?: boolean;
        createdTime?: boolean;
        updatedTime?: boolean;
        player?: boolean | PlayerDefaultArgs<ExtArgs>;
      },
      ExtArgs["result"]["account"]
    >;

  export type AccountSelectScalar = {
    id?: boolean;
    alias?: boolean;
    puuid?: boolean;
    region?: boolean;
    playerId?: boolean;
    lastProcessedMatchId?: boolean;
    lastMatchTime?: boolean;
    lastCheckedAt?: boolean;
    serverId?: boolean;
    creatorDiscordId?: boolean;
    createdTime?: boolean;
    updatedTime?: boolean;
  };

  export type AccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<
    | "id"
    | "alias"
    | "puuid"
    | "region"
    | "playerId"
    | "lastProcessedMatchId"
    | "lastMatchTime"
    | "lastCheckedAt"
    | "serverId"
    | "creatorDiscordId"
    | "createdTime"
    | "updatedTime",
    ExtArgs["result"]["account"]
  >;
  export type AccountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };
  export type AccountIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };
  export type AccountIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };

  export type $AccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Account";
    objects: {
      player: Prisma.$PlayerPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        alias: string;
        puuid: string;
        region: string;
        playerId: number;
        lastProcessedMatchId: string | null;
        lastMatchTime: Date | null;
        lastCheckedAt: Date | null;
        serverId: string;
        creatorDiscordId: string;
        createdTime: Date;
        updatedTime: Date;
      },
      ExtArgs["result"]["account"]
    >;
    composites: {};
  };

  type AccountGetPayload<S extends boolean | null | undefined | AccountDefaultArgs> = $Result.GetResult<
    Prisma.$AccountPayload,
    S
  >;

  type AccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    AccountFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: AccountCountAggregateInputType | true;
  };

  export interface AccountDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["model"]["Account"]; meta: { name: "Account" } };
    /**
     * Find zero or one Account that matches the filter.
     * @param {AccountFindUniqueArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AccountFindUniqueArgs>(
      args: SelectSubset<T, AccountFindUniqueArgs<ExtArgs>>,
    ): Prisma__AccountClient<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Account that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AccountFindUniqueOrThrowArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AccountFindUniqueOrThrowArgs>(
      args: SelectSubset<T, AccountFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__AccountClient<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Account that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindFirstArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AccountFindFirstArgs>(
      args?: SelectSubset<T, AccountFindFirstArgs<ExtArgs>>,
    ): Prisma__AccountClient<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Account that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindFirstOrThrowArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AccountFindFirstOrThrowArgs>(
      args?: SelectSubset<T, AccountFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__AccountClient<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Accounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Accounts
     * const accounts = await prisma.account.findMany()
     *
     * // Get first 10 Accounts
     * const accounts = await prisma.account.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const accountWithIdOnly = await prisma.account.findMany({ select: { id: true } })
     *
     */
    findMany<T extends AccountFindManyArgs>(
      args?: SelectSubset<T, AccountFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;

    /**
     * Create a Account.
     * @param {AccountCreateArgs} args - Arguments to create a Account.
     * @example
     * // Create one Account
     * const Account = await prisma.account.create({
     *   data: {
     *     // ... data to create a Account
     *   }
     * })
     *
     */
    create<T extends AccountCreateArgs>(
      args: SelectSubset<T, AccountCreateArgs<ExtArgs>>,
    ): Prisma__AccountClient<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Accounts.
     * @param {AccountCreateManyArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const account = await prisma.account.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends AccountCreateManyArgs>(
      args?: SelectSubset<T, AccountCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Accounts and returns the data saved in the database.
     * @param {AccountCreateManyAndReturnArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const account = await prisma.account.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Accounts and only return the `id`
     * const accountWithIdOnly = await prisma.account.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends AccountCreateManyAndReturnArgs>(
      args?: SelectSubset<T, AccountCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Delete a Account.
     * @param {AccountDeleteArgs} args - Arguments to delete one Account.
     * @example
     * // Delete one Account
     * const Account = await prisma.account.delete({
     *   where: {
     *     // ... filter to delete one Account
     *   }
     * })
     *
     */
    delete<T extends AccountDeleteArgs>(
      args: SelectSubset<T, AccountDeleteArgs<ExtArgs>>,
    ): Prisma__AccountClient<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Account.
     * @param {AccountUpdateArgs} args - Arguments to update one Account.
     * @example
     * // Update one Account
     * const account = await prisma.account.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends AccountUpdateArgs>(
      args: SelectSubset<T, AccountUpdateArgs<ExtArgs>>,
    ): Prisma__AccountClient<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Accounts.
     * @param {AccountDeleteManyArgs} args - Arguments to filter Accounts to delete.
     * @example
     * // Delete a few Accounts
     * const { count } = await prisma.account.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends AccountDeleteManyArgs>(
      args?: SelectSubset<T, AccountDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Accounts
     * const account = await prisma.account.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends AccountUpdateManyArgs>(
      args: SelectSubset<T, AccountUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Accounts and returns the data updated in the database.
     * @param {AccountUpdateManyAndReturnArgs} args - Arguments to update many Accounts.
     * @example
     * // Update many Accounts
     * const account = await prisma.account.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Accounts and only return the `id`
     * const accountWithIdOnly = await prisma.account.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends AccountUpdateManyAndReturnArgs>(
      args: SelectSubset<T, AccountUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Create or update one Account.
     * @param {AccountUpsertArgs} args - Arguments to update or create a Account.
     * @example
     * // Update or create a Account
     * const account = await prisma.account.upsert({
     *   create: {
     *     // ... data to create a Account
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Account we want to update
     *   }
     * })
     */
    upsert<T extends AccountUpsertArgs>(
      args: SelectSubset<T, AccountUpsertArgs<ExtArgs>>,
    ): Prisma__AccountClient<
      $Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountCountArgs} args - Arguments to filter Accounts to count.
     * @example
     * // Count the number of Accounts
     * const count = await prisma.account.count({
     *   where: {
     *     // ... the filter for the Accounts we want to count
     *   }
     * })
     **/
    count<T extends AccountCountArgs>(
      args?: Subset<T, AccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], AccountCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Account.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends AccountAggregateArgs>(
      args: Subset<T, AccountAggregateArgs>,
    ): Prisma.PrismaPromise<GetAccountAggregateType<T>>;

    /**
     * Group by Account.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends AccountGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AccountGroupByArgs["orderBy"] }
        : { orderBy?: AccountGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, AccountGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Account model
     */
    readonly fields: AccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Account.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AccountClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, PlayerDefaultArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Account model
   */
  interface AccountFieldRefs {
    readonly id: FieldRef<"Account", "Int">;
    readonly alias: FieldRef<"Account", "String">;
    readonly puuid: FieldRef<"Account", "String">;
    readonly region: FieldRef<"Account", "String">;
    readonly playerId: FieldRef<"Account", "Int">;
    readonly lastProcessedMatchId: FieldRef<"Account", "String">;
    readonly lastMatchTime: FieldRef<"Account", "DateTime">;
    readonly lastCheckedAt: FieldRef<"Account", "DateTime">;
    readonly serverId: FieldRef<"Account", "String">;
    readonly creatorDiscordId: FieldRef<"Account", "String">;
    readonly createdTime: FieldRef<"Account", "DateTime">;
    readonly updatedTime: FieldRef<"Account", "DateTime">;
  }

  // Custom InputTypes
  /**
   * Account findUnique
   */
  export type AccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * Filter, which Account to fetch.
     */
    where: AccountWhereUniqueInput;
  };

  /**
   * Account findUniqueOrThrow
   */
  export type AccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * Filter, which Account to fetch.
     */
    where: AccountWhereUniqueInput;
  };

  /**
   * Account findFirst
   */
  export type AccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * Filter, which Account to fetch.
     */
    where?: AccountWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Accounts.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[];
  };

  /**
   * Account findFirstOrThrow
   */
  export type AccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * Filter, which Account to fetch.
     */
    where?: AccountWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Accounts.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[];
  };

  /**
   * Account findMany
   */
  export type AccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * Filter, which Accounts to fetch.
     */
    where?: AccountWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Accounts.
     */
    cursor?: AccountWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Accounts.
     */
    skip?: number;
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[];
  };

  /**
   * Account create
   */
  export type AccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * The data needed to create a Account.
     */
    data: XOR<AccountCreateInput, AccountUncheckedCreateInput>;
  };

  /**
   * Account createMany
   */
  export type AccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Accounts.
     */
    data: AccountCreateManyInput | AccountCreateManyInput[];
  };

  /**
   * Account createManyAndReturn
   */
  export type AccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * The data used to create many Accounts.
     */
    data: AccountCreateManyInput | AccountCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Account update
   */
  export type AccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * The data needed to update a Account.
     */
    data: XOR<AccountUpdateInput, AccountUncheckedUpdateInput>;
    /**
     * Choose, which Account to update.
     */
    where: AccountWhereUniqueInput;
  };

  /**
   * Account updateMany
   */
  export type AccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyInput>;
    /**
     * Filter which Accounts to update
     */
    where?: AccountWhereInput;
    /**
     * Limit how many Accounts to update.
     */
    limit?: number;
  };

  /**
   * Account updateManyAndReturn
   */
  export type AccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyInput>;
    /**
     * Filter which Accounts to update
     */
    where?: AccountWhereInput;
    /**
     * Limit how many Accounts to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Account upsert
   */
  export type AccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * The filter to search for the Account to update in case it exists.
     */
    where: AccountWhereUniqueInput;
    /**
     * In case the Account found by the `where` argument doesn't exist, create a new Account with this data.
     */
    create: XOR<AccountCreateInput, AccountUncheckedCreateInput>;
    /**
     * In case the Account was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AccountUpdateInput, AccountUncheckedUpdateInput>;
  };

  /**
   * Account delete
   */
  export type AccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
    /**
     * Filter which Account to delete.
     */
    where: AccountWhereUniqueInput;
  };

  /**
   * Account deleteMany
   */
  export type AccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Accounts to delete
     */
    where?: AccountWhereInput;
    /**
     * Limit how many Accounts to delete.
     */
    limit?: number;
  };

  /**
   * Account without action
   */
  export type AccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null;
  };

  /**
   * Model Competition
   */

  export type AggregateCompetition = {
    _count: CompetitionCountAggregateOutputType | null;
    _avg: CompetitionAvgAggregateOutputType | null;
    _sum: CompetitionSumAggregateOutputType | null;
    _min: CompetitionMinAggregateOutputType | null;
    _max: CompetitionMaxAggregateOutputType | null;
  };

  export type CompetitionAvgAggregateOutputType = {
    id: number | null;
    maxParticipants: number | null;
  };

  export type CompetitionSumAggregateOutputType = {
    id: number | null;
    maxParticipants: number | null;
  };

  export type CompetitionMinAggregateOutputType = {
    id: number | null;
    serverId: string | null;
    ownerId: string | null;
    title: string | null;
    description: string | null;
    channelId: string | null;
    isCancelled: boolean | null;
    visibility: string | null;
    criteriaType: string | null;
    criteriaConfig: string | null;
    maxParticipants: number | null;
    startDate: Date | null;
    endDate: Date | null;
    seasonId: string | null;
    startProcessedAt: Date | null;
    endProcessedAt: Date | null;
    creatorDiscordId: string | null;
    createdTime: Date | null;
    updatedTime: Date | null;
  };

  export type CompetitionMaxAggregateOutputType = {
    id: number | null;
    serverId: string | null;
    ownerId: string | null;
    title: string | null;
    description: string | null;
    channelId: string | null;
    isCancelled: boolean | null;
    visibility: string | null;
    criteriaType: string | null;
    criteriaConfig: string | null;
    maxParticipants: number | null;
    startDate: Date | null;
    endDate: Date | null;
    seasonId: string | null;
    startProcessedAt: Date | null;
    endProcessedAt: Date | null;
    creatorDiscordId: string | null;
    createdTime: Date | null;
    updatedTime: Date | null;
  };

  export type CompetitionCountAggregateOutputType = {
    id: number;
    serverId: number;
    ownerId: number;
    title: number;
    description: number;
    channelId: number;
    isCancelled: number;
    visibility: number;
    criteriaType: number;
    criteriaConfig: number;
    maxParticipants: number;
    startDate: number;
    endDate: number;
    seasonId: number;
    startProcessedAt: number;
    endProcessedAt: number;
    creatorDiscordId: number;
    createdTime: number;
    updatedTime: number;
    _all: number;
  };

  export type CompetitionAvgAggregateInputType = {
    id?: true;
    maxParticipants?: true;
  };

  export type CompetitionSumAggregateInputType = {
    id?: true;
    maxParticipants?: true;
  };

  export type CompetitionMinAggregateInputType = {
    id?: true;
    serverId?: true;
    ownerId?: true;
    title?: true;
    description?: true;
    channelId?: true;
    isCancelled?: true;
    visibility?: true;
    criteriaType?: true;
    criteriaConfig?: true;
    maxParticipants?: true;
    startDate?: true;
    endDate?: true;
    seasonId?: true;
    startProcessedAt?: true;
    endProcessedAt?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
  };

  export type CompetitionMaxAggregateInputType = {
    id?: true;
    serverId?: true;
    ownerId?: true;
    title?: true;
    description?: true;
    channelId?: true;
    isCancelled?: true;
    visibility?: true;
    criteriaType?: true;
    criteriaConfig?: true;
    maxParticipants?: true;
    startDate?: true;
    endDate?: true;
    seasonId?: true;
    startProcessedAt?: true;
    endProcessedAt?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
  };

  export type CompetitionCountAggregateInputType = {
    id?: true;
    serverId?: true;
    ownerId?: true;
    title?: true;
    description?: true;
    channelId?: true;
    isCancelled?: true;
    visibility?: true;
    criteriaType?: true;
    criteriaConfig?: true;
    maxParticipants?: true;
    startDate?: true;
    endDate?: true;
    seasonId?: true;
    startProcessedAt?: true;
    endProcessedAt?: true;
    creatorDiscordId?: true;
    createdTime?: true;
    updatedTime?: true;
    _all?: true;
  };

  export type CompetitionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Competition to aggregate.
     */
    where?: CompetitionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Competitions to fetch.
     */
    orderBy?: CompetitionOrderByWithRelationInput | CompetitionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CompetitionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Competitions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Competitions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Competitions
     **/
    _count?: true | CompetitionCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: CompetitionAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: CompetitionSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: CompetitionMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: CompetitionMaxAggregateInputType;
  };

  export type GetCompetitionAggregateType<T extends CompetitionAggregateArgs> = {
    [P in keyof T & keyof AggregateCompetition]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCompetition[P]>
      : GetScalarType<T[P], AggregateCompetition[P]>;
  };

  export type CompetitionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CompetitionWhereInput;
    orderBy?: CompetitionOrderByWithAggregationInput | CompetitionOrderByWithAggregationInput[];
    by: CompetitionScalarFieldEnum[] | CompetitionScalarFieldEnum;
    having?: CompetitionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CompetitionCountAggregateInputType | true;
    _avg?: CompetitionAvgAggregateInputType;
    _sum?: CompetitionSumAggregateInputType;
    _min?: CompetitionMinAggregateInputType;
    _max?: CompetitionMaxAggregateInputType;
  };

  export type CompetitionGroupByOutputType = {
    id: number;
    serverId: string;
    ownerId: string;
    title: string;
    description: string;
    channelId: string;
    isCancelled: boolean;
    visibility: string;
    criteriaType: string;
    criteriaConfig: string;
    maxParticipants: number;
    startDate: Date | null;
    endDate: Date | null;
    seasonId: string | null;
    startProcessedAt: Date | null;
    endProcessedAt: Date | null;
    creatorDiscordId: string;
    createdTime: Date;
    updatedTime: Date;
    _count: CompetitionCountAggregateOutputType | null;
    _avg: CompetitionAvgAggregateOutputType | null;
    _sum: CompetitionSumAggregateOutputType | null;
    _min: CompetitionMinAggregateOutputType | null;
    _max: CompetitionMaxAggregateOutputType | null;
  };

  type GetCompetitionGroupByPayload<T extends CompetitionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CompetitionGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof CompetitionGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], CompetitionGroupByOutputType[P]>
          : GetScalarType<T[P], CompetitionGroupByOutputType[P]>;
      }
    >
  >;

  export type CompetitionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        serverId?: boolean;
        ownerId?: boolean;
        title?: boolean;
        description?: boolean;
        channelId?: boolean;
        isCancelled?: boolean;
        visibility?: boolean;
        criteriaType?: boolean;
        criteriaConfig?: boolean;
        maxParticipants?: boolean;
        startDate?: boolean;
        endDate?: boolean;
        seasonId?: boolean;
        startProcessedAt?: boolean;
        endProcessedAt?: boolean;
        creatorDiscordId?: boolean;
        createdTime?: boolean;
        updatedTime?: boolean;
        participants?: boolean | Competition$participantsArgs<ExtArgs>;
        snapshots?: boolean | Competition$snapshotsArgs<ExtArgs>;
        _count?: boolean | CompetitionCountOutputTypeDefaultArgs<ExtArgs>;
      },
      ExtArgs["result"]["competition"]
    >;

  export type CompetitionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        serverId?: boolean;
        ownerId?: boolean;
        title?: boolean;
        description?: boolean;
        channelId?: boolean;
        isCancelled?: boolean;
        visibility?: boolean;
        criteriaType?: boolean;
        criteriaConfig?: boolean;
        maxParticipants?: boolean;
        startDate?: boolean;
        endDate?: boolean;
        seasonId?: boolean;
        startProcessedAt?: boolean;
        endProcessedAt?: boolean;
        creatorDiscordId?: boolean;
        createdTime?: boolean;
        updatedTime?: boolean;
      },
      ExtArgs["result"]["competition"]
    >;

  export type CompetitionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        serverId?: boolean;
        ownerId?: boolean;
        title?: boolean;
        description?: boolean;
        channelId?: boolean;
        isCancelled?: boolean;
        visibility?: boolean;
        criteriaType?: boolean;
        criteriaConfig?: boolean;
        maxParticipants?: boolean;
        startDate?: boolean;
        endDate?: boolean;
        seasonId?: boolean;
        startProcessedAt?: boolean;
        endProcessedAt?: boolean;
        creatorDiscordId?: boolean;
        createdTime?: boolean;
        updatedTime?: boolean;
      },
      ExtArgs["result"]["competition"]
    >;

  export type CompetitionSelectScalar = {
    id?: boolean;
    serverId?: boolean;
    ownerId?: boolean;
    title?: boolean;
    description?: boolean;
    channelId?: boolean;
    isCancelled?: boolean;
    visibility?: boolean;
    criteriaType?: boolean;
    criteriaConfig?: boolean;
    maxParticipants?: boolean;
    startDate?: boolean;
    endDate?: boolean;
    seasonId?: boolean;
    startProcessedAt?: boolean;
    endProcessedAt?: boolean;
    creatorDiscordId?: boolean;
    createdTime?: boolean;
    updatedTime?: boolean;
  };

  export type CompetitionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<
    | "id"
    | "serverId"
    | "ownerId"
    | "title"
    | "description"
    | "channelId"
    | "isCancelled"
    | "visibility"
    | "criteriaType"
    | "criteriaConfig"
    | "maxParticipants"
    | "startDate"
    | "endDate"
    | "seasonId"
    | "startProcessedAt"
    | "endProcessedAt"
    | "creatorDiscordId"
    | "createdTime"
    | "updatedTime",
    ExtArgs["result"]["competition"]
  >;
  export type CompetitionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    participants?: boolean | Competition$participantsArgs<ExtArgs>;
    snapshots?: boolean | Competition$snapshotsArgs<ExtArgs>;
    _count?: boolean | CompetitionCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type CompetitionIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {};
  export type CompetitionIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {};

  export type $CompetitionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Competition";
    objects: {
      participants: Prisma.$CompetitionParticipantPayload<ExtArgs>[];
      snapshots: Prisma.$CompetitionSnapshotPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        serverId: string;
        ownerId: string;
        title: string;
        description: string;
        channelId: string;
        isCancelled: boolean;
        visibility: string;
        criteriaType: string;
        criteriaConfig: string;
        maxParticipants: number;
        startDate: Date | null;
        endDate: Date | null;
        seasonId: string | null;
        startProcessedAt: Date | null;
        endProcessedAt: Date | null;
        creatorDiscordId: string;
        createdTime: Date;
        updatedTime: Date;
      },
      ExtArgs["result"]["competition"]
    >;
    composites: {};
  };

  type CompetitionGetPayload<S extends boolean | null | undefined | CompetitionDefaultArgs> = $Result.GetResult<
    Prisma.$CompetitionPayload,
    S
  >;

  type CompetitionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    CompetitionFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: CompetitionCountAggregateInputType | true;
  };

  export interface CompetitionDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["model"]["Competition"]; meta: { name: "Competition" } };
    /**
     * Find zero or one Competition that matches the filter.
     * @param {CompetitionFindUniqueArgs} args - Arguments to find a Competition
     * @example
     * // Get one Competition
     * const competition = await prisma.competition.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CompetitionFindUniqueArgs>(
      args: SelectSubset<T, CompetitionFindUniqueArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Competition that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CompetitionFindUniqueOrThrowArgs} args - Arguments to find a Competition
     * @example
     * // Get one Competition
     * const competition = await prisma.competition.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CompetitionFindUniqueOrThrowArgs>(
      args: SelectSubset<T, CompetitionFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Competition that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionFindFirstArgs} args - Arguments to find a Competition
     * @example
     * // Get one Competition
     * const competition = await prisma.competition.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CompetitionFindFirstArgs>(
      args?: SelectSubset<T, CompetitionFindFirstArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Competition that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionFindFirstOrThrowArgs} args - Arguments to find a Competition
     * @example
     * // Get one Competition
     * const competition = await prisma.competition.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CompetitionFindFirstOrThrowArgs>(
      args?: SelectSubset<T, CompetitionFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Competitions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Competitions
     * const competitions = await prisma.competition.findMany()
     *
     * // Get first 10 Competitions
     * const competitions = await prisma.competition.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const competitionWithIdOnly = await prisma.competition.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CompetitionFindManyArgs>(
      args?: SelectSubset<T, CompetitionFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;

    /**
     * Create a Competition.
     * @param {CompetitionCreateArgs} args - Arguments to create a Competition.
     * @example
     * // Create one Competition
     * const Competition = await prisma.competition.create({
     *   data: {
     *     // ... data to create a Competition
     *   }
     * })
     *
     */
    create<T extends CompetitionCreateArgs>(
      args: SelectSubset<T, CompetitionCreateArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Competitions.
     * @param {CompetitionCreateManyArgs} args - Arguments to create many Competitions.
     * @example
     * // Create many Competitions
     * const competition = await prisma.competition.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CompetitionCreateManyArgs>(
      args?: SelectSubset<T, CompetitionCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Competitions and returns the data saved in the database.
     * @param {CompetitionCreateManyAndReturnArgs} args - Arguments to create many Competitions.
     * @example
     * // Create many Competitions
     * const competition = await prisma.competition.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Competitions and only return the `id`
     * const competitionWithIdOnly = await prisma.competition.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CompetitionCreateManyAndReturnArgs>(
      args?: SelectSubset<T, CompetitionCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Delete a Competition.
     * @param {CompetitionDeleteArgs} args - Arguments to delete one Competition.
     * @example
     * // Delete one Competition
     * const Competition = await prisma.competition.delete({
     *   where: {
     *     // ... filter to delete one Competition
     *   }
     * })
     *
     */
    delete<T extends CompetitionDeleteArgs>(
      args: SelectSubset<T, CompetitionDeleteArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Competition.
     * @param {CompetitionUpdateArgs} args - Arguments to update one Competition.
     * @example
     * // Update one Competition
     * const competition = await prisma.competition.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CompetitionUpdateArgs>(
      args: SelectSubset<T, CompetitionUpdateArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Competitions.
     * @param {CompetitionDeleteManyArgs} args - Arguments to filter Competitions to delete.
     * @example
     * // Delete a few Competitions
     * const { count } = await prisma.competition.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CompetitionDeleteManyArgs>(
      args?: SelectSubset<T, CompetitionDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Competitions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Competitions
     * const competition = await prisma.competition.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CompetitionUpdateManyArgs>(
      args: SelectSubset<T, CompetitionUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Competitions and returns the data updated in the database.
     * @param {CompetitionUpdateManyAndReturnArgs} args - Arguments to update many Competitions.
     * @example
     * // Update many Competitions
     * const competition = await prisma.competition.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Competitions and only return the `id`
     * const competitionWithIdOnly = await prisma.competition.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CompetitionUpdateManyAndReturnArgs>(
      args: SelectSubset<T, CompetitionUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Create or update one Competition.
     * @param {CompetitionUpsertArgs} args - Arguments to update or create a Competition.
     * @example
     * // Update or create a Competition
     * const competition = await prisma.competition.upsert({
     *   create: {
     *     // ... data to create a Competition
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Competition we want to update
     *   }
     * })
     */
    upsert<T extends CompetitionUpsertArgs>(
      args: SelectSubset<T, CompetitionUpsertArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Competitions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionCountArgs} args - Arguments to filter Competitions to count.
     * @example
     * // Count the number of Competitions
     * const count = await prisma.competition.count({
     *   where: {
     *     // ... the filter for the Competitions we want to count
     *   }
     * })
     **/
    count<T extends CompetitionCountArgs>(
      args?: Subset<T, CompetitionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], CompetitionCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Competition.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends CompetitionAggregateArgs>(
      args: Subset<T, CompetitionAggregateArgs>,
    ): Prisma.PrismaPromise<GetCompetitionAggregateType<T>>;

    /**
     * Group by Competition.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends CompetitionGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CompetitionGroupByArgs["orderBy"] }
        : { orderBy?: CompetitionGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, CompetitionGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetCompetitionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Competition model
     */
    readonly fields: CompetitionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Competition.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CompetitionClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    participants<T extends Competition$participantsArgs<ExtArgs> = {}>(
      args?: Subset<T, Competition$participantsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null
    >;
    snapshots<T extends Competition$snapshotsArgs<ExtArgs> = {}>(
      args?: Subset<T, Competition$snapshotsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Competition model
   */
  interface CompetitionFieldRefs {
    readonly id: FieldRef<"Competition", "Int">;
    readonly serverId: FieldRef<"Competition", "String">;
    readonly ownerId: FieldRef<"Competition", "String">;
    readonly title: FieldRef<"Competition", "String">;
    readonly description: FieldRef<"Competition", "String">;
    readonly channelId: FieldRef<"Competition", "String">;
    readonly isCancelled: FieldRef<"Competition", "Boolean">;
    readonly visibility: FieldRef<"Competition", "String">;
    readonly criteriaType: FieldRef<"Competition", "String">;
    readonly criteriaConfig: FieldRef<"Competition", "String">;
    readonly maxParticipants: FieldRef<"Competition", "Int">;
    readonly startDate: FieldRef<"Competition", "DateTime">;
    readonly endDate: FieldRef<"Competition", "DateTime">;
    readonly seasonId: FieldRef<"Competition", "String">;
    readonly startProcessedAt: FieldRef<"Competition", "DateTime">;
    readonly endProcessedAt: FieldRef<"Competition", "DateTime">;
    readonly creatorDiscordId: FieldRef<"Competition", "String">;
    readonly createdTime: FieldRef<"Competition", "DateTime">;
    readonly updatedTime: FieldRef<"Competition", "DateTime">;
  }

  // Custom InputTypes
  /**
   * Competition findUnique
   */
  export type CompetitionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * Filter, which Competition to fetch.
     */
    where: CompetitionWhereUniqueInput;
  };

  /**
   * Competition findUniqueOrThrow
   */
  export type CompetitionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * Filter, which Competition to fetch.
     */
    where: CompetitionWhereUniqueInput;
  };

  /**
   * Competition findFirst
   */
  export type CompetitionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * Filter, which Competition to fetch.
     */
    where?: CompetitionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Competitions to fetch.
     */
    orderBy?: CompetitionOrderByWithRelationInput | CompetitionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Competitions.
     */
    cursor?: CompetitionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Competitions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Competitions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Competitions.
     */
    distinct?: CompetitionScalarFieldEnum | CompetitionScalarFieldEnum[];
  };

  /**
   * Competition findFirstOrThrow
   */
  export type CompetitionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * Filter, which Competition to fetch.
     */
    where?: CompetitionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Competitions to fetch.
     */
    orderBy?: CompetitionOrderByWithRelationInput | CompetitionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Competitions.
     */
    cursor?: CompetitionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Competitions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Competitions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Competitions.
     */
    distinct?: CompetitionScalarFieldEnum | CompetitionScalarFieldEnum[];
  };

  /**
   * Competition findMany
   */
  export type CompetitionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * Filter, which Competitions to fetch.
     */
    where?: CompetitionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Competitions to fetch.
     */
    orderBy?: CompetitionOrderByWithRelationInput | CompetitionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Competitions.
     */
    cursor?: CompetitionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Competitions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Competitions.
     */
    skip?: number;
    distinct?: CompetitionScalarFieldEnum | CompetitionScalarFieldEnum[];
  };

  /**
   * Competition create
   */
  export type CompetitionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * The data needed to create a Competition.
     */
    data: XOR<CompetitionCreateInput, CompetitionUncheckedCreateInput>;
  };

  /**
   * Competition createMany
   */
  export type CompetitionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Competitions.
     */
    data: CompetitionCreateManyInput | CompetitionCreateManyInput[];
  };

  /**
   * Competition createManyAndReturn
   */
  export type CompetitionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * The data used to create many Competitions.
     */
    data: CompetitionCreateManyInput | CompetitionCreateManyInput[];
  };

  /**
   * Competition update
   */
  export type CompetitionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * The data needed to update a Competition.
     */
    data: XOR<CompetitionUpdateInput, CompetitionUncheckedUpdateInput>;
    /**
     * Choose, which Competition to update.
     */
    where: CompetitionWhereUniqueInput;
  };

  /**
   * Competition updateMany
   */
  export type CompetitionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Competitions.
     */
    data: XOR<CompetitionUpdateManyMutationInput, CompetitionUncheckedUpdateManyInput>;
    /**
     * Filter which Competitions to update
     */
    where?: CompetitionWhereInput;
    /**
     * Limit how many Competitions to update.
     */
    limit?: number;
  };

  /**
   * Competition updateManyAndReturn
   */
  export type CompetitionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * The data used to update Competitions.
     */
    data: XOR<CompetitionUpdateManyMutationInput, CompetitionUncheckedUpdateManyInput>;
    /**
     * Filter which Competitions to update
     */
    where?: CompetitionWhereInput;
    /**
     * Limit how many Competitions to update.
     */
    limit?: number;
  };

  /**
   * Competition upsert
   */
  export type CompetitionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * The filter to search for the Competition to update in case it exists.
     */
    where: CompetitionWhereUniqueInput;
    /**
     * In case the Competition found by the `where` argument doesn't exist, create a new Competition with this data.
     */
    create: XOR<CompetitionCreateInput, CompetitionUncheckedCreateInput>;
    /**
     * In case the Competition was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CompetitionUpdateInput, CompetitionUncheckedUpdateInput>;
  };

  /**
   * Competition delete
   */
  export type CompetitionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
    /**
     * Filter which Competition to delete.
     */
    where: CompetitionWhereUniqueInput;
  };

  /**
   * Competition deleteMany
   */
  export type CompetitionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Competitions to delete
     */
    where?: CompetitionWhereInput;
    /**
     * Limit how many Competitions to delete.
     */
    limit?: number;
  };

  /**
   * Competition.participants
   */
  export type Competition$participantsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    where?: CompetitionParticipantWhereInput;
    orderBy?: CompetitionParticipantOrderByWithRelationInput | CompetitionParticipantOrderByWithRelationInput[];
    cursor?: CompetitionParticipantWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: CompetitionParticipantScalarFieldEnum | CompetitionParticipantScalarFieldEnum[];
  };

  /**
   * Competition.snapshots
   */
  export type Competition$snapshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    where?: CompetitionSnapshotWhereInput;
    orderBy?: CompetitionSnapshotOrderByWithRelationInput | CompetitionSnapshotOrderByWithRelationInput[];
    cursor?: CompetitionSnapshotWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: CompetitionSnapshotScalarFieldEnum | CompetitionSnapshotScalarFieldEnum[];
  };

  /**
   * Competition without action
   */
  export type CompetitionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Competition
     */
    select?: CompetitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Competition
     */
    omit?: CompetitionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionInclude<ExtArgs> | null;
  };

  /**
   * Model CompetitionParticipant
   */

  export type AggregateCompetitionParticipant = {
    _count: CompetitionParticipantCountAggregateOutputType | null;
    _avg: CompetitionParticipantAvgAggregateOutputType | null;
    _sum: CompetitionParticipantSumAggregateOutputType | null;
    _min: CompetitionParticipantMinAggregateOutputType | null;
    _max: CompetitionParticipantMaxAggregateOutputType | null;
  };

  export type CompetitionParticipantAvgAggregateOutputType = {
    id: number | null;
    competitionId: number | null;
    playerId: number | null;
  };

  export type CompetitionParticipantSumAggregateOutputType = {
    id: number | null;
    competitionId: number | null;
    playerId: number | null;
  };

  export type CompetitionParticipantMinAggregateOutputType = {
    id: number | null;
    competitionId: number | null;
    playerId: number | null;
    status: string | null;
    invitedBy: string | null;
    invitedAt: Date | null;
    joinedAt: Date | null;
    leftAt: Date | null;
  };

  export type CompetitionParticipantMaxAggregateOutputType = {
    id: number | null;
    competitionId: number | null;
    playerId: number | null;
    status: string | null;
    invitedBy: string | null;
    invitedAt: Date | null;
    joinedAt: Date | null;
    leftAt: Date | null;
  };

  export type CompetitionParticipantCountAggregateOutputType = {
    id: number;
    competitionId: number;
    playerId: number;
    status: number;
    invitedBy: number;
    invitedAt: number;
    joinedAt: number;
    leftAt: number;
    _all: number;
  };

  export type CompetitionParticipantAvgAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
  };

  export type CompetitionParticipantSumAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
  };

  export type CompetitionParticipantMinAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
    status?: true;
    invitedBy?: true;
    invitedAt?: true;
    joinedAt?: true;
    leftAt?: true;
  };

  export type CompetitionParticipantMaxAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
    status?: true;
    invitedBy?: true;
    invitedAt?: true;
    joinedAt?: true;
    leftAt?: true;
  };

  export type CompetitionParticipantCountAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
    status?: true;
    invitedBy?: true;
    invitedAt?: true;
    joinedAt?: true;
    leftAt?: true;
    _all?: true;
  };

  export type CompetitionParticipantAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Filter which CompetitionParticipant to aggregate.
       */
      where?: CompetitionParticipantWhereInput;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
       *
       * Determine the order of CompetitionParticipants to fetch.
       */
      orderBy?: CompetitionParticipantOrderByWithRelationInput | CompetitionParticipantOrderByWithRelationInput[];
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
       *
       * Sets the start position
       */
      cursor?: CompetitionParticipantWhereUniqueInput;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
       *
       * Take `±n` CompetitionParticipants from the position of the cursor.
       */
      take?: number;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
       *
       * Skip the first `n` CompetitionParticipants.
       */
      skip?: number;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
       *
       * Count returned CompetitionParticipants
       **/
      _count?: true | CompetitionParticipantCountAggregateInputType;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
       *
       * Select which fields to average
       **/
      _avg?: CompetitionParticipantAvgAggregateInputType;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
       *
       * Select which fields to sum
       **/
      _sum?: CompetitionParticipantSumAggregateInputType;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
       *
       * Select which fields to find the minimum value
       **/
      _min?: CompetitionParticipantMinAggregateInputType;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
       *
       * Select which fields to find the maximum value
       **/
      _max?: CompetitionParticipantMaxAggregateInputType;
    };

  export type GetCompetitionParticipantAggregateType<T extends CompetitionParticipantAggregateArgs> = {
    [P in keyof T & keyof AggregateCompetitionParticipant]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCompetitionParticipant[P]>
      : GetScalarType<T[P], AggregateCompetitionParticipant[P]>;
  };

  export type CompetitionParticipantGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CompetitionParticipantWhereInput;
    orderBy?: CompetitionParticipantOrderByWithAggregationInput | CompetitionParticipantOrderByWithAggregationInput[];
    by: CompetitionParticipantScalarFieldEnum[] | CompetitionParticipantScalarFieldEnum;
    having?: CompetitionParticipantScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CompetitionParticipantCountAggregateInputType | true;
    _avg?: CompetitionParticipantAvgAggregateInputType;
    _sum?: CompetitionParticipantSumAggregateInputType;
    _min?: CompetitionParticipantMinAggregateInputType;
    _max?: CompetitionParticipantMaxAggregateInputType;
  };

  export type CompetitionParticipantGroupByOutputType = {
    id: number;
    competitionId: number;
    playerId: number;
    status: string;
    invitedBy: string | null;
    invitedAt: Date | null;
    joinedAt: Date | null;
    leftAt: Date | null;
    _count: CompetitionParticipantCountAggregateOutputType | null;
    _avg: CompetitionParticipantAvgAggregateOutputType | null;
    _sum: CompetitionParticipantSumAggregateOutputType | null;
    _min: CompetitionParticipantMinAggregateOutputType | null;
    _max: CompetitionParticipantMaxAggregateOutputType | null;
  };

  type GetCompetitionParticipantGroupByPayload<T extends CompetitionParticipantGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CompetitionParticipantGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof CompetitionParticipantGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], CompetitionParticipantGroupByOutputType[P]>
          : GetScalarType<T[P], CompetitionParticipantGroupByOutputType[P]>;
      }
    >
  >;

  export type CompetitionParticipantSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        competitionId?: boolean;
        playerId?: boolean;
        status?: boolean;
        invitedBy?: boolean;
        invitedAt?: boolean;
        joinedAt?: boolean;
        leftAt?: boolean;
        competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
        player?: boolean | PlayerDefaultArgs<ExtArgs>;
      },
      ExtArgs["result"]["competitionParticipant"]
    >;

  export type CompetitionParticipantSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      competitionId?: boolean;
      playerId?: boolean;
      status?: boolean;
      invitedBy?: boolean;
      invitedAt?: boolean;
      joinedAt?: boolean;
      leftAt?: boolean;
      competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
      player?: boolean | PlayerDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["competitionParticipant"]
  >;

  export type CompetitionParticipantSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      competitionId?: boolean;
      playerId?: boolean;
      status?: boolean;
      invitedBy?: boolean;
      invitedAt?: boolean;
      joinedAt?: boolean;
      leftAt?: boolean;
      competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
      player?: boolean | PlayerDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["competitionParticipant"]
  >;

  export type CompetitionParticipantSelectScalar = {
    id?: boolean;
    competitionId?: boolean;
    playerId?: boolean;
    status?: boolean;
    invitedBy?: boolean;
    invitedAt?: boolean;
    joinedAt?: boolean;
    leftAt?: boolean;
  };

  export type CompetitionParticipantOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetOmit<
      "id" | "competitionId" | "playerId" | "status" | "invitedBy" | "invitedAt" | "joinedAt" | "leftAt",
      ExtArgs["result"]["competitionParticipant"]
    >;
  export type CompetitionParticipantInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };
  export type CompetitionParticipantIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };
  export type CompetitionParticipantIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };

  export type $CompetitionParticipantPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CompetitionParticipant";
    objects: {
      competition: Prisma.$CompetitionPayload<ExtArgs>;
      player: Prisma.$PlayerPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        competitionId: number;
        playerId: number;
        status: string;
        invitedBy: string | null;
        invitedAt: Date | null;
        joinedAt: Date | null;
        leftAt: Date | null;
      },
      ExtArgs["result"]["competitionParticipant"]
    >;
    composites: {};
  };

  type CompetitionParticipantGetPayload<S extends boolean | null | undefined | CompetitionParticipantDefaultArgs> =
    $Result.GetResult<Prisma.$CompetitionParticipantPayload, S>;

  type CompetitionParticipantCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    CompetitionParticipantFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: CompetitionParticipantCountAggregateInputType | true;
  };

  export interface CompetitionParticipantDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["CompetitionParticipant"];
      meta: { name: "CompetitionParticipant" };
    };
    /**
     * Find zero or one CompetitionParticipant that matches the filter.
     * @param {CompetitionParticipantFindUniqueArgs} args - Arguments to find a CompetitionParticipant
     * @example
     * // Get one CompetitionParticipant
     * const competitionParticipant = await prisma.competitionParticipant.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CompetitionParticipantFindUniqueArgs>(
      args: SelectSubset<T, CompetitionParticipantFindUniqueArgs<ExtArgs>>,
    ): Prisma__CompetitionParticipantClient<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one CompetitionParticipant that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CompetitionParticipantFindUniqueOrThrowArgs} args - Arguments to find a CompetitionParticipant
     * @example
     * // Get one CompetitionParticipant
     * const competitionParticipant = await prisma.competitionParticipant.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CompetitionParticipantFindUniqueOrThrowArgs>(
      args: SelectSubset<T, CompetitionParticipantFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__CompetitionParticipantClient<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first CompetitionParticipant that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionParticipantFindFirstArgs} args - Arguments to find a CompetitionParticipant
     * @example
     * // Get one CompetitionParticipant
     * const competitionParticipant = await prisma.competitionParticipant.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CompetitionParticipantFindFirstArgs>(
      args?: SelectSubset<T, CompetitionParticipantFindFirstArgs<ExtArgs>>,
    ): Prisma__CompetitionParticipantClient<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first CompetitionParticipant that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionParticipantFindFirstOrThrowArgs} args - Arguments to find a CompetitionParticipant
     * @example
     * // Get one CompetitionParticipant
     * const competitionParticipant = await prisma.competitionParticipant.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CompetitionParticipantFindFirstOrThrowArgs>(
      args?: SelectSubset<T, CompetitionParticipantFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__CompetitionParticipantClient<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more CompetitionParticipants that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionParticipantFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CompetitionParticipants
     * const competitionParticipants = await prisma.competitionParticipant.findMany()
     *
     * // Get first 10 CompetitionParticipants
     * const competitionParticipants = await prisma.competitionParticipant.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const competitionParticipantWithIdOnly = await prisma.competitionParticipant.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CompetitionParticipantFindManyArgs>(
      args?: SelectSubset<T, CompetitionParticipantFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>
    >;

    /**
     * Create a CompetitionParticipant.
     * @param {CompetitionParticipantCreateArgs} args - Arguments to create a CompetitionParticipant.
     * @example
     * // Create one CompetitionParticipant
     * const CompetitionParticipant = await prisma.competitionParticipant.create({
     *   data: {
     *     // ... data to create a CompetitionParticipant
     *   }
     * })
     *
     */
    create<T extends CompetitionParticipantCreateArgs>(
      args: SelectSubset<T, CompetitionParticipantCreateArgs<ExtArgs>>,
    ): Prisma__CompetitionParticipantClient<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many CompetitionParticipants.
     * @param {CompetitionParticipantCreateManyArgs} args - Arguments to create many CompetitionParticipants.
     * @example
     * // Create many CompetitionParticipants
     * const competitionParticipant = await prisma.competitionParticipant.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CompetitionParticipantCreateManyArgs>(
      args?: SelectSubset<T, CompetitionParticipantCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many CompetitionParticipants and returns the data saved in the database.
     * @param {CompetitionParticipantCreateManyAndReturnArgs} args - Arguments to create many CompetitionParticipants.
     * @example
     * // Create many CompetitionParticipants
     * const competitionParticipant = await prisma.competitionParticipant.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many CompetitionParticipants and only return the `id`
     * const competitionParticipantWithIdOnly = await prisma.competitionParticipant.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CompetitionParticipantCreateManyAndReturnArgs>(
      args?: SelectSubset<T, CompetitionParticipantCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Delete a CompetitionParticipant.
     * @param {CompetitionParticipantDeleteArgs} args - Arguments to delete one CompetitionParticipant.
     * @example
     * // Delete one CompetitionParticipant
     * const CompetitionParticipant = await prisma.competitionParticipant.delete({
     *   where: {
     *     // ... filter to delete one CompetitionParticipant
     *   }
     * })
     *
     */
    delete<T extends CompetitionParticipantDeleteArgs>(
      args: SelectSubset<T, CompetitionParticipantDeleteArgs<ExtArgs>>,
    ): Prisma__CompetitionParticipantClient<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one CompetitionParticipant.
     * @param {CompetitionParticipantUpdateArgs} args - Arguments to update one CompetitionParticipant.
     * @example
     * // Update one CompetitionParticipant
     * const competitionParticipant = await prisma.competitionParticipant.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CompetitionParticipantUpdateArgs>(
      args: SelectSubset<T, CompetitionParticipantUpdateArgs<ExtArgs>>,
    ): Prisma__CompetitionParticipantClient<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more CompetitionParticipants.
     * @param {CompetitionParticipantDeleteManyArgs} args - Arguments to filter CompetitionParticipants to delete.
     * @example
     * // Delete a few CompetitionParticipants
     * const { count } = await prisma.competitionParticipant.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CompetitionParticipantDeleteManyArgs>(
      args?: SelectSubset<T, CompetitionParticipantDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more CompetitionParticipants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionParticipantUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CompetitionParticipants
     * const competitionParticipant = await prisma.competitionParticipant.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CompetitionParticipantUpdateManyArgs>(
      args: SelectSubset<T, CompetitionParticipantUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more CompetitionParticipants and returns the data updated in the database.
     * @param {CompetitionParticipantUpdateManyAndReturnArgs} args - Arguments to update many CompetitionParticipants.
     * @example
     * // Update many CompetitionParticipants
     * const competitionParticipant = await prisma.competitionParticipant.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more CompetitionParticipants and only return the `id`
     * const competitionParticipantWithIdOnly = await prisma.competitionParticipant.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CompetitionParticipantUpdateManyAndReturnArgs>(
      args: SelectSubset<T, CompetitionParticipantUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Create or update one CompetitionParticipant.
     * @param {CompetitionParticipantUpsertArgs} args - Arguments to update or create a CompetitionParticipant.
     * @example
     * // Update or create a CompetitionParticipant
     * const competitionParticipant = await prisma.competitionParticipant.upsert({
     *   create: {
     *     // ... data to create a CompetitionParticipant
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CompetitionParticipant we want to update
     *   }
     * })
     */
    upsert<T extends CompetitionParticipantUpsertArgs>(
      args: SelectSubset<T, CompetitionParticipantUpsertArgs<ExtArgs>>,
    ): Prisma__CompetitionParticipantClient<
      $Result.GetResult<Prisma.$CompetitionParticipantPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of CompetitionParticipants.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionParticipantCountArgs} args - Arguments to filter CompetitionParticipants to count.
     * @example
     * // Count the number of CompetitionParticipants
     * const count = await prisma.competitionParticipant.count({
     *   where: {
     *     // ... the filter for the CompetitionParticipants we want to count
     *   }
     * })
     **/
    count<T extends CompetitionParticipantCountArgs>(
      args?: Subset<T, CompetitionParticipantCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], CompetitionParticipantCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a CompetitionParticipant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionParticipantAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends CompetitionParticipantAggregateArgs>(
      args: Subset<T, CompetitionParticipantAggregateArgs>,
    ): Prisma.PrismaPromise<GetCompetitionParticipantAggregateType<T>>;

    /**
     * Group by CompetitionParticipant.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionParticipantGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends CompetitionParticipantGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CompetitionParticipantGroupByArgs["orderBy"] }
        : { orderBy?: CompetitionParticipantGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, CompetitionParticipantGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetCompetitionParticipantGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the CompetitionParticipant model
     */
    readonly fields: CompetitionParticipantFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CompetitionParticipant.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CompetitionParticipantClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    competition<T extends CompetitionDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, CompetitionDefaultArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, PlayerDefaultArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the CompetitionParticipant model
   */
  interface CompetitionParticipantFieldRefs {
    readonly id: FieldRef<"CompetitionParticipant", "Int">;
    readonly competitionId: FieldRef<"CompetitionParticipant", "Int">;
    readonly playerId: FieldRef<"CompetitionParticipant", "Int">;
    readonly status: FieldRef<"CompetitionParticipant", "String">;
    readonly invitedBy: FieldRef<"CompetitionParticipant", "String">;
    readonly invitedAt: FieldRef<"CompetitionParticipant", "DateTime">;
    readonly joinedAt: FieldRef<"CompetitionParticipant", "DateTime">;
    readonly leftAt: FieldRef<"CompetitionParticipant", "DateTime">;
  }

  // Custom InputTypes
  /**
   * CompetitionParticipant findUnique
   */
  export type CompetitionParticipantFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the CompetitionParticipant
       */
      select?: CompetitionParticipantSelect<ExtArgs> | null;
      /**
       * Omit specific fields from the CompetitionParticipant
       */
      omit?: CompetitionParticipantOmit<ExtArgs> | null;
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: CompetitionParticipantInclude<ExtArgs> | null;
      /**
       * Filter, which CompetitionParticipant to fetch.
       */
      where: CompetitionParticipantWhereUniqueInput;
    };

  /**
   * CompetitionParticipant findUniqueOrThrow
   */
  export type CompetitionParticipantFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    /**
     * Filter, which CompetitionParticipant to fetch.
     */
    where: CompetitionParticipantWhereUniqueInput;
  };

  /**
   * CompetitionParticipant findFirst
   */
  export type CompetitionParticipantFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the CompetitionParticipant
       */
      select?: CompetitionParticipantSelect<ExtArgs> | null;
      /**
       * Omit specific fields from the CompetitionParticipant
       */
      omit?: CompetitionParticipantOmit<ExtArgs> | null;
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: CompetitionParticipantInclude<ExtArgs> | null;
      /**
       * Filter, which CompetitionParticipant to fetch.
       */
      where?: CompetitionParticipantWhereInput;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
       *
       * Determine the order of CompetitionParticipants to fetch.
       */
      orderBy?: CompetitionParticipantOrderByWithRelationInput | CompetitionParticipantOrderByWithRelationInput[];
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
       *
       * Sets the position for searching for CompetitionParticipants.
       */
      cursor?: CompetitionParticipantWhereUniqueInput;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
       *
       * Take `±n` CompetitionParticipants from the position of the cursor.
       */
      take?: number;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
       *
       * Skip the first `n` CompetitionParticipants.
       */
      skip?: number;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
       *
       * Filter by unique combinations of CompetitionParticipants.
       */
      distinct?: CompetitionParticipantScalarFieldEnum | CompetitionParticipantScalarFieldEnum[];
    };

  /**
   * CompetitionParticipant findFirstOrThrow
   */
  export type CompetitionParticipantFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    /**
     * Filter, which CompetitionParticipant to fetch.
     */
    where?: CompetitionParticipantWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CompetitionParticipants to fetch.
     */
    orderBy?: CompetitionParticipantOrderByWithRelationInput | CompetitionParticipantOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CompetitionParticipants.
     */
    cursor?: CompetitionParticipantWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CompetitionParticipants from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CompetitionParticipants.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CompetitionParticipants.
     */
    distinct?: CompetitionParticipantScalarFieldEnum | CompetitionParticipantScalarFieldEnum[];
  };

  /**
   * CompetitionParticipant findMany
   */
  export type CompetitionParticipantFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    /**
     * Filter, which CompetitionParticipants to fetch.
     */
    where?: CompetitionParticipantWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CompetitionParticipants to fetch.
     */
    orderBy?: CompetitionParticipantOrderByWithRelationInput | CompetitionParticipantOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing CompetitionParticipants.
     */
    cursor?: CompetitionParticipantWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CompetitionParticipants from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CompetitionParticipants.
     */
    skip?: number;
    distinct?: CompetitionParticipantScalarFieldEnum | CompetitionParticipantScalarFieldEnum[];
  };

  /**
   * CompetitionParticipant create
   */
  export type CompetitionParticipantCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    /**
     * The data needed to create a CompetitionParticipant.
     */
    data: XOR<CompetitionParticipantCreateInput, CompetitionParticipantUncheckedCreateInput>;
  };

  /**
   * CompetitionParticipant createMany
   */
  export type CompetitionParticipantCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * The data used to create many CompetitionParticipants.
       */
      data: CompetitionParticipantCreateManyInput | CompetitionParticipantCreateManyInput[];
    };

  /**
   * CompetitionParticipant createManyAndReturn
   */
  export type CompetitionParticipantCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * The data used to create many CompetitionParticipants.
     */
    data: CompetitionParticipantCreateManyInput | CompetitionParticipantCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * CompetitionParticipant update
   */
  export type CompetitionParticipantUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    /**
     * The data needed to update a CompetitionParticipant.
     */
    data: XOR<CompetitionParticipantUpdateInput, CompetitionParticipantUncheckedUpdateInput>;
    /**
     * Choose, which CompetitionParticipant to update.
     */
    where: CompetitionParticipantWhereUniqueInput;
  };

  /**
   * CompetitionParticipant updateMany
   */
  export type CompetitionParticipantUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * The data used to update CompetitionParticipants.
       */
      data: XOR<CompetitionParticipantUpdateManyMutationInput, CompetitionParticipantUncheckedUpdateManyInput>;
      /**
       * Filter which CompetitionParticipants to update
       */
      where?: CompetitionParticipantWhereInput;
      /**
       * Limit how many CompetitionParticipants to update.
       */
      limit?: number;
    };

  /**
   * CompetitionParticipant updateManyAndReturn
   */
  export type CompetitionParticipantUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * The data used to update CompetitionParticipants.
     */
    data: XOR<CompetitionParticipantUpdateManyMutationInput, CompetitionParticipantUncheckedUpdateManyInput>;
    /**
     * Filter which CompetitionParticipants to update
     */
    where?: CompetitionParticipantWhereInput;
    /**
     * Limit how many CompetitionParticipants to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * CompetitionParticipant upsert
   */
  export type CompetitionParticipantUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    /**
     * The filter to search for the CompetitionParticipant to update in case it exists.
     */
    where: CompetitionParticipantWhereUniqueInput;
    /**
     * In case the CompetitionParticipant found by the `where` argument doesn't exist, create a new CompetitionParticipant with this data.
     */
    create: XOR<CompetitionParticipantCreateInput, CompetitionParticipantUncheckedCreateInput>;
    /**
     * In case the CompetitionParticipant was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CompetitionParticipantUpdateInput, CompetitionParticipantUncheckedUpdateInput>;
  };

  /**
   * CompetitionParticipant delete
   */
  export type CompetitionParticipantDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
    /**
     * Filter which CompetitionParticipant to delete.
     */
    where: CompetitionParticipantWhereUniqueInput;
  };

  /**
   * CompetitionParticipant deleteMany
   */
  export type CompetitionParticipantDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Filter which CompetitionParticipants to delete
       */
      where?: CompetitionParticipantWhereInput;
      /**
       * Limit how many CompetitionParticipants to delete.
       */
      limit?: number;
    };

  /**
   * CompetitionParticipant without action
   */
  export type CompetitionParticipantDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionParticipant
     */
    select?: CompetitionParticipantSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionParticipant
     */
    omit?: CompetitionParticipantOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionParticipantInclude<ExtArgs> | null;
  };

  /**
   * Model CompetitionSnapshot
   */

  export type AggregateCompetitionSnapshot = {
    _count: CompetitionSnapshotCountAggregateOutputType | null;
    _avg: CompetitionSnapshotAvgAggregateOutputType | null;
    _sum: CompetitionSnapshotSumAggregateOutputType | null;
    _min: CompetitionSnapshotMinAggregateOutputType | null;
    _max: CompetitionSnapshotMaxAggregateOutputType | null;
  };

  export type CompetitionSnapshotAvgAggregateOutputType = {
    id: number | null;
    competitionId: number | null;
    playerId: number | null;
  };

  export type CompetitionSnapshotSumAggregateOutputType = {
    id: number | null;
    competitionId: number | null;
    playerId: number | null;
  };

  export type CompetitionSnapshotMinAggregateOutputType = {
    id: number | null;
    competitionId: number | null;
    playerId: number | null;
    snapshotType: string | null;
    snapshotData: string | null;
    snapshotTime: Date | null;
  };

  export type CompetitionSnapshotMaxAggregateOutputType = {
    id: number | null;
    competitionId: number | null;
    playerId: number | null;
    snapshotType: string | null;
    snapshotData: string | null;
    snapshotTime: Date | null;
  };

  export type CompetitionSnapshotCountAggregateOutputType = {
    id: number;
    competitionId: number;
    playerId: number;
    snapshotType: number;
    snapshotData: number;
    snapshotTime: number;
    _all: number;
  };

  export type CompetitionSnapshotAvgAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
  };

  export type CompetitionSnapshotSumAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
  };

  export type CompetitionSnapshotMinAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
    snapshotType?: true;
    snapshotData?: true;
    snapshotTime?: true;
  };

  export type CompetitionSnapshotMaxAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
    snapshotType?: true;
    snapshotData?: true;
    snapshotTime?: true;
  };

  export type CompetitionSnapshotCountAggregateInputType = {
    id?: true;
    competitionId?: true;
    playerId?: true;
    snapshotType?: true;
    snapshotData?: true;
    snapshotTime?: true;
    _all?: true;
  };

  export type CompetitionSnapshotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CompetitionSnapshot to aggregate.
     */
    where?: CompetitionSnapshotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CompetitionSnapshots to fetch.
     */
    orderBy?: CompetitionSnapshotOrderByWithRelationInput | CompetitionSnapshotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CompetitionSnapshotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CompetitionSnapshots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CompetitionSnapshots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned CompetitionSnapshots
     **/
    _count?: true | CompetitionSnapshotCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: CompetitionSnapshotAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: CompetitionSnapshotSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: CompetitionSnapshotMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: CompetitionSnapshotMaxAggregateInputType;
  };

  export type GetCompetitionSnapshotAggregateType<T extends CompetitionSnapshotAggregateArgs> = {
    [P in keyof T & keyof AggregateCompetitionSnapshot]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCompetitionSnapshot[P]>
      : GetScalarType<T[P], AggregateCompetitionSnapshot[P]>;
  };

  export type CompetitionSnapshotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CompetitionSnapshotWhereInput;
    orderBy?: CompetitionSnapshotOrderByWithAggregationInput | CompetitionSnapshotOrderByWithAggregationInput[];
    by: CompetitionSnapshotScalarFieldEnum[] | CompetitionSnapshotScalarFieldEnum;
    having?: CompetitionSnapshotScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CompetitionSnapshotCountAggregateInputType | true;
    _avg?: CompetitionSnapshotAvgAggregateInputType;
    _sum?: CompetitionSnapshotSumAggregateInputType;
    _min?: CompetitionSnapshotMinAggregateInputType;
    _max?: CompetitionSnapshotMaxAggregateInputType;
  };

  export type CompetitionSnapshotGroupByOutputType = {
    id: number;
    competitionId: number;
    playerId: number;
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date;
    _count: CompetitionSnapshotCountAggregateOutputType | null;
    _avg: CompetitionSnapshotAvgAggregateOutputType | null;
    _sum: CompetitionSnapshotSumAggregateOutputType | null;
    _min: CompetitionSnapshotMinAggregateOutputType | null;
    _max: CompetitionSnapshotMaxAggregateOutputType | null;
  };

  type GetCompetitionSnapshotGroupByPayload<T extends CompetitionSnapshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CompetitionSnapshotGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof CompetitionSnapshotGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], CompetitionSnapshotGroupByOutputType[P]>
          : GetScalarType<T[P], CompetitionSnapshotGroupByOutputType[P]>;
      }
    >
  >;

  export type CompetitionSnapshotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        competitionId?: boolean;
        playerId?: boolean;
        snapshotType?: boolean;
        snapshotData?: boolean;
        snapshotTime?: boolean;
        competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
        player?: boolean | PlayerDefaultArgs<ExtArgs>;
      },
      ExtArgs["result"]["competitionSnapshot"]
    >;

  export type CompetitionSnapshotSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      competitionId?: boolean;
      playerId?: boolean;
      snapshotType?: boolean;
      snapshotData?: boolean;
      snapshotTime?: boolean;
      competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
      player?: boolean | PlayerDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["competitionSnapshot"]
  >;

  export type CompetitionSnapshotSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      competitionId?: boolean;
      playerId?: boolean;
      snapshotType?: boolean;
      snapshotData?: boolean;
      snapshotTime?: boolean;
      competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
      player?: boolean | PlayerDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["competitionSnapshot"]
  >;

  export type CompetitionSnapshotSelectScalar = {
    id?: boolean;
    competitionId?: boolean;
    playerId?: boolean;
    snapshotType?: boolean;
    snapshotData?: boolean;
    snapshotTime?: boolean;
  };

  export type CompetitionSnapshotOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetOmit<
      "id" | "competitionId" | "playerId" | "snapshotType" | "snapshotData" | "snapshotTime",
      ExtArgs["result"]["competitionSnapshot"]
    >;
  export type CompetitionSnapshotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };
  export type CompetitionSnapshotIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };
  export type CompetitionSnapshotIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    competition?: boolean | CompetitionDefaultArgs<ExtArgs>;
    player?: boolean | PlayerDefaultArgs<ExtArgs>;
  };

  export type $CompetitionSnapshotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CompetitionSnapshot";
    objects: {
      competition: Prisma.$CompetitionPayload<ExtArgs>;
      player: Prisma.$PlayerPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        competitionId: number;
        playerId: number;
        snapshotType: string;
        snapshotData: string;
        snapshotTime: Date;
      },
      ExtArgs["result"]["competitionSnapshot"]
    >;
    composites: {};
  };

  type CompetitionSnapshotGetPayload<S extends boolean | null | undefined | CompetitionSnapshotDefaultArgs> =
    $Result.GetResult<Prisma.$CompetitionSnapshotPayload, S>;

  type CompetitionSnapshotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    CompetitionSnapshotFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: CompetitionSnapshotCountAggregateInputType | true;
  };

  export interface CompetitionSnapshotDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["CompetitionSnapshot"];
      meta: { name: "CompetitionSnapshot" };
    };
    /**
     * Find zero or one CompetitionSnapshot that matches the filter.
     * @param {CompetitionSnapshotFindUniqueArgs} args - Arguments to find a CompetitionSnapshot
     * @example
     * // Get one CompetitionSnapshot
     * const competitionSnapshot = await prisma.competitionSnapshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CompetitionSnapshotFindUniqueArgs>(
      args: SelectSubset<T, CompetitionSnapshotFindUniqueArgs<ExtArgs>>,
    ): Prisma__CompetitionSnapshotClient<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one CompetitionSnapshot that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CompetitionSnapshotFindUniqueOrThrowArgs} args - Arguments to find a CompetitionSnapshot
     * @example
     * // Get one CompetitionSnapshot
     * const competitionSnapshot = await prisma.competitionSnapshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CompetitionSnapshotFindUniqueOrThrowArgs>(
      args: SelectSubset<T, CompetitionSnapshotFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__CompetitionSnapshotClient<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first CompetitionSnapshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionSnapshotFindFirstArgs} args - Arguments to find a CompetitionSnapshot
     * @example
     * // Get one CompetitionSnapshot
     * const competitionSnapshot = await prisma.competitionSnapshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CompetitionSnapshotFindFirstArgs>(
      args?: SelectSubset<T, CompetitionSnapshotFindFirstArgs<ExtArgs>>,
    ): Prisma__CompetitionSnapshotClient<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first CompetitionSnapshot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionSnapshotFindFirstOrThrowArgs} args - Arguments to find a CompetitionSnapshot
     * @example
     * // Get one CompetitionSnapshot
     * const competitionSnapshot = await prisma.competitionSnapshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CompetitionSnapshotFindFirstOrThrowArgs>(
      args?: SelectSubset<T, CompetitionSnapshotFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__CompetitionSnapshotClient<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more CompetitionSnapshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionSnapshotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CompetitionSnapshots
     * const competitionSnapshots = await prisma.competitionSnapshot.findMany()
     *
     * // Get first 10 CompetitionSnapshots
     * const competitionSnapshots = await prisma.competitionSnapshot.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const competitionSnapshotWithIdOnly = await prisma.competitionSnapshot.findMany({ select: { id: true } })
     *
     */
    findMany<T extends CompetitionSnapshotFindManyArgs>(
      args?: SelectSubset<T, CompetitionSnapshotFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>
    >;

    /**
     * Create a CompetitionSnapshot.
     * @param {CompetitionSnapshotCreateArgs} args - Arguments to create a CompetitionSnapshot.
     * @example
     * // Create one CompetitionSnapshot
     * const CompetitionSnapshot = await prisma.competitionSnapshot.create({
     *   data: {
     *     // ... data to create a CompetitionSnapshot
     *   }
     * })
     *
     */
    create<T extends CompetitionSnapshotCreateArgs>(
      args: SelectSubset<T, CompetitionSnapshotCreateArgs<ExtArgs>>,
    ): Prisma__CompetitionSnapshotClient<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many CompetitionSnapshots.
     * @param {CompetitionSnapshotCreateManyArgs} args - Arguments to create many CompetitionSnapshots.
     * @example
     * // Create many CompetitionSnapshots
     * const competitionSnapshot = await prisma.competitionSnapshot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CompetitionSnapshotCreateManyArgs>(
      args?: SelectSubset<T, CompetitionSnapshotCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many CompetitionSnapshots and returns the data saved in the database.
     * @param {CompetitionSnapshotCreateManyAndReturnArgs} args - Arguments to create many CompetitionSnapshots.
     * @example
     * // Create many CompetitionSnapshots
     * const competitionSnapshot = await prisma.competitionSnapshot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many CompetitionSnapshots and only return the `id`
     * const competitionSnapshotWithIdOnly = await prisma.competitionSnapshot.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CompetitionSnapshotCreateManyAndReturnArgs>(
      args?: SelectSubset<T, CompetitionSnapshotCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Delete a CompetitionSnapshot.
     * @param {CompetitionSnapshotDeleteArgs} args - Arguments to delete one CompetitionSnapshot.
     * @example
     * // Delete one CompetitionSnapshot
     * const CompetitionSnapshot = await prisma.competitionSnapshot.delete({
     *   where: {
     *     // ... filter to delete one CompetitionSnapshot
     *   }
     * })
     *
     */
    delete<T extends CompetitionSnapshotDeleteArgs>(
      args: SelectSubset<T, CompetitionSnapshotDeleteArgs<ExtArgs>>,
    ): Prisma__CompetitionSnapshotClient<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one CompetitionSnapshot.
     * @param {CompetitionSnapshotUpdateArgs} args - Arguments to update one CompetitionSnapshot.
     * @example
     * // Update one CompetitionSnapshot
     * const competitionSnapshot = await prisma.competitionSnapshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CompetitionSnapshotUpdateArgs>(
      args: SelectSubset<T, CompetitionSnapshotUpdateArgs<ExtArgs>>,
    ): Prisma__CompetitionSnapshotClient<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more CompetitionSnapshots.
     * @param {CompetitionSnapshotDeleteManyArgs} args - Arguments to filter CompetitionSnapshots to delete.
     * @example
     * // Delete a few CompetitionSnapshots
     * const { count } = await prisma.competitionSnapshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CompetitionSnapshotDeleteManyArgs>(
      args?: SelectSubset<T, CompetitionSnapshotDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more CompetitionSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionSnapshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CompetitionSnapshots
     * const competitionSnapshot = await prisma.competitionSnapshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CompetitionSnapshotUpdateManyArgs>(
      args: SelectSubset<T, CompetitionSnapshotUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more CompetitionSnapshots and returns the data updated in the database.
     * @param {CompetitionSnapshotUpdateManyAndReturnArgs} args - Arguments to update many CompetitionSnapshots.
     * @example
     * // Update many CompetitionSnapshots
     * const competitionSnapshot = await prisma.competitionSnapshot.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more CompetitionSnapshots and only return the `id`
     * const competitionSnapshotWithIdOnly = await prisma.competitionSnapshot.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CompetitionSnapshotUpdateManyAndReturnArgs>(
      args: SelectSubset<T, CompetitionSnapshotUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Create or update one CompetitionSnapshot.
     * @param {CompetitionSnapshotUpsertArgs} args - Arguments to update or create a CompetitionSnapshot.
     * @example
     * // Update or create a CompetitionSnapshot
     * const competitionSnapshot = await prisma.competitionSnapshot.upsert({
     *   create: {
     *     // ... data to create a CompetitionSnapshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CompetitionSnapshot we want to update
     *   }
     * })
     */
    upsert<T extends CompetitionSnapshotUpsertArgs>(
      args: SelectSubset<T, CompetitionSnapshotUpsertArgs<ExtArgs>>,
    ): Prisma__CompetitionSnapshotClient<
      $Result.GetResult<Prisma.$CompetitionSnapshotPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of CompetitionSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionSnapshotCountArgs} args - Arguments to filter CompetitionSnapshots to count.
     * @example
     * // Count the number of CompetitionSnapshots
     * const count = await prisma.competitionSnapshot.count({
     *   where: {
     *     // ... the filter for the CompetitionSnapshots we want to count
     *   }
     * })
     **/
    count<T extends CompetitionSnapshotCountArgs>(
      args?: Subset<T, CompetitionSnapshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], CompetitionSnapshotCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a CompetitionSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionSnapshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends CompetitionSnapshotAggregateArgs>(
      args: Subset<T, CompetitionSnapshotAggregateArgs>,
    ): Prisma.PrismaPromise<GetCompetitionSnapshotAggregateType<T>>;

    /**
     * Group by CompetitionSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CompetitionSnapshotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends CompetitionSnapshotGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CompetitionSnapshotGroupByArgs["orderBy"] }
        : { orderBy?: CompetitionSnapshotGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, CompetitionSnapshotGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetCompetitionSnapshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the CompetitionSnapshot model
     */
    readonly fields: CompetitionSnapshotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CompetitionSnapshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CompetitionSnapshotClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    competition<T extends CompetitionDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, CompetitionDefaultArgs<ExtArgs>>,
    ): Prisma__CompetitionClient<
      $Result.GetResult<Prisma.$CompetitionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    player<T extends PlayerDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, PlayerDefaultArgs<ExtArgs>>,
    ): Prisma__PlayerClient<
      $Result.GetResult<Prisma.$PlayerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the CompetitionSnapshot model
   */
  interface CompetitionSnapshotFieldRefs {
    readonly id: FieldRef<"CompetitionSnapshot", "Int">;
    readonly competitionId: FieldRef<"CompetitionSnapshot", "Int">;
    readonly playerId: FieldRef<"CompetitionSnapshot", "Int">;
    readonly snapshotType: FieldRef<"CompetitionSnapshot", "String">;
    readonly snapshotData: FieldRef<"CompetitionSnapshot", "String">;
    readonly snapshotTime: FieldRef<"CompetitionSnapshot", "DateTime">;
  }

  // Custom InputTypes
  /**
   * CompetitionSnapshot findUnique
   */
  export type CompetitionSnapshotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which CompetitionSnapshot to fetch.
     */
    where: CompetitionSnapshotWhereUniqueInput;
  };

  /**
   * CompetitionSnapshot findUniqueOrThrow
   */
  export type CompetitionSnapshotFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which CompetitionSnapshot to fetch.
     */
    where: CompetitionSnapshotWhereUniqueInput;
  };

  /**
   * CompetitionSnapshot findFirst
   */
  export type CompetitionSnapshotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which CompetitionSnapshot to fetch.
     */
    where?: CompetitionSnapshotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CompetitionSnapshots to fetch.
     */
    orderBy?: CompetitionSnapshotOrderByWithRelationInput | CompetitionSnapshotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CompetitionSnapshots.
     */
    cursor?: CompetitionSnapshotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CompetitionSnapshots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CompetitionSnapshots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CompetitionSnapshots.
     */
    distinct?: CompetitionSnapshotScalarFieldEnum | CompetitionSnapshotScalarFieldEnum[];
  };

  /**
   * CompetitionSnapshot findFirstOrThrow
   */
  export type CompetitionSnapshotFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which CompetitionSnapshot to fetch.
     */
    where?: CompetitionSnapshotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CompetitionSnapshots to fetch.
     */
    orderBy?: CompetitionSnapshotOrderByWithRelationInput | CompetitionSnapshotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for CompetitionSnapshots.
     */
    cursor?: CompetitionSnapshotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CompetitionSnapshots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CompetitionSnapshots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of CompetitionSnapshots.
     */
    distinct?: CompetitionSnapshotScalarFieldEnum | CompetitionSnapshotScalarFieldEnum[];
  };

  /**
   * CompetitionSnapshot findMany
   */
  export type CompetitionSnapshotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which CompetitionSnapshots to fetch.
     */
    where?: CompetitionSnapshotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of CompetitionSnapshots to fetch.
     */
    orderBy?: CompetitionSnapshotOrderByWithRelationInput | CompetitionSnapshotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing CompetitionSnapshots.
     */
    cursor?: CompetitionSnapshotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` CompetitionSnapshots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` CompetitionSnapshots.
     */
    skip?: number;
    distinct?: CompetitionSnapshotScalarFieldEnum | CompetitionSnapshotScalarFieldEnum[];
  };

  /**
   * CompetitionSnapshot create
   */
  export type CompetitionSnapshotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * The data needed to create a CompetitionSnapshot.
     */
    data: XOR<CompetitionSnapshotCreateInput, CompetitionSnapshotUncheckedCreateInput>;
  };

  /**
   * CompetitionSnapshot createMany
   */
  export type CompetitionSnapshotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CompetitionSnapshots.
     */
    data: CompetitionSnapshotCreateManyInput | CompetitionSnapshotCreateManyInput[];
  };

  /**
   * CompetitionSnapshot createManyAndReturn
   */
  export type CompetitionSnapshotCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * The data used to create many CompetitionSnapshots.
     */
    data: CompetitionSnapshotCreateManyInput | CompetitionSnapshotCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * CompetitionSnapshot update
   */
  export type CompetitionSnapshotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * The data needed to update a CompetitionSnapshot.
     */
    data: XOR<CompetitionSnapshotUpdateInput, CompetitionSnapshotUncheckedUpdateInput>;
    /**
     * Choose, which CompetitionSnapshot to update.
     */
    where: CompetitionSnapshotWhereUniqueInput;
  };

  /**
   * CompetitionSnapshot updateMany
   */
  export type CompetitionSnapshotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CompetitionSnapshots.
     */
    data: XOR<CompetitionSnapshotUpdateManyMutationInput, CompetitionSnapshotUncheckedUpdateManyInput>;
    /**
     * Filter which CompetitionSnapshots to update
     */
    where?: CompetitionSnapshotWhereInput;
    /**
     * Limit how many CompetitionSnapshots to update.
     */
    limit?: number;
  };

  /**
   * CompetitionSnapshot updateManyAndReturn
   */
  export type CompetitionSnapshotUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * The data used to update CompetitionSnapshots.
     */
    data: XOR<CompetitionSnapshotUpdateManyMutationInput, CompetitionSnapshotUncheckedUpdateManyInput>;
    /**
     * Filter which CompetitionSnapshots to update
     */
    where?: CompetitionSnapshotWhereInput;
    /**
     * Limit how many CompetitionSnapshots to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * CompetitionSnapshot upsert
   */
  export type CompetitionSnapshotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * The filter to search for the CompetitionSnapshot to update in case it exists.
     */
    where: CompetitionSnapshotWhereUniqueInput;
    /**
     * In case the CompetitionSnapshot found by the `where` argument doesn't exist, create a new CompetitionSnapshot with this data.
     */
    create: XOR<CompetitionSnapshotCreateInput, CompetitionSnapshotUncheckedCreateInput>;
    /**
     * In case the CompetitionSnapshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CompetitionSnapshotUpdateInput, CompetitionSnapshotUncheckedUpdateInput>;
  };

  /**
   * CompetitionSnapshot delete
   */
  export type CompetitionSnapshotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
    /**
     * Filter which CompetitionSnapshot to delete.
     */
    where: CompetitionSnapshotWhereUniqueInput;
  };

  /**
   * CompetitionSnapshot deleteMany
   */
  export type CompetitionSnapshotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CompetitionSnapshots to delete
     */
    where?: CompetitionSnapshotWhereInput;
    /**
     * Limit how many CompetitionSnapshots to delete.
     */
    limit?: number;
  };

  /**
   * CompetitionSnapshot without action
   */
  export type CompetitionSnapshotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CompetitionSnapshot
     */
    select?: CompetitionSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the CompetitionSnapshot
     */
    omit?: CompetitionSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CompetitionSnapshotInclude<ExtArgs> | null;
  };

  /**
   * Model ServerPermission
   */

  export type AggregateServerPermission = {
    _count: ServerPermissionCountAggregateOutputType | null;
    _avg: ServerPermissionAvgAggregateOutputType | null;
    _sum: ServerPermissionSumAggregateOutputType | null;
    _min: ServerPermissionMinAggregateOutputType | null;
    _max: ServerPermissionMaxAggregateOutputType | null;
  };

  export type ServerPermissionAvgAggregateOutputType = {
    id: number | null;
  };

  export type ServerPermissionSumAggregateOutputType = {
    id: number | null;
  };

  export type ServerPermissionMinAggregateOutputType = {
    id: number | null;
    serverId: string | null;
    discordUserId: string | null;
    permission: string | null;
    grantedBy: string | null;
    grantedAt: Date | null;
  };

  export type ServerPermissionMaxAggregateOutputType = {
    id: number | null;
    serverId: string | null;
    discordUserId: string | null;
    permission: string | null;
    grantedBy: string | null;
    grantedAt: Date | null;
  };

  export type ServerPermissionCountAggregateOutputType = {
    id: number;
    serverId: number;
    discordUserId: number;
    permission: number;
    grantedBy: number;
    grantedAt: number;
    _all: number;
  };

  export type ServerPermissionAvgAggregateInputType = {
    id?: true;
  };

  export type ServerPermissionSumAggregateInputType = {
    id?: true;
  };

  export type ServerPermissionMinAggregateInputType = {
    id?: true;
    serverId?: true;
    discordUserId?: true;
    permission?: true;
    grantedBy?: true;
    grantedAt?: true;
  };

  export type ServerPermissionMaxAggregateInputType = {
    id?: true;
    serverId?: true;
    discordUserId?: true;
    permission?: true;
    grantedBy?: true;
    grantedAt?: true;
  };

  export type ServerPermissionCountAggregateInputType = {
    id?: true;
    serverId?: true;
    discordUserId?: true;
    permission?: true;
    grantedBy?: true;
    grantedAt?: true;
    _all?: true;
  };

  export type ServerPermissionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ServerPermission to aggregate.
     */
    where?: ServerPermissionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ServerPermissions to fetch.
     */
    orderBy?: ServerPermissionOrderByWithRelationInput | ServerPermissionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ServerPermissionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ServerPermissions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ServerPermissions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ServerPermissions
     **/
    _count?: true | ServerPermissionCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: ServerPermissionAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: ServerPermissionSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ServerPermissionMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ServerPermissionMaxAggregateInputType;
  };

  export type GetServerPermissionAggregateType<T extends ServerPermissionAggregateArgs> = {
    [P in keyof T & keyof AggregateServerPermission]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateServerPermission[P]>
      : GetScalarType<T[P], AggregateServerPermission[P]>;
  };

  export type ServerPermissionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ServerPermissionWhereInput;
    orderBy?: ServerPermissionOrderByWithAggregationInput | ServerPermissionOrderByWithAggregationInput[];
    by: ServerPermissionScalarFieldEnum[] | ServerPermissionScalarFieldEnum;
    having?: ServerPermissionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ServerPermissionCountAggregateInputType | true;
    _avg?: ServerPermissionAvgAggregateInputType;
    _sum?: ServerPermissionSumAggregateInputType;
    _min?: ServerPermissionMinAggregateInputType;
    _max?: ServerPermissionMaxAggregateInputType;
  };

  export type ServerPermissionGroupByOutputType = {
    id: number;
    serverId: string;
    discordUserId: string;
    permission: string;
    grantedBy: string;
    grantedAt: Date;
    _count: ServerPermissionCountAggregateOutputType | null;
    _avg: ServerPermissionAvgAggregateOutputType | null;
    _sum: ServerPermissionSumAggregateOutputType | null;
    _min: ServerPermissionMinAggregateOutputType | null;
    _max: ServerPermissionMaxAggregateOutputType | null;
  };

  type GetServerPermissionGroupByPayload<T extends ServerPermissionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ServerPermissionGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof ServerPermissionGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], ServerPermissionGroupByOutputType[P]>
          : GetScalarType<T[P], ServerPermissionGroupByOutputType[P]>;
      }
    >
  >;

  export type ServerPermissionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        serverId?: boolean;
        discordUserId?: boolean;
        permission?: boolean;
        grantedBy?: boolean;
        grantedAt?: boolean;
      },
      ExtArgs["result"]["serverPermission"]
    >;

  export type ServerPermissionSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      serverId?: boolean;
      discordUserId?: boolean;
      permission?: boolean;
      grantedBy?: boolean;
      grantedAt?: boolean;
    },
    ExtArgs["result"]["serverPermission"]
  >;

  export type ServerPermissionSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      serverId?: boolean;
      discordUserId?: boolean;
      permission?: boolean;
      grantedBy?: boolean;
      grantedAt?: boolean;
    },
    ExtArgs["result"]["serverPermission"]
  >;

  export type ServerPermissionSelectScalar = {
    id?: boolean;
    serverId?: boolean;
    discordUserId?: boolean;
    permission?: boolean;
    grantedBy?: boolean;
    grantedAt?: boolean;
  };

  export type ServerPermissionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetOmit<
      "id" | "serverId" | "discordUserId" | "permission" | "grantedBy" | "grantedAt",
      ExtArgs["result"]["serverPermission"]
    >;

  export type $ServerPermissionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ServerPermission";
    objects: {};
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        serverId: string;
        discordUserId: string;
        permission: string;
        grantedBy: string;
        grantedAt: Date;
      },
      ExtArgs["result"]["serverPermission"]
    >;
    composites: {};
  };

  type ServerPermissionGetPayload<S extends boolean | null | undefined | ServerPermissionDefaultArgs> =
    $Result.GetResult<Prisma.$ServerPermissionPayload, S>;

  type ServerPermissionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    ServerPermissionFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: ServerPermissionCountAggregateInputType | true;
  };

  export interface ServerPermissionDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["model"]["ServerPermission"]; meta: { name: "ServerPermission" } };
    /**
     * Find zero or one ServerPermission that matches the filter.
     * @param {ServerPermissionFindUniqueArgs} args - Arguments to find a ServerPermission
     * @example
     * // Get one ServerPermission
     * const serverPermission = await prisma.serverPermission.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ServerPermissionFindUniqueArgs>(
      args: SelectSubset<T, ServerPermissionFindUniqueArgs<ExtArgs>>,
    ): Prisma__ServerPermissionClient<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one ServerPermission that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ServerPermissionFindUniqueOrThrowArgs} args - Arguments to find a ServerPermission
     * @example
     * // Get one ServerPermission
     * const serverPermission = await prisma.serverPermission.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ServerPermissionFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ServerPermissionFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__ServerPermissionClient<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first ServerPermission that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServerPermissionFindFirstArgs} args - Arguments to find a ServerPermission
     * @example
     * // Get one ServerPermission
     * const serverPermission = await prisma.serverPermission.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ServerPermissionFindFirstArgs>(
      args?: SelectSubset<T, ServerPermissionFindFirstArgs<ExtArgs>>,
    ): Prisma__ServerPermissionClient<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first ServerPermission that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServerPermissionFindFirstOrThrowArgs} args - Arguments to find a ServerPermission
     * @example
     * // Get one ServerPermission
     * const serverPermission = await prisma.serverPermission.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ServerPermissionFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ServerPermissionFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__ServerPermissionClient<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more ServerPermissions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServerPermissionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ServerPermissions
     * const serverPermissions = await prisma.serverPermission.findMany()
     *
     * // Get first 10 ServerPermissions
     * const serverPermissions = await prisma.serverPermission.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const serverPermissionWithIdOnly = await prisma.serverPermission.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ServerPermissionFindManyArgs>(
      args?: SelectSubset<T, ServerPermissionFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>
    >;

    /**
     * Create a ServerPermission.
     * @param {ServerPermissionCreateArgs} args - Arguments to create a ServerPermission.
     * @example
     * // Create one ServerPermission
     * const ServerPermission = await prisma.serverPermission.create({
     *   data: {
     *     // ... data to create a ServerPermission
     *   }
     * })
     *
     */
    create<T extends ServerPermissionCreateArgs>(
      args: SelectSubset<T, ServerPermissionCreateArgs<ExtArgs>>,
    ): Prisma__ServerPermissionClient<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many ServerPermissions.
     * @param {ServerPermissionCreateManyArgs} args - Arguments to create many ServerPermissions.
     * @example
     * // Create many ServerPermissions
     * const serverPermission = await prisma.serverPermission.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ServerPermissionCreateManyArgs>(
      args?: SelectSubset<T, ServerPermissionCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many ServerPermissions and returns the data saved in the database.
     * @param {ServerPermissionCreateManyAndReturnArgs} args - Arguments to create many ServerPermissions.
     * @example
     * // Create many ServerPermissions
     * const serverPermission = await prisma.serverPermission.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ServerPermissions and only return the `id`
     * const serverPermissionWithIdOnly = await prisma.serverPermission.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ServerPermissionCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ServerPermissionCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Delete a ServerPermission.
     * @param {ServerPermissionDeleteArgs} args - Arguments to delete one ServerPermission.
     * @example
     * // Delete one ServerPermission
     * const ServerPermission = await prisma.serverPermission.delete({
     *   where: {
     *     // ... filter to delete one ServerPermission
     *   }
     * })
     *
     */
    delete<T extends ServerPermissionDeleteArgs>(
      args: SelectSubset<T, ServerPermissionDeleteArgs<ExtArgs>>,
    ): Prisma__ServerPermissionClient<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one ServerPermission.
     * @param {ServerPermissionUpdateArgs} args - Arguments to update one ServerPermission.
     * @example
     * // Update one ServerPermission
     * const serverPermission = await prisma.serverPermission.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ServerPermissionUpdateArgs>(
      args: SelectSubset<T, ServerPermissionUpdateArgs<ExtArgs>>,
    ): Prisma__ServerPermissionClient<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more ServerPermissions.
     * @param {ServerPermissionDeleteManyArgs} args - Arguments to filter ServerPermissions to delete.
     * @example
     * // Delete a few ServerPermissions
     * const { count } = await prisma.serverPermission.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ServerPermissionDeleteManyArgs>(
      args?: SelectSubset<T, ServerPermissionDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more ServerPermissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServerPermissionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ServerPermissions
     * const serverPermission = await prisma.serverPermission.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ServerPermissionUpdateManyArgs>(
      args: SelectSubset<T, ServerPermissionUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more ServerPermissions and returns the data updated in the database.
     * @param {ServerPermissionUpdateManyAndReturnArgs} args - Arguments to update many ServerPermissions.
     * @example
     * // Update many ServerPermissions
     * const serverPermission = await prisma.serverPermission.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ServerPermissions and only return the `id`
     * const serverPermissionWithIdOnly = await prisma.serverPermission.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ServerPermissionUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ServerPermissionUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Create or update one ServerPermission.
     * @param {ServerPermissionUpsertArgs} args - Arguments to update or create a ServerPermission.
     * @example
     * // Update or create a ServerPermission
     * const serverPermission = await prisma.serverPermission.upsert({
     *   create: {
     *     // ... data to create a ServerPermission
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ServerPermission we want to update
     *   }
     * })
     */
    upsert<T extends ServerPermissionUpsertArgs>(
      args: SelectSubset<T, ServerPermissionUpsertArgs<ExtArgs>>,
    ): Prisma__ServerPermissionClient<
      $Result.GetResult<Prisma.$ServerPermissionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of ServerPermissions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServerPermissionCountArgs} args - Arguments to filter ServerPermissions to count.
     * @example
     * // Count the number of ServerPermissions
     * const count = await prisma.serverPermission.count({
     *   where: {
     *     // ... the filter for the ServerPermissions we want to count
     *   }
     * })
     **/
    count<T extends ServerPermissionCountArgs>(
      args?: Subset<T, ServerPermissionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], ServerPermissionCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a ServerPermission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServerPermissionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ServerPermissionAggregateArgs>(
      args: Subset<T, ServerPermissionAggregateArgs>,
    ): Prisma.PrismaPromise<GetServerPermissionAggregateType<T>>;

    /**
     * Group by ServerPermission.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServerPermissionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ServerPermissionGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ServerPermissionGroupByArgs["orderBy"] }
        : { orderBy?: ServerPermissionGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ServerPermissionGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetServerPermissionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ServerPermission model
     */
    readonly fields: ServerPermissionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ServerPermission.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ServerPermissionClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the ServerPermission model
   */
  interface ServerPermissionFieldRefs {
    readonly id: FieldRef<"ServerPermission", "Int">;
    readonly serverId: FieldRef<"ServerPermission", "String">;
    readonly discordUserId: FieldRef<"ServerPermission", "String">;
    readonly permission: FieldRef<"ServerPermission", "String">;
    readonly grantedBy: FieldRef<"ServerPermission", "String">;
    readonly grantedAt: FieldRef<"ServerPermission", "DateTime">;
  }

  // Custom InputTypes
  /**
   * ServerPermission findUnique
   */
  export type ServerPermissionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * Filter, which ServerPermission to fetch.
     */
    where: ServerPermissionWhereUniqueInput;
  };

  /**
   * ServerPermission findUniqueOrThrow
   */
  export type ServerPermissionFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * Filter, which ServerPermission to fetch.
     */
    where: ServerPermissionWhereUniqueInput;
  };

  /**
   * ServerPermission findFirst
   */
  export type ServerPermissionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * Filter, which ServerPermission to fetch.
     */
    where?: ServerPermissionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ServerPermissions to fetch.
     */
    orderBy?: ServerPermissionOrderByWithRelationInput | ServerPermissionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ServerPermissions.
     */
    cursor?: ServerPermissionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ServerPermissions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ServerPermissions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ServerPermissions.
     */
    distinct?: ServerPermissionScalarFieldEnum | ServerPermissionScalarFieldEnum[];
  };

  /**
   * ServerPermission findFirstOrThrow
   */
  export type ServerPermissionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the ServerPermission
       */
      select?: ServerPermissionSelect<ExtArgs> | null;
      /**
       * Omit specific fields from the ServerPermission
       */
      omit?: ServerPermissionOmit<ExtArgs> | null;
      /**
       * Filter, which ServerPermission to fetch.
       */
      where?: ServerPermissionWhereInput;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
       *
       * Determine the order of ServerPermissions to fetch.
       */
      orderBy?: ServerPermissionOrderByWithRelationInput | ServerPermissionOrderByWithRelationInput[];
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
       *
       * Sets the position for searching for ServerPermissions.
       */
      cursor?: ServerPermissionWhereUniqueInput;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
       *
       * Take `±n` ServerPermissions from the position of the cursor.
       */
      take?: number;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
       *
       * Skip the first `n` ServerPermissions.
       */
      skip?: number;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
       *
       * Filter by unique combinations of ServerPermissions.
       */
      distinct?: ServerPermissionScalarFieldEnum | ServerPermissionScalarFieldEnum[];
    };

  /**
   * ServerPermission findMany
   */
  export type ServerPermissionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * Filter, which ServerPermissions to fetch.
     */
    where?: ServerPermissionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ServerPermissions to fetch.
     */
    orderBy?: ServerPermissionOrderByWithRelationInput | ServerPermissionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ServerPermissions.
     */
    cursor?: ServerPermissionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ServerPermissions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ServerPermissions.
     */
    skip?: number;
    distinct?: ServerPermissionScalarFieldEnum | ServerPermissionScalarFieldEnum[];
  };

  /**
   * ServerPermission create
   */
  export type ServerPermissionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * The data needed to create a ServerPermission.
     */
    data: XOR<ServerPermissionCreateInput, ServerPermissionUncheckedCreateInput>;
  };

  /**
   * ServerPermission createMany
   */
  export type ServerPermissionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ServerPermissions.
     */
    data: ServerPermissionCreateManyInput | ServerPermissionCreateManyInput[];
  };

  /**
   * ServerPermission createManyAndReturn
   */
  export type ServerPermissionCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * The data used to create many ServerPermissions.
     */
    data: ServerPermissionCreateManyInput | ServerPermissionCreateManyInput[];
  };

  /**
   * ServerPermission update
   */
  export type ServerPermissionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * The data needed to update a ServerPermission.
     */
    data: XOR<ServerPermissionUpdateInput, ServerPermissionUncheckedUpdateInput>;
    /**
     * Choose, which ServerPermission to update.
     */
    where: ServerPermissionWhereUniqueInput;
  };

  /**
   * ServerPermission updateMany
   */
  export type ServerPermissionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ServerPermissions.
     */
    data: XOR<ServerPermissionUpdateManyMutationInput, ServerPermissionUncheckedUpdateManyInput>;
    /**
     * Filter which ServerPermissions to update
     */
    where?: ServerPermissionWhereInput;
    /**
     * Limit how many ServerPermissions to update.
     */
    limit?: number;
  };

  /**
   * ServerPermission updateManyAndReturn
   */
  export type ServerPermissionUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * The data used to update ServerPermissions.
     */
    data: XOR<ServerPermissionUpdateManyMutationInput, ServerPermissionUncheckedUpdateManyInput>;
    /**
     * Filter which ServerPermissions to update
     */
    where?: ServerPermissionWhereInput;
    /**
     * Limit how many ServerPermissions to update.
     */
    limit?: number;
  };

  /**
   * ServerPermission upsert
   */
  export type ServerPermissionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * The filter to search for the ServerPermission to update in case it exists.
     */
    where: ServerPermissionWhereUniqueInput;
    /**
     * In case the ServerPermission found by the `where` argument doesn't exist, create a new ServerPermission with this data.
     */
    create: XOR<ServerPermissionCreateInput, ServerPermissionUncheckedCreateInput>;
    /**
     * In case the ServerPermission was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ServerPermissionUpdateInput, ServerPermissionUncheckedUpdateInput>;
  };

  /**
   * ServerPermission delete
   */
  export type ServerPermissionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
    /**
     * Filter which ServerPermission to delete.
     */
    where: ServerPermissionWhereUniqueInput;
  };

  /**
   * ServerPermission deleteMany
   */
  export type ServerPermissionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ServerPermissions to delete
     */
    where?: ServerPermissionWhereInput;
    /**
     * Limit how many ServerPermissions to delete.
     */
    limit?: number;
  };

  /**
   * ServerPermission without action
   */
  export type ServerPermissionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServerPermission
     */
    select?: ServerPermissionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ServerPermission
     */
    omit?: ServerPermissionOmit<ExtArgs> | null;
  };

  /**
   * Model GuildPermissionError
   */

  export type AggregateGuildPermissionError = {
    _count: GuildPermissionErrorCountAggregateOutputType | null;
    _avg: GuildPermissionErrorAvgAggregateOutputType | null;
    _sum: GuildPermissionErrorSumAggregateOutputType | null;
    _min: GuildPermissionErrorMinAggregateOutputType | null;
    _max: GuildPermissionErrorMaxAggregateOutputType | null;
  };

  export type GuildPermissionErrorAvgAggregateOutputType = {
    id: number | null;
    consecutiveErrorCount: number | null;
  };

  export type GuildPermissionErrorSumAggregateOutputType = {
    id: number | null;
    consecutiveErrorCount: number | null;
  };

  export type GuildPermissionErrorMinAggregateOutputType = {
    id: number | null;
    serverId: string | null;
    channelId: string | null;
    errorType: string | null;
    errorReason: string | null;
    firstOccurrence: Date | null;
    lastOccurrence: Date | null;
    consecutiveErrorCount: number | null;
    lastSuccessfulSend: Date | null;
    ownerNotified: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type GuildPermissionErrorMaxAggregateOutputType = {
    id: number | null;
    serverId: string | null;
    channelId: string | null;
    errorType: string | null;
    errorReason: string | null;
    firstOccurrence: Date | null;
    lastOccurrence: Date | null;
    consecutiveErrorCount: number | null;
    lastSuccessfulSend: Date | null;
    ownerNotified: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type GuildPermissionErrorCountAggregateOutputType = {
    id: number;
    serverId: number;
    channelId: number;
    errorType: number;
    errorReason: number;
    firstOccurrence: number;
    lastOccurrence: number;
    consecutiveErrorCount: number;
    lastSuccessfulSend: number;
    ownerNotified: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type GuildPermissionErrorAvgAggregateInputType = {
    id?: true;
    consecutiveErrorCount?: true;
  };

  export type GuildPermissionErrorSumAggregateInputType = {
    id?: true;
    consecutiveErrorCount?: true;
  };

  export type GuildPermissionErrorMinAggregateInputType = {
    id?: true;
    serverId?: true;
    channelId?: true;
    errorType?: true;
    errorReason?: true;
    firstOccurrence?: true;
    lastOccurrence?: true;
    consecutiveErrorCount?: true;
    lastSuccessfulSend?: true;
    ownerNotified?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type GuildPermissionErrorMaxAggregateInputType = {
    id?: true;
    serverId?: true;
    channelId?: true;
    errorType?: true;
    errorReason?: true;
    firstOccurrence?: true;
    lastOccurrence?: true;
    consecutiveErrorCount?: true;
    lastSuccessfulSend?: true;
    ownerNotified?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type GuildPermissionErrorCountAggregateInputType = {
    id?: true;
    serverId?: true;
    channelId?: true;
    errorType?: true;
    errorReason?: true;
    firstOccurrence?: true;
    lastOccurrence?: true;
    consecutiveErrorCount?: true;
    lastSuccessfulSend?: true;
    ownerNotified?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type GuildPermissionErrorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GuildPermissionError to aggregate.
     */
    where?: GuildPermissionErrorWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of GuildPermissionErrors to fetch.
     */
    orderBy?: GuildPermissionErrorOrderByWithRelationInput | GuildPermissionErrorOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: GuildPermissionErrorWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` GuildPermissionErrors from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` GuildPermissionErrors.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned GuildPermissionErrors
     **/
    _count?: true | GuildPermissionErrorCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: GuildPermissionErrorAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: GuildPermissionErrorSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: GuildPermissionErrorMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: GuildPermissionErrorMaxAggregateInputType;
  };

  export type GetGuildPermissionErrorAggregateType<T extends GuildPermissionErrorAggregateArgs> = {
    [P in keyof T & keyof AggregateGuildPermissionError]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGuildPermissionError[P]>
      : GetScalarType<T[P], AggregateGuildPermissionError[P]>;
  };

  export type GuildPermissionErrorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GuildPermissionErrorWhereInput;
    orderBy?: GuildPermissionErrorOrderByWithAggregationInput | GuildPermissionErrorOrderByWithAggregationInput[];
    by: GuildPermissionErrorScalarFieldEnum[] | GuildPermissionErrorScalarFieldEnum;
    having?: GuildPermissionErrorScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: GuildPermissionErrorCountAggregateInputType | true;
    _avg?: GuildPermissionErrorAvgAggregateInputType;
    _sum?: GuildPermissionErrorSumAggregateInputType;
    _min?: GuildPermissionErrorMinAggregateInputType;
    _max?: GuildPermissionErrorMaxAggregateInputType;
  };

  export type GuildPermissionErrorGroupByOutputType = {
    id: number;
    serverId: string;
    channelId: string;
    errorType: string;
    errorReason: string | null;
    firstOccurrence: Date;
    lastOccurrence: Date;
    consecutiveErrorCount: number;
    lastSuccessfulSend: Date | null;
    ownerNotified: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: GuildPermissionErrorCountAggregateOutputType | null;
    _avg: GuildPermissionErrorAvgAggregateOutputType | null;
    _sum: GuildPermissionErrorSumAggregateOutputType | null;
    _min: GuildPermissionErrorMinAggregateOutputType | null;
    _max: GuildPermissionErrorMaxAggregateOutputType | null;
  };

  type GetGuildPermissionErrorGroupByPayload<T extends GuildPermissionErrorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GuildPermissionErrorGroupByOutputType, T["by"]> & {
        [P in keyof T & keyof GuildPermissionErrorGroupByOutputType]: P extends "_count"
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], GuildPermissionErrorGroupByOutputType[P]>
          : GetScalarType<T[P], GuildPermissionErrorGroupByOutputType[P]>;
      }
    >
  >;

  export type GuildPermissionErrorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        serverId?: boolean;
        channelId?: boolean;
        errorType?: boolean;
        errorReason?: boolean;
        firstOccurrence?: boolean;
        lastOccurrence?: boolean;
        consecutiveErrorCount?: boolean;
        lastSuccessfulSend?: boolean;
        ownerNotified?: boolean;
        createdAt?: boolean;
        updatedAt?: boolean;
      },
      ExtArgs["result"]["guildPermissionError"]
    >;

  export type GuildPermissionErrorSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      serverId?: boolean;
      channelId?: boolean;
      errorType?: boolean;
      errorReason?: boolean;
      firstOccurrence?: boolean;
      lastOccurrence?: boolean;
      consecutiveErrorCount?: boolean;
      lastSuccessfulSend?: boolean;
      ownerNotified?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
    },
    ExtArgs["result"]["guildPermissionError"]
  >;

  export type GuildPermissionErrorSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      serverId?: boolean;
      channelId?: boolean;
      errorType?: boolean;
      errorReason?: boolean;
      firstOccurrence?: boolean;
      lastOccurrence?: boolean;
      consecutiveErrorCount?: boolean;
      lastSuccessfulSend?: boolean;
      ownerNotified?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
    },
    ExtArgs["result"]["guildPermissionError"]
  >;

  export type GuildPermissionErrorSelectScalar = {
    id?: boolean;
    serverId?: boolean;
    channelId?: boolean;
    errorType?: boolean;
    errorReason?: boolean;
    firstOccurrence?: boolean;
    lastOccurrence?: boolean;
    consecutiveErrorCount?: boolean;
    lastSuccessfulSend?: boolean;
    ownerNotified?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type GuildPermissionErrorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetOmit<
      | "id"
      | "serverId"
      | "channelId"
      | "errorType"
      | "errorReason"
      | "firstOccurrence"
      | "lastOccurrence"
      | "consecutiveErrorCount"
      | "lastSuccessfulSend"
      | "ownerNotified"
      | "createdAt"
      | "updatedAt",
      ExtArgs["result"]["guildPermissionError"]
    >;

  export type $GuildPermissionErrorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "GuildPermissionError";
    objects: {};
    scalars: $Extensions.GetPayloadResult<
      {
        id: number;
        serverId: string;
        channelId: string;
        errorType: string;
        errorReason: string | null;
        firstOccurrence: Date;
        lastOccurrence: Date;
        consecutiveErrorCount: number;
        lastSuccessfulSend: Date | null;
        ownerNotified: boolean;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs["result"]["guildPermissionError"]
    >;
    composites: {};
  };

  type GuildPermissionErrorGetPayload<S extends boolean | null | undefined | GuildPermissionErrorDefaultArgs> =
    $Result.GetResult<Prisma.$GuildPermissionErrorPayload, S>;

  type GuildPermissionErrorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    GuildPermissionErrorFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: GuildPermissionErrorCountAggregateInputType | true;
  };

  export interface GuildPermissionErrorDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["GuildPermissionError"];
      meta: { name: "GuildPermissionError" };
    };
    /**
     * Find zero or one GuildPermissionError that matches the filter.
     * @param {GuildPermissionErrorFindUniqueArgs} args - Arguments to find a GuildPermissionError
     * @example
     * // Get one GuildPermissionError
     * const guildPermissionError = await prisma.guildPermissionError.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GuildPermissionErrorFindUniqueArgs>(
      args: SelectSubset<T, GuildPermissionErrorFindUniqueArgs<ExtArgs>>,
    ): Prisma__GuildPermissionErrorClient<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one GuildPermissionError that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GuildPermissionErrorFindUniqueOrThrowArgs} args - Arguments to find a GuildPermissionError
     * @example
     * // Get one GuildPermissionError
     * const guildPermissionError = await prisma.guildPermissionError.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GuildPermissionErrorFindUniqueOrThrowArgs>(
      args: SelectSubset<T, GuildPermissionErrorFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__GuildPermissionErrorClient<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first GuildPermissionError that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildPermissionErrorFindFirstArgs} args - Arguments to find a GuildPermissionError
     * @example
     * // Get one GuildPermissionError
     * const guildPermissionError = await prisma.guildPermissionError.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GuildPermissionErrorFindFirstArgs>(
      args?: SelectSubset<T, GuildPermissionErrorFindFirstArgs<ExtArgs>>,
    ): Prisma__GuildPermissionErrorClient<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first GuildPermissionError that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildPermissionErrorFindFirstOrThrowArgs} args - Arguments to find a GuildPermissionError
     * @example
     * // Get one GuildPermissionError
     * const guildPermissionError = await prisma.guildPermissionError.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GuildPermissionErrorFindFirstOrThrowArgs>(
      args?: SelectSubset<T, GuildPermissionErrorFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__GuildPermissionErrorClient<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more GuildPermissionErrors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildPermissionErrorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all GuildPermissionErrors
     * const guildPermissionErrors = await prisma.guildPermissionError.findMany()
     *
     * // Get first 10 GuildPermissionErrors
     * const guildPermissionErrors = await prisma.guildPermissionError.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const guildPermissionErrorWithIdOnly = await prisma.guildPermissionError.findMany({ select: { id: true } })
     *
     */
    findMany<T extends GuildPermissionErrorFindManyArgs>(
      args?: SelectSubset<T, GuildPermissionErrorFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>
    >;

    /**
     * Create a GuildPermissionError.
     * @param {GuildPermissionErrorCreateArgs} args - Arguments to create a GuildPermissionError.
     * @example
     * // Create one GuildPermissionError
     * const GuildPermissionError = await prisma.guildPermissionError.create({
     *   data: {
     *     // ... data to create a GuildPermissionError
     *   }
     * })
     *
     */
    create<T extends GuildPermissionErrorCreateArgs>(
      args: SelectSubset<T, GuildPermissionErrorCreateArgs<ExtArgs>>,
    ): Prisma__GuildPermissionErrorClient<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "create", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many GuildPermissionErrors.
     * @param {GuildPermissionErrorCreateManyArgs} args - Arguments to create many GuildPermissionErrors.
     * @example
     * // Create many GuildPermissionErrors
     * const guildPermissionError = await prisma.guildPermissionError.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends GuildPermissionErrorCreateManyArgs>(
      args?: SelectSubset<T, GuildPermissionErrorCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many GuildPermissionErrors and returns the data saved in the database.
     * @param {GuildPermissionErrorCreateManyAndReturnArgs} args - Arguments to create many GuildPermissionErrors.
     * @example
     * // Create many GuildPermissionErrors
     * const guildPermissionError = await prisma.guildPermissionError.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many GuildPermissionErrors and only return the `id`
     * const guildPermissionErrorWithIdOnly = await prisma.guildPermissionError.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends GuildPermissionErrorCreateManyAndReturnArgs>(
      args?: SelectSubset<T, GuildPermissionErrorCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Delete a GuildPermissionError.
     * @param {GuildPermissionErrorDeleteArgs} args - Arguments to delete one GuildPermissionError.
     * @example
     * // Delete one GuildPermissionError
     * const GuildPermissionError = await prisma.guildPermissionError.delete({
     *   where: {
     *     // ... filter to delete one GuildPermissionError
     *   }
     * })
     *
     */
    delete<T extends GuildPermissionErrorDeleteArgs>(
      args: SelectSubset<T, GuildPermissionErrorDeleteArgs<ExtArgs>>,
    ): Prisma__GuildPermissionErrorClient<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one GuildPermissionError.
     * @param {GuildPermissionErrorUpdateArgs} args - Arguments to update one GuildPermissionError.
     * @example
     * // Update one GuildPermissionError
     * const guildPermissionError = await prisma.guildPermissionError.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends GuildPermissionErrorUpdateArgs>(
      args: SelectSubset<T, GuildPermissionErrorUpdateArgs<ExtArgs>>,
    ): Prisma__GuildPermissionErrorClient<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "update", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more GuildPermissionErrors.
     * @param {GuildPermissionErrorDeleteManyArgs} args - Arguments to filter GuildPermissionErrors to delete.
     * @example
     * // Delete a few GuildPermissionErrors
     * const { count } = await prisma.guildPermissionError.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends GuildPermissionErrorDeleteManyArgs>(
      args?: SelectSubset<T, GuildPermissionErrorDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more GuildPermissionErrors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildPermissionErrorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many GuildPermissionErrors
     * const guildPermissionError = await prisma.guildPermissionError.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends GuildPermissionErrorUpdateManyArgs>(
      args: SelectSubset<T, GuildPermissionErrorUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more GuildPermissionErrors and returns the data updated in the database.
     * @param {GuildPermissionErrorUpdateManyAndReturnArgs} args - Arguments to update many GuildPermissionErrors.
     * @example
     * // Update many GuildPermissionErrors
     * const guildPermissionError = await prisma.guildPermissionError.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more GuildPermissionErrors and only return the `id`
     * const guildPermissionErrorWithIdOnly = await prisma.guildPermissionError.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends GuildPermissionErrorUpdateManyAndReturnArgs>(
      args: SelectSubset<T, GuildPermissionErrorUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>
    >;

    /**
     * Create or update one GuildPermissionError.
     * @param {GuildPermissionErrorUpsertArgs} args - Arguments to update or create a GuildPermissionError.
     * @example
     * // Update or create a GuildPermissionError
     * const guildPermissionError = await prisma.guildPermissionError.upsert({
     *   create: {
     *     // ... data to create a GuildPermissionError
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the GuildPermissionError we want to update
     *   }
     * })
     */
    upsert<T extends GuildPermissionErrorUpsertArgs>(
      args: SelectSubset<T, GuildPermissionErrorUpsertArgs<ExtArgs>>,
    ): Prisma__GuildPermissionErrorClient<
      $Result.GetResult<Prisma.$GuildPermissionErrorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of GuildPermissionErrors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildPermissionErrorCountArgs} args - Arguments to filter GuildPermissionErrors to count.
     * @example
     * // Count the number of GuildPermissionErrors
     * const count = await prisma.guildPermissionError.count({
     *   where: {
     *     // ... the filter for the GuildPermissionErrors we want to count
     *   }
     * })
     **/
    count<T extends GuildPermissionErrorCountArgs>(
      args?: Subset<T, GuildPermissionErrorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], GuildPermissionErrorCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a GuildPermissionError.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildPermissionErrorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends GuildPermissionErrorAggregateArgs>(
      args: Subset<T, GuildPermissionErrorAggregateArgs>,
    ): Prisma.PrismaPromise<GetGuildPermissionErrorAggregateType<T>>;

    /**
     * Group by GuildPermissionError.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildPermissionErrorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends GuildPermissionErrorGroupByArgs,
      HasSelectOrTake extends Or<Extends<"skip", Keys<T>>, Extends<"take", Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GuildPermissionErrorGroupByArgs["orderBy"] }
        : { orderBy?: GuildPermissionErrorGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T["orderBy"]>>>,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, "Field ", P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, GuildPermissionErrorGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetGuildPermissionErrorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the GuildPermissionError model
     */
    readonly fields: GuildPermissionErrorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for GuildPermissionError.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GuildPermissionErrorClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the GuildPermissionError model
   */
  interface GuildPermissionErrorFieldRefs {
    readonly id: FieldRef<"GuildPermissionError", "Int">;
    readonly serverId: FieldRef<"GuildPermissionError", "String">;
    readonly channelId: FieldRef<"GuildPermissionError", "String">;
    readonly errorType: FieldRef<"GuildPermissionError", "String">;
    readonly errorReason: FieldRef<"GuildPermissionError", "String">;
    readonly firstOccurrence: FieldRef<"GuildPermissionError", "DateTime">;
    readonly lastOccurrence: FieldRef<"GuildPermissionError", "DateTime">;
    readonly consecutiveErrorCount: FieldRef<"GuildPermissionError", "Int">;
    readonly lastSuccessfulSend: FieldRef<"GuildPermissionError", "DateTime">;
    readonly ownerNotified: FieldRef<"GuildPermissionError", "Boolean">;
    readonly createdAt: FieldRef<"GuildPermissionError", "DateTime">;
    readonly updatedAt: FieldRef<"GuildPermissionError", "DateTime">;
  }

  // Custom InputTypes
  /**
   * GuildPermissionError findUnique
   */
  export type GuildPermissionErrorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * Filter, which GuildPermissionError to fetch.
     */
    where: GuildPermissionErrorWhereUniqueInput;
  };

  /**
   * GuildPermissionError findUniqueOrThrow
   */
  export type GuildPermissionErrorFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * Filter, which GuildPermissionError to fetch.
     */
    where: GuildPermissionErrorWhereUniqueInput;
  };

  /**
   * GuildPermissionError findFirst
   */
  export type GuildPermissionErrorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * Filter, which GuildPermissionError to fetch.
     */
    where?: GuildPermissionErrorWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of GuildPermissionErrors to fetch.
     */
    orderBy?: GuildPermissionErrorOrderByWithRelationInput | GuildPermissionErrorOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for GuildPermissionErrors.
     */
    cursor?: GuildPermissionErrorWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` GuildPermissionErrors from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` GuildPermissionErrors.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of GuildPermissionErrors.
     */
    distinct?: GuildPermissionErrorScalarFieldEnum | GuildPermissionErrorScalarFieldEnum[];
  };

  /**
   * GuildPermissionError findFirstOrThrow
   */
  export type GuildPermissionErrorFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * Filter, which GuildPermissionError to fetch.
     */
    where?: GuildPermissionErrorWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of GuildPermissionErrors to fetch.
     */
    orderBy?: GuildPermissionErrorOrderByWithRelationInput | GuildPermissionErrorOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for GuildPermissionErrors.
     */
    cursor?: GuildPermissionErrorWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` GuildPermissionErrors from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` GuildPermissionErrors.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of GuildPermissionErrors.
     */
    distinct?: GuildPermissionErrorScalarFieldEnum | GuildPermissionErrorScalarFieldEnum[];
  };

  /**
   * GuildPermissionError findMany
   */
  export type GuildPermissionErrorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * Filter, which GuildPermissionErrors to fetch.
     */
    where?: GuildPermissionErrorWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of GuildPermissionErrors to fetch.
     */
    orderBy?: GuildPermissionErrorOrderByWithRelationInput | GuildPermissionErrorOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing GuildPermissionErrors.
     */
    cursor?: GuildPermissionErrorWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` GuildPermissionErrors from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` GuildPermissionErrors.
     */
    skip?: number;
    distinct?: GuildPermissionErrorScalarFieldEnum | GuildPermissionErrorScalarFieldEnum[];
  };

  /**
   * GuildPermissionError create
   */
  export type GuildPermissionErrorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * The data needed to create a GuildPermissionError.
     */
    data: XOR<GuildPermissionErrorCreateInput, GuildPermissionErrorUncheckedCreateInput>;
  };

  /**
   * GuildPermissionError createMany
   */
  export type GuildPermissionErrorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many GuildPermissionErrors.
     */
    data: GuildPermissionErrorCreateManyInput | GuildPermissionErrorCreateManyInput[];
  };

  /**
   * GuildPermissionError createManyAndReturn
   */
  export type GuildPermissionErrorCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * The data used to create many GuildPermissionErrors.
     */
    data: GuildPermissionErrorCreateManyInput | GuildPermissionErrorCreateManyInput[];
  };

  /**
   * GuildPermissionError update
   */
  export type GuildPermissionErrorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * The data needed to update a GuildPermissionError.
     */
    data: XOR<GuildPermissionErrorUpdateInput, GuildPermissionErrorUncheckedUpdateInput>;
    /**
     * Choose, which GuildPermissionError to update.
     */
    where: GuildPermissionErrorWhereUniqueInput;
  };

  /**
   * GuildPermissionError updateMany
   */
  export type GuildPermissionErrorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update GuildPermissionErrors.
     */
    data: XOR<GuildPermissionErrorUpdateManyMutationInput, GuildPermissionErrorUncheckedUpdateManyInput>;
    /**
     * Filter which GuildPermissionErrors to update
     */
    where?: GuildPermissionErrorWhereInput;
    /**
     * Limit how many GuildPermissionErrors to update.
     */
    limit?: number;
  };

  /**
   * GuildPermissionError updateManyAndReturn
   */
  export type GuildPermissionErrorUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * The data used to update GuildPermissionErrors.
     */
    data: XOR<GuildPermissionErrorUpdateManyMutationInput, GuildPermissionErrorUncheckedUpdateManyInput>;
    /**
     * Filter which GuildPermissionErrors to update
     */
    where?: GuildPermissionErrorWhereInput;
    /**
     * Limit how many GuildPermissionErrors to update.
     */
    limit?: number;
  };

  /**
   * GuildPermissionError upsert
   */
  export type GuildPermissionErrorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * The filter to search for the GuildPermissionError to update in case it exists.
     */
    where: GuildPermissionErrorWhereUniqueInput;
    /**
     * In case the GuildPermissionError found by the `where` argument doesn't exist, create a new GuildPermissionError with this data.
     */
    create: XOR<GuildPermissionErrorCreateInput, GuildPermissionErrorUncheckedCreateInput>;
    /**
     * In case the GuildPermissionError was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GuildPermissionErrorUpdateInput, GuildPermissionErrorUncheckedUpdateInput>;
  };

  /**
   * GuildPermissionError delete
   */
  export type GuildPermissionErrorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
    /**
     * Filter which GuildPermissionError to delete.
     */
    where: GuildPermissionErrorWhereUniqueInput;
  };

  /**
   * GuildPermissionError deleteMany
   */
  export type GuildPermissionErrorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which GuildPermissionErrors to delete
     */
    where?: GuildPermissionErrorWhereInput;
    /**
     * Limit how many GuildPermissionErrors to delete.
     */
    limit?: number;
  };

  /**
   * GuildPermissionError without action
   */
  export type GuildPermissionErrorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildPermissionError
     */
    select?: GuildPermissionErrorSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the GuildPermissionError
     */
    omit?: GuildPermissionErrorOmit<ExtArgs> | null;
  };

  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: "Serializable";
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];

  export const SubscriptionScalarFieldEnum: {
    id: "id";
    playerId: "playerId";
    channelId: "channelId";
    serverId: "serverId";
    creatorDiscordId: "creatorDiscordId";
    createdTime: "createdTime";
    updatedTime: "updatedTime";
  };

  export type SubscriptionScalarFieldEnum =
    (typeof SubscriptionScalarFieldEnum)[keyof typeof SubscriptionScalarFieldEnum];

  export const PlayerScalarFieldEnum: {
    id: "id";
    alias: "alias";
    discordId: "discordId";
    serverId: "serverId";
    creatorDiscordId: "creatorDiscordId";
    createdTime: "createdTime";
    updatedTime: "updatedTime";
  };

  export type PlayerScalarFieldEnum = (typeof PlayerScalarFieldEnum)[keyof typeof PlayerScalarFieldEnum];

  export const AccountScalarFieldEnum: {
    id: "id";
    alias: "alias";
    puuid: "puuid";
    region: "region";
    playerId: "playerId";
    lastProcessedMatchId: "lastProcessedMatchId";
    lastMatchTime: "lastMatchTime";
    lastCheckedAt: "lastCheckedAt";
    serverId: "serverId";
    creatorDiscordId: "creatorDiscordId";
    createdTime: "createdTime";
    updatedTime: "updatedTime";
  };

  export type AccountScalarFieldEnum = (typeof AccountScalarFieldEnum)[keyof typeof AccountScalarFieldEnum];

  export const CompetitionScalarFieldEnum: {
    id: "id";
    serverId: "serverId";
    ownerId: "ownerId";
    title: "title";
    description: "description";
    channelId: "channelId";
    isCancelled: "isCancelled";
    visibility: "visibility";
    criteriaType: "criteriaType";
    criteriaConfig: "criteriaConfig";
    maxParticipants: "maxParticipants";
    startDate: "startDate";
    endDate: "endDate";
    seasonId: "seasonId";
    startProcessedAt: "startProcessedAt";
    endProcessedAt: "endProcessedAt";
    creatorDiscordId: "creatorDiscordId";
    createdTime: "createdTime";
    updatedTime: "updatedTime";
  };

  export type CompetitionScalarFieldEnum = (typeof CompetitionScalarFieldEnum)[keyof typeof CompetitionScalarFieldEnum];

  export const CompetitionParticipantScalarFieldEnum: {
    id: "id";
    competitionId: "competitionId";
    playerId: "playerId";
    status: "status";
    invitedBy: "invitedBy";
    invitedAt: "invitedAt";
    joinedAt: "joinedAt";
    leftAt: "leftAt";
  };

  export type CompetitionParticipantScalarFieldEnum =
    (typeof CompetitionParticipantScalarFieldEnum)[keyof typeof CompetitionParticipantScalarFieldEnum];

  export const CompetitionSnapshotScalarFieldEnum: {
    id: "id";
    competitionId: "competitionId";
    playerId: "playerId";
    snapshotType: "snapshotType";
    snapshotData: "snapshotData";
    snapshotTime: "snapshotTime";
  };

  export type CompetitionSnapshotScalarFieldEnum =
    (typeof CompetitionSnapshotScalarFieldEnum)[keyof typeof CompetitionSnapshotScalarFieldEnum];

  export const ServerPermissionScalarFieldEnum: {
    id: "id";
    serverId: "serverId";
    discordUserId: "discordUserId";
    permission: "permission";
    grantedBy: "grantedBy";
    grantedAt: "grantedAt";
  };

  export type ServerPermissionScalarFieldEnum =
    (typeof ServerPermissionScalarFieldEnum)[keyof typeof ServerPermissionScalarFieldEnum];

  export const GuildPermissionErrorScalarFieldEnum: {
    id: "id";
    serverId: "serverId";
    channelId: "channelId";
    errorType: "errorType";
    errorReason: "errorReason";
    firstOccurrence: "firstOccurrence";
    lastOccurrence: "lastOccurrence";
    consecutiveErrorCount: "consecutiveErrorCount";
    lastSuccessfulSend: "lastSuccessfulSend";
    ownerNotified: "ownerNotified";
    createdAt: "createdAt";
    updatedAt: "updatedAt";
  };

  export type GuildPermissionErrorScalarFieldEnum =
    (typeof GuildPermissionErrorScalarFieldEnum)[keyof typeof GuildPermissionErrorScalarFieldEnum];

  export const SortOrder: {
    asc: "asc";
    desc: "desc";
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

  export const NullsOrder: {
    first: "first";
    last: "last";
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];

  /**
   * Field references
   */

  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, "Int">;

  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, "String">;

  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, "DateTime">;

  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, "Boolean">;

  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, "Float">;

  /**
   * Deep Input Types
   */

  export type SubscriptionWhereInput = {
    AND?: SubscriptionWhereInput | SubscriptionWhereInput[];
    OR?: SubscriptionWhereInput[];
    NOT?: SubscriptionWhereInput | SubscriptionWhereInput[];
    id?: IntFilter<"Subscription"> | number;
    playerId?: IntFilter<"Subscription"> | number;
    channelId?: StringFilter<"Subscription"> | string;
    serverId?: StringFilter<"Subscription"> | string;
    creatorDiscordId?: StringFilter<"Subscription"> | string;
    createdTime?: DateTimeFilter<"Subscription"> | Date | string;
    updatedTime?: DateTimeFilter<"Subscription"> | Date | string;
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>;
  };

  export type SubscriptionOrderByWithRelationInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    channelId?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
    player?: PlayerOrderByWithRelationInput;
  };

  export type SubscriptionWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      serverId_playerId_channelId?: SubscriptionServerIdPlayerIdChannelIdCompoundUniqueInput;
      AND?: SubscriptionWhereInput | SubscriptionWhereInput[];
      OR?: SubscriptionWhereInput[];
      NOT?: SubscriptionWhereInput | SubscriptionWhereInput[];
      playerId?: IntFilter<"Subscription"> | number;
      channelId?: StringFilter<"Subscription"> | string;
      serverId?: StringFilter<"Subscription"> | string;
      creatorDiscordId?: StringFilter<"Subscription"> | string;
      createdTime?: DateTimeFilter<"Subscription"> | Date | string;
      updatedTime?: DateTimeFilter<"Subscription"> | Date | string;
      player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>;
    },
    "id" | "serverId_playerId_channelId"
  >;

  export type SubscriptionOrderByWithAggregationInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    channelId?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
    _count?: SubscriptionCountOrderByAggregateInput;
    _avg?: SubscriptionAvgOrderByAggregateInput;
    _max?: SubscriptionMaxOrderByAggregateInput;
    _min?: SubscriptionMinOrderByAggregateInput;
    _sum?: SubscriptionSumOrderByAggregateInput;
  };

  export type SubscriptionScalarWhereWithAggregatesInput = {
    AND?: SubscriptionScalarWhereWithAggregatesInput | SubscriptionScalarWhereWithAggregatesInput[];
    OR?: SubscriptionScalarWhereWithAggregatesInput[];
    NOT?: SubscriptionScalarWhereWithAggregatesInput | SubscriptionScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"Subscription"> | number;
    playerId?: IntWithAggregatesFilter<"Subscription"> | number;
    channelId?: StringWithAggregatesFilter<"Subscription"> | string;
    serverId?: StringWithAggregatesFilter<"Subscription"> | string;
    creatorDiscordId?: StringWithAggregatesFilter<"Subscription"> | string;
    createdTime?: DateTimeWithAggregatesFilter<"Subscription"> | Date | string;
    updatedTime?: DateTimeWithAggregatesFilter<"Subscription"> | Date | string;
  };

  export type PlayerWhereInput = {
    AND?: PlayerWhereInput | PlayerWhereInput[];
    OR?: PlayerWhereInput[];
    NOT?: PlayerWhereInput | PlayerWhereInput[];
    id?: IntFilter<"Player"> | number;
    alias?: StringFilter<"Player"> | string;
    discordId?: StringNullableFilter<"Player"> | string | null;
    serverId?: StringFilter<"Player"> | string;
    creatorDiscordId?: StringFilter<"Player"> | string;
    createdTime?: DateTimeFilter<"Player"> | Date | string;
    updatedTime?: DateTimeFilter<"Player"> | Date | string;
    accounts?: AccountListRelationFilter;
    subscriptions?: SubscriptionListRelationFilter;
    competitionParticipants?: CompetitionParticipantListRelationFilter;
    competitionSnapshots?: CompetitionSnapshotListRelationFilter;
  };

  export type PlayerOrderByWithRelationInput = {
    id?: SortOrder;
    alias?: SortOrder;
    discordId?: SortOrderInput | SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
    accounts?: AccountOrderByRelationAggregateInput;
    subscriptions?: SubscriptionOrderByRelationAggregateInput;
    competitionParticipants?: CompetitionParticipantOrderByRelationAggregateInput;
    competitionSnapshots?: CompetitionSnapshotOrderByRelationAggregateInput;
  };

  export type PlayerWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      serverId_alias?: PlayerServerIdAliasCompoundUniqueInput;
      AND?: PlayerWhereInput | PlayerWhereInput[];
      OR?: PlayerWhereInput[];
      NOT?: PlayerWhereInput | PlayerWhereInput[];
      alias?: StringFilter<"Player"> | string;
      discordId?: StringNullableFilter<"Player"> | string | null;
      serverId?: StringFilter<"Player"> | string;
      creatorDiscordId?: StringFilter<"Player"> | string;
      createdTime?: DateTimeFilter<"Player"> | Date | string;
      updatedTime?: DateTimeFilter<"Player"> | Date | string;
      accounts?: AccountListRelationFilter;
      subscriptions?: SubscriptionListRelationFilter;
      competitionParticipants?: CompetitionParticipantListRelationFilter;
      competitionSnapshots?: CompetitionSnapshotListRelationFilter;
    },
    "id" | "serverId_alias"
  >;

  export type PlayerOrderByWithAggregationInput = {
    id?: SortOrder;
    alias?: SortOrder;
    discordId?: SortOrderInput | SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
    _count?: PlayerCountOrderByAggregateInput;
    _avg?: PlayerAvgOrderByAggregateInput;
    _max?: PlayerMaxOrderByAggregateInput;
    _min?: PlayerMinOrderByAggregateInput;
    _sum?: PlayerSumOrderByAggregateInput;
  };

  export type PlayerScalarWhereWithAggregatesInput = {
    AND?: PlayerScalarWhereWithAggregatesInput | PlayerScalarWhereWithAggregatesInput[];
    OR?: PlayerScalarWhereWithAggregatesInput[];
    NOT?: PlayerScalarWhereWithAggregatesInput | PlayerScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"Player"> | number;
    alias?: StringWithAggregatesFilter<"Player"> | string;
    discordId?: StringNullableWithAggregatesFilter<"Player"> | string | null;
    serverId?: StringWithAggregatesFilter<"Player"> | string;
    creatorDiscordId?: StringWithAggregatesFilter<"Player"> | string;
    createdTime?: DateTimeWithAggregatesFilter<"Player"> | Date | string;
    updatedTime?: DateTimeWithAggregatesFilter<"Player"> | Date | string;
  };

  export type AccountWhereInput = {
    AND?: AccountWhereInput | AccountWhereInput[];
    OR?: AccountWhereInput[];
    NOT?: AccountWhereInput | AccountWhereInput[];
    id?: IntFilter<"Account"> | number;
    alias?: StringFilter<"Account"> | string;
    puuid?: StringFilter<"Account"> | string;
    region?: StringFilter<"Account"> | string;
    playerId?: IntFilter<"Account"> | number;
    lastProcessedMatchId?: StringNullableFilter<"Account"> | string | null;
    lastMatchTime?: DateTimeNullableFilter<"Account"> | Date | string | null;
    lastCheckedAt?: DateTimeNullableFilter<"Account"> | Date | string | null;
    serverId?: StringFilter<"Account"> | string;
    creatorDiscordId?: StringFilter<"Account"> | string;
    createdTime?: DateTimeFilter<"Account"> | Date | string;
    updatedTime?: DateTimeFilter<"Account"> | Date | string;
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>;
  };

  export type AccountOrderByWithRelationInput = {
    id?: SortOrder;
    alias?: SortOrder;
    puuid?: SortOrder;
    region?: SortOrder;
    playerId?: SortOrder;
    lastProcessedMatchId?: SortOrderInput | SortOrder;
    lastMatchTime?: SortOrderInput | SortOrder;
    lastCheckedAt?: SortOrderInput | SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
    player?: PlayerOrderByWithRelationInput;
  };

  export type AccountWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      serverId_puuid?: AccountServerIdPuuidCompoundUniqueInput;
      AND?: AccountWhereInput | AccountWhereInput[];
      OR?: AccountWhereInput[];
      NOT?: AccountWhereInput | AccountWhereInput[];
      alias?: StringFilter<"Account"> | string;
      puuid?: StringFilter<"Account"> | string;
      region?: StringFilter<"Account"> | string;
      playerId?: IntFilter<"Account"> | number;
      lastProcessedMatchId?: StringNullableFilter<"Account"> | string | null;
      lastMatchTime?: DateTimeNullableFilter<"Account"> | Date | string | null;
      lastCheckedAt?: DateTimeNullableFilter<"Account"> | Date | string | null;
      serverId?: StringFilter<"Account"> | string;
      creatorDiscordId?: StringFilter<"Account"> | string;
      createdTime?: DateTimeFilter<"Account"> | Date | string;
      updatedTime?: DateTimeFilter<"Account"> | Date | string;
      player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>;
    },
    "id" | "serverId_puuid"
  >;

  export type AccountOrderByWithAggregationInput = {
    id?: SortOrder;
    alias?: SortOrder;
    puuid?: SortOrder;
    region?: SortOrder;
    playerId?: SortOrder;
    lastProcessedMatchId?: SortOrderInput | SortOrder;
    lastMatchTime?: SortOrderInput | SortOrder;
    lastCheckedAt?: SortOrderInput | SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
    _count?: AccountCountOrderByAggregateInput;
    _avg?: AccountAvgOrderByAggregateInput;
    _max?: AccountMaxOrderByAggregateInput;
    _min?: AccountMinOrderByAggregateInput;
    _sum?: AccountSumOrderByAggregateInput;
  };

  export type AccountScalarWhereWithAggregatesInput = {
    AND?: AccountScalarWhereWithAggregatesInput | AccountScalarWhereWithAggregatesInput[];
    OR?: AccountScalarWhereWithAggregatesInput[];
    NOT?: AccountScalarWhereWithAggregatesInput | AccountScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"Account"> | number;
    alias?: StringWithAggregatesFilter<"Account"> | string;
    puuid?: StringWithAggregatesFilter<"Account"> | string;
    region?: StringWithAggregatesFilter<"Account"> | string;
    playerId?: IntWithAggregatesFilter<"Account"> | number;
    lastProcessedMatchId?: StringNullableWithAggregatesFilter<"Account"> | string | null;
    lastMatchTime?: DateTimeNullableWithAggregatesFilter<"Account"> | Date | string | null;
    lastCheckedAt?: DateTimeNullableWithAggregatesFilter<"Account"> | Date | string | null;
    serverId?: StringWithAggregatesFilter<"Account"> | string;
    creatorDiscordId?: StringWithAggregatesFilter<"Account"> | string;
    createdTime?: DateTimeWithAggregatesFilter<"Account"> | Date | string;
    updatedTime?: DateTimeWithAggregatesFilter<"Account"> | Date | string;
  };

  export type CompetitionWhereInput = {
    AND?: CompetitionWhereInput | CompetitionWhereInput[];
    OR?: CompetitionWhereInput[];
    NOT?: CompetitionWhereInput | CompetitionWhereInput[];
    id?: IntFilter<"Competition"> | number;
    serverId?: StringFilter<"Competition"> | string;
    ownerId?: StringFilter<"Competition"> | string;
    title?: StringFilter<"Competition"> | string;
    description?: StringFilter<"Competition"> | string;
    channelId?: StringFilter<"Competition"> | string;
    isCancelled?: BoolFilter<"Competition"> | boolean;
    visibility?: StringFilter<"Competition"> | string;
    criteriaType?: StringFilter<"Competition"> | string;
    criteriaConfig?: StringFilter<"Competition"> | string;
    maxParticipants?: IntFilter<"Competition"> | number;
    startDate?: DateTimeNullableFilter<"Competition"> | Date | string | null;
    endDate?: DateTimeNullableFilter<"Competition"> | Date | string | null;
    seasonId?: StringNullableFilter<"Competition"> | string | null;
    startProcessedAt?: DateTimeNullableFilter<"Competition"> | Date | string | null;
    endProcessedAt?: DateTimeNullableFilter<"Competition"> | Date | string | null;
    creatorDiscordId?: StringFilter<"Competition"> | string;
    createdTime?: DateTimeFilter<"Competition"> | Date | string;
    updatedTime?: DateTimeFilter<"Competition"> | Date | string;
    participants?: CompetitionParticipantListRelationFilter;
    snapshots?: CompetitionSnapshotListRelationFilter;
  };

  export type CompetitionOrderByWithRelationInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    ownerId?: SortOrder;
    title?: SortOrder;
    description?: SortOrder;
    channelId?: SortOrder;
    isCancelled?: SortOrder;
    visibility?: SortOrder;
    criteriaType?: SortOrder;
    criteriaConfig?: SortOrder;
    maxParticipants?: SortOrder;
    startDate?: SortOrderInput | SortOrder;
    endDate?: SortOrderInput | SortOrder;
    seasonId?: SortOrderInput | SortOrder;
    startProcessedAt?: SortOrderInput | SortOrder;
    endProcessedAt?: SortOrderInput | SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
    participants?: CompetitionParticipantOrderByRelationAggregateInput;
    snapshots?: CompetitionSnapshotOrderByRelationAggregateInput;
  };

  export type CompetitionWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      AND?: CompetitionWhereInput | CompetitionWhereInput[];
      OR?: CompetitionWhereInput[];
      NOT?: CompetitionWhereInput | CompetitionWhereInput[];
      serverId?: StringFilter<"Competition"> | string;
      ownerId?: StringFilter<"Competition"> | string;
      title?: StringFilter<"Competition"> | string;
      description?: StringFilter<"Competition"> | string;
      channelId?: StringFilter<"Competition"> | string;
      isCancelled?: BoolFilter<"Competition"> | boolean;
      visibility?: StringFilter<"Competition"> | string;
      criteriaType?: StringFilter<"Competition"> | string;
      criteriaConfig?: StringFilter<"Competition"> | string;
      maxParticipants?: IntFilter<"Competition"> | number;
      startDate?: DateTimeNullableFilter<"Competition"> | Date | string | null;
      endDate?: DateTimeNullableFilter<"Competition"> | Date | string | null;
      seasonId?: StringNullableFilter<"Competition"> | string | null;
      startProcessedAt?: DateTimeNullableFilter<"Competition"> | Date | string | null;
      endProcessedAt?: DateTimeNullableFilter<"Competition"> | Date | string | null;
      creatorDiscordId?: StringFilter<"Competition"> | string;
      createdTime?: DateTimeFilter<"Competition"> | Date | string;
      updatedTime?: DateTimeFilter<"Competition"> | Date | string;
      participants?: CompetitionParticipantListRelationFilter;
      snapshots?: CompetitionSnapshotListRelationFilter;
    },
    "id"
  >;

  export type CompetitionOrderByWithAggregationInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    ownerId?: SortOrder;
    title?: SortOrder;
    description?: SortOrder;
    channelId?: SortOrder;
    isCancelled?: SortOrder;
    visibility?: SortOrder;
    criteriaType?: SortOrder;
    criteriaConfig?: SortOrder;
    maxParticipants?: SortOrder;
    startDate?: SortOrderInput | SortOrder;
    endDate?: SortOrderInput | SortOrder;
    seasonId?: SortOrderInput | SortOrder;
    startProcessedAt?: SortOrderInput | SortOrder;
    endProcessedAt?: SortOrderInput | SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
    _count?: CompetitionCountOrderByAggregateInput;
    _avg?: CompetitionAvgOrderByAggregateInput;
    _max?: CompetitionMaxOrderByAggregateInput;
    _min?: CompetitionMinOrderByAggregateInput;
    _sum?: CompetitionSumOrderByAggregateInput;
  };

  export type CompetitionScalarWhereWithAggregatesInput = {
    AND?: CompetitionScalarWhereWithAggregatesInput | CompetitionScalarWhereWithAggregatesInput[];
    OR?: CompetitionScalarWhereWithAggregatesInput[];
    NOT?: CompetitionScalarWhereWithAggregatesInput | CompetitionScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"Competition"> | number;
    serverId?: StringWithAggregatesFilter<"Competition"> | string;
    ownerId?: StringWithAggregatesFilter<"Competition"> | string;
    title?: StringWithAggregatesFilter<"Competition"> | string;
    description?: StringWithAggregatesFilter<"Competition"> | string;
    channelId?: StringWithAggregatesFilter<"Competition"> | string;
    isCancelled?: BoolWithAggregatesFilter<"Competition"> | boolean;
    visibility?: StringWithAggregatesFilter<"Competition"> | string;
    criteriaType?: StringWithAggregatesFilter<"Competition"> | string;
    criteriaConfig?: StringWithAggregatesFilter<"Competition"> | string;
    maxParticipants?: IntWithAggregatesFilter<"Competition"> | number;
    startDate?: DateTimeNullableWithAggregatesFilter<"Competition"> | Date | string | null;
    endDate?: DateTimeNullableWithAggregatesFilter<"Competition"> | Date | string | null;
    seasonId?: StringNullableWithAggregatesFilter<"Competition"> | string | null;
    startProcessedAt?: DateTimeNullableWithAggregatesFilter<"Competition"> | Date | string | null;
    endProcessedAt?: DateTimeNullableWithAggregatesFilter<"Competition"> | Date | string | null;
    creatorDiscordId?: StringWithAggregatesFilter<"Competition"> | string;
    createdTime?: DateTimeWithAggregatesFilter<"Competition"> | Date | string;
    updatedTime?: DateTimeWithAggregatesFilter<"Competition"> | Date | string;
  };

  export type CompetitionParticipantWhereInput = {
    AND?: CompetitionParticipantWhereInput | CompetitionParticipantWhereInput[];
    OR?: CompetitionParticipantWhereInput[];
    NOT?: CompetitionParticipantWhereInput | CompetitionParticipantWhereInput[];
    id?: IntFilter<"CompetitionParticipant"> | number;
    competitionId?: IntFilter<"CompetitionParticipant"> | number;
    playerId?: IntFilter<"CompetitionParticipant"> | number;
    status?: StringFilter<"CompetitionParticipant"> | string;
    invitedBy?: StringNullableFilter<"CompetitionParticipant"> | string | null;
    invitedAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
    joinedAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
    leftAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
    competition?: XOR<CompetitionScalarRelationFilter, CompetitionWhereInput>;
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>;
  };

  export type CompetitionParticipantOrderByWithRelationInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    status?: SortOrder;
    invitedBy?: SortOrderInput | SortOrder;
    invitedAt?: SortOrderInput | SortOrder;
    joinedAt?: SortOrderInput | SortOrder;
    leftAt?: SortOrderInput | SortOrder;
    competition?: CompetitionOrderByWithRelationInput;
    player?: PlayerOrderByWithRelationInput;
  };

  export type CompetitionParticipantWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      competitionId_playerId?: CompetitionParticipantCompetitionIdPlayerIdCompoundUniqueInput;
      AND?: CompetitionParticipantWhereInput | CompetitionParticipantWhereInput[];
      OR?: CompetitionParticipantWhereInput[];
      NOT?: CompetitionParticipantWhereInput | CompetitionParticipantWhereInput[];
      competitionId?: IntFilter<"CompetitionParticipant"> | number;
      playerId?: IntFilter<"CompetitionParticipant"> | number;
      status?: StringFilter<"CompetitionParticipant"> | string;
      invitedBy?: StringNullableFilter<"CompetitionParticipant"> | string | null;
      invitedAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
      joinedAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
      leftAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
      competition?: XOR<CompetitionScalarRelationFilter, CompetitionWhereInput>;
      player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>;
    },
    "id" | "competitionId_playerId"
  >;

  export type CompetitionParticipantOrderByWithAggregationInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    status?: SortOrder;
    invitedBy?: SortOrderInput | SortOrder;
    invitedAt?: SortOrderInput | SortOrder;
    joinedAt?: SortOrderInput | SortOrder;
    leftAt?: SortOrderInput | SortOrder;
    _count?: CompetitionParticipantCountOrderByAggregateInput;
    _avg?: CompetitionParticipantAvgOrderByAggregateInput;
    _max?: CompetitionParticipantMaxOrderByAggregateInput;
    _min?: CompetitionParticipantMinOrderByAggregateInput;
    _sum?: CompetitionParticipantSumOrderByAggregateInput;
  };

  export type CompetitionParticipantScalarWhereWithAggregatesInput = {
    AND?: CompetitionParticipantScalarWhereWithAggregatesInput | CompetitionParticipantScalarWhereWithAggregatesInput[];
    OR?: CompetitionParticipantScalarWhereWithAggregatesInput[];
    NOT?: CompetitionParticipantScalarWhereWithAggregatesInput | CompetitionParticipantScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"CompetitionParticipant"> | number;
    competitionId?: IntWithAggregatesFilter<"CompetitionParticipant"> | number;
    playerId?: IntWithAggregatesFilter<"CompetitionParticipant"> | number;
    status?: StringWithAggregatesFilter<"CompetitionParticipant"> | string;
    invitedBy?: StringNullableWithAggregatesFilter<"CompetitionParticipant"> | string | null;
    invitedAt?: DateTimeNullableWithAggregatesFilter<"CompetitionParticipant"> | Date | string | null;
    joinedAt?: DateTimeNullableWithAggregatesFilter<"CompetitionParticipant"> | Date | string | null;
    leftAt?: DateTimeNullableWithAggregatesFilter<"CompetitionParticipant"> | Date | string | null;
  };

  export type CompetitionSnapshotWhereInput = {
    AND?: CompetitionSnapshotWhereInput | CompetitionSnapshotWhereInput[];
    OR?: CompetitionSnapshotWhereInput[];
    NOT?: CompetitionSnapshotWhereInput | CompetitionSnapshotWhereInput[];
    id?: IntFilter<"CompetitionSnapshot"> | number;
    competitionId?: IntFilter<"CompetitionSnapshot"> | number;
    playerId?: IntFilter<"CompetitionSnapshot"> | number;
    snapshotType?: StringFilter<"CompetitionSnapshot"> | string;
    snapshotData?: StringFilter<"CompetitionSnapshot"> | string;
    snapshotTime?: DateTimeFilter<"CompetitionSnapshot"> | Date | string;
    competition?: XOR<CompetitionScalarRelationFilter, CompetitionWhereInput>;
    player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>;
  };

  export type CompetitionSnapshotOrderByWithRelationInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    snapshotType?: SortOrder;
    snapshotData?: SortOrder;
    snapshotTime?: SortOrder;
    competition?: CompetitionOrderByWithRelationInput;
    player?: PlayerOrderByWithRelationInput;
  };

  export type CompetitionSnapshotWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      competitionId_playerId_snapshotType?: CompetitionSnapshotCompetitionIdPlayerIdSnapshotTypeCompoundUniqueInput;
      AND?: CompetitionSnapshotWhereInput | CompetitionSnapshotWhereInput[];
      OR?: CompetitionSnapshotWhereInput[];
      NOT?: CompetitionSnapshotWhereInput | CompetitionSnapshotWhereInput[];
      competitionId?: IntFilter<"CompetitionSnapshot"> | number;
      playerId?: IntFilter<"CompetitionSnapshot"> | number;
      snapshotType?: StringFilter<"CompetitionSnapshot"> | string;
      snapshotData?: StringFilter<"CompetitionSnapshot"> | string;
      snapshotTime?: DateTimeFilter<"CompetitionSnapshot"> | Date | string;
      competition?: XOR<CompetitionScalarRelationFilter, CompetitionWhereInput>;
      player?: XOR<PlayerScalarRelationFilter, PlayerWhereInput>;
    },
    "id" | "competitionId_playerId_snapshotType"
  >;

  export type CompetitionSnapshotOrderByWithAggregationInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    snapshotType?: SortOrder;
    snapshotData?: SortOrder;
    snapshotTime?: SortOrder;
    _count?: CompetitionSnapshotCountOrderByAggregateInput;
    _avg?: CompetitionSnapshotAvgOrderByAggregateInput;
    _max?: CompetitionSnapshotMaxOrderByAggregateInput;
    _min?: CompetitionSnapshotMinOrderByAggregateInput;
    _sum?: CompetitionSnapshotSumOrderByAggregateInput;
  };

  export type CompetitionSnapshotScalarWhereWithAggregatesInput = {
    AND?: CompetitionSnapshotScalarWhereWithAggregatesInput | CompetitionSnapshotScalarWhereWithAggregatesInput[];
    OR?: CompetitionSnapshotScalarWhereWithAggregatesInput[];
    NOT?: CompetitionSnapshotScalarWhereWithAggregatesInput | CompetitionSnapshotScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"CompetitionSnapshot"> | number;
    competitionId?: IntWithAggregatesFilter<"CompetitionSnapshot"> | number;
    playerId?: IntWithAggregatesFilter<"CompetitionSnapshot"> | number;
    snapshotType?: StringWithAggregatesFilter<"CompetitionSnapshot"> | string;
    snapshotData?: StringWithAggregatesFilter<"CompetitionSnapshot"> | string;
    snapshotTime?: DateTimeWithAggregatesFilter<"CompetitionSnapshot"> | Date | string;
  };

  export type ServerPermissionWhereInput = {
    AND?: ServerPermissionWhereInput | ServerPermissionWhereInput[];
    OR?: ServerPermissionWhereInput[];
    NOT?: ServerPermissionWhereInput | ServerPermissionWhereInput[];
    id?: IntFilter<"ServerPermission"> | number;
    serverId?: StringFilter<"ServerPermission"> | string;
    discordUserId?: StringFilter<"ServerPermission"> | string;
    permission?: StringFilter<"ServerPermission"> | string;
    grantedBy?: StringFilter<"ServerPermission"> | string;
    grantedAt?: DateTimeFilter<"ServerPermission"> | Date | string;
  };

  export type ServerPermissionOrderByWithRelationInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    discordUserId?: SortOrder;
    permission?: SortOrder;
    grantedBy?: SortOrder;
    grantedAt?: SortOrder;
  };

  export type ServerPermissionWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      serverId_discordUserId_permission?: ServerPermissionServerIdDiscordUserIdPermissionCompoundUniqueInput;
      AND?: ServerPermissionWhereInput | ServerPermissionWhereInput[];
      OR?: ServerPermissionWhereInput[];
      NOT?: ServerPermissionWhereInput | ServerPermissionWhereInput[];
      serverId?: StringFilter<"ServerPermission"> | string;
      discordUserId?: StringFilter<"ServerPermission"> | string;
      permission?: StringFilter<"ServerPermission"> | string;
      grantedBy?: StringFilter<"ServerPermission"> | string;
      grantedAt?: DateTimeFilter<"ServerPermission"> | Date | string;
    },
    "id" | "serverId_discordUserId_permission"
  >;

  export type ServerPermissionOrderByWithAggregationInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    discordUserId?: SortOrder;
    permission?: SortOrder;
    grantedBy?: SortOrder;
    grantedAt?: SortOrder;
    _count?: ServerPermissionCountOrderByAggregateInput;
    _avg?: ServerPermissionAvgOrderByAggregateInput;
    _max?: ServerPermissionMaxOrderByAggregateInput;
    _min?: ServerPermissionMinOrderByAggregateInput;
    _sum?: ServerPermissionSumOrderByAggregateInput;
  };

  export type ServerPermissionScalarWhereWithAggregatesInput = {
    AND?: ServerPermissionScalarWhereWithAggregatesInput | ServerPermissionScalarWhereWithAggregatesInput[];
    OR?: ServerPermissionScalarWhereWithAggregatesInput[];
    NOT?: ServerPermissionScalarWhereWithAggregatesInput | ServerPermissionScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"ServerPermission"> | number;
    serverId?: StringWithAggregatesFilter<"ServerPermission"> | string;
    discordUserId?: StringWithAggregatesFilter<"ServerPermission"> | string;
    permission?: StringWithAggregatesFilter<"ServerPermission"> | string;
    grantedBy?: StringWithAggregatesFilter<"ServerPermission"> | string;
    grantedAt?: DateTimeWithAggregatesFilter<"ServerPermission"> | Date | string;
  };

  export type GuildPermissionErrorWhereInput = {
    AND?: GuildPermissionErrorWhereInput | GuildPermissionErrorWhereInput[];
    OR?: GuildPermissionErrorWhereInput[];
    NOT?: GuildPermissionErrorWhereInput | GuildPermissionErrorWhereInput[];
    id?: IntFilter<"GuildPermissionError"> | number;
    serverId?: StringFilter<"GuildPermissionError"> | string;
    channelId?: StringFilter<"GuildPermissionError"> | string;
    errorType?: StringFilter<"GuildPermissionError"> | string;
    errorReason?: StringNullableFilter<"GuildPermissionError"> | string | null;
    firstOccurrence?: DateTimeFilter<"GuildPermissionError"> | Date | string;
    lastOccurrence?: DateTimeFilter<"GuildPermissionError"> | Date | string;
    consecutiveErrorCount?: IntFilter<"GuildPermissionError"> | number;
    lastSuccessfulSend?: DateTimeNullableFilter<"GuildPermissionError"> | Date | string | null;
    ownerNotified?: BoolFilter<"GuildPermissionError"> | boolean;
    createdAt?: DateTimeFilter<"GuildPermissionError"> | Date | string;
    updatedAt?: DateTimeFilter<"GuildPermissionError"> | Date | string;
  };

  export type GuildPermissionErrorOrderByWithRelationInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    channelId?: SortOrder;
    errorType?: SortOrder;
    errorReason?: SortOrderInput | SortOrder;
    firstOccurrence?: SortOrder;
    lastOccurrence?: SortOrder;
    consecutiveErrorCount?: SortOrder;
    lastSuccessfulSend?: SortOrderInput | SortOrder;
    ownerNotified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type GuildPermissionErrorWhereUniqueInput = Prisma.AtLeast<
    {
      id?: number;
      serverId_channelId?: GuildPermissionErrorServerIdChannelIdCompoundUniqueInput;
      AND?: GuildPermissionErrorWhereInput | GuildPermissionErrorWhereInput[];
      OR?: GuildPermissionErrorWhereInput[];
      NOT?: GuildPermissionErrorWhereInput | GuildPermissionErrorWhereInput[];
      serverId?: StringFilter<"GuildPermissionError"> | string;
      channelId?: StringFilter<"GuildPermissionError"> | string;
      errorType?: StringFilter<"GuildPermissionError"> | string;
      errorReason?: StringNullableFilter<"GuildPermissionError"> | string | null;
      firstOccurrence?: DateTimeFilter<"GuildPermissionError"> | Date | string;
      lastOccurrence?: DateTimeFilter<"GuildPermissionError"> | Date | string;
      consecutiveErrorCount?: IntFilter<"GuildPermissionError"> | number;
      lastSuccessfulSend?: DateTimeNullableFilter<"GuildPermissionError"> | Date | string | null;
      ownerNotified?: BoolFilter<"GuildPermissionError"> | boolean;
      createdAt?: DateTimeFilter<"GuildPermissionError"> | Date | string;
      updatedAt?: DateTimeFilter<"GuildPermissionError"> | Date | string;
    },
    "id" | "serverId_channelId"
  >;

  export type GuildPermissionErrorOrderByWithAggregationInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    channelId?: SortOrder;
    errorType?: SortOrder;
    errorReason?: SortOrderInput | SortOrder;
    firstOccurrence?: SortOrder;
    lastOccurrence?: SortOrder;
    consecutiveErrorCount?: SortOrder;
    lastSuccessfulSend?: SortOrderInput | SortOrder;
    ownerNotified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: GuildPermissionErrorCountOrderByAggregateInput;
    _avg?: GuildPermissionErrorAvgOrderByAggregateInput;
    _max?: GuildPermissionErrorMaxOrderByAggregateInput;
    _min?: GuildPermissionErrorMinOrderByAggregateInput;
    _sum?: GuildPermissionErrorSumOrderByAggregateInput;
  };

  export type GuildPermissionErrorScalarWhereWithAggregatesInput = {
    AND?: GuildPermissionErrorScalarWhereWithAggregatesInput | GuildPermissionErrorScalarWhereWithAggregatesInput[];
    OR?: GuildPermissionErrorScalarWhereWithAggregatesInput[];
    NOT?: GuildPermissionErrorScalarWhereWithAggregatesInput | GuildPermissionErrorScalarWhereWithAggregatesInput[];
    id?: IntWithAggregatesFilter<"GuildPermissionError"> | number;
    serverId?: StringWithAggregatesFilter<"GuildPermissionError"> | string;
    channelId?: StringWithAggregatesFilter<"GuildPermissionError"> | string;
    errorType?: StringWithAggregatesFilter<"GuildPermissionError"> | string;
    errorReason?: StringNullableWithAggregatesFilter<"GuildPermissionError"> | string | null;
    firstOccurrence?: DateTimeWithAggregatesFilter<"GuildPermissionError"> | Date | string;
    lastOccurrence?: DateTimeWithAggregatesFilter<"GuildPermissionError"> | Date | string;
    consecutiveErrorCount?: IntWithAggregatesFilter<"GuildPermissionError"> | number;
    lastSuccessfulSend?: DateTimeNullableWithAggregatesFilter<"GuildPermissionError"> | Date | string | null;
    ownerNotified?: BoolWithAggregatesFilter<"GuildPermissionError"> | boolean;
    createdAt?: DateTimeWithAggregatesFilter<"GuildPermissionError"> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<"GuildPermissionError"> | Date | string;
  };

  export type SubscriptionCreateInput = {
    channelId: string;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    player: PlayerCreateNestedOneWithoutSubscriptionsInput;
  };

  export type SubscriptionUncheckedCreateInput = {
    id?: number;
    playerId: number;
    channelId: string;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type SubscriptionUpdateInput = {
    channelId?: StringFieldUpdateOperationsInput | string;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    player?: PlayerUpdateOneRequiredWithoutSubscriptionsNestedInput;
  };

  export type SubscriptionUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    channelId?: StringFieldUpdateOperationsInput | string;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type SubscriptionCreateManyInput = {
    id?: number;
    playerId: number;
    channelId: string;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type SubscriptionUpdateManyMutationInput = {
    channelId?: StringFieldUpdateOperationsInput | string;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type SubscriptionUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    channelId?: StringFieldUpdateOperationsInput | string;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlayerCreateInput = {
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    accounts?: AccountCreateNestedManyWithoutPlayerInput;
    subscriptions?: SubscriptionCreateNestedManyWithoutPlayerInput;
    competitionParticipants?: CompetitionParticipantCreateNestedManyWithoutPlayerInput;
    competitionSnapshots?: CompetitionSnapshotCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerUncheckedCreateInput = {
    id?: number;
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    accounts?: AccountUncheckedCreateNestedManyWithoutPlayerInput;
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutPlayerInput;
    competitionParticipants?: CompetitionParticipantUncheckedCreateNestedManyWithoutPlayerInput;
    competitionSnapshots?: CompetitionSnapshotUncheckedCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerUpdateInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: AccountUpdateManyWithoutPlayerNestedInput;
    subscriptions?: SubscriptionUpdateManyWithoutPlayerNestedInput;
    competitionParticipants?: CompetitionParticipantUpdateManyWithoutPlayerNestedInput;
    competitionSnapshots?: CompetitionSnapshotUpdateManyWithoutPlayerNestedInput;
  };

  export type PlayerUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: AccountUncheckedUpdateManyWithoutPlayerNestedInput;
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutPlayerNestedInput;
    competitionParticipants?: CompetitionParticipantUncheckedUpdateManyWithoutPlayerNestedInput;
    competitionSnapshots?: CompetitionSnapshotUncheckedUpdateManyWithoutPlayerNestedInput;
  };

  export type PlayerCreateManyInput = {
    id?: number;
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type PlayerUpdateManyMutationInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlayerUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type AccountCreateInput = {
    alias: string;
    puuid: string;
    region: string;
    lastProcessedMatchId?: string | null;
    lastMatchTime?: Date | string | null;
    lastCheckedAt?: Date | string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    player: PlayerCreateNestedOneWithoutAccountsInput;
  };

  export type AccountUncheckedCreateInput = {
    id?: number;
    alias: string;
    puuid: string;
    region: string;
    playerId: number;
    lastProcessedMatchId?: string | null;
    lastMatchTime?: Date | string | null;
    lastCheckedAt?: Date | string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type AccountUpdateInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    puuid?: StringFieldUpdateOperationsInput | string;
    region?: StringFieldUpdateOperationsInput | string;
    lastProcessedMatchId?: NullableStringFieldUpdateOperationsInput | string | null;
    lastMatchTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    player?: PlayerUpdateOneRequiredWithoutAccountsNestedInput;
  };

  export type AccountUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    puuid?: StringFieldUpdateOperationsInput | string;
    region?: StringFieldUpdateOperationsInput | string;
    playerId?: IntFieldUpdateOperationsInput | number;
    lastProcessedMatchId?: NullableStringFieldUpdateOperationsInput | string | null;
    lastMatchTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type AccountCreateManyInput = {
    id?: number;
    alias: string;
    puuid: string;
    region: string;
    playerId: number;
    lastProcessedMatchId?: string | null;
    lastMatchTime?: Date | string | null;
    lastCheckedAt?: Date | string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type AccountUpdateManyMutationInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    puuid?: StringFieldUpdateOperationsInput | string;
    region?: StringFieldUpdateOperationsInput | string;
    lastProcessedMatchId?: NullableStringFieldUpdateOperationsInput | string | null;
    lastMatchTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type AccountUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    puuid?: StringFieldUpdateOperationsInput | string;
    region?: StringFieldUpdateOperationsInput | string;
    playerId?: IntFieldUpdateOperationsInput | number;
    lastProcessedMatchId?: NullableStringFieldUpdateOperationsInput | string | null;
    lastMatchTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionCreateInput = {
    serverId: string;
    ownerId: string;
    title: string;
    description: string;
    channelId: string;
    isCancelled?: boolean;
    visibility: string;
    criteriaType: string;
    criteriaConfig: string;
    maxParticipants?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    seasonId?: string | null;
    startProcessedAt?: Date | string | null;
    endProcessedAt?: Date | string | null;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    participants?: CompetitionParticipantCreateNestedManyWithoutCompetitionInput;
    snapshots?: CompetitionSnapshotCreateNestedManyWithoutCompetitionInput;
  };

  export type CompetitionUncheckedCreateInput = {
    id?: number;
    serverId: string;
    ownerId: string;
    title: string;
    description: string;
    channelId: string;
    isCancelled?: boolean;
    visibility: string;
    criteriaType: string;
    criteriaConfig: string;
    maxParticipants?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    seasonId?: string | null;
    startProcessedAt?: Date | string | null;
    endProcessedAt?: Date | string | null;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    participants?: CompetitionParticipantUncheckedCreateNestedManyWithoutCompetitionInput;
    snapshots?: CompetitionSnapshotUncheckedCreateNestedManyWithoutCompetitionInput;
  };

  export type CompetitionUpdateInput = {
    serverId?: StringFieldUpdateOperationsInput | string;
    ownerId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    description?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    isCancelled?: BoolFieldUpdateOperationsInput | boolean;
    visibility?: StringFieldUpdateOperationsInput | string;
    criteriaType?: StringFieldUpdateOperationsInput | string;
    criteriaConfig?: StringFieldUpdateOperationsInput | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null;
    startProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    participants?: CompetitionParticipantUpdateManyWithoutCompetitionNestedInput;
    snapshots?: CompetitionSnapshotUpdateManyWithoutCompetitionNestedInput;
  };

  export type CompetitionUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    serverId?: StringFieldUpdateOperationsInput | string;
    ownerId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    description?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    isCancelled?: BoolFieldUpdateOperationsInput | boolean;
    visibility?: StringFieldUpdateOperationsInput | string;
    criteriaType?: StringFieldUpdateOperationsInput | string;
    criteriaConfig?: StringFieldUpdateOperationsInput | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null;
    startProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    participants?: CompetitionParticipantUncheckedUpdateManyWithoutCompetitionNestedInput;
    snapshots?: CompetitionSnapshotUncheckedUpdateManyWithoutCompetitionNestedInput;
  };

  export type CompetitionCreateManyInput = {
    id?: number;
    serverId: string;
    ownerId: string;
    title: string;
    description: string;
    channelId: string;
    isCancelled?: boolean;
    visibility: string;
    criteriaType: string;
    criteriaConfig: string;
    maxParticipants?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    seasonId?: string | null;
    startProcessedAt?: Date | string | null;
    endProcessedAt?: Date | string | null;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type CompetitionUpdateManyMutationInput = {
    serverId?: StringFieldUpdateOperationsInput | string;
    ownerId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    description?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    isCancelled?: BoolFieldUpdateOperationsInput | boolean;
    visibility?: StringFieldUpdateOperationsInput | string;
    criteriaType?: StringFieldUpdateOperationsInput | string;
    criteriaConfig?: StringFieldUpdateOperationsInput | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null;
    startProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    serverId?: StringFieldUpdateOperationsInput | string;
    ownerId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    description?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    isCancelled?: BoolFieldUpdateOperationsInput | boolean;
    visibility?: StringFieldUpdateOperationsInput | string;
    criteriaType?: StringFieldUpdateOperationsInput | string;
    criteriaConfig?: StringFieldUpdateOperationsInput | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null;
    startProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionParticipantCreateInput = {
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    competition: CompetitionCreateNestedOneWithoutParticipantsInput;
    player: PlayerCreateNestedOneWithoutCompetitionParticipantsInput;
  };

  export type CompetitionParticipantUncheckedCreateInput = {
    id?: number;
    competitionId: number;
    playerId: number;
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
  };

  export type CompetitionParticipantUpdateInput = {
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    competition?: CompetitionUpdateOneRequiredWithoutParticipantsNestedInput;
    player?: PlayerUpdateOneRequiredWithoutCompetitionParticipantsNestedInput;
  };

  export type CompetitionParticipantUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    competitionId?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type CompetitionParticipantCreateManyInput = {
    id?: number;
    competitionId: number;
    playerId: number;
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
  };

  export type CompetitionParticipantUpdateManyMutationInput = {
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type CompetitionParticipantUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    competitionId?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type CompetitionSnapshotCreateInput = {
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
    competition: CompetitionCreateNestedOneWithoutSnapshotsInput;
    player: PlayerCreateNestedOneWithoutCompetitionSnapshotsInput;
  };

  export type CompetitionSnapshotUncheckedCreateInput = {
    id?: number;
    competitionId: number;
    playerId: number;
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
  };

  export type CompetitionSnapshotUpdateInput = {
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    competition?: CompetitionUpdateOneRequiredWithoutSnapshotsNestedInput;
    player?: PlayerUpdateOneRequiredWithoutCompetitionSnapshotsNestedInput;
  };

  export type CompetitionSnapshotUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    competitionId?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionSnapshotCreateManyInput = {
    id?: number;
    competitionId: number;
    playerId: number;
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
  };

  export type CompetitionSnapshotUpdateManyMutationInput = {
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionSnapshotUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    competitionId?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ServerPermissionCreateInput = {
    serverId: string;
    discordUserId: string;
    permission: string;
    grantedBy: string;
    grantedAt: Date | string;
  };

  export type ServerPermissionUncheckedCreateInput = {
    id?: number;
    serverId: string;
    discordUserId: string;
    permission: string;
    grantedBy: string;
    grantedAt: Date | string;
  };

  export type ServerPermissionUpdateInput = {
    serverId?: StringFieldUpdateOperationsInput | string;
    discordUserId?: StringFieldUpdateOperationsInput | string;
    permission?: StringFieldUpdateOperationsInput | string;
    grantedBy?: StringFieldUpdateOperationsInput | string;
    grantedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ServerPermissionUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    serverId?: StringFieldUpdateOperationsInput | string;
    discordUserId?: StringFieldUpdateOperationsInput | string;
    permission?: StringFieldUpdateOperationsInput | string;
    grantedBy?: StringFieldUpdateOperationsInput | string;
    grantedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ServerPermissionCreateManyInput = {
    id?: number;
    serverId: string;
    discordUserId: string;
    permission: string;
    grantedBy: string;
    grantedAt: Date | string;
  };

  export type ServerPermissionUpdateManyMutationInput = {
    serverId?: StringFieldUpdateOperationsInput | string;
    discordUserId?: StringFieldUpdateOperationsInput | string;
    permission?: StringFieldUpdateOperationsInput | string;
    grantedBy?: StringFieldUpdateOperationsInput | string;
    grantedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type ServerPermissionUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    serverId?: StringFieldUpdateOperationsInput | string;
    discordUserId?: StringFieldUpdateOperationsInput | string;
    permission?: StringFieldUpdateOperationsInput | string;
    grantedBy?: StringFieldUpdateOperationsInput | string;
    grantedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type GuildPermissionErrorCreateInput = {
    serverId: string;
    channelId: string;
    errorType: string;
    errorReason?: string | null;
    firstOccurrence: Date | string;
    lastOccurrence: Date | string;
    consecutiveErrorCount?: number;
    lastSuccessfulSend?: Date | string | null;
    ownerNotified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type GuildPermissionErrorUncheckedCreateInput = {
    id?: number;
    serverId: string;
    channelId: string;
    errorType: string;
    errorReason?: string | null;
    firstOccurrence: Date | string;
    lastOccurrence: Date | string;
    consecutiveErrorCount?: number;
    lastSuccessfulSend?: Date | string | null;
    ownerNotified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type GuildPermissionErrorUpdateInput = {
    serverId?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    errorType?: StringFieldUpdateOperationsInput | string;
    errorReason?: NullableStringFieldUpdateOperationsInput | string | null;
    firstOccurrence?: DateTimeFieldUpdateOperationsInput | Date | string;
    lastOccurrence?: DateTimeFieldUpdateOperationsInput | Date | string;
    consecutiveErrorCount?: IntFieldUpdateOperationsInput | number;
    lastSuccessfulSend?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    ownerNotified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type GuildPermissionErrorUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number;
    serverId?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    errorType?: StringFieldUpdateOperationsInput | string;
    errorReason?: NullableStringFieldUpdateOperationsInput | string | null;
    firstOccurrence?: DateTimeFieldUpdateOperationsInput | Date | string;
    lastOccurrence?: DateTimeFieldUpdateOperationsInput | Date | string;
    consecutiveErrorCount?: IntFieldUpdateOperationsInput | number;
    lastSuccessfulSend?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    ownerNotified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type GuildPermissionErrorCreateManyInput = {
    id?: number;
    serverId: string;
    channelId: string;
    errorType: string;
    errorReason?: string | null;
    firstOccurrence: Date | string;
    lastOccurrence: Date | string;
    consecutiveErrorCount?: number;
    lastSuccessfulSend?: Date | string | null;
    ownerNotified?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type GuildPermissionErrorUpdateManyMutationInput = {
    serverId?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    errorType?: StringFieldUpdateOperationsInput | string;
    errorReason?: NullableStringFieldUpdateOperationsInput | string | null;
    firstOccurrence?: DateTimeFieldUpdateOperationsInput | Date | string;
    lastOccurrence?: DateTimeFieldUpdateOperationsInput | Date | string;
    consecutiveErrorCount?: IntFieldUpdateOperationsInput | number;
    lastSuccessfulSend?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    ownerNotified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type GuildPermissionErrorUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number;
    serverId?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    errorType?: StringFieldUpdateOperationsInput | string;
    errorReason?: NullableStringFieldUpdateOperationsInput | string | null;
    firstOccurrence?: DateTimeFieldUpdateOperationsInput | Date | string;
    lastOccurrence?: DateTimeFieldUpdateOperationsInput | Date | string;
    consecutiveErrorCount?: IntFieldUpdateOperationsInput | number;
    lastSuccessfulSend?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    ownerNotified?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string;
  };

  export type PlayerScalarRelationFilter = {
    is?: PlayerWhereInput;
    isNot?: PlayerWhereInput;
  };

  export type SubscriptionServerIdPlayerIdChannelIdCompoundUniqueInput = {
    serverId: string;
    playerId: number;
    channelId: string;
  };

  export type SubscriptionCountOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    channelId?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type SubscriptionAvgOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
  };

  export type SubscriptionMaxOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    channelId?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type SubscriptionMinOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
    channelId?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type SubscriptionSumOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
  };

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedIntFilter<$PrismaModel>;
    _min?: NestedIntFilter<$PrismaModel>;
    _max?: NestedIntFilter<$PrismaModel>;
  };

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedDateTimeFilter<$PrismaModel>;
    _max?: NestedDateTimeFilter<$PrismaModel>;
  };

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type AccountListRelationFilter = {
    every?: AccountWhereInput;
    some?: AccountWhereInput;
    none?: AccountWhereInput;
  };

  export type SubscriptionListRelationFilter = {
    every?: SubscriptionWhereInput;
    some?: SubscriptionWhereInput;
    none?: SubscriptionWhereInput;
  };

  export type CompetitionParticipantListRelationFilter = {
    every?: CompetitionParticipantWhereInput;
    some?: CompetitionParticipantWhereInput;
    none?: CompetitionParticipantWhereInput;
  };

  export type CompetitionSnapshotListRelationFilter = {
    every?: CompetitionSnapshotWhereInput;
    some?: CompetitionSnapshotWhereInput;
    none?: CompetitionSnapshotWhereInput;
  };

  export type SortOrderInput = {
    sort: SortOrder;
    nulls?: NullsOrder;
  };

  export type AccountOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type SubscriptionOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type CompetitionParticipantOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type CompetitionSnapshotOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type PlayerServerIdAliasCompoundUniqueInput = {
    serverId: string;
    alias: string;
  };

  export type PlayerCountOrderByAggregateInput = {
    id?: SortOrder;
    alias?: SortOrder;
    discordId?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type PlayerAvgOrderByAggregateInput = {
    id?: SortOrder;
  };

  export type PlayerMaxOrderByAggregateInput = {
    id?: SortOrder;
    alias?: SortOrder;
    discordId?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type PlayerMinOrderByAggregateInput = {
    id?: SortOrder;
    alias?: SortOrder;
    discordId?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type PlayerSumOrderByAggregateInput = {
    id?: SortOrder;
  };

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
  };

  export type AccountServerIdPuuidCompoundUniqueInput = {
    serverId: string;
    puuid: string;
  };

  export type AccountCountOrderByAggregateInput = {
    id?: SortOrder;
    alias?: SortOrder;
    puuid?: SortOrder;
    region?: SortOrder;
    playerId?: SortOrder;
    lastProcessedMatchId?: SortOrder;
    lastMatchTime?: SortOrder;
    lastCheckedAt?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type AccountAvgOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
  };

  export type AccountMaxOrderByAggregateInput = {
    id?: SortOrder;
    alias?: SortOrder;
    puuid?: SortOrder;
    region?: SortOrder;
    playerId?: SortOrder;
    lastProcessedMatchId?: SortOrder;
    lastMatchTime?: SortOrder;
    lastCheckedAt?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type AccountMinOrderByAggregateInput = {
    id?: SortOrder;
    alias?: SortOrder;
    puuid?: SortOrder;
    region?: SortOrder;
    playerId?: SortOrder;
    lastProcessedMatchId?: SortOrder;
    lastMatchTime?: SortOrder;
    lastCheckedAt?: SortOrder;
    serverId?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type AccountSumOrderByAggregateInput = {
    id?: SortOrder;
    playerId?: SortOrder;
  };

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: NestedDateTimeNullableFilter<$PrismaModel>;
  };

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolFilter<$PrismaModel> | boolean;
  };

  export type CompetitionCountOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    ownerId?: SortOrder;
    title?: SortOrder;
    description?: SortOrder;
    channelId?: SortOrder;
    isCancelled?: SortOrder;
    visibility?: SortOrder;
    criteriaType?: SortOrder;
    criteriaConfig?: SortOrder;
    maxParticipants?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    seasonId?: SortOrder;
    startProcessedAt?: SortOrder;
    endProcessedAt?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type CompetitionAvgOrderByAggregateInput = {
    id?: SortOrder;
    maxParticipants?: SortOrder;
  };

  export type CompetitionMaxOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    ownerId?: SortOrder;
    title?: SortOrder;
    description?: SortOrder;
    channelId?: SortOrder;
    isCancelled?: SortOrder;
    visibility?: SortOrder;
    criteriaType?: SortOrder;
    criteriaConfig?: SortOrder;
    maxParticipants?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    seasonId?: SortOrder;
    startProcessedAt?: SortOrder;
    endProcessedAt?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type CompetitionMinOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    ownerId?: SortOrder;
    title?: SortOrder;
    description?: SortOrder;
    channelId?: SortOrder;
    isCancelled?: SortOrder;
    visibility?: SortOrder;
    criteriaType?: SortOrder;
    criteriaConfig?: SortOrder;
    maxParticipants?: SortOrder;
    startDate?: SortOrder;
    endDate?: SortOrder;
    seasonId?: SortOrder;
    startProcessedAt?: SortOrder;
    endProcessedAt?: SortOrder;
    creatorDiscordId?: SortOrder;
    createdTime?: SortOrder;
    updatedTime?: SortOrder;
  };

  export type CompetitionSumOrderByAggregateInput = {
    id?: SortOrder;
    maxParticipants?: SortOrder;
  };

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedBoolFilter<$PrismaModel>;
    _max?: NestedBoolFilter<$PrismaModel>;
  };

  export type CompetitionScalarRelationFilter = {
    is?: CompetitionWhereInput;
    isNot?: CompetitionWhereInput;
  };

  export type CompetitionParticipantCompetitionIdPlayerIdCompoundUniqueInput = {
    competitionId: number;
    playerId: number;
  };

  export type CompetitionParticipantCountOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    status?: SortOrder;
    invitedBy?: SortOrder;
    invitedAt?: SortOrder;
    joinedAt?: SortOrder;
    leftAt?: SortOrder;
  };

  export type CompetitionParticipantAvgOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
  };

  export type CompetitionParticipantMaxOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    status?: SortOrder;
    invitedBy?: SortOrder;
    invitedAt?: SortOrder;
    joinedAt?: SortOrder;
    leftAt?: SortOrder;
  };

  export type CompetitionParticipantMinOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    status?: SortOrder;
    invitedBy?: SortOrder;
    invitedAt?: SortOrder;
    joinedAt?: SortOrder;
    leftAt?: SortOrder;
  };

  export type CompetitionParticipantSumOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
  };

  export type CompetitionSnapshotCompetitionIdPlayerIdSnapshotTypeCompoundUniqueInput = {
    competitionId: number;
    playerId: number;
    snapshotType: string;
  };

  export type CompetitionSnapshotCountOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    snapshotType?: SortOrder;
    snapshotData?: SortOrder;
    snapshotTime?: SortOrder;
  };

  export type CompetitionSnapshotAvgOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
  };

  export type CompetitionSnapshotMaxOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    snapshotType?: SortOrder;
    snapshotData?: SortOrder;
    snapshotTime?: SortOrder;
  };

  export type CompetitionSnapshotMinOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
    snapshotType?: SortOrder;
    snapshotData?: SortOrder;
    snapshotTime?: SortOrder;
  };

  export type CompetitionSnapshotSumOrderByAggregateInput = {
    id?: SortOrder;
    competitionId?: SortOrder;
    playerId?: SortOrder;
  };

  export type ServerPermissionServerIdDiscordUserIdPermissionCompoundUniqueInput = {
    serverId: string;
    discordUserId: string;
    permission: string;
  };

  export type ServerPermissionCountOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    discordUserId?: SortOrder;
    permission?: SortOrder;
    grantedBy?: SortOrder;
    grantedAt?: SortOrder;
  };

  export type ServerPermissionAvgOrderByAggregateInput = {
    id?: SortOrder;
  };

  export type ServerPermissionMaxOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    discordUserId?: SortOrder;
    permission?: SortOrder;
    grantedBy?: SortOrder;
    grantedAt?: SortOrder;
  };

  export type ServerPermissionMinOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    discordUserId?: SortOrder;
    permission?: SortOrder;
    grantedBy?: SortOrder;
    grantedAt?: SortOrder;
  };

  export type ServerPermissionSumOrderByAggregateInput = {
    id?: SortOrder;
  };

  export type GuildPermissionErrorServerIdChannelIdCompoundUniqueInput = {
    serverId: string;
    channelId: string;
  };

  export type GuildPermissionErrorCountOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    channelId?: SortOrder;
    errorType?: SortOrder;
    errorReason?: SortOrder;
    firstOccurrence?: SortOrder;
    lastOccurrence?: SortOrder;
    consecutiveErrorCount?: SortOrder;
    lastSuccessfulSend?: SortOrder;
    ownerNotified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type GuildPermissionErrorAvgOrderByAggregateInput = {
    id?: SortOrder;
    consecutiveErrorCount?: SortOrder;
  };

  export type GuildPermissionErrorMaxOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    channelId?: SortOrder;
    errorType?: SortOrder;
    errorReason?: SortOrder;
    firstOccurrence?: SortOrder;
    lastOccurrence?: SortOrder;
    consecutiveErrorCount?: SortOrder;
    lastSuccessfulSend?: SortOrder;
    ownerNotified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type GuildPermissionErrorMinOrderByAggregateInput = {
    id?: SortOrder;
    serverId?: SortOrder;
    channelId?: SortOrder;
    errorType?: SortOrder;
    errorReason?: SortOrder;
    firstOccurrence?: SortOrder;
    lastOccurrence?: SortOrder;
    consecutiveErrorCount?: SortOrder;
    lastSuccessfulSend?: SortOrder;
    ownerNotified?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type GuildPermissionErrorSumOrderByAggregateInput = {
    id?: SortOrder;
    consecutiveErrorCount?: SortOrder;
  };

  export type PlayerCreateNestedOneWithoutSubscriptionsInput = {
    create?: XOR<PlayerCreateWithoutSubscriptionsInput, PlayerUncheckedCreateWithoutSubscriptionsInput>;
    connectOrCreate?: PlayerCreateOrConnectWithoutSubscriptionsInput;
    connect?: PlayerWhereUniqueInput;
  };

  export type StringFieldUpdateOperationsInput = {
    set?: string;
  };

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
  };

  export type PlayerUpdateOneRequiredWithoutSubscriptionsNestedInput = {
    create?: XOR<PlayerCreateWithoutSubscriptionsInput, PlayerUncheckedCreateWithoutSubscriptionsInput>;
    connectOrCreate?: PlayerCreateOrConnectWithoutSubscriptionsInput;
    upsert?: PlayerUpsertWithoutSubscriptionsInput;
    connect?: PlayerWhereUniqueInput;
    update?: XOR<
      XOR<PlayerUpdateToOneWithWhereWithoutSubscriptionsInput, PlayerUpdateWithoutSubscriptionsInput>,
      PlayerUncheckedUpdateWithoutSubscriptionsInput
    >;
  };

  export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
  };

  export type AccountCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<AccountCreateWithoutPlayerInput, AccountUncheckedCreateWithoutPlayerInput>
      | AccountCreateWithoutPlayerInput[]
      | AccountUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?: AccountCreateOrConnectWithoutPlayerInput | AccountCreateOrConnectWithoutPlayerInput[];
    createMany?: AccountCreateManyPlayerInputEnvelope;
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
  };

  export type SubscriptionCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<SubscriptionCreateWithoutPlayerInput, SubscriptionUncheckedCreateWithoutPlayerInput>
      | SubscriptionCreateWithoutPlayerInput[]
      | SubscriptionUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?: SubscriptionCreateOrConnectWithoutPlayerInput | SubscriptionCreateOrConnectWithoutPlayerInput[];
    createMany?: SubscriptionCreateManyPlayerInputEnvelope;
    connect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
  };

  export type CompetitionParticipantCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<CompetitionParticipantCreateWithoutPlayerInput, CompetitionParticipantUncheckedCreateWithoutPlayerInput>
      | CompetitionParticipantCreateWithoutPlayerInput[]
      | CompetitionParticipantUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | CompetitionParticipantCreateOrConnectWithoutPlayerInput
      | CompetitionParticipantCreateOrConnectWithoutPlayerInput[];
    createMany?: CompetitionParticipantCreateManyPlayerInputEnvelope;
    connect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
  };

  export type CompetitionSnapshotCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<CompetitionSnapshotCreateWithoutPlayerInput, CompetitionSnapshotUncheckedCreateWithoutPlayerInput>
      | CompetitionSnapshotCreateWithoutPlayerInput[]
      | CompetitionSnapshotUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | CompetitionSnapshotCreateOrConnectWithoutPlayerInput
      | CompetitionSnapshotCreateOrConnectWithoutPlayerInput[];
    createMany?: CompetitionSnapshotCreateManyPlayerInputEnvelope;
    connect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
  };

  export type AccountUncheckedCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<AccountCreateWithoutPlayerInput, AccountUncheckedCreateWithoutPlayerInput>
      | AccountCreateWithoutPlayerInput[]
      | AccountUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?: AccountCreateOrConnectWithoutPlayerInput | AccountCreateOrConnectWithoutPlayerInput[];
    createMany?: AccountCreateManyPlayerInputEnvelope;
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
  };

  export type SubscriptionUncheckedCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<SubscriptionCreateWithoutPlayerInput, SubscriptionUncheckedCreateWithoutPlayerInput>
      | SubscriptionCreateWithoutPlayerInput[]
      | SubscriptionUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?: SubscriptionCreateOrConnectWithoutPlayerInput | SubscriptionCreateOrConnectWithoutPlayerInput[];
    createMany?: SubscriptionCreateManyPlayerInputEnvelope;
    connect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
  };

  export type CompetitionParticipantUncheckedCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<CompetitionParticipantCreateWithoutPlayerInput, CompetitionParticipantUncheckedCreateWithoutPlayerInput>
      | CompetitionParticipantCreateWithoutPlayerInput[]
      | CompetitionParticipantUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | CompetitionParticipantCreateOrConnectWithoutPlayerInput
      | CompetitionParticipantCreateOrConnectWithoutPlayerInput[];
    createMany?: CompetitionParticipantCreateManyPlayerInputEnvelope;
    connect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
  };

  export type CompetitionSnapshotUncheckedCreateNestedManyWithoutPlayerInput = {
    create?:
      | XOR<CompetitionSnapshotCreateWithoutPlayerInput, CompetitionSnapshotUncheckedCreateWithoutPlayerInput>
      | CompetitionSnapshotCreateWithoutPlayerInput[]
      | CompetitionSnapshotUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | CompetitionSnapshotCreateOrConnectWithoutPlayerInput
      | CompetitionSnapshotCreateOrConnectWithoutPlayerInput[];
    createMany?: CompetitionSnapshotCreateManyPlayerInputEnvelope;
    connect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
  };

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
  };

  export type AccountUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<AccountCreateWithoutPlayerInput, AccountUncheckedCreateWithoutPlayerInput>
      | AccountCreateWithoutPlayerInput[]
      | AccountUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?: AccountCreateOrConnectWithoutPlayerInput | AccountCreateOrConnectWithoutPlayerInput[];
    upsert?: AccountUpsertWithWhereUniqueWithoutPlayerInput | AccountUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: AccountCreateManyPlayerInputEnvelope;
    set?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
    disconnect?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
    delete?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
    update?: AccountUpdateWithWhereUniqueWithoutPlayerInput | AccountUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?: AccountUpdateManyWithWhereWithoutPlayerInput | AccountUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: AccountScalarWhereInput | AccountScalarWhereInput[];
  };

  export type SubscriptionUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<SubscriptionCreateWithoutPlayerInput, SubscriptionUncheckedCreateWithoutPlayerInput>
      | SubscriptionCreateWithoutPlayerInput[]
      | SubscriptionUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?: SubscriptionCreateOrConnectWithoutPlayerInput | SubscriptionCreateOrConnectWithoutPlayerInput[];
    upsert?:
      | SubscriptionUpsertWithWhereUniqueWithoutPlayerInput
      | SubscriptionUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: SubscriptionCreateManyPlayerInputEnvelope;
    set?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
    disconnect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
    delete?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
    connect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
    update?:
      | SubscriptionUpdateWithWhereUniqueWithoutPlayerInput
      | SubscriptionUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?:
      | SubscriptionUpdateManyWithWhereWithoutPlayerInput
      | SubscriptionUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: SubscriptionScalarWhereInput | SubscriptionScalarWhereInput[];
  };

  export type CompetitionParticipantUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<CompetitionParticipantCreateWithoutPlayerInput, CompetitionParticipantUncheckedCreateWithoutPlayerInput>
      | CompetitionParticipantCreateWithoutPlayerInput[]
      | CompetitionParticipantUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | CompetitionParticipantCreateOrConnectWithoutPlayerInput
      | CompetitionParticipantCreateOrConnectWithoutPlayerInput[];
    upsert?:
      | CompetitionParticipantUpsertWithWhereUniqueWithoutPlayerInput
      | CompetitionParticipantUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: CompetitionParticipantCreateManyPlayerInputEnvelope;
    set?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    disconnect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    delete?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    connect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    update?:
      | CompetitionParticipantUpdateWithWhereUniqueWithoutPlayerInput
      | CompetitionParticipantUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?:
      | CompetitionParticipantUpdateManyWithWhereWithoutPlayerInput
      | CompetitionParticipantUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: CompetitionParticipantScalarWhereInput | CompetitionParticipantScalarWhereInput[];
  };

  export type CompetitionSnapshotUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<CompetitionSnapshotCreateWithoutPlayerInput, CompetitionSnapshotUncheckedCreateWithoutPlayerInput>
      | CompetitionSnapshotCreateWithoutPlayerInput[]
      | CompetitionSnapshotUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | CompetitionSnapshotCreateOrConnectWithoutPlayerInput
      | CompetitionSnapshotCreateOrConnectWithoutPlayerInput[];
    upsert?:
      | CompetitionSnapshotUpsertWithWhereUniqueWithoutPlayerInput
      | CompetitionSnapshotUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: CompetitionSnapshotCreateManyPlayerInputEnvelope;
    set?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    disconnect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    delete?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    connect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    update?:
      | CompetitionSnapshotUpdateWithWhereUniqueWithoutPlayerInput
      | CompetitionSnapshotUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?:
      | CompetitionSnapshotUpdateManyWithWhereWithoutPlayerInput
      | CompetitionSnapshotUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: CompetitionSnapshotScalarWhereInput | CompetitionSnapshotScalarWhereInput[];
  };

  export type AccountUncheckedUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<AccountCreateWithoutPlayerInput, AccountUncheckedCreateWithoutPlayerInput>
      | AccountCreateWithoutPlayerInput[]
      | AccountUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?: AccountCreateOrConnectWithoutPlayerInput | AccountCreateOrConnectWithoutPlayerInput[];
    upsert?: AccountUpsertWithWhereUniqueWithoutPlayerInput | AccountUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: AccountCreateManyPlayerInputEnvelope;
    set?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
    disconnect?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
    delete?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[];
    update?: AccountUpdateWithWhereUniqueWithoutPlayerInput | AccountUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?: AccountUpdateManyWithWhereWithoutPlayerInput | AccountUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: AccountScalarWhereInput | AccountScalarWhereInput[];
  };

  export type SubscriptionUncheckedUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<SubscriptionCreateWithoutPlayerInput, SubscriptionUncheckedCreateWithoutPlayerInput>
      | SubscriptionCreateWithoutPlayerInput[]
      | SubscriptionUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?: SubscriptionCreateOrConnectWithoutPlayerInput | SubscriptionCreateOrConnectWithoutPlayerInput[];
    upsert?:
      | SubscriptionUpsertWithWhereUniqueWithoutPlayerInput
      | SubscriptionUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: SubscriptionCreateManyPlayerInputEnvelope;
    set?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
    disconnect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
    delete?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
    connect?: SubscriptionWhereUniqueInput | SubscriptionWhereUniqueInput[];
    update?:
      | SubscriptionUpdateWithWhereUniqueWithoutPlayerInput
      | SubscriptionUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?:
      | SubscriptionUpdateManyWithWhereWithoutPlayerInput
      | SubscriptionUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: SubscriptionScalarWhereInput | SubscriptionScalarWhereInput[];
  };

  export type CompetitionParticipantUncheckedUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<CompetitionParticipantCreateWithoutPlayerInput, CompetitionParticipantUncheckedCreateWithoutPlayerInput>
      | CompetitionParticipantCreateWithoutPlayerInput[]
      | CompetitionParticipantUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | CompetitionParticipantCreateOrConnectWithoutPlayerInput
      | CompetitionParticipantCreateOrConnectWithoutPlayerInput[];
    upsert?:
      | CompetitionParticipantUpsertWithWhereUniqueWithoutPlayerInput
      | CompetitionParticipantUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: CompetitionParticipantCreateManyPlayerInputEnvelope;
    set?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    disconnect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    delete?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    connect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    update?:
      | CompetitionParticipantUpdateWithWhereUniqueWithoutPlayerInput
      | CompetitionParticipantUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?:
      | CompetitionParticipantUpdateManyWithWhereWithoutPlayerInput
      | CompetitionParticipantUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: CompetitionParticipantScalarWhereInput | CompetitionParticipantScalarWhereInput[];
  };

  export type CompetitionSnapshotUncheckedUpdateManyWithoutPlayerNestedInput = {
    create?:
      | XOR<CompetitionSnapshotCreateWithoutPlayerInput, CompetitionSnapshotUncheckedCreateWithoutPlayerInput>
      | CompetitionSnapshotCreateWithoutPlayerInput[]
      | CompetitionSnapshotUncheckedCreateWithoutPlayerInput[];
    connectOrCreate?:
      | CompetitionSnapshotCreateOrConnectWithoutPlayerInput
      | CompetitionSnapshotCreateOrConnectWithoutPlayerInput[];
    upsert?:
      | CompetitionSnapshotUpsertWithWhereUniqueWithoutPlayerInput
      | CompetitionSnapshotUpsertWithWhereUniqueWithoutPlayerInput[];
    createMany?: CompetitionSnapshotCreateManyPlayerInputEnvelope;
    set?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    disconnect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    delete?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    connect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    update?:
      | CompetitionSnapshotUpdateWithWhereUniqueWithoutPlayerInput
      | CompetitionSnapshotUpdateWithWhereUniqueWithoutPlayerInput[];
    updateMany?:
      | CompetitionSnapshotUpdateManyWithWhereWithoutPlayerInput
      | CompetitionSnapshotUpdateManyWithWhereWithoutPlayerInput[];
    deleteMany?: CompetitionSnapshotScalarWhereInput | CompetitionSnapshotScalarWhereInput[];
  };

  export type PlayerCreateNestedOneWithoutAccountsInput = {
    create?: XOR<PlayerCreateWithoutAccountsInput, PlayerUncheckedCreateWithoutAccountsInput>;
    connectOrCreate?: PlayerCreateOrConnectWithoutAccountsInput;
    connect?: PlayerWhereUniqueInput;
  };

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
  };

  export type PlayerUpdateOneRequiredWithoutAccountsNestedInput = {
    create?: XOR<PlayerCreateWithoutAccountsInput, PlayerUncheckedCreateWithoutAccountsInput>;
    connectOrCreate?: PlayerCreateOrConnectWithoutAccountsInput;
    upsert?: PlayerUpsertWithoutAccountsInput;
    connect?: PlayerWhereUniqueInput;
    update?: XOR<
      XOR<PlayerUpdateToOneWithWhereWithoutAccountsInput, PlayerUpdateWithoutAccountsInput>,
      PlayerUncheckedUpdateWithoutAccountsInput
    >;
  };

  export type CompetitionParticipantCreateNestedManyWithoutCompetitionInput = {
    create?:
      | XOR<
          CompetitionParticipantCreateWithoutCompetitionInput,
          CompetitionParticipantUncheckedCreateWithoutCompetitionInput
        >
      | CompetitionParticipantCreateWithoutCompetitionInput[]
      | CompetitionParticipantUncheckedCreateWithoutCompetitionInput[];
    connectOrCreate?:
      | CompetitionParticipantCreateOrConnectWithoutCompetitionInput
      | CompetitionParticipantCreateOrConnectWithoutCompetitionInput[];
    createMany?: CompetitionParticipantCreateManyCompetitionInputEnvelope;
    connect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
  };

  export type CompetitionSnapshotCreateNestedManyWithoutCompetitionInput = {
    create?:
      | XOR<CompetitionSnapshotCreateWithoutCompetitionInput, CompetitionSnapshotUncheckedCreateWithoutCompetitionInput>
      | CompetitionSnapshotCreateWithoutCompetitionInput[]
      | CompetitionSnapshotUncheckedCreateWithoutCompetitionInput[];
    connectOrCreate?:
      | CompetitionSnapshotCreateOrConnectWithoutCompetitionInput
      | CompetitionSnapshotCreateOrConnectWithoutCompetitionInput[];
    createMany?: CompetitionSnapshotCreateManyCompetitionInputEnvelope;
    connect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
  };

  export type CompetitionParticipantUncheckedCreateNestedManyWithoutCompetitionInput = {
    create?:
      | XOR<
          CompetitionParticipantCreateWithoutCompetitionInput,
          CompetitionParticipantUncheckedCreateWithoutCompetitionInput
        >
      | CompetitionParticipantCreateWithoutCompetitionInput[]
      | CompetitionParticipantUncheckedCreateWithoutCompetitionInput[];
    connectOrCreate?:
      | CompetitionParticipantCreateOrConnectWithoutCompetitionInput
      | CompetitionParticipantCreateOrConnectWithoutCompetitionInput[];
    createMany?: CompetitionParticipantCreateManyCompetitionInputEnvelope;
    connect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
  };

  export type CompetitionSnapshotUncheckedCreateNestedManyWithoutCompetitionInput = {
    create?:
      | XOR<CompetitionSnapshotCreateWithoutCompetitionInput, CompetitionSnapshotUncheckedCreateWithoutCompetitionInput>
      | CompetitionSnapshotCreateWithoutCompetitionInput[]
      | CompetitionSnapshotUncheckedCreateWithoutCompetitionInput[];
    connectOrCreate?:
      | CompetitionSnapshotCreateOrConnectWithoutCompetitionInput
      | CompetitionSnapshotCreateOrConnectWithoutCompetitionInput[];
    createMany?: CompetitionSnapshotCreateManyCompetitionInputEnvelope;
    connect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
  };

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
  };

  export type CompetitionParticipantUpdateManyWithoutCompetitionNestedInput = {
    create?:
      | XOR<
          CompetitionParticipantCreateWithoutCompetitionInput,
          CompetitionParticipantUncheckedCreateWithoutCompetitionInput
        >
      | CompetitionParticipantCreateWithoutCompetitionInput[]
      | CompetitionParticipantUncheckedCreateWithoutCompetitionInput[];
    connectOrCreate?:
      | CompetitionParticipantCreateOrConnectWithoutCompetitionInput
      | CompetitionParticipantCreateOrConnectWithoutCompetitionInput[];
    upsert?:
      | CompetitionParticipantUpsertWithWhereUniqueWithoutCompetitionInput
      | CompetitionParticipantUpsertWithWhereUniqueWithoutCompetitionInput[];
    createMany?: CompetitionParticipantCreateManyCompetitionInputEnvelope;
    set?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    disconnect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    delete?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    connect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    update?:
      | CompetitionParticipantUpdateWithWhereUniqueWithoutCompetitionInput
      | CompetitionParticipantUpdateWithWhereUniqueWithoutCompetitionInput[];
    updateMany?:
      | CompetitionParticipantUpdateManyWithWhereWithoutCompetitionInput
      | CompetitionParticipantUpdateManyWithWhereWithoutCompetitionInput[];
    deleteMany?: CompetitionParticipantScalarWhereInput | CompetitionParticipantScalarWhereInput[];
  };

  export type CompetitionSnapshotUpdateManyWithoutCompetitionNestedInput = {
    create?:
      | XOR<CompetitionSnapshotCreateWithoutCompetitionInput, CompetitionSnapshotUncheckedCreateWithoutCompetitionInput>
      | CompetitionSnapshotCreateWithoutCompetitionInput[]
      | CompetitionSnapshotUncheckedCreateWithoutCompetitionInput[];
    connectOrCreate?:
      | CompetitionSnapshotCreateOrConnectWithoutCompetitionInput
      | CompetitionSnapshotCreateOrConnectWithoutCompetitionInput[];
    upsert?:
      | CompetitionSnapshotUpsertWithWhereUniqueWithoutCompetitionInput
      | CompetitionSnapshotUpsertWithWhereUniqueWithoutCompetitionInput[];
    createMany?: CompetitionSnapshotCreateManyCompetitionInputEnvelope;
    set?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    disconnect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    delete?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    connect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    update?:
      | CompetitionSnapshotUpdateWithWhereUniqueWithoutCompetitionInput
      | CompetitionSnapshotUpdateWithWhereUniqueWithoutCompetitionInput[];
    updateMany?:
      | CompetitionSnapshotUpdateManyWithWhereWithoutCompetitionInput
      | CompetitionSnapshotUpdateManyWithWhereWithoutCompetitionInput[];
    deleteMany?: CompetitionSnapshotScalarWhereInput | CompetitionSnapshotScalarWhereInput[];
  };

  export type CompetitionParticipantUncheckedUpdateManyWithoutCompetitionNestedInput = {
    create?:
      | XOR<
          CompetitionParticipantCreateWithoutCompetitionInput,
          CompetitionParticipantUncheckedCreateWithoutCompetitionInput
        >
      | CompetitionParticipantCreateWithoutCompetitionInput[]
      | CompetitionParticipantUncheckedCreateWithoutCompetitionInput[];
    connectOrCreate?:
      | CompetitionParticipantCreateOrConnectWithoutCompetitionInput
      | CompetitionParticipantCreateOrConnectWithoutCompetitionInput[];
    upsert?:
      | CompetitionParticipantUpsertWithWhereUniqueWithoutCompetitionInput
      | CompetitionParticipantUpsertWithWhereUniqueWithoutCompetitionInput[];
    createMany?: CompetitionParticipantCreateManyCompetitionInputEnvelope;
    set?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    disconnect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    delete?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    connect?: CompetitionParticipantWhereUniqueInput | CompetitionParticipantWhereUniqueInput[];
    update?:
      | CompetitionParticipantUpdateWithWhereUniqueWithoutCompetitionInput
      | CompetitionParticipantUpdateWithWhereUniqueWithoutCompetitionInput[];
    updateMany?:
      | CompetitionParticipantUpdateManyWithWhereWithoutCompetitionInput
      | CompetitionParticipantUpdateManyWithWhereWithoutCompetitionInput[];
    deleteMany?: CompetitionParticipantScalarWhereInput | CompetitionParticipantScalarWhereInput[];
  };

  export type CompetitionSnapshotUncheckedUpdateManyWithoutCompetitionNestedInput = {
    create?:
      | XOR<CompetitionSnapshotCreateWithoutCompetitionInput, CompetitionSnapshotUncheckedCreateWithoutCompetitionInput>
      | CompetitionSnapshotCreateWithoutCompetitionInput[]
      | CompetitionSnapshotUncheckedCreateWithoutCompetitionInput[];
    connectOrCreate?:
      | CompetitionSnapshotCreateOrConnectWithoutCompetitionInput
      | CompetitionSnapshotCreateOrConnectWithoutCompetitionInput[];
    upsert?:
      | CompetitionSnapshotUpsertWithWhereUniqueWithoutCompetitionInput
      | CompetitionSnapshotUpsertWithWhereUniqueWithoutCompetitionInput[];
    createMany?: CompetitionSnapshotCreateManyCompetitionInputEnvelope;
    set?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    disconnect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    delete?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    connect?: CompetitionSnapshotWhereUniqueInput | CompetitionSnapshotWhereUniqueInput[];
    update?:
      | CompetitionSnapshotUpdateWithWhereUniqueWithoutCompetitionInput
      | CompetitionSnapshotUpdateWithWhereUniqueWithoutCompetitionInput[];
    updateMany?:
      | CompetitionSnapshotUpdateManyWithWhereWithoutCompetitionInput
      | CompetitionSnapshotUpdateManyWithWhereWithoutCompetitionInput[];
    deleteMany?: CompetitionSnapshotScalarWhereInput | CompetitionSnapshotScalarWhereInput[];
  };

  export type CompetitionCreateNestedOneWithoutParticipantsInput = {
    create?: XOR<CompetitionCreateWithoutParticipantsInput, CompetitionUncheckedCreateWithoutParticipantsInput>;
    connectOrCreate?: CompetitionCreateOrConnectWithoutParticipantsInput;
    connect?: CompetitionWhereUniqueInput;
  };

  export type PlayerCreateNestedOneWithoutCompetitionParticipantsInput = {
    create?: XOR<
      PlayerCreateWithoutCompetitionParticipantsInput,
      PlayerUncheckedCreateWithoutCompetitionParticipantsInput
    >;
    connectOrCreate?: PlayerCreateOrConnectWithoutCompetitionParticipantsInput;
    connect?: PlayerWhereUniqueInput;
  };

  export type CompetitionUpdateOneRequiredWithoutParticipantsNestedInput = {
    create?: XOR<CompetitionCreateWithoutParticipantsInput, CompetitionUncheckedCreateWithoutParticipantsInput>;
    connectOrCreate?: CompetitionCreateOrConnectWithoutParticipantsInput;
    upsert?: CompetitionUpsertWithoutParticipantsInput;
    connect?: CompetitionWhereUniqueInput;
    update?: XOR<
      XOR<CompetitionUpdateToOneWithWhereWithoutParticipantsInput, CompetitionUpdateWithoutParticipantsInput>,
      CompetitionUncheckedUpdateWithoutParticipantsInput
    >;
  };

  export type PlayerUpdateOneRequiredWithoutCompetitionParticipantsNestedInput = {
    create?: XOR<
      PlayerCreateWithoutCompetitionParticipantsInput,
      PlayerUncheckedCreateWithoutCompetitionParticipantsInput
    >;
    connectOrCreate?: PlayerCreateOrConnectWithoutCompetitionParticipantsInput;
    upsert?: PlayerUpsertWithoutCompetitionParticipantsInput;
    connect?: PlayerWhereUniqueInput;
    update?: XOR<
      XOR<
        PlayerUpdateToOneWithWhereWithoutCompetitionParticipantsInput,
        PlayerUpdateWithoutCompetitionParticipantsInput
      >,
      PlayerUncheckedUpdateWithoutCompetitionParticipantsInput
    >;
  };

  export type CompetitionCreateNestedOneWithoutSnapshotsInput = {
    create?: XOR<CompetitionCreateWithoutSnapshotsInput, CompetitionUncheckedCreateWithoutSnapshotsInput>;
    connectOrCreate?: CompetitionCreateOrConnectWithoutSnapshotsInput;
    connect?: CompetitionWhereUniqueInput;
  };

  export type PlayerCreateNestedOneWithoutCompetitionSnapshotsInput = {
    create?: XOR<PlayerCreateWithoutCompetitionSnapshotsInput, PlayerUncheckedCreateWithoutCompetitionSnapshotsInput>;
    connectOrCreate?: PlayerCreateOrConnectWithoutCompetitionSnapshotsInput;
    connect?: PlayerWhereUniqueInput;
  };

  export type CompetitionUpdateOneRequiredWithoutSnapshotsNestedInput = {
    create?: XOR<CompetitionCreateWithoutSnapshotsInput, CompetitionUncheckedCreateWithoutSnapshotsInput>;
    connectOrCreate?: CompetitionCreateOrConnectWithoutSnapshotsInput;
    upsert?: CompetitionUpsertWithoutSnapshotsInput;
    connect?: CompetitionWhereUniqueInput;
    update?: XOR<
      XOR<CompetitionUpdateToOneWithWhereWithoutSnapshotsInput, CompetitionUpdateWithoutSnapshotsInput>,
      CompetitionUncheckedUpdateWithoutSnapshotsInput
    >;
  };

  export type PlayerUpdateOneRequiredWithoutCompetitionSnapshotsNestedInput = {
    create?: XOR<PlayerCreateWithoutCompetitionSnapshotsInput, PlayerUncheckedCreateWithoutCompetitionSnapshotsInput>;
    connectOrCreate?: PlayerCreateOrConnectWithoutCompetitionSnapshotsInput;
    upsert?: PlayerUpsertWithoutCompetitionSnapshotsInput;
    connect?: PlayerWhereUniqueInput;
    update?: XOR<
      XOR<PlayerUpdateToOneWithWhereWithoutCompetitionSnapshotsInput, PlayerUpdateWithoutCompetitionSnapshotsInput>,
      PlayerUncheckedUpdateWithoutCompetitionSnapshotsInput
    >;
  };

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string;
  };

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedIntFilter<$PrismaModel>;
    _min?: NestedIntFilter<$PrismaModel>;
    _max?: NestedIntFilter<$PrismaModel>;
  };

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | FloatFieldRefInput<$PrismaModel>;
    lte?: number | FloatFieldRefInput<$PrismaModel>;
    gt?: number | FloatFieldRefInput<$PrismaModel>;
    gte?: number | FloatFieldRefInput<$PrismaModel>;
    not?: NestedFloatFilter<$PrismaModel> | number;
  };

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedDateTimeFilter<$PrismaModel>;
    _max?: NestedDateTimeFilter<$PrismaModel>;
  };

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | null;
    notIn?: number[] | null;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntNullableFilter<$PrismaModel> | number | null;
  };

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
  };

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: NestedDateTimeNullableFilter<$PrismaModel>;
  };

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolFilter<$PrismaModel> | boolean;
  };

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedBoolFilter<$PrismaModel>;
    _max?: NestedBoolFilter<$PrismaModel>;
  };

  export type PlayerCreateWithoutSubscriptionsInput = {
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    accounts?: AccountCreateNestedManyWithoutPlayerInput;
    competitionParticipants?: CompetitionParticipantCreateNestedManyWithoutPlayerInput;
    competitionSnapshots?: CompetitionSnapshotCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerUncheckedCreateWithoutSubscriptionsInput = {
    id?: number;
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    accounts?: AccountUncheckedCreateNestedManyWithoutPlayerInput;
    competitionParticipants?: CompetitionParticipantUncheckedCreateNestedManyWithoutPlayerInput;
    competitionSnapshots?: CompetitionSnapshotUncheckedCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerCreateOrConnectWithoutSubscriptionsInput = {
    where: PlayerWhereUniqueInput;
    create: XOR<PlayerCreateWithoutSubscriptionsInput, PlayerUncheckedCreateWithoutSubscriptionsInput>;
  };

  export type PlayerUpsertWithoutSubscriptionsInput = {
    update: XOR<PlayerUpdateWithoutSubscriptionsInput, PlayerUncheckedUpdateWithoutSubscriptionsInput>;
    create: XOR<PlayerCreateWithoutSubscriptionsInput, PlayerUncheckedCreateWithoutSubscriptionsInput>;
    where?: PlayerWhereInput;
  };

  export type PlayerUpdateToOneWithWhereWithoutSubscriptionsInput = {
    where?: PlayerWhereInput;
    data: XOR<PlayerUpdateWithoutSubscriptionsInput, PlayerUncheckedUpdateWithoutSubscriptionsInput>;
  };

  export type PlayerUpdateWithoutSubscriptionsInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: AccountUpdateManyWithoutPlayerNestedInput;
    competitionParticipants?: CompetitionParticipantUpdateManyWithoutPlayerNestedInput;
    competitionSnapshots?: CompetitionSnapshotUpdateManyWithoutPlayerNestedInput;
  };

  export type PlayerUncheckedUpdateWithoutSubscriptionsInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: AccountUncheckedUpdateManyWithoutPlayerNestedInput;
    competitionParticipants?: CompetitionParticipantUncheckedUpdateManyWithoutPlayerNestedInput;
    competitionSnapshots?: CompetitionSnapshotUncheckedUpdateManyWithoutPlayerNestedInput;
  };

  export type AccountCreateWithoutPlayerInput = {
    alias: string;
    puuid: string;
    region: string;
    lastProcessedMatchId?: string | null;
    lastMatchTime?: Date | string | null;
    lastCheckedAt?: Date | string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type AccountUncheckedCreateWithoutPlayerInput = {
    id?: number;
    alias: string;
    puuid: string;
    region: string;
    lastProcessedMatchId?: string | null;
    lastMatchTime?: Date | string | null;
    lastCheckedAt?: Date | string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type AccountCreateOrConnectWithoutPlayerInput = {
    where: AccountWhereUniqueInput;
    create: XOR<AccountCreateWithoutPlayerInput, AccountUncheckedCreateWithoutPlayerInput>;
  };

  export type AccountCreateManyPlayerInputEnvelope = {
    data: AccountCreateManyPlayerInput | AccountCreateManyPlayerInput[];
  };

  export type SubscriptionCreateWithoutPlayerInput = {
    channelId: string;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type SubscriptionUncheckedCreateWithoutPlayerInput = {
    id?: number;
    channelId: string;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type SubscriptionCreateOrConnectWithoutPlayerInput = {
    where: SubscriptionWhereUniqueInput;
    create: XOR<SubscriptionCreateWithoutPlayerInput, SubscriptionUncheckedCreateWithoutPlayerInput>;
  };

  export type SubscriptionCreateManyPlayerInputEnvelope = {
    data: SubscriptionCreateManyPlayerInput | SubscriptionCreateManyPlayerInput[];
  };

  export type CompetitionParticipantCreateWithoutPlayerInput = {
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    competition: CompetitionCreateNestedOneWithoutParticipantsInput;
  };

  export type CompetitionParticipantUncheckedCreateWithoutPlayerInput = {
    id?: number;
    competitionId: number;
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
  };

  export type CompetitionParticipantCreateOrConnectWithoutPlayerInput = {
    where: CompetitionParticipantWhereUniqueInput;
    create: XOR<
      CompetitionParticipantCreateWithoutPlayerInput,
      CompetitionParticipantUncheckedCreateWithoutPlayerInput
    >;
  };

  export type CompetitionParticipantCreateManyPlayerInputEnvelope = {
    data: CompetitionParticipantCreateManyPlayerInput | CompetitionParticipantCreateManyPlayerInput[];
  };

  export type CompetitionSnapshotCreateWithoutPlayerInput = {
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
    competition: CompetitionCreateNestedOneWithoutSnapshotsInput;
  };

  export type CompetitionSnapshotUncheckedCreateWithoutPlayerInput = {
    id?: number;
    competitionId: number;
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
  };

  export type CompetitionSnapshotCreateOrConnectWithoutPlayerInput = {
    where: CompetitionSnapshotWhereUniqueInput;
    create: XOR<CompetitionSnapshotCreateWithoutPlayerInput, CompetitionSnapshotUncheckedCreateWithoutPlayerInput>;
  };

  export type CompetitionSnapshotCreateManyPlayerInputEnvelope = {
    data: CompetitionSnapshotCreateManyPlayerInput | CompetitionSnapshotCreateManyPlayerInput[];
  };

  export type AccountUpsertWithWhereUniqueWithoutPlayerInput = {
    where: AccountWhereUniqueInput;
    update: XOR<AccountUpdateWithoutPlayerInput, AccountUncheckedUpdateWithoutPlayerInput>;
    create: XOR<AccountCreateWithoutPlayerInput, AccountUncheckedCreateWithoutPlayerInput>;
  };

  export type AccountUpdateWithWhereUniqueWithoutPlayerInput = {
    where: AccountWhereUniqueInput;
    data: XOR<AccountUpdateWithoutPlayerInput, AccountUncheckedUpdateWithoutPlayerInput>;
  };

  export type AccountUpdateManyWithWhereWithoutPlayerInput = {
    where: AccountScalarWhereInput;
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyWithoutPlayerInput>;
  };

  export type AccountScalarWhereInput = {
    AND?: AccountScalarWhereInput | AccountScalarWhereInput[];
    OR?: AccountScalarWhereInput[];
    NOT?: AccountScalarWhereInput | AccountScalarWhereInput[];
    id?: IntFilter<"Account"> | number;
    alias?: StringFilter<"Account"> | string;
    puuid?: StringFilter<"Account"> | string;
    region?: StringFilter<"Account"> | string;
    playerId?: IntFilter<"Account"> | number;
    lastProcessedMatchId?: StringNullableFilter<"Account"> | string | null;
    lastMatchTime?: DateTimeNullableFilter<"Account"> | Date | string | null;
    lastCheckedAt?: DateTimeNullableFilter<"Account"> | Date | string | null;
    serverId?: StringFilter<"Account"> | string;
    creatorDiscordId?: StringFilter<"Account"> | string;
    createdTime?: DateTimeFilter<"Account"> | Date | string;
    updatedTime?: DateTimeFilter<"Account"> | Date | string;
  };

  export type SubscriptionUpsertWithWhereUniqueWithoutPlayerInput = {
    where: SubscriptionWhereUniqueInput;
    update: XOR<SubscriptionUpdateWithoutPlayerInput, SubscriptionUncheckedUpdateWithoutPlayerInput>;
    create: XOR<SubscriptionCreateWithoutPlayerInput, SubscriptionUncheckedCreateWithoutPlayerInput>;
  };

  export type SubscriptionUpdateWithWhereUniqueWithoutPlayerInput = {
    where: SubscriptionWhereUniqueInput;
    data: XOR<SubscriptionUpdateWithoutPlayerInput, SubscriptionUncheckedUpdateWithoutPlayerInput>;
  };

  export type SubscriptionUpdateManyWithWhereWithoutPlayerInput = {
    where: SubscriptionScalarWhereInput;
    data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyWithoutPlayerInput>;
  };

  export type SubscriptionScalarWhereInput = {
    AND?: SubscriptionScalarWhereInput | SubscriptionScalarWhereInput[];
    OR?: SubscriptionScalarWhereInput[];
    NOT?: SubscriptionScalarWhereInput | SubscriptionScalarWhereInput[];
    id?: IntFilter<"Subscription"> | number;
    playerId?: IntFilter<"Subscription"> | number;
    channelId?: StringFilter<"Subscription"> | string;
    serverId?: StringFilter<"Subscription"> | string;
    creatorDiscordId?: StringFilter<"Subscription"> | string;
    createdTime?: DateTimeFilter<"Subscription"> | Date | string;
    updatedTime?: DateTimeFilter<"Subscription"> | Date | string;
  };

  export type CompetitionParticipantUpsertWithWhereUniqueWithoutPlayerInput = {
    where: CompetitionParticipantWhereUniqueInput;
    update: XOR<
      CompetitionParticipantUpdateWithoutPlayerInput,
      CompetitionParticipantUncheckedUpdateWithoutPlayerInput
    >;
    create: XOR<
      CompetitionParticipantCreateWithoutPlayerInput,
      CompetitionParticipantUncheckedCreateWithoutPlayerInput
    >;
  };

  export type CompetitionParticipantUpdateWithWhereUniqueWithoutPlayerInput = {
    where: CompetitionParticipantWhereUniqueInput;
    data: XOR<CompetitionParticipantUpdateWithoutPlayerInput, CompetitionParticipantUncheckedUpdateWithoutPlayerInput>;
  };

  export type CompetitionParticipantUpdateManyWithWhereWithoutPlayerInput = {
    where: CompetitionParticipantScalarWhereInput;
    data: XOR<
      CompetitionParticipantUpdateManyMutationInput,
      CompetitionParticipantUncheckedUpdateManyWithoutPlayerInput
    >;
  };

  export type CompetitionParticipantScalarWhereInput = {
    AND?: CompetitionParticipantScalarWhereInput | CompetitionParticipantScalarWhereInput[];
    OR?: CompetitionParticipantScalarWhereInput[];
    NOT?: CompetitionParticipantScalarWhereInput | CompetitionParticipantScalarWhereInput[];
    id?: IntFilter<"CompetitionParticipant"> | number;
    competitionId?: IntFilter<"CompetitionParticipant"> | number;
    playerId?: IntFilter<"CompetitionParticipant"> | number;
    status?: StringFilter<"CompetitionParticipant"> | string;
    invitedBy?: StringNullableFilter<"CompetitionParticipant"> | string | null;
    invitedAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
    joinedAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
    leftAt?: DateTimeNullableFilter<"CompetitionParticipant"> | Date | string | null;
  };

  export type CompetitionSnapshotUpsertWithWhereUniqueWithoutPlayerInput = {
    where: CompetitionSnapshotWhereUniqueInput;
    update: XOR<CompetitionSnapshotUpdateWithoutPlayerInput, CompetitionSnapshotUncheckedUpdateWithoutPlayerInput>;
    create: XOR<CompetitionSnapshotCreateWithoutPlayerInput, CompetitionSnapshotUncheckedCreateWithoutPlayerInput>;
  };

  export type CompetitionSnapshotUpdateWithWhereUniqueWithoutPlayerInput = {
    where: CompetitionSnapshotWhereUniqueInput;
    data: XOR<CompetitionSnapshotUpdateWithoutPlayerInput, CompetitionSnapshotUncheckedUpdateWithoutPlayerInput>;
  };

  export type CompetitionSnapshotUpdateManyWithWhereWithoutPlayerInput = {
    where: CompetitionSnapshotScalarWhereInput;
    data: XOR<CompetitionSnapshotUpdateManyMutationInput, CompetitionSnapshotUncheckedUpdateManyWithoutPlayerInput>;
  };

  export type CompetitionSnapshotScalarWhereInput = {
    AND?: CompetitionSnapshotScalarWhereInput | CompetitionSnapshotScalarWhereInput[];
    OR?: CompetitionSnapshotScalarWhereInput[];
    NOT?: CompetitionSnapshotScalarWhereInput | CompetitionSnapshotScalarWhereInput[];
    id?: IntFilter<"CompetitionSnapshot"> | number;
    competitionId?: IntFilter<"CompetitionSnapshot"> | number;
    playerId?: IntFilter<"CompetitionSnapshot"> | number;
    snapshotType?: StringFilter<"CompetitionSnapshot"> | string;
    snapshotData?: StringFilter<"CompetitionSnapshot"> | string;
    snapshotTime?: DateTimeFilter<"CompetitionSnapshot"> | Date | string;
  };

  export type PlayerCreateWithoutAccountsInput = {
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    subscriptions?: SubscriptionCreateNestedManyWithoutPlayerInput;
    competitionParticipants?: CompetitionParticipantCreateNestedManyWithoutPlayerInput;
    competitionSnapshots?: CompetitionSnapshotCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerUncheckedCreateWithoutAccountsInput = {
    id?: number;
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutPlayerInput;
    competitionParticipants?: CompetitionParticipantUncheckedCreateNestedManyWithoutPlayerInput;
    competitionSnapshots?: CompetitionSnapshotUncheckedCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerCreateOrConnectWithoutAccountsInput = {
    where: PlayerWhereUniqueInput;
    create: XOR<PlayerCreateWithoutAccountsInput, PlayerUncheckedCreateWithoutAccountsInput>;
  };

  export type PlayerUpsertWithoutAccountsInput = {
    update: XOR<PlayerUpdateWithoutAccountsInput, PlayerUncheckedUpdateWithoutAccountsInput>;
    create: XOR<PlayerCreateWithoutAccountsInput, PlayerUncheckedCreateWithoutAccountsInput>;
    where?: PlayerWhereInput;
  };

  export type PlayerUpdateToOneWithWhereWithoutAccountsInput = {
    where?: PlayerWhereInput;
    data: XOR<PlayerUpdateWithoutAccountsInput, PlayerUncheckedUpdateWithoutAccountsInput>;
  };

  export type PlayerUpdateWithoutAccountsInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    subscriptions?: SubscriptionUpdateManyWithoutPlayerNestedInput;
    competitionParticipants?: CompetitionParticipantUpdateManyWithoutPlayerNestedInput;
    competitionSnapshots?: CompetitionSnapshotUpdateManyWithoutPlayerNestedInput;
  };

  export type PlayerUncheckedUpdateWithoutAccountsInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutPlayerNestedInput;
    competitionParticipants?: CompetitionParticipantUncheckedUpdateManyWithoutPlayerNestedInput;
    competitionSnapshots?: CompetitionSnapshotUncheckedUpdateManyWithoutPlayerNestedInput;
  };

  export type CompetitionParticipantCreateWithoutCompetitionInput = {
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
    player: PlayerCreateNestedOneWithoutCompetitionParticipantsInput;
  };

  export type CompetitionParticipantUncheckedCreateWithoutCompetitionInput = {
    id?: number;
    playerId: number;
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
  };

  export type CompetitionParticipantCreateOrConnectWithoutCompetitionInput = {
    where: CompetitionParticipantWhereUniqueInput;
    create: XOR<
      CompetitionParticipantCreateWithoutCompetitionInput,
      CompetitionParticipantUncheckedCreateWithoutCompetitionInput
    >;
  };

  export type CompetitionParticipantCreateManyCompetitionInputEnvelope = {
    data: CompetitionParticipantCreateManyCompetitionInput | CompetitionParticipantCreateManyCompetitionInput[];
  };

  export type CompetitionSnapshotCreateWithoutCompetitionInput = {
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
    player: PlayerCreateNestedOneWithoutCompetitionSnapshotsInput;
  };

  export type CompetitionSnapshotUncheckedCreateWithoutCompetitionInput = {
    id?: number;
    playerId: number;
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
  };

  export type CompetitionSnapshotCreateOrConnectWithoutCompetitionInput = {
    where: CompetitionSnapshotWhereUniqueInput;
    create: XOR<
      CompetitionSnapshotCreateWithoutCompetitionInput,
      CompetitionSnapshotUncheckedCreateWithoutCompetitionInput
    >;
  };

  export type CompetitionSnapshotCreateManyCompetitionInputEnvelope = {
    data: CompetitionSnapshotCreateManyCompetitionInput | CompetitionSnapshotCreateManyCompetitionInput[];
  };

  export type CompetitionParticipantUpsertWithWhereUniqueWithoutCompetitionInput = {
    where: CompetitionParticipantWhereUniqueInput;
    update: XOR<
      CompetitionParticipantUpdateWithoutCompetitionInput,
      CompetitionParticipantUncheckedUpdateWithoutCompetitionInput
    >;
    create: XOR<
      CompetitionParticipantCreateWithoutCompetitionInput,
      CompetitionParticipantUncheckedCreateWithoutCompetitionInput
    >;
  };

  export type CompetitionParticipantUpdateWithWhereUniqueWithoutCompetitionInput = {
    where: CompetitionParticipantWhereUniqueInput;
    data: XOR<
      CompetitionParticipantUpdateWithoutCompetitionInput,
      CompetitionParticipantUncheckedUpdateWithoutCompetitionInput
    >;
  };

  export type CompetitionParticipantUpdateManyWithWhereWithoutCompetitionInput = {
    where: CompetitionParticipantScalarWhereInput;
    data: XOR<
      CompetitionParticipantUpdateManyMutationInput,
      CompetitionParticipantUncheckedUpdateManyWithoutCompetitionInput
    >;
  };

  export type CompetitionSnapshotUpsertWithWhereUniqueWithoutCompetitionInput = {
    where: CompetitionSnapshotWhereUniqueInput;
    update: XOR<
      CompetitionSnapshotUpdateWithoutCompetitionInput,
      CompetitionSnapshotUncheckedUpdateWithoutCompetitionInput
    >;
    create: XOR<
      CompetitionSnapshotCreateWithoutCompetitionInput,
      CompetitionSnapshotUncheckedCreateWithoutCompetitionInput
    >;
  };

  export type CompetitionSnapshotUpdateWithWhereUniqueWithoutCompetitionInput = {
    where: CompetitionSnapshotWhereUniqueInput;
    data: XOR<
      CompetitionSnapshotUpdateWithoutCompetitionInput,
      CompetitionSnapshotUncheckedUpdateWithoutCompetitionInput
    >;
  };

  export type CompetitionSnapshotUpdateManyWithWhereWithoutCompetitionInput = {
    where: CompetitionSnapshotScalarWhereInput;
    data: XOR<
      CompetitionSnapshotUpdateManyMutationInput,
      CompetitionSnapshotUncheckedUpdateManyWithoutCompetitionInput
    >;
  };

  export type CompetitionCreateWithoutParticipantsInput = {
    serverId: string;
    ownerId: string;
    title: string;
    description: string;
    channelId: string;
    isCancelled?: boolean;
    visibility: string;
    criteriaType: string;
    criteriaConfig: string;
    maxParticipants?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    seasonId?: string | null;
    startProcessedAt?: Date | string | null;
    endProcessedAt?: Date | string | null;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    snapshots?: CompetitionSnapshotCreateNestedManyWithoutCompetitionInput;
  };

  export type CompetitionUncheckedCreateWithoutParticipantsInput = {
    id?: number;
    serverId: string;
    ownerId: string;
    title: string;
    description: string;
    channelId: string;
    isCancelled?: boolean;
    visibility: string;
    criteriaType: string;
    criteriaConfig: string;
    maxParticipants?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    seasonId?: string | null;
    startProcessedAt?: Date | string | null;
    endProcessedAt?: Date | string | null;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    snapshots?: CompetitionSnapshotUncheckedCreateNestedManyWithoutCompetitionInput;
  };

  export type CompetitionCreateOrConnectWithoutParticipantsInput = {
    where: CompetitionWhereUniqueInput;
    create: XOR<CompetitionCreateWithoutParticipantsInput, CompetitionUncheckedCreateWithoutParticipantsInput>;
  };

  export type PlayerCreateWithoutCompetitionParticipantsInput = {
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    accounts?: AccountCreateNestedManyWithoutPlayerInput;
    subscriptions?: SubscriptionCreateNestedManyWithoutPlayerInput;
    competitionSnapshots?: CompetitionSnapshotCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerUncheckedCreateWithoutCompetitionParticipantsInput = {
    id?: number;
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    accounts?: AccountUncheckedCreateNestedManyWithoutPlayerInput;
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutPlayerInput;
    competitionSnapshots?: CompetitionSnapshotUncheckedCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerCreateOrConnectWithoutCompetitionParticipantsInput = {
    where: PlayerWhereUniqueInput;
    create: XOR<
      PlayerCreateWithoutCompetitionParticipantsInput,
      PlayerUncheckedCreateWithoutCompetitionParticipantsInput
    >;
  };

  export type CompetitionUpsertWithoutParticipantsInput = {
    update: XOR<CompetitionUpdateWithoutParticipantsInput, CompetitionUncheckedUpdateWithoutParticipantsInput>;
    create: XOR<CompetitionCreateWithoutParticipantsInput, CompetitionUncheckedCreateWithoutParticipantsInput>;
    where?: CompetitionWhereInput;
  };

  export type CompetitionUpdateToOneWithWhereWithoutParticipantsInput = {
    where?: CompetitionWhereInput;
    data: XOR<CompetitionUpdateWithoutParticipantsInput, CompetitionUncheckedUpdateWithoutParticipantsInput>;
  };

  export type CompetitionUpdateWithoutParticipantsInput = {
    serverId?: StringFieldUpdateOperationsInput | string;
    ownerId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    description?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    isCancelled?: BoolFieldUpdateOperationsInput | boolean;
    visibility?: StringFieldUpdateOperationsInput | string;
    criteriaType?: StringFieldUpdateOperationsInput | string;
    criteriaConfig?: StringFieldUpdateOperationsInput | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null;
    startProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    snapshots?: CompetitionSnapshotUpdateManyWithoutCompetitionNestedInput;
  };

  export type CompetitionUncheckedUpdateWithoutParticipantsInput = {
    id?: IntFieldUpdateOperationsInput | number;
    serverId?: StringFieldUpdateOperationsInput | string;
    ownerId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    description?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    isCancelled?: BoolFieldUpdateOperationsInput | boolean;
    visibility?: StringFieldUpdateOperationsInput | string;
    criteriaType?: StringFieldUpdateOperationsInput | string;
    criteriaConfig?: StringFieldUpdateOperationsInput | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null;
    startProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    snapshots?: CompetitionSnapshotUncheckedUpdateManyWithoutCompetitionNestedInput;
  };

  export type PlayerUpsertWithoutCompetitionParticipantsInput = {
    update: XOR<
      PlayerUpdateWithoutCompetitionParticipantsInput,
      PlayerUncheckedUpdateWithoutCompetitionParticipantsInput
    >;
    create: XOR<
      PlayerCreateWithoutCompetitionParticipantsInput,
      PlayerUncheckedCreateWithoutCompetitionParticipantsInput
    >;
    where?: PlayerWhereInput;
  };

  export type PlayerUpdateToOneWithWhereWithoutCompetitionParticipantsInput = {
    where?: PlayerWhereInput;
    data: XOR<
      PlayerUpdateWithoutCompetitionParticipantsInput,
      PlayerUncheckedUpdateWithoutCompetitionParticipantsInput
    >;
  };

  export type PlayerUpdateWithoutCompetitionParticipantsInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: AccountUpdateManyWithoutPlayerNestedInput;
    subscriptions?: SubscriptionUpdateManyWithoutPlayerNestedInput;
    competitionSnapshots?: CompetitionSnapshotUpdateManyWithoutPlayerNestedInput;
  };

  export type PlayerUncheckedUpdateWithoutCompetitionParticipantsInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: AccountUncheckedUpdateManyWithoutPlayerNestedInput;
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutPlayerNestedInput;
    competitionSnapshots?: CompetitionSnapshotUncheckedUpdateManyWithoutPlayerNestedInput;
  };

  export type CompetitionCreateWithoutSnapshotsInput = {
    serverId: string;
    ownerId: string;
    title: string;
    description: string;
    channelId: string;
    isCancelled?: boolean;
    visibility: string;
    criteriaType: string;
    criteriaConfig: string;
    maxParticipants?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    seasonId?: string | null;
    startProcessedAt?: Date | string | null;
    endProcessedAt?: Date | string | null;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    participants?: CompetitionParticipantCreateNestedManyWithoutCompetitionInput;
  };

  export type CompetitionUncheckedCreateWithoutSnapshotsInput = {
    id?: number;
    serverId: string;
    ownerId: string;
    title: string;
    description: string;
    channelId: string;
    isCancelled?: boolean;
    visibility: string;
    criteriaType: string;
    criteriaConfig: string;
    maxParticipants?: number;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    seasonId?: string | null;
    startProcessedAt?: Date | string | null;
    endProcessedAt?: Date | string | null;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    participants?: CompetitionParticipantUncheckedCreateNestedManyWithoutCompetitionInput;
  };

  export type CompetitionCreateOrConnectWithoutSnapshotsInput = {
    where: CompetitionWhereUniqueInput;
    create: XOR<CompetitionCreateWithoutSnapshotsInput, CompetitionUncheckedCreateWithoutSnapshotsInput>;
  };

  export type PlayerCreateWithoutCompetitionSnapshotsInput = {
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    accounts?: AccountCreateNestedManyWithoutPlayerInput;
    subscriptions?: SubscriptionCreateNestedManyWithoutPlayerInput;
    competitionParticipants?: CompetitionParticipantCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerUncheckedCreateWithoutCompetitionSnapshotsInput = {
    id?: number;
    alias: string;
    discordId?: string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
    accounts?: AccountUncheckedCreateNestedManyWithoutPlayerInput;
    subscriptions?: SubscriptionUncheckedCreateNestedManyWithoutPlayerInput;
    competitionParticipants?: CompetitionParticipantUncheckedCreateNestedManyWithoutPlayerInput;
  };

  export type PlayerCreateOrConnectWithoutCompetitionSnapshotsInput = {
    where: PlayerWhereUniqueInput;
    create: XOR<PlayerCreateWithoutCompetitionSnapshotsInput, PlayerUncheckedCreateWithoutCompetitionSnapshotsInput>;
  };

  export type CompetitionUpsertWithoutSnapshotsInput = {
    update: XOR<CompetitionUpdateWithoutSnapshotsInput, CompetitionUncheckedUpdateWithoutSnapshotsInput>;
    create: XOR<CompetitionCreateWithoutSnapshotsInput, CompetitionUncheckedCreateWithoutSnapshotsInput>;
    where?: CompetitionWhereInput;
  };

  export type CompetitionUpdateToOneWithWhereWithoutSnapshotsInput = {
    where?: CompetitionWhereInput;
    data: XOR<CompetitionUpdateWithoutSnapshotsInput, CompetitionUncheckedUpdateWithoutSnapshotsInput>;
  };

  export type CompetitionUpdateWithoutSnapshotsInput = {
    serverId?: StringFieldUpdateOperationsInput | string;
    ownerId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    description?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    isCancelled?: BoolFieldUpdateOperationsInput | boolean;
    visibility?: StringFieldUpdateOperationsInput | string;
    criteriaType?: StringFieldUpdateOperationsInput | string;
    criteriaConfig?: StringFieldUpdateOperationsInput | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null;
    startProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    participants?: CompetitionParticipantUpdateManyWithoutCompetitionNestedInput;
  };

  export type CompetitionUncheckedUpdateWithoutSnapshotsInput = {
    id?: IntFieldUpdateOperationsInput | number;
    serverId?: StringFieldUpdateOperationsInput | string;
    ownerId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    description?: StringFieldUpdateOperationsInput | string;
    channelId?: StringFieldUpdateOperationsInput | string;
    isCancelled?: BoolFieldUpdateOperationsInput | boolean;
    visibility?: StringFieldUpdateOperationsInput | string;
    criteriaType?: StringFieldUpdateOperationsInput | string;
    criteriaConfig?: StringFieldUpdateOperationsInput | string;
    maxParticipants?: IntFieldUpdateOperationsInput | number;
    startDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    seasonId?: NullableStringFieldUpdateOperationsInput | string | null;
    startProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    endProcessedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    participants?: CompetitionParticipantUncheckedUpdateManyWithoutCompetitionNestedInput;
  };

  export type PlayerUpsertWithoutCompetitionSnapshotsInput = {
    update: XOR<PlayerUpdateWithoutCompetitionSnapshotsInput, PlayerUncheckedUpdateWithoutCompetitionSnapshotsInput>;
    create: XOR<PlayerCreateWithoutCompetitionSnapshotsInput, PlayerUncheckedCreateWithoutCompetitionSnapshotsInput>;
    where?: PlayerWhereInput;
  };

  export type PlayerUpdateToOneWithWhereWithoutCompetitionSnapshotsInput = {
    where?: PlayerWhereInput;
    data: XOR<PlayerUpdateWithoutCompetitionSnapshotsInput, PlayerUncheckedUpdateWithoutCompetitionSnapshotsInput>;
  };

  export type PlayerUpdateWithoutCompetitionSnapshotsInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: AccountUpdateManyWithoutPlayerNestedInput;
    subscriptions?: SubscriptionUpdateManyWithoutPlayerNestedInput;
    competitionParticipants?: CompetitionParticipantUpdateManyWithoutPlayerNestedInput;
  };

  export type PlayerUncheckedUpdateWithoutCompetitionSnapshotsInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    discordId?: NullableStringFieldUpdateOperationsInput | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    accounts?: AccountUncheckedUpdateManyWithoutPlayerNestedInput;
    subscriptions?: SubscriptionUncheckedUpdateManyWithoutPlayerNestedInput;
    competitionParticipants?: CompetitionParticipantUncheckedUpdateManyWithoutPlayerNestedInput;
  };

  export type AccountCreateManyPlayerInput = {
    id?: number;
    alias: string;
    puuid: string;
    region: string;
    lastProcessedMatchId?: string | null;
    lastMatchTime?: Date | string | null;
    lastCheckedAt?: Date | string | null;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type SubscriptionCreateManyPlayerInput = {
    id?: number;
    channelId: string;
    serverId: string;
    creatorDiscordId: string;
    createdTime: Date | string;
    updatedTime: Date | string;
  };

  export type CompetitionParticipantCreateManyPlayerInput = {
    id?: number;
    competitionId: number;
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
  };

  export type CompetitionSnapshotCreateManyPlayerInput = {
    id?: number;
    competitionId: number;
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
  };

  export type AccountUpdateWithoutPlayerInput = {
    alias?: StringFieldUpdateOperationsInput | string;
    puuid?: StringFieldUpdateOperationsInput | string;
    region?: StringFieldUpdateOperationsInput | string;
    lastProcessedMatchId?: NullableStringFieldUpdateOperationsInput | string | null;
    lastMatchTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type AccountUncheckedUpdateWithoutPlayerInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    puuid?: StringFieldUpdateOperationsInput | string;
    region?: StringFieldUpdateOperationsInput | string;
    lastProcessedMatchId?: NullableStringFieldUpdateOperationsInput | string | null;
    lastMatchTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type AccountUncheckedUpdateManyWithoutPlayerInput = {
    id?: IntFieldUpdateOperationsInput | number;
    alias?: StringFieldUpdateOperationsInput | string;
    puuid?: StringFieldUpdateOperationsInput | string;
    region?: StringFieldUpdateOperationsInput | string;
    lastProcessedMatchId?: NullableStringFieldUpdateOperationsInput | string | null;
    lastMatchTime?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    lastCheckedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type SubscriptionUpdateWithoutPlayerInput = {
    channelId?: StringFieldUpdateOperationsInput | string;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type SubscriptionUncheckedUpdateWithoutPlayerInput = {
    id?: IntFieldUpdateOperationsInput | number;
    channelId?: StringFieldUpdateOperationsInput | string;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type SubscriptionUncheckedUpdateManyWithoutPlayerInput = {
    id?: IntFieldUpdateOperationsInput | number;
    channelId?: StringFieldUpdateOperationsInput | string;
    serverId?: StringFieldUpdateOperationsInput | string;
    creatorDiscordId?: StringFieldUpdateOperationsInput | string;
    createdTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionParticipantUpdateWithoutPlayerInput = {
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    competition?: CompetitionUpdateOneRequiredWithoutParticipantsNestedInput;
  };

  export type CompetitionParticipantUncheckedUpdateWithoutPlayerInput = {
    id?: IntFieldUpdateOperationsInput | number;
    competitionId?: IntFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type CompetitionParticipantUncheckedUpdateManyWithoutPlayerInput = {
    id?: IntFieldUpdateOperationsInput | number;
    competitionId?: IntFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type CompetitionSnapshotUpdateWithoutPlayerInput = {
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    competition?: CompetitionUpdateOneRequiredWithoutSnapshotsNestedInput;
  };

  export type CompetitionSnapshotUncheckedUpdateWithoutPlayerInput = {
    id?: IntFieldUpdateOperationsInput | number;
    competitionId?: IntFieldUpdateOperationsInput | number;
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionSnapshotUncheckedUpdateManyWithoutPlayerInput = {
    id?: IntFieldUpdateOperationsInput | number;
    competitionId?: IntFieldUpdateOperationsInput | number;
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionParticipantCreateManyCompetitionInput = {
    id?: number;
    playerId: number;
    status: string;
    invitedBy?: string | null;
    invitedAt?: Date | string | null;
    joinedAt?: Date | string | null;
    leftAt?: Date | string | null;
  };

  export type CompetitionSnapshotCreateManyCompetitionInput = {
    id?: number;
    playerId: number;
    snapshotType: string;
    snapshotData: string;
    snapshotTime: Date | string;
  };

  export type CompetitionParticipantUpdateWithoutCompetitionInput = {
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    player?: PlayerUpdateOneRequiredWithoutCompetitionParticipantsNestedInput;
  };

  export type CompetitionParticipantUncheckedUpdateWithoutCompetitionInput = {
    id?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type CompetitionParticipantUncheckedUpdateManyWithoutCompetitionInput = {
    id?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    status?: StringFieldUpdateOperationsInput | string;
    invitedBy?: NullableStringFieldUpdateOperationsInput | string | null;
    invitedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    joinedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    leftAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type CompetitionSnapshotUpdateWithoutCompetitionInput = {
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
    player?: PlayerUpdateOneRequiredWithoutCompetitionSnapshotsNestedInput;
  };

  export type CompetitionSnapshotUncheckedUpdateWithoutCompetitionInput = {
    id?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type CompetitionSnapshotUncheckedUpdateManyWithoutCompetitionInput = {
    id?: IntFieldUpdateOperationsInput | number;
    playerId?: IntFieldUpdateOperationsInput | number;
    snapshotType?: StringFieldUpdateOperationsInput | string;
    snapshotData?: StringFieldUpdateOperationsInput | string;
    snapshotTime?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number;
  };

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF;
}
