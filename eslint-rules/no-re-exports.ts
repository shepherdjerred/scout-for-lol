import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/shepherdjerred/homelab/blob/main/eslint-rules/${name}.ts`,
);

export const noReExports = createRule({
  name: "no-re-exports",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow re-exporting from other modules. Only allow exports of declarations defined in the same file for better code organization and explicit dependencies.",
    },
    messages: {
      noExportAll:
        "Re-exports (export * from) are not allowed. Only export declarations from the same file. This ensures explicit exports and prevents accidental API surface expansion.",
      noExportNamed:
        "Re-exports (export { ... } from) are not allowed. Only export declarations from the same file. Import and re-declare if you need to expose external symbols.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      // Check for export * from "module"
      ExportAllDeclaration(node) {
        context.report({
          node,
          messageId: "noExportAll",
        });
      },

      // Check for export { foo } from "module"
      ExportNamedDeclaration(node) {
        // Only flag if it has a source (i.e., it's a re-export)
        if (node.source) {
          context.report({
            node,
            messageId: "noExportNamed",
          });
        }
      },
    };
  },
});
