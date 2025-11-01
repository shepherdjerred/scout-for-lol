#!/usr/bin/env bun
/**
 * Post-process Prisma generated types to use branded IDs
 *
 * This script uses TypeScript's AST to properly transform the generated
 * Prisma types, replacing number IDs with branded types from @scout-for-lol/data
 *
 * Usage:
 *   bun run scripts/brand-prisma-types.ts
 *
 * This should be run after `prisma generate`
 */

import { Project, SyntaxKind, type TypeAliasDeclaration } from "ts-morph";
import { resolve } from "node:path";

// Configuration: Map field names to branded types
const BRAND_MAPPINGS = {
  id: {
    Player: "PlayerId",
    Account: "AccountId",
    Competition: "CompetitionId",
    CompetitionParticipant: "ParticipantId",
    CompetitionSnapshot: "number", // snapshot IDs don't need branding
    Subscription: "number", // subscription IDs don't need branding
  },
  playerId: "PlayerId",
  competitionId: "CompetitionId",
  accountId: "AccountId",
  serverId: "DiscordGuildId",
  channelId: "DiscordChannelId",
  discordId: "DiscordAccountId",
  ownerId: "DiscordAccountId",
  creatorDiscordId: "DiscordAccountId",
  invitedBy: "DiscordAccountId",
  puuid: "LeaguePuuid",
  region: "Region",
} as const;

// Types that need to be imported
const BRANDED_TYPES_TO_IMPORT = new Set<string>();

function main() {
  console.log("🔧 Branding Prisma types with AST transformation...");

  const project = new Project({
    tsConfigFilePath: resolve(__dirname, "../tsconfig.json"),
  });

  const prismaTypesPath = resolve(__dirname, "../generated/prisma/client/index.d.ts");
  const sourceFile = project.addSourceFileAtPath(prismaTypesPath);

  console.log(`📄 Processing: ${prismaTypesPath}`);

  // Track how many properties we transform
  let transformCount = 0;

  // Find the Prisma namespace
  const prismaNamespace = sourceFile.getModule("Prisma");
  if (!prismaNamespace) {
    console.error("❌ Could not find Prisma namespace!");
    return;
  }

  // Process all type aliases inside the Prisma namespace
  const typeAliases = prismaNamespace.getTypeAliases();

  for (const typeAlias of typeAliases) {
    const typeName = typeAlias.getName();

    // Process Payload types (return types)
    if (typeName.startsWith("$") && typeName.endsWith("Payload")) {
      transformCount += transformPayloadType(typeAlias);
    }
    // Process Where input types (query filters)
    else if (typeName.includes("WhereUniqueInput") || typeName.includes("WhereInput")) {
      transformCount += transformWhereType(typeAlias);
    }
    // Process Create input types
    else if (typeName.includes("CreateInput") || typeName.includes("CreateManyInput")) {
      transformCount += transformInputType(typeAlias);
    }
    // Process Update input types
    else if (typeName.includes("UpdateInput") || typeName.includes("UpdateManyInput")) {
      transformCount += transformInputType(typeAlias);
    }
  }

  // Add imports for branded types at the top of the file
  if (BRANDED_TYPES_TO_IMPORT.size > 0) {
    sourceFile.insertImportDeclaration(0, {
      moduleSpecifier: "@scout-for-lol/data",
      namedImports: Array.from(BRANDED_TYPES_TO_IMPORT).sort(),
    });
  }

  // Save the transformed file
  sourceFile.saveSync();

  console.log(`✅ Transformed ${transformCount.toString()} properties`);
  console.log(`✅ Added imports: ${Array.from(BRANDED_TYPES_TO_IMPORT).join(", ")}`);
  console.log("🎉 Prisma types successfully branded!");
}

