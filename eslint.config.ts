import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import { zodSchemaNaming } from "./eslint-rules/zod-schema-naming.ts";
import { noRedundantZodParse } from "./eslint-rules/no-redundant-zod-parse.ts";
import { satoriBestPractices } from "./eslint-rules/satori-best-practices.ts";
import { prismaClientDisconnect } from "./eslint-rules/prisma-client-disconnect.ts";
import importPlugin from "eslint-plugin-import";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import * as regexpPlugin from "eslint-plugin-regexp";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import astroPlugin from "eslint-plugin-astro";
// Tailwind plugin currently disabled due to incompatibility with Tailwind CSS v4
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- No type definitions available
// // @ts-ignore
// import tailwindcss from "eslint-plugin-tailwindcss";

/**
 * Bridge typescript-eslint rule to ESLint plugin system
 *
 * Type assertion required: @typescript-eslint/utils RuleContext includes extra methods
 * (getAncestors, getDeclaredVariables, getScope, markVariableAsUsed) that base ESLint
 * RuleContext doesn't have. At runtime, typescript-eslint provides a compatible context,
 * but TypeScript sees the types as incompatible. The rule works correctly at runtime.
 */
const customRulesPlugin = {
  rules: {
    "zod-schema-naming": zodSchemaNaming,
    "no-redundant-zod-parse": noRedundantZodParse,
    "satori-best-practices": satoriBestPractices,
    "prisma-client-disconnect": prismaClientDisconnect,
  },
};

