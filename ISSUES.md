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
- Remove duplicated code

## Done

- [x] Have Prisma load Zod branded types
- [x] Use branded types over string/number
- [x] Remove stuff due to spectator API being deprecated
- [x] Fix competition notifications firing at random times and on bot startup
- [x] resolve TODO comments