function transformPayloadType(typeAlias: TypeAliasDeclaration): number {
  const payloadName = typeAlias.getName(); // e.g., "$PlayerPayload"
  const modelName = payloadName.replace(/^\$/, "").replace(/Payload$/, ""); // e.g., "Player"

  console.log(`\n  Processing ${modelName}...`);

  const typeNode = typeAlias.getTypeNode();
  if (!typeNode || typeNode.getKind() !== SyntaxKind.TypeLiteral) return 0;

  const typeLiteral = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral);
  let count = 0;

  // Find the 'scalars' property
  for (const member of typeLiteral.getMembers()) {
    if (member.getKind() !== SyntaxKind.PropertySignature) continue;

    const prop = member.asKindOrThrow(SyntaxKind.PropertySignature);
    if (prop.getName() !== "scalars") continue;

    // The scalars property contains: $Extensions.GetPayloadResult<{...}, ...>
    const scalarTypeNode = prop.getTypeNode();
    if (!scalarTypeNode) continue;

    // Find the first type argument (the object literal with field definitions)
    const typeArgs = scalarTypeNode.getType().getAliasTypeArguments();
    if (typeArgs.length === 0) continue;

    // We need to modify the source text directly since it's inside a generic
    // Get the full text of the scalars property
    const fullText = prop.getText();

    // Extract the object literal part: $Extensions.GetPayloadResult<{ ... }, ...>
    const payloadPattern = /\$Extensions\.GetPayloadResult<\s*\{([^}]+)\}/;
    const match = payloadPattern.exec(fullText);
    if (!match?.[1]) continue;

    const objectContent = match[1];
    let transformedContent = objectContent;

    // Transform number fields (PlayerId, CompetitionId, etc.)
    const numberFieldPattern = /(\w+):\s*number(\s*\|\s*null)?/g;
    let numberMatch = numberFieldPattern.exec(objectContent);

    while (numberMatch !== null) {
      const fieldName = numberMatch[1];
      if (!fieldName) {
        numberMatch = numberFieldPattern.exec(objectContent);
        continue;
      }

      const isNullable = !!numberMatch[2];
      const originalType = `number${numberMatch[2] ?? ""}`;

      const brandedType = getBrandedType(fieldName, modelName);
      if (brandedType) {
        const newType = isNullable ? `${brandedType} | null` : brandedType;
        const fieldReplacePattern = new RegExp(`${fieldName}:\\s*number(\\s*\\|\\s*null)?`);
        transformedContent = transformedContent.replace(fieldReplacePattern, `${fieldName}: ${newType}`);

        BRANDED_TYPES_TO_IMPORT.add(brandedType);
        count++;

        console.log(`    ✓ ${modelName}.${fieldName}: ${originalType} → ${newType}`);
      }

      numberMatch = numberFieldPattern.exec(objectContent);
    }

    // Transform string fields (DiscordGuildId, DiscordChannelId, etc.)
    const stringFieldPattern = /(\w+):\s*string(\s*\|\s*null)?/g;
    let stringMatch = stringFieldPattern.exec(objectContent);

    while (stringMatch !== null) {
      const fieldName = stringMatch[1];
      if (!fieldName) {
        stringMatch = stringFieldPattern.exec(objectContent);
        continue;
      }

      const isNullable = !!stringMatch[2];
      const originalType = `string${stringMatch[2] ?? ""}`;

      const brandedType = getBrandedType(fieldName, modelName);
      if (brandedType) {
        const newType = isNullable ? `${brandedType} | null` : brandedType;
        const fieldReplacePattern = new RegExp(`${fieldName}:\\s*string(\\s*\\|\\s*null)?`);
        transformedContent = transformedContent.replace(fieldReplacePattern, `${fieldName}: ${newType}`);

        BRANDED_TYPES_TO_IMPORT.add(brandedType);
        count++;

        console.log(`    ✓ ${modelName}.${fieldName}: ${originalType} → ${newType}`);
      }

      stringMatch = stringFieldPattern.exec(objectContent);
    }

    // Replace the entire scalars property with the transformed version
    if (count > 0) {
      const newScalarsText = fullText.replace(objectContent, transformedContent);
      prop.replaceWithText(newScalarsText);
    }
  }

  return count;
}

