# Issues

- Use `undefined` rather than `null`
  - Add linter
  - Fix for Prisma
- Avoid enums
- Avoid z.parse and z.safeParse -- use the type system instead
- Lots of repetition in tests. we need helpers
- Remove unhelpful tests
  - I think we have a file analyzing what tests are helpful and which are not
- Skipped tests
- Remove dead code
  - Continue running knip
- Remove duplicated code
  - Continue running dedupe script
- Add eslint rules to detect overusage of Zod
- eslint rule to avoid .then and .catch
- lower allowed complexity, duplication, and line length
- rename DTO -> raw
  - add check that DTO objects must have "raw" in the var/param name

## Done

- [x] Have Prisma load Zod branded types
- [x] Use branded types over string/number
- [x] Remove stuff due to spectator API being deprecated
- [x] Fix competition notifications firing at random times and on bot startup
- [x] resolve TODO comments
