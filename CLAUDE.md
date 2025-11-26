# Scout for LoL Project Standards

## Project Structure

This is a monorepo using **Bun workspaces** with packages:
- `packages/backend` - Discord bot backend service
- `packages/data` - Shared data models and utilities
- `packages/report` - Report generation components
- `packages/frontend` - Web frontend (Astro)

## Core Technologies

- **Bun** - Runtime and package manager
- **TypeScript** - Strict typing with `noEmit` checks
- **Discord.js** - Discord bot framework
- **Prisma** - Database ORM and migrations
- **Zod** - Runtime validation and type safety
- **Dagger** - CI/CD pipelines and containerization
- **React** - UI components (for report generation)
- **Astro** - Frontend framework

## Development Commands

```bash
# Root level
bun run install:all       # Install dependencies
bun run typecheck:all     # Type checking
bun run lint:all          # Linting
bun run format:all        # Formatting
bun run test:all          # Testing
bun run generate          # Generate Prisma client
bun run clean             # Clean node_modules

# Backend (cd packages/backend)
bun run dev               # Start with hot reload
bun run build             # Build for production
bun run db:generate       # Generate Prisma client
bun run db:push           # Push schema to database
bun run db:migrate        # Run migrations
bun run db:studio         # Open Prisma Studio
```

## Dagger CI/CD

```bash
dagger functions                                        # List available functions
dagger call check                                       # Run lint, typecheck, test
dagger call build --version="1.0.0" --git-sha="abc123" # Build all packages
dagger call ci --version="1.0.0" --git-sha="abc123"    # Full CI pipeline
dagger call deploy --version="1.0.0" --stage="beta"    # Deploy to stage

# Package-specific
dagger call check-backend
dagger call build-backend-image --version="1.0.0" --git-sha="abc123"
dagger call generate-prisma
dagger call check-report
dagger call build-report-for-npm --version="1.0.0"
dagger call check-data
```

## TypeScript Standards

- **NEVER use `any`** - Always define proper types
- **Avoid type assertions (`as`)** - Use type guards instead
- **Use `unknown` for uncertain types** - Validate with Zod before processing
- **Prefer advanced types** - Mapped types, conditional types, template literals
- **Exhaustive pattern matching** - Use `ts-pattern` for complex branching
- **Strict null checks** - Handle undefined/null explicitly

```typescript
// Validate unknown input with Zod
const result = SomeSchema.safeParse(unknownData);
if (!result.success) {
  throw new Error(fromZodError(result.error).toString());
}

// Use type guards instead of casting
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

## Key Libraries

- `remeda` - Functional data transformations
- `ts-pattern` - Complex control flow
- `env-var` - Type-safe environment configuration
- `date-fns` - Date operations
- `zod-validation-error` - User-friendly validation errors
- `twisted` - Riot API client
- `satori` / `@resvg/resvg-js` - Image generation for reports

## Discord Bot Patterns

Commands are in `packages/backend/src/discord/commands/`. Each command exports a `SlashCommandBuilder` and `execute` function.

```typescript
// Error handling pattern
try {
  await interaction.reply({ content: 'Success!' });
} catch (error) {
  console.error('Discord API error:', error);
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content: 'An error occurred', ephemeral: true });
  } else {
    await interaction.reply({ content: 'An error occurred', ephemeral: true });
  }
}
```

- Use ephemeral responses for error messages
- Use embeds for rich content presentation
- Handle message length limits appropriately

## Database (Prisma)

- Schema-first approach in `schema.prisma`
- Use `prisma migrate` for production migrations
- Proper connection pooling and cleanup
- Use transactions for multi-step operations

## Environment & Configuration

- Use `env-var` for type-safe environment variables
- Validate all config with Zod schemas
- Use Dagger secrets for sensitive data in CI/CD

## Performance

- Lazy load heavy dependencies (image generation, API clients)
- Use connection pooling for database connections
- Implement proper caching strategies
- Monitor memory usage and clean up resources
