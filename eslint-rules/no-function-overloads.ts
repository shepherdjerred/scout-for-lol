import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/shepherdjerred/homelab/blob/main/eslint-rules/${name}.ts`,
);

export const noFunctionOverloads = createRule({
  name: "no-function-overloads",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow function overloads. Use conditional types, union types, or optional parameters instead of multiple function signatures.",
    },
    messages: {
      functionOverload:
        "Function overloads are not allowed. Use conditional types instead. Example: Replace overloads with a single signature using conditional return types like `Promise<T extends SomeType ? ReturnTypeA : ReturnTypeB>`, or use union types for simpler cases.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // Track function declarations by name (simple approach - all in same file share scope)
    const functionDeclarations = new Map<string, TSESTree.FunctionDeclaration[]>();

    return {
      ExportNamedDeclaration(node: TSESTree.ExportNamedDeclaration) {
        if (node.declaration?.type === AST_NODE_TYPES.FunctionDeclaration) {
          const funcDecl = node.declaration;
          if (funcDecl.id) {
            const functionName = funcDecl.id.name;
            const declarations = functionDeclarations.get(functionName) || [];
            declarations.push(funcDecl);
            functionDeclarations.set(functionName, declarations);
          }
        }
      },
      FunctionDeclaration(node: TSESTree.FunctionDeclaration) {
        // Track all function declarations (may duplicate with ExportNamedDeclaration)
        if (node.id) {
          const functionName = node.id.name;
          const declarations = functionDeclarations.get(functionName) || [];
          declarations.push(node);
          functionDeclarations.set(functionName, declarations);
        }
      },
      "Program:exit"() {
        // After parsing the entire file, check for overloads
        for (const [functionName, declarations] of functionDeclarations.entries()) {
          // Deduplicate by node reference using WeakSet
          const seen = new WeakSet<TSESTree.FunctionDeclaration>();
          const uniqueDeclarations = declarations.filter((decl) => {
            if (seen.has(decl)) {
              return false;
            }
            seen.add(decl);
            return true;
          });

          if (uniqueDeclarations.length > 1) {
            // Found multiple declarations with the same name - this is an overload
            for (const decl of uniqueDeclarations) {
              context.report({
                node: decl,
                messageId: "functionOverload",
              });
            }
          }
        }
      },
    };
  },
});
