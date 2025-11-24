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
        "Prefer Zod schema validation over built-in JavaScript/TypeScript type checking methods for runtime validation.",
    },
    messages: {
      preferZodOverTypeof:
        "Prefer Zod schema validation over typeof operator. Use z.string(), z.number(), etc. instead.",
      preferZodOverArrayIsArray: "Prefer Zod schema validation over Array.isArray(). Use z.array() instead.",
      preferZodOverInstanceof:
        "Prefer Zod schema validation over instanceof operator. Use appropriate z.instanceof() or custom Zod schemas instead. Exception: 'instanceof Error' is allowed for error handling.",
      preferZodOverNumberIsInteger:
        "Prefer Zod schema validation over Number.isInteger(). Use z.number().int() instead.",
      preferZodOverNumberIsNaN:
        "Prefer Zod schema validation over Number.isNaN(). Use z.number() with proper error handling instead.",
      preferZodOverNumberIsFinite:
        "Prefer Zod schema validation over Number.isFinite(). Use z.number().finite() instead.",
      preferZodOverTypeGuard:
        "Prefer Zod schema validation over type guard functions. Use z.schema.safeParse() instead of custom type guards.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowInstanceof: {
            type: "boolean",
            description: "Allow instanceof checks (useful for Discord.js and similar libraries)",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allowInstanceof: false }],
  create(context, [options]) {
    return {
      // Check for typeof operator (except typeof Bun)
      UnaryExpression(node) {
        if (node.operator === "typeof") {
          // Allow typeof Bun
          if (node.argument.type === AST_NODE_TYPES.Identifier && node.argument.name === "Bun") {
            return;
          }

          context.report({
            node,
            messageId: "preferZodOverTypeof",
          });
        }
      },

      // Check for Array.isArray()
      CallExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === "Array" &&
          node.callee.property.type === AST_NODE_TYPES.Identifier &&
          node.callee.property.name === "isArray"
        ) {
          context.report({
            node,
            messageId: "preferZodOverArrayIsArray",
          });
        }

        // Check for Number.isInteger(), Number.isNaN(), Number.isFinite()
        if (
          node.callee.type === AST_NODE_TYPES.MemberExpression &&
          node.callee.object.type === AST_NODE_TYPES.Identifier &&
          node.callee.object.name === "Number" &&
          node.callee.property.type === AST_NODE_TYPES.Identifier
        ) {
          const methodName = node.callee.property.name;

          if (methodName === "isInteger") {
            context.report({
              node,
              messageId: "preferZodOverNumberIsInteger",
            });
          } else if (methodName === "isNaN") {
            context.report({
              node,
              messageId: "preferZodOverNumberIsNaN",
            });
          } else if (methodName === "isFinite") {
            context.report({
              node,
              messageId: "preferZodOverNumberIsFinite",
            });
          }
        }
      },

      // Check for instanceof (except Error types)
      BinaryExpression(node) {
        if (node.operator === "instanceof" && !options.allowInstanceof) {
          // Allow instanceof Error or types ending with Error
          if (node.right.type === AST_NODE_TYPES.Identifier) {
            const rightName = node.right.name;
            if (rightName === "Error" || /Error$/.test(rightName)) {
              return;
            }
          }

          context.report({
            node,
            messageId: "preferZodOverInstanceof",
          });
        }
      },

      // Check for type predicates
      TSTypePredicate(node) {
        context.report({
          node,
          messageId: "preferZodOverTypeGuard",
        });
      },
    };
  },
});
