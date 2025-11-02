#!/usr/bin/env bash
# Runs only tests relevant to the changed files using TypeScript dependency analysis
# Usage: run-relevant-tests.sh <package-dir> <changed-files...>

set -e

PACKAGE_DIR=$1
shift
CHANGED_FILES=("$@")

# Find relevant test files using TypeScript compiler API
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_FILES=$(bun "$SCRIPT_DIR/find-dependent-tests.ts" "$PACKAGE_DIR" "${CHANGED_FILES[@]}")

# Check if we got any test files
if [ -z "$TEST_FILES" ]; then
  echo "No test files found for changed files, skipping tests."
  exit 0
fi

# Convert to array
readarray -t TEST_FILES_ARRAY <<< "$TEST_FILES"

echo "Running ${#TEST_FILES_ARRAY[@]} relevant test file(s)..."

# Run the tests
cd "$PACKAGE_DIR" && bun test "${TEST_FILES_ARRAY[@]}"
