#!/usr/bin/env bun

import { runMigrations } from "@scout-for-lol/backend/database/run-migrations.ts";

await runMigrations();