// eslint-disable-next-line @typescript-eslint/no-deprecated -- config() is the correct API for typescript-eslint v8+
export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  regexpPlugin.configs["flat/recommended"],
  {
    ignores: [
      "**/generated/**/*",
      "**/dist/**/*",
      "**/build/**/*",
      "**/.cache/**/*",
      "**/node_modules/**/*",
      "**/.astro/**/*",
      ".dagger/sdk/**/*",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".astro"],
      },
    },
  },
  // ESLint disable directive rules
  {
    plugins: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ESLint plugin type compatibility
      "eslint-comments": eslintComments,
    },
    rules: {
      // Require specific rule names when disabling ESLint (no blanket eslint-disable)
      "eslint-comments/no-unlimited-disable": "error",
      // Disallow unused eslint-disable comments
      "eslint-comments/no-unused-disable": "error",
      // Require descriptions for eslint-disable comments
      "eslint-comments/require-description": "error",
      // Disallow duplicate disable directives
      "eslint-comments/no-duplicate-disable": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
    rules: {
      "import/no-unresolved": "off",
    },
  },
  {
    plugins: {
      "no-relative-import-paths": noRelativeImportPaths,
    },
    rules: {
      "no-relative-import-paths/no-relative-import-paths": [
        "warn",
        { allowSameFolder: false, prefix: "@scout-for-lol" },
      ],
    },
  },
  {
    rules: {
      // Code quality and complexity limits
      "max-lines": ["error", { max: 1200, skipBlankLines: false, skipComments: false }],
      complexity: ["error", { max: 20 }],
      "max-depth": ["error", { max: 4 }],
      "max-params": ["error", { max: 4 }],
      curly: ["error", "all"],

      "no-warning-comments": [
        "warn",
        {
          terms: ["todo", "fixme", "hack", "xxx", "to do"],
          location: "anywhere",
        },
      ],

      // TypeScript configuration
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],

      // Prefer Bun APIs over Node.js imports
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "fs",
              message:
                "Use Bun.file() for reading and Bun.write() for writing instead of fs. See https://bun.sh/docs/api/file-io",
            },
            {
              name: "node:fs",
              message:
                "Use Bun.file() for reading and Bun.write() for writing instead of node:fs. See https://bun.sh/docs/api/file-io",
            },
            {
              name: "fs/promises",
              message:
                "Use Bun.file() for reading and Bun.write() for writing instead of fs/promises. See https://bun.sh/docs/api/file-io",
            },
            {
              name: "node:fs/promises",
              message:
                "Use Bun.file() for reading and Bun.write() for writing instead of node:fs/promises. See https://bun.sh/docs/api/file-io",
            },
            {
              name: "child_process",
              message:
                "Use Bun.spawn() instead of child_process for spawning processes. See https://bun.sh/docs/api/spawn",
            },
            {
              name: "node:child_process",
              message:
                "Use Bun.spawn() instead of node:child_process for spawning processes. See https://bun.sh/docs/api/spawn",
            },
            {
              name: "crypto",
              message:
                "Use Bun.password for password hashing, Bun.hash() for hashing, or Web Crypto API for cryptography instead of crypto. See https://bun.sh/docs/api/hashing",
            },
            {
              name: "node:crypto",
              message:
                "Use Bun.password for password hashing, Bun.hash() for hashing, or Web Crypto API for cryptography instead of node:crypto. See https://bun.sh/docs/api/hashing",
            },
          ],
          patterns: [
            {
              group: ["node:*"],
              message: "Avoid node: imports. Bun provides faster, more modern alternatives. See https://bun.sh/docs",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        // Zod validation over built-in type checks
        {
          selector: "UnaryExpression[operator='typeof']:not([argument.name='Bun'])",
          message: "Prefer Zod schema validation over typeof operator. Use z.string(), z.number(), etc. instead.",
        },
        {
          selector: "CallExpression[callee.object.name='Array'][callee.property.name='isArray']",
          message: "Prefer Zod schema validation over Array.isArray(). Use z.array() instead.",
        },
        {
          selector: "BinaryExpression[operator='instanceof']",
          message:
            "Prefer Zod schema validation over instanceof operator. Use appropriate z.instanceof() or custom Zod schemas instead.",
        },
        {
          selector: "CallExpression[callee.object.name='Number'][callee.property.name='isInteger']",
          message: "Prefer Zod schema validation over Number.isInteger(). Use z.number().int() instead.",
        },
        {
          selector: "CallExpression[callee.object.name='Number'][callee.property.name='isNaN']",
          message:
            "Prefer Zod schema validation over Number.isNaN(). Use z.number() with proper error handling instead.",
        },
        {
          selector: "CallExpression[callee.object.name='Number'][callee.property.name='isFinite']",
          message: "Prefer Zod schema validation over Number.isFinite(). Use z.number().finite() instead.",
        },
        {
          selector: "TSTypePredicate",
          message:
            "Prefer Zod schema validation over type guard functions. Use z.schema.safeParse() instead of custom type guards.",
        },
        // Type assertion restrictions
        {
          selector: "TSTypeAssertion:not([typeAnnotation.type='TSUnknownKeyword'])",
          message:
            "Type assertions are not allowed except for casting to 'unknown'. Use 'value as unknown' if you need to cast to unknown, otherwise use Zod schema validation.",
        },
        {
          selector:
            "TSAsExpression:not([typeAnnotation.type='TSUnknownKeyword']):not([typeAnnotation.type='TSTypeReference'][typeAnnotation.typeName.name='const'])",
          message:
            "Type assertions are not allowed except for casting to 'unknown' or 'as const'. Use 'value as unknown' to widen to unknown, 'value as const' for const assertions, or Zod schema validation to safely narrow types.",
        },
        // Bun-specific restrictions: prefer Bun APIs over Node.js globals
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Use Bun.env instead of process.env to access environment variables. Bun.env is a more modern, typed alternative. See https://bun.sh/docs/runtime/env",
        },
        {
          selector: "Identifier[name='__dirname']",
          message:
            "Use import.meta.dir instead of __dirname. import.meta.dir is the ESM-native way to get the directory path. See https://bun.sh/docs/api/import-meta",
        },
        {
          selector: "Identifier[name='__filename']",
          message:
            "Use import.meta.path instead of __filename. import.meta.path is the ESM-native way to get the file path. See https://bun.sh/docs/api/import-meta",
        },
        {
          selector: "CallExpression[callee.name='require']",
          message:
            "Use ESM import statements instead of require(). Bun fully supports ESM and it's the modern standard. Example: import { foo } from 'module'",
        },
        {
          selector: "Identifier[name='Buffer']:not(VariableDeclarator > Identifier[name='Buffer'])",
          message:
            "Prefer Uint8Array or Bun's binary data APIs over Buffer. For file operations, use Bun.file() which handles binary data natively. See https://bun.sh/docs/api/binary-data",
        },
      ],
    },
  },
  // Dagger index.ts - Dagger module API can have many parameters for external interface
  {
    files: [".dagger/src/index.ts"],
    rules: {
      "max-params": "off", // this is for the external interface of the Dagger module
    },
  },
  // Test files can be longer and use test-specific patterns
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.integration.test.ts"],
    rules: {
      "max-lines": ["error", { max: 1500, skipBlankLines: false, skipComments: false }],
      // Allow test mocks and doubles to use any and type assertions
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "no-restricted-syntax": "off", // Allow type assertions, typeof, instanceof in tests
    },
  },
  // Integration test specific rules - ensure Prisma clients are disconnected
  {
    files: ["**/*.integration.test.ts"],
    plugins: {
      "custom-rules": customRulesPlugin,
    },
    rules: {
      "custom-rules/prisma-client-disconnect": "error",
    },
  },
  // Allow instanceof for Discord.js error handling and channel type checking
  {
    files: ["**/discord/**/*.ts", "**/league/discord/**/*.ts", "**/league/tasks/competition/**/*.ts"],
    ignores: ["**/*.test.ts", "**/*.test.tsx", "**/*.integration.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        // Zod validation over built-in type checks (but allow instanceof for Discord.js)
        {
          selector: "UnaryExpression[operator='typeof']:not([argument.name='Bun'])",
          message: "Prefer Zod schema validation over typeof operator. Use z.string(), z.number(), etc. instead.",
        },
        {
          selector: "CallExpression[callee.object.name='Array'][callee.property.name='isArray']",
          message: "Prefer Zod schema validation over Array.isArray(). Use z.array() instead.",
        },
        {
          selector: "CallExpression[callee.object.name='Number'][callee.property.name='isInteger']",
          message: "Prefer Zod schema validation over Number.isInteger(). Use z.number().int() instead.",
        },
        {
          selector: "CallExpression[callee.object.name='Number'][callee.property.name='isNaN']",
          message:
            "Prefer Zod schema validation over Number.isNaN(). Use z.number() with proper error handling instead.",
        },
        {
          selector: "CallExpression[callee.object.name='Number'][callee.property.name='isFinite']",
          message: "Prefer Zod schema validation over Number.isFinite(). Use z.number().finite() instead.",
        },
        {
          selector: "TSTypePredicate",
          message:
            "Prefer Zod schema validation over type guard functions. Use z.schema.safeParse() instead of custom type guards.",
        },
        // Type assertion restrictions
        {
          selector: "TSTypeAssertion:not([typeAnnotation.type='TSUnknownKeyword'])",
          message:
            "Type assertions are not allowed except for casting to 'unknown'. Use 'value as unknown' if you need to cast to unknown, otherwise use Zod schema validation.",
        },
        {
          selector:
            "TSAsExpression:not([typeAnnotation.type='TSUnknownKeyword']):not([typeAnnotation.type='TSTypeReference'][typeAnnotation.typeName.name='const'])",
          message:
            "Type assertions are not allowed except for casting to 'unknown' or 'as const'. Use 'value as unknown' to widen to unknown, 'value as const' for const assertions, or Zod schema validation to safely narrow types.",
        },
        // Bun-specific restrictions: prefer Bun APIs over Node.js globals
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Use Bun.env instead of process.env to access environment variables. Bun.env is a more modern, typed alternative. See https://bun.sh/docs/runtime/env",
        },
        {
          selector: "Identifier[name='__dirname']",
          message:
            "Use import.meta.dir instead of __dirname. import.meta.dir is the ESM-native way to get the directory path. See https://bun.sh/docs/api/import-meta",
        },
        {
          selector: "Identifier[name='__filename']",
          message:
            "Use import.meta.path instead of __filename. import.meta.path is the ESM-native way to get the file path. See https://bun.sh/docs/api/import-meta",
        },
        {
          selector: "CallExpression[callee.name='require']",
          message:
            "Use ESM import statements instead of require(). Bun fully supports ESM and it's the modern standard. Example: import { foo } from 'module'",
        },
        {
          selector: "Identifier[name='Buffer']:not(VariableDeclarator > Identifier[name='Buffer'])",
          message:
            "Prefer Uint8Array or Bun's binary data APIs over Buffer. For file operations, use Bun.file() which handles binary data natively. See https://bun.sh/docs/api/binary-data",
        },
      ],
    },
  },
  // File naming conventions
  {
    plugins: {
      unicorn,
    },
    rules: {
      "unicorn/filename-case": [
        "error",
        {
          case: "kebabCase",
        },
      ],
    },
  },
  // Custom rules for Zod schema naming and validation
  {
    plugins: {
      "custom-rules": customRulesPlugin,
    },
    rules: {
      "custom-rules/zod-schema-naming": "error",
      "custom-rules/no-redundant-zod-parse": "error",
    },
  },
  // Satori-specific best practices for all report components
  {
    files: ["packages/report/**/*.tsx", "packages/report/**/*.ts"],
    plugins: {
      "custom-rules": customRulesPlugin,
    },
    rules: {
      "custom-rules/satori-best-practices": "error",
    },
  },
  // React and React Hooks rules for TSX files
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ESLint plugin type compatibility
      react,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ESLint plugin type compatibility
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React best practices
      "react/jsx-key": "error",
      "react/jsx-no-target-blank": "error",
      "react/jsx-pascal-case": "error",
      "react/no-children-prop": "error",
      "react/no-danger": "warn",
      "react/no-danger-with-children": "error",
      "react/no-deprecated": "error",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-is-mounted": "error",
      "react/no-render-return-value": "error",
      "react/no-string-refs": "error",
      "react/no-unescaped-entities": "error",
      "react/no-unknown-property": "error",
      "react/no-unsafe": "error",
      "react/require-render-return": "error",
      "react/void-dom-elements-no-children": "error",

      // Disable prop-types (using TypeScript instead)
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off", // Not needed in React 17+

      // React Hooks rules - critical for correctness
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  // JSX Accessibility rules
  {
    files: ["**/*.tsx", "**/*.jsx", "**/*.astro"],
    plugins: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ESLint plugin type compatibility
      "jsx-a11y": jsxA11y,
    },
    rules: {
      // Images must have alt text
      "jsx-a11y/alt-text": "error",
      // Enforce valid ARIA roles
      "jsx-a11y/aria-role": "error",
      // Enforce ARIA props are valid
      "jsx-a11y/aria-props": "error",
      // Enforce ARIA state and property values are valid
      "jsx-a11y/aria-proptypes": "error",
      // Enforce ARIA attributes are used correctly
      "jsx-a11y/aria-unsupported-elements": "error",
      // Enforce anchor elements are valid
      "jsx-a11y/anchor-is-valid": "error",
      // Enforce heading elements have content
      "jsx-a11y/heading-has-content": "error",
      // Enforce HTML elements have valid lang attribute
      "jsx-a11y/html-has-lang": "error",
      // Enforce iframe elements have title
      "jsx-a11y/iframe-has-title": "error",
      // Enforce img elements have alt attribute
      "jsx-a11y/img-redundant-alt": "error",
      // Enforce interactive elements are keyboard accessible
      "jsx-a11y/interactive-supports-focus": "error",
      // Enforce label elements have associated control
      "jsx-a11y/label-has-associated-control": "error",
      // Enforce media elements have captions
      "jsx-a11y/media-has-caption": "warn",
      // Enforce mouse events have keyboard equivalents
      "jsx-a11y/mouse-events-have-key-events": "error",
      // Enforce no access key attribute
      "jsx-a11y/no-access-key": "error",
      // Enforce no autofocus attribute
      "jsx-a11y/no-autofocus": "warn",
      // Enforce no distracting elements
      "jsx-a11y/no-distracting-elements": "error",
      // Enforce no interactive element to noninteractive role
      "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
      // Enforce no noninteractive element interactions
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      // Enforce no noninteractive tabindex
      "jsx-a11y/no-noninteractive-tabindex": "error",
      // Enforce no redundant roles
      "jsx-a11y/no-redundant-roles": "error",
      // Enforce no static element interactions
      "jsx-a11y/no-static-element-interactions": "error",
      // Enforce tabindex value is not greater than zero
      "jsx-a11y/tabindex-no-positive": "error",
    },
  },
  // Astro-specific rules
  {
    files: ["**/*.astro"],
    plugins: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- ESLint plugin type compatibility
      astro: astroPlugin,
    },
    // Astro parser doesn't support type-aware linting, so we need to disable those rules
    rules: {
      // Disable TypeScript type-checking rules for Astro files
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/unbound-method": "off",

      // Astro best practices
      "astro/no-conflict-set-directives": "error",
      "astro/no-deprecated-astro-canonicalurl": "error",
      "astro/no-deprecated-astro-fetchcontent": "error",
      "astro/no-deprecated-astro-resolve": "error",
      "astro/no-deprecated-getentrybyslug": "error",
      "astro/no-unused-define-vars-in-style": "error",
      "astro/valid-compile": "error",
    },
  },
  // Tailwind CSS class validation and ordering
  // Note: Disabled due to eslint-plugin-tailwindcss incompatibility with Tailwind CSS v4
  // The plugin attempts to import 'tailwindcss/resolveConfig' which is not exported in v4
  // Re-enable once plugin adds v4 support: https://github.com/francoismassart/eslint-plugin-tailwindcss/issues
  // {
  //   files: ["packages/frontend/**/*.{tsx,jsx,astro}", "packages/report-ui/**/*.{tsx,jsx}"],
  //   plugins: {
  //     tailwindcss,
  //   },
  //   rules: {
  //     "tailwindcss/classnames-order": "warn",
  //     "tailwindcss/no-contradicting-classname": "error",
  //     "tailwindcss/no-custom-classname": "off",
  //   },
  // },
  // Variable and identifier naming conventions
  {
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        // Functions: camelCase (React components can be PascalCase)
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        // Constants: UPPER_SNAKE_CASE or camelCase (excluding *Schema variables - handled by custom rule)
        {
          selector: "variable",
          modifiers: ["const"],
          filter: {
            regex: "Schema$",
            match: false,
          },
          format: ["camelCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        // All other variables: camelCase (excluding *Schema variables - handled by custom rule)
        {
          selector: "variable",
          filter: {
            regex: "Schema$",
            match: false,
          },
          format: ["camelCase"],
          leadingUnderscore: "allow",
          trailingUnderscore: "allow",
        },
        // Parameters: camelCase
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        // Types, interfaces, classes: PascalCase
        {
          selector: ["typeLike"],
          format: ["PascalCase"],
        },
        // Enum members: PascalCase or UPPER_CASE
        {
          selector: "enumMember",
          format: ["PascalCase", "UPPER_CASE"],
        },
      ],
    },
  },
  // Config file itself can use relative imports for local eslint rules
  {
    files: ["eslint.config.ts"],
    rules: {
      "no-relative-import-paths/no-relative-import-paths": "off",
    },
  },
);
