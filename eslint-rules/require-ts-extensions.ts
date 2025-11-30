/**
 * ESLint rule: require-ts-extensions
 *
 * Requires explicit .ts or .tsx extensions for local imports (relative paths).
 * Third-party package imports (node_modules) can omit extensions.
 *
 * ❌ BAD:
 * import { x } from "./utils";
 * import { y } from "../models/user";
 *
 * ✅ GOOD:
 * import { x } from "./utils.ts";
 * import { y } from "../models/user.ts";
 * import { z } from "discord.js";  // Third-party OK without extension
 * import { a } from "@scout-for-lol/data";  // Workspace package OK
 */

// eslint-disable-next-line no-restricted-imports -- ESLint rule needs path and fs for auto-fix
import { dirname, resolve } from "node:path";
// eslint-disable-next-line no-restricted-imports -- ESLint rule needs fs to check file extensions
import { existsSync } from "node:fs";
import type { TSESLint } from "@typescript-eslint/utils";

export const requireTsExtensions: TSESLint.RuleModule<"requireTsExtension"> = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description: "Require explicit .ts or .tsx extensions for local imports",
    },
    messages: {
      requireTsExtension:
        "Local imports must include explicit .ts or .tsx extensions. Add '{{ suggestedExtension }}' to the import path.",
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

        // Skip imports that have any extension (including .json, .css.ts, etc.)
        // Only flag imports with NO extension
        const hasAnyExtension = /\.[a-z]+(?:\.[a-z]+)?$/iu.exec(importPath);
        if (hasAnyExtension) {
          return;
        }

        // At this point, we have a relative import without any extension
        const hasValidExtension = false;

        if (!hasValidExtension) {
          // Determine suggested extension based on file type
          const currentFileName = context.filename;
          const suggestedExtension = currentFileName.endsWith(".tsx") ? ".tsx" : ".ts";

          context.report({
            node: node.source,
            messageId: "requireTsExtension",
            data: {
              suggestedExtension,
            },
            fix(fixer) {
              // Determine the actual file extension by checking the filesystem
              const currentDir = dirname(context.filename);
              const resolvedPath = resolve(currentDir, importPath);

              // Try common extensions in order
              const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
              let actualExtension = ".ts"; // Default fallback

              for (const ext of extensions) {
                if (existsSync(`${resolvedPath}${ext}`)) {
                  actualExtension = ext;
                  break;
                }
              }

              // Preserve the original quote style
              const sourceText = node.source.raw;
              const quoteChar = sourceText.charAt(0);
              const fixedPath = `${importPath}${actualExtension}`;
              return fixer.replaceText(node.source, `${quoteChar}${fixedPath}${quoteChar}`);
            },
          });
        }
      },
    };
  },
};
