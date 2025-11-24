#!/usr/bin/env bun
/**
 * Automated ESLint mechanical fixes using ts-morph
 * Fixes issues that are safe to automate:
 * - React unescaped entities
 * - Unused variables (prefix with _)
 * - JSX label associations
 */

import { Project, SyntaxKind, Node } from "ts-morph";

const project = new Project({
  tsConfigFilePath: "/workspaces/scout-for-lol/tsconfig.json",
});

let fixCount = 0;

// Fix 1: React unescaped entities - replace " with &quot; in JSX text
function fixUnescapedEntities() {
  console.log("\n=== Fixing React unescaped entities ===");
  
  const sourceFiles = project.getSourceFiles("packages/**/*.{tsx,jsx}");
  
  for (const sourceFile of sourceFiles) {
    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
    
    for (const jsxText of jsxTexts) {
      const text = jsxText.getText();
      if (text.includes('"')) {
        const fixed = text.replace(/"/g, "&quot;");
        jsxText.replaceWithText(fixed);
        fixCount++;
        console.log(`  Fixed: ${sourceFile.getFilePath().replace('/workspaces/scout-for-lol/', '')}`);
      }
    }
  }
}

// Fix 2: Unused variables - prefix with underscore
function fixUnusedVariables() {
  console.log("\n=== Fixing unused variables ===");
  
  // This is harder to do safely with ts-morph alone, as we need ESLint to tell us which vars are unused
  // For now, we'll handle the specific unused imports we know about
  
  const filesToCheck = [
    "packages/review-dev-tool/src/lib/s3.ts",
    "scripts/run-relevant-tests.ts",
  ];
  
  for (const filePath of filesToCheck) {
    const sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) continue;
    
    // Find imports named MatchDtoSchema that aren't used
    const importDecls = sourceFile.getImportDeclarations();
    for (const importDecl of importDecls) {
      const namedImports = importDecl.getNamedImports();
      for (const namedImport of namedImports) {
        const name = namedImport.getName();
        if (name === "MatchDtoSchema") {
          // Check if it's used
          const refs = namedImport.getNameNode().findReferencesAsNodes();
          if (refs.length <= 1) { // Only the import itself
            console.log(`  Removing unused import: ${name} from ${filePath}`);
            namedImport.remove();
            fixCount++;
          }
        }
      }
    }
  }
}

// Fix 3: Add htmlFor to labels
function fixLabelAssociations() {
  console.log("\n=== Fixing JSX label associations ===");
  
  const sourceFiles = project.getSourceFiles("packages/review-dev-tool/**/*.tsx");
  
  for (const sourceFile of sourceFiles) {
    const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
    
    for (const element of jsxElements) {
      const tagName = element.getTagNameNode().getText();
      if (tagName !== "label") continue;
      
      // Check if it already has htmlFor
      const hasHtmlFor = element.getAttributes().some(attr => 
        attr.isKind(SyntaxKind.JsxAttribute) && attr.getName() === "htmlFor"
      );
      
      if (hasHtmlFor) continue;
      
      // Look for an input as a direct child or sibling
      const parent = element.getParent();
      if (!parent) continue;
      
      const labelElement = parent.getParent();
      if (!labelElement || !Node.isJsxElement(labelElement)) continue;
      
      // Find input elements in the label's children
      const children = labelElement.getJsxChildren();
      let inputId: string | undefined;
      
      for (const child of children) {
        if (Node.isJsxElement(child) || Node.isJsxSelfClosingElement(child)) {
          const childTag = Node.isJsxElement(child) 
            ? child.getOpeningElement().getTagNameNode().getText()
            : child.getTagNameNode().getText();
          
          if (childTag === "input" || childTag === "select" || childTag === "textarea") {
            // Try to find or create an id
            const attrs = Node.isJsxElement(child) 
              ? child.getOpeningElement().getAttributes()
              : child.getAttributes();
            
            const idAttr = attrs.find(attr => 
              attr.isKind(SyntaxKind.JsxAttribute) && attr.getName() === "id"
            );
            
            if (idAttr && idAttr.isKind(SyntaxKind.JsxAttribute)) {
              const initializer = idAttr.getInitializer();
              if (initializer && Node.isStringLiteral(initializer)) {
                inputId = initializer.getLiteralText();
                break;
              }
            }
          }
        }
      }
      
      // If we found an input with an id, add htmlFor to the label
      if (inputId) {
        element.addAttribute({
          name: "htmlFor",
          initializer: `"${inputId}"`,
        });
        fixCount++;
        console.log(`  Added htmlFor="${inputId}" to label in ${sourceFile.getFilePath().replace('/workspaces/scout-for-lol/', '')}`);
      }
    }
  }
}

// Main execution
console.log("Starting mechanical ESLint fixes...");

fixUnescapedEntities();
fixUnusedVariables();
// Skip label fixes for now - they're complex and may need manual review
// fixLabelAssociations();

// Save all changes
console.log("\n=== Saving changes ===");
project.saveSync();

console.log(`\n✓ Applied ${fixCount} fixes`);
console.log("\nRun 'npx eslint .' to verify remaining errors");

