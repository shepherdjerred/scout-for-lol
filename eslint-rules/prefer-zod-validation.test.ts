import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "bun:test";
import { preferZodValidation } from "./prefer-zod-validation";

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

ruleTester.run("prefer-zod-validation", preferZodValidation, {
  valid: [
    {
      name: "allows single typeof check on property",
      code: `if (typeof obj.field === "string") { console.log(obj.field); }`,
    },
    {
      name: "allows single typeof check on nested property",
      code: `if (typeof obj.nested.value === "string") { console.log(obj.nested.value); }`,
    },
    {
      name: "allows simple property access without type checking",
      code: `if (data.user.profile.settings.theme === "dark") { }`,
    },
    {
      name: "allows single instanceof check on property",
      code: `if (obj.field instanceof Error) { console.log(obj.field); }`,
    },
    {
      name: "allows instanceof custom class on property",
      code: `if (obj.value instanceof MyClass) { console.log(obj.value); }`,
    },
    {
      name: "allows typeof check on different properties (2 checks)",
      code: `if (typeof obj.a === "string" && typeof obj.b === "number") { }`,
    },
    {
      name: "allows Zod validation",
      code: `const result = schema.safeParse(data);`,
    },
    {
      name: "allows property access after validation",
      code: `const user = schema.parse(data); console.log(user.name.first);`,
    },
    {
      name: "allows simple truthiness check with single type check",
      code: `if (obj && typeof obj.field === "string") { }`,
    },
    {
      name: "allows two type checks chained",
      code: `if (obj && typeof obj.field === "string") { }`,
    },
  ],
  invalid: [
    {
      name: "disallows repeated typeof check on same nested property",
      code: `if (typeof obj.field === "string") { const x = typeof obj.field === "number"; }`,
      errors: [
        {
          messageId: "repeatedTypeChecking",
        },
      ],
    },
    {
      name: "disallows typeof check in multiple conditions",
      code: `if (typeof user.profile.role === "string") { } if (typeof user.profile.role === "admin") { }`,
      errors: [
        {
          messageId: "repeatedTypeChecking",
        },
      ],
    },
    {
      name: "disallows repeated instanceof on same property",
      code: `if (obj.error instanceof Error) { const isErr = obj.error instanceof Error; }`,
      errors: [
        {
          messageId: "repeatedTypeChecking",
        },
      ],
    },
    {
      name: "disallows complex type checking chain with typeof",
      code: `const isValid = obj && typeof obj === "object" && "field" in obj && typeof obj.field === "string";`,
      errors: [
        {
          messageId: "complexTypeChecking",
        },
      ],
    },
    {
      name: "disallows complex permission checking pattern",
      code: `const isAdmin = member && typeof member === "object" && "permissions" in member && member.permissions && typeof member.permissions.has === "function";`,
      errors: [
        {
          messageId: "complexTypeChecking",
        },
      ],
    },
    {
      name: "disallows multiple typeof checks in chain",
      code: `if (typeof a === "string" && typeof b === "number" && typeof c === "boolean") { }`,
      errors: [
        {
          messageId: "complexTypeChecking",
        },
      ],
    },
    {
      name: "disallows mixed type checks (typeof + in + instanceof)",
      code: `const valid = typeof obj === "object" && "prop" in obj && obj.prop instanceof Error;`,
      errors: [
        {
          messageId: "complexTypeChecking",
        },
      ],
    },
  ],
});
