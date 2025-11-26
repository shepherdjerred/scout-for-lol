#!/bin/bash
set -e

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies
bun install

# Generate Prisma client
bun run generate
