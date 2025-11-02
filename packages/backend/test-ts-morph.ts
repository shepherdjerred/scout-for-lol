import { Project } from "ts-morph";
import { resolve } from "node:path";

const project = new Project({
  tsConfigFilePath: resolve("./tsconfig.json"),
});

const prismaTypesPath = resolve("./generated/prisma/client/index.d.ts");
console.log("File path:", prismaTypesPath);
console.log("File exists:", await Bun.file(prismaTypesPath).exists());

const sourceFile = project.addSourceFileAtPath(prismaTypesPath);
console.log("Source file loaded:", sourceFile.getFilePath());

// Try to save
try {
  sourceFile.saveSync();
  console.log("Save completed successfully");
} catch (error) {
  console.error("Save failed:", error);
}
