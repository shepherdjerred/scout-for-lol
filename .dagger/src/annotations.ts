/**
 * GitHub Actions annotations utilities for CI checks
 *
 * This module provides utilities to parse check output (ESLint, TypeScript, tests)
 * and convert them to GitHub Actions annotation format for inline PR feedback.
 *
 * Annotation format: ::error file={path},line={line},col={col}::{message}
 */

import { z } from "zod";

export type Annotation = {
  level: "error" | "warning" | "notice";
  file: string;
  line: number;
  col?: number | undefined;
  endLine?: number | undefined;
  endCol?: number | undefined;
  message: string;
  title?: string | undefined;
};

/**
 * Format an annotation as a GitHub Actions workflow command
 */
export function formatAnnotation(annotation: Annotation): string {
  const parts = [`file=${annotation.file}`, `line=${annotation.line.toString()}`];

  if (annotation.col !== undefined) {
    parts.push(`col=${annotation.col.toString()}`);
  }
  if (annotation.endLine !== undefined) {
    parts.push(`endLine=${annotation.endLine.toString()}`);
  }
  if (annotation.endCol !== undefined) {
    parts.push(`endColumn=${annotation.endCol.toString()}`);
  }
  if (annotation.title !== undefined) {
    parts.push(`title=${annotation.title}`);
  }

  return `::${annotation.level} ${parts.join(",")}::${annotation.message}`;
}

/**
 * ESLint JSON output schema for validation
 */
const ESLintMessageSchema = z.object({
  ruleId: z.string().nullable(),
  severity: z.union([z.literal(1), z.literal(2)]),
  message: z.string(),
  line: z.number(),
  column: z.number(),
  endLine: z.number().optional(),
  endColumn: z.number().optional(),
});

const ESLintResultSchema = z.object({
  filePath: z.string(),
  messages: z.array(ESLintMessageSchema),
  errorCount: z.number(),
  warningCount: z.number(),
});

const ESLintOutputSchema = z.array(ESLintResultSchema);

/**
 * Parse ESLint JSON output and convert to annotations
 */
export function parseESLintOutput(jsonOutput: string, workspacePrefix = "/workspace/"): Annotation[] {
  const annotations: Annotation[] = [];

  const parseResult = ESLintOutputSchema.safeParse(JSON.parse(jsonOutput));
  if (!parseResult.success) {
    return annotations;
  }

  for (const result of parseResult.data) {
    let filePath = result.filePath;
    if (filePath.startsWith(workspacePrefix)) {
      filePath = filePath.slice(workspacePrefix.length);
    }

    for (const msg of result.messages) {
      const annotation: Annotation = {
        level: msg.severity === 2 ? "error" : "warning",
        file: filePath,
        line: msg.line,
        col: msg.column,
        message: msg.message,
        title: msg.ruleId ?? "eslint",
      };

      if (msg.endLine !== undefined) {
        annotation.endLine = msg.endLine;
      }
      if (msg.endColumn !== undefined) {
        annotation.endCol = msg.endColumn;
      }

      annotations.push(annotation);
    }
  }

  return annotations;
}

/**
 * Normalize file path by removing workspace prefix
 */
function normalizeFilePath(filePath: string, workspacePrefix: string): string {
  if (filePath.startsWith(workspacePrefix)) {
    return filePath.slice(workspacePrefix.length);
  }
  return filePath;
}

/**
 * Parse a TypeScript error line with parenthesis format: file.ts(line,col): error TS####: message
 */
