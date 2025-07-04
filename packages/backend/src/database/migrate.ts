#!/usr/bin/env bun

import { $ } from "bun";

// Run prisma migrate deploy using Bun
await $`bunx prisma migrate deploy`;
