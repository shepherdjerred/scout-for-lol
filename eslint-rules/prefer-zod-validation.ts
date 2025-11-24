import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/shepherdjerred/homelab/blob/main/eslint-rules/${name}.ts`,
);

export const preferZodValidation = createRule({
  name: "prefer-zod-validation",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Flag repeated type checking on nested properties. Use Zod to validate the entire structure once instead of checking multiple levels with typeof/instanceof chains.",
    },
    messages: {
      repeatedTypeChecking:
        "Repeated type checking on nested properties should use Zod validation instead. Validate the entire structure once with a Zod schema.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track typeof/instanceof checks on member expressions
    const typeCheckMap = new Map<string, typeof node[]>();

    function getMemberPath(node: typeof node): string | null {
      if (node.type === AST_NODE_TYPES.MemberExpression) {
        const parts: string[] = [];
        let current: typeof node | undefined = node;

        while (current?.type === AST_NODE_TYPES.MemberExpression) {
          if (current.property.type === AST_NODE_TYPES.Identifier) {
            parts.unshift(current.property.name);
          } else if (current.property.type === AST_NODE_TYPES.Literal && typeof current.property.value === "string") {
            parts.unshift(current.property.value);
          } else {
            return null;
          }
          current = current.object;
        }

        if (current?.type === AST_NODE_TYPES.Identifier) {
          parts.unshift(current.name);
          return parts.join(".");
        }
      }

      return null;
    }

    return {
      // Track typeof checks on member expressions
      UnaryExpression(node) {
        if (node.operator === "typeof" && node.argument.type === AST_NODE_TYPES.MemberExpression) {
          const path = getMemberPath(node.argument);
          if (path) {
            const checks = typeCheckMap.get(path) || [];
            checks.push(node);
            typeCheckMap.set(path, checks);

            // Flag if we're checking the same path multiple times
            if (checks.length > 1) {
              context.report({
                node,
                messageId: "repeatedTypeChecking",
              });
            }
          }
        }
      },

      // Track instanceof checks on member expressions
      BinaryExpression(node) {
        if (node.operator === "instanceof" && node.left.type === AST_NODE_TYPES.MemberExpression) {
          const path = getMemberPath(node.left);
          if (path) {
            const checks = typeCheckMap.get(path) || [];
            checks.push(node);
            typeCheckMap.set(path, checks);

            // Flag if we're checking the same path multiple times
            if (checks.length > 1) {
              context.report({
                node,
                messageId: "repeatedTypeChecking",
              });
            }
          }
        }
      },
    };
  },
});