function transformWhereType(typeAlias: TypeAliasDeclaration): number {
  const typeName = typeAlias.getName();
  // Extract model name: PlayerWhereUniqueInput → Player
  const modelName = typeName.replace(/WhereUniqueInput|WhereInput/, "");

  return transformSimpleObjectType(typeAlias, modelName);
}

function transformInputType(typeAlias: TypeAliasDeclaration): number {
  const typeName = typeAlias.getName();
  // Extract model name from various input type patterns
  const modelName = typeName.replace(
    /CreateInput|CreateManyInput|UpdateInput|UpdateManyInput|UncheckedCreateInput|UncheckedUpdateInput/,
    "",
  );

  return transformSimpleObjectType(typeAlias, modelName);
}

function transformSimpleObjectType(typeAlias: TypeAliasDeclaration, modelName: string): number {
  const typeNode = typeAlias.getTypeNode();
  if (!typeNode || typeNode.getKind() !== SyntaxKind.TypeLiteral) return 0;

  const typeLiteral = typeNode.asKindOrThrow(SyntaxKind.TypeLiteral);
  let count = 0;

  for (const member of typeLiteral.getMembers()) {
    if (member.getKind() !== SyntaxKind.PropertySignature) continue;

    const prop = member.asKindOrThrow(SyntaxKind.PropertySignature);
    const propName = prop.getName();
    const propTypeNode = prop.getTypeNode();

    if (!propTypeNode) continue;

    const brandedType = getBrandedType(propName, modelName);
    if (!brandedType) continue;

    const fullText = prop.getText();

    // Match patterns like: id?: number | IntFieldUpdateOperationsInput
    // OR: serverId?: string | StringFilter
    // We want to brand the primitive type part while keeping other types
    const simpleNumberPattern = new RegExp(`${propName}\\??:\\s*number\\b`);
    const simpleStringPattern = new RegExp(`${propName}\\??:\\s*string\\b`);

    const numberMatch = simpleNumberPattern.exec(fullText);
    const stringMatch = simpleStringPattern.exec(fullText);

    if (numberMatch) {
      const newText = fullText.replace(/:\s*number\b/, `: ${brandedType}`);
      prop.replaceWithText(newText);
      BRANDED_TYPES_TO_IMPORT.add(brandedType);
      count++;
      continue;
    }

    if (stringMatch) {
      const newText = fullText.replace(/:\s*string\b/, `: ${brandedType}`);
      prop.replaceWithText(newText);
      BRANDED_TYPES_TO_IMPORT.add(brandedType);
      count++;
      continue;
    }

    // Match union patterns: number | SomeOtherType OR string | SomeOtherType
    const unionPattern = new RegExp(`${propName}\\??:\\s*([^\\n]+)`);
    const unionMatch = unionPattern.exec(fullText);
    if (unionMatch?.[1]) {
      const typeExpression = unionMatch[1];
      if (typeExpression.includes("number")) {
        const newText = fullText.replace(/\bnumber\b/, brandedType);
        prop.replaceWithText(newText);
        BRANDED_TYPES_TO_IMPORT.add(brandedType);
        count++;
      } else if (typeExpression.includes("string")) {
        const newText = fullText.replace(/\bstring\b/, brandedType);
        prop.replaceWithText(newText);
        BRANDED_TYPES_TO_IMPORT.add(brandedType);
        count++;
      }
    }
  }

  return count;
}

function getBrandedType(propName: string, parentTypeName: string): string | null {
  // Check if this is an 'id' field with model-specific branding
  if (propName === "id") {
    const idMappings = BRAND_MAPPINGS.id;

    // Check if the parent type exists in our id mappings
    if (parentTypeName in idMappings) {
      const mapping = idMappings[parentTypeName as keyof typeof idMappings];
      if (mapping === "number") return null;
      return mapping;
    }
    return null;
  }

  // Check other field mappings
  if (propName in BRAND_MAPPINGS) {
    const mapping = BRAND_MAPPINGS[propName as keyof typeof BRAND_MAPPINGS];

    // The id field is an object, other fields are strings
    // This is a build script, so typeof check is appropriate here
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    return typeof mapping === "string" ? mapping : null;
  }

  return null;
}

// Run the script
main();
