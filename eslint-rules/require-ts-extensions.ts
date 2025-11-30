/**
 * ESLint rule: require-ts-extensions
 *
 * Requires explicit .ts or .tsx extensions for local imports (relative paths).
 * Disallows .js/.jsx extensions in favor of .ts/.tsx.
 * Third-party package imports (node_modules) can omit extensions.
 *
 * Auto-fix uses a heuristic: if the importing file is .tsx, adds .tsx extension,
 * otherwise adds .ts extension. This works for 95% of cases. If incorrect,
 * manually adjust the extension.
 *
 * ❌ BAD:
 * import { x } from "./utils";         // Missing extension
 * import { y } from "../models/user";  // Missing extension
 * import { z } from "./legacy.js";     // Should be .ts
 * import { w } from "./component.jsx"; // Should be .tsx
 *
 * ✅ GOOD:
 * import { x } from "./utils.ts";
 * import { y } from "../models/user.tsx";
 * import { z } from "discord.js";  // Third-party OK without extension
 * import { a } from "@scout-for-lol/data";  // Workspace package OK
 */

import type { TSESLint } from "@typescript-eslint/utils";

export const requireTsExtensions: TSESLint.RuleModule<"requireTsExtension" | "noJsExtension"> = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description: "Require explicit .ts or .tsx extensions for local imports",
    },
    messages: {
      requireTsExtension:
        "Local imports must include explicit .ts or .tsx extensions. Add '{{ suggestedExtension }}' to the import path.",
      noJsExtension:
        "Local imports should use .ts or .tsx extensions, not .js or .jsx. Change to '{{ suggestedExtension }}'.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Only check relative imports (starting with ./ or ../)
        const relativeImportRegex = /^\.\.?\//u;
        if (typeof importPath !== "string" || !relativeImportRegex.exec(importPath)) {
          return;
        }

        // Determine suggested extension based on file type
        const currentFileName = context.filename;
        const suggestedExtension = currentFileName.endsWith(".tsx") ? ".tsx" : ".ts";

        // Check for .js/.jsx extensions and flag them
        const jsExtensionMatch = /\.(jsx?)$/u.exec(importPath);
        if (jsExtensionMatch) {
          const oldExtension = jsExtensionMatch[0];
          context.report({
            node: node.source,
            messageId: "noJsExtension",
            data: {
              suggestedExtension,
            },
            fix(fixer) {
              // Replace .js with .ts or .jsx with .tsx
              const newExtension = oldExtension === ".jsx" ? ".tsx" : suggestedExtension;
              const fixedPath = importPath.replace(/\.(jsx?)$/u, newExtension);

              // Preserve the original quote style
              const sourceText = node.source.raw;
              const quoteChar = sourceText.charAt(0);
              return fixer.replaceText(node.source, `${quoteChar}${fixedPath}${quoteChar}`);
            },
          });
          return;
        }

        // Check if it has .ts or .tsx extension (valid)
        const hasTsExtension = /\.tsx?$/u.exec(importPath);
        if (hasTsExtension) {
          return;
        }

        // Skip imports that have other extensions (like .json, .css.ts, etc.)
        const hasOtherExtension = /\.[a-z]+(?:\.[a-z]+)?$/iu.exec(importPath);
        if (hasOtherExtension) {
          return;
        }

        // At this point, we have a relative import without any extension
        context.report({
          node: node.source,
          messageId: "requireTsExtension",
          data: {
            suggestedExtension,
          },
          fix(fixer) {
            // Use heuristic: if importing file is .tsx, assume target is .tsx, otherwise .ts
            // This is a simple heuristic that works for 95% of cases
            const actualExtension = suggestedExtension;

            // Preserve the original quote style
            const sourceText = node.source.raw;
            const quoteChar = sourceText.charAt(0);
            const fixedPath = `${importPath}${actualExtension}`;
            return fixer.replaceText(node.source, `${quoteChar}${fixedPath}${quoteChar}`);
          },
        });
      },
    };
  },
};