function parseParenFormat(line: string, workspacePrefix: string): Annotation | null {
  // eslint-disable-next-line regexp/no-super-linear-backtracking -- Input is bounded by line length, no risk
  const match = /^([^(]+)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/.exec(line);
  if (match === null) {
    return null;
  }

  const [, filePathMatch, lineMatch, colMatch, levelMatch, codeMatch, messageMatch] = match;
  if (
    filePathMatch === undefined ||
    lineMatch === undefined ||
    colMatch === undefined ||
    levelMatch === undefined ||
    codeMatch === undefined ||
    messageMatch === undefined
  ) {
    return null;
  }

  return {
    level: levelMatch === "error" ? "error" : "warning",
    file: normalizeFilePath(filePathMatch, workspacePrefix),
    line: parseInt(lineMatch, 10),
    col: parseInt(colMatch, 10),
    message: messageMatch,
    title: codeMatch,
  };
}

/**
 * Parse a TypeScript error line with colon format: file.ts:line:col - error TS####: message
 */
function parseColonFormat(line: string, workspacePrefix: string): Annotation | null {
  // eslint-disable-next-line regexp/no-super-linear-backtracking -- Input is bounded by line length, no risk
  const match = /^([^:]+):(\d+):(\d+)\s+-\s+(error|warning)\s+(TS\d+):\s+(.+)$/.exec(line);
  if (match === null) {
    return null;
  }

  const [, filePathMatch, lineMatch, colMatch, levelMatch, codeMatch, messageMatch] = match;
  if (
    filePathMatch === undefined ||
    lineMatch === undefined ||
    colMatch === undefined ||
    levelMatch === undefined ||
    codeMatch === undefined ||
    messageMatch === undefined
  ) {
    return null;
  }

  return {
    level: levelMatch === "error" ? "error" : "warning",
    file: normalizeFilePath(filePathMatch, workspacePrefix),
    line: parseInt(lineMatch, 10),
    col: parseInt(colMatch, 10),
    message: messageMatch,
    title: codeMatch,
  };
}

/**
 * Parse TypeScript compiler output and convert to annotations
 */
export function parseTypeScriptOutput(output: string, workspacePrefix = "/workspace/"): Annotation[] {
  const annotations: Annotation[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const parenAnnotation = parseParenFormat(line, workspacePrefix);
    if (parenAnnotation !== null) {
      annotations.push(parenAnnotation);
      continue;
    }

    const colonAnnotation = parseColonFormat(line, workspacePrefix);
    if (colonAnnotation !== null) {
      annotations.push(colonAnnotation);
    }
  }

  return annotations;
}

/**
 * Parse a stack trace location line
 */
function parseStackTraceLine(line: string, workspacePrefix: string): Annotation | null {
  // Pattern: at functionName (file:line:col)
  const match = /at\s+\S+\s+\(([^:]+):(\d+):(\d+)\)/.exec(line);
  if (match === null) {
    return null;
  }

  const [, fileMatch, lineMatch, colMatch] = match;
  if (fileMatch === undefined || lineMatch === undefined || colMatch === undefined) {
    return null;
  }

  const filePath = normalizeFilePath(fileMatch, workspacePrefix);

  // Only include test files, skip node_modules
  if (filePath.includes("node_modules") || !filePath.includes(".test.")) {
    return null;
  }

  return {
    level: "error",
    file: filePath,
    line: parseInt(lineMatch, 10),
    col: parseInt(colMatch, 10),
    message: "Test failed at this location",
    title: "Test Failure",
  };
}

/**
 * Parse Bun test output for failures
 */
export function parseBunTestOutput(output: string, workspacePrefix = "/workspace/"): Annotation[] {
  const annotations: Annotation[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const annotation = parseStackTraceLine(line, workspacePrefix);
    if (annotation === null) {
      continue;
    }

    // Avoid duplicates
    const existing = annotations.find((a) => a.file === annotation.file && a.line === annotation.line);
    if (existing === undefined) {
      annotations.push(annotation);
    }
  }

  return annotations;
}

/**
 * Aggregate check result with annotations
 */
export type CheckResult = {
  name: string;
  passed: boolean;
  output: string;
  annotations: Annotation[];
};

/**
 * Format all annotations from check results as GitHub Actions commands
 */
export function formatAllAnnotations(results: CheckResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    if (!result.passed && result.annotations.length > 0) {
      lines.push(`::group::${result.name} annotations`);
      for (const annotation of result.annotations) {
        lines.push(formatAnnotation(annotation));
      }
      lines.push("::endgroup::");
    }
  }

  return lines.join("\n");
}

/**
 * Create a summary of check results
 */
export function createCheckSummary(results: CheckResult[]): string {
  const lines: string[] = [];
  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);

  if (failed.length > 0) {
    lines.push("## Check Results");
    lines.push("");
    lines.push(`${passed.length.toString()} passed, ${failed.length.toString()} failed`);
    lines.push("");
    lines.push("### Failed Checks");
    for (const result of failed) {
      const errorCount = result.annotations.filter((a) => a.level === "error").length;
      const warningCount = result.annotations.filter((a) => a.level === "warning").length;
      lines.push(`- **${result.name}**: ${errorCount.toString()} errors, ${warningCount.toString()} warnings`);
    }
  } else {
    lines.push("## All Checks Passed");
  }

  return lines.join("\n");
}
