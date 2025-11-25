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
  ],
});
