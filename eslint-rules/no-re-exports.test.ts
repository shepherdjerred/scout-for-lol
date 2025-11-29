import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import { noReExports } from "./no-re-exports";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: false,
    },
  },
});

ruleTester.run("no-re-exports", noReExports, {
  valid: [
    {
      name: "allows exporting locally declared function",
      code: `export function myFunction() { return 42; }`,
    },
    {
      name: "allows exporting locally declared type",
      code: `export type MyType = { id: string; };`,
    },
    {
      name: "allows exporting locally declared interface",
      code: `export interface MyInterface { id: string; }`,
    },
    {
      name: "allows exporting locally declared const",
      code: `export const myConst = "value";`,
    },
    {
      name: "allows importing and using without re-exporting",
      code: `import { something } from "./other"; const x = something();`,
    },
    {
      name: "allows type alias that transforms imported type with generics",
      code: `import type { BaseType } from "./other"; export type MyType = BaseType<string>;`,
    },
    {
      name: "allows type alias that uses imported type in a union",
      code: `import type { BaseType } from "./other"; export type MyType = BaseType | null;`,
    },
    {
      name: "allows type alias that uses imported type in an intersection",
      code: `import type { BaseType } from "./other"; export type MyType = BaseType & { extra: boolean };`,
    },
    {
      name: "allows non-exported type alias that references imported type",
      code: `import type { BaseType } from "./other"; type LocalAlias = BaseType;`,
    },
  ],
  invalid: [
    {
      name: "disallows export * from",
      code: `export * from "./other-module";`,
      errors: [
        {
          messageId: "noExportAll",
        },
      ],
    },
    {
      name: "disallows export { ... } from",
      code: `export { myFunction } from "./other-module";`,
      errors: [
        {
          messageId: "noExportNamed",
        },
      ],
    },
    {
      name: "disallows re-exporting imported identifiers",
      code: `import { myFunction } from "./other"; export { myFunction };`,
      errors: [
        {
          messageId: "noReExportImported",
        },
      ],
    },
    {
      name: "disallows export type re-exports",
      code: `export type { MyType } from "./other-module";`,
      errors: [
        {
          messageId: "noExportNamed",
        },
      ],
    },
    {
      name: "disallows type alias re-exports (disguised re-export)",
      code: `import type { ImportedType } from "./other"; export type MyType = ImportedType;`,
      errors: [
        {
          messageId: "noTypeAliasReExport",
        },
      ],
    },
    {
      name: "disallows type alias re-exports with aliased import",
      code: `import type { Foo as ImportedFoo } from "./other"; export type Foo = ImportedFoo;`,
      errors: [
        {
          messageId: "noTypeAliasReExport",
        },
      ],
    },
    {
      name: "disallows multiple type alias re-exports",
      code: `import type { TypeA, TypeB } from "./other"; export type AliasA = TypeA; export type AliasB = TypeB;`,
      errors: [
        {
          messageId: "noTypeAliasReExport",
        },
        {
          messageId: "noTypeAliasReExport",
        },
      ],
    },
  ],
});
