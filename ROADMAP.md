# ROADMAP

There seems to be a fair bit of coupling. Examples:

- Some parts of the app are not runnable without config, resvg, React, Discord,
  etc.
- Unrelated concerns should be runnable

## Next Milestone

- [ ] AI reviews

## Release

- [x] Unsubscribe command
- [x] View detailed player info
  - [x] Accounts
    - [x] Include rate limiting info
  - [x] Subscriptions
  - [x] Competitions
  - [x] Debug info
- [x] View detailed server info
  - [x] Players
  - [x] Accounts
  - [x] Subscriptions
  - [x] Competitions
  - [x] Debug info
- [x] Edit player info
  - [x] Add/remove accounts
  - [x] Change alias
  - [x] Change/add/remove Discord ID
- [x] Competition management
- [ ] Show user-readable Zod error messages
- [x] Prevent bot from sending messages larger than Discord's limit (happens with Zod)
- [x] Make Arena matches pretty
  - [x] Show augment icons

### Post-Match

- [ ] add champ icon
- [ ] add icons for damage, K/D/A, and gold
- [ ] add runes

## Beta

### Code Quality

- [ ] parse, safeParse -- we use it way too much
- [ ] as unknown as

### Misc

- [x] Limit number of competitions per server
- [x] Allow passing in champion id as name
- [x] Accept datetime for competition
- [x] List competitions command
- [x] Edit competition command
- [x] Strict TS config for Dagger
- [x] Fix KDA ratio
- [x] Fix image width
- [x] Show CS
- [x] Show lane images
- [x] Better rank support, show message for placements
- [x] Better duo/flex squeue support
- [x] Remove use of deprecated flags (--unstable)
- [ ] Allow a user to be in multiple games at once (e.g. Arena games)
  - I think this is a limit of the Riot API
- [x] Allow Players to have multiple Accounts, e.g. maybe do a lookup on Account based on alias and append an Account?
- [x] CI doesn't seem to be running tests, linter
- [x] Setup CI to deploy site

### Bugs

- [x] Handle error gracefully when the bot doesn't have permission to post to a
      channel
- [x] Duplicate messages when a user is tracked in multiple servers
- [x] Fix summoner spell icons

### MVP

- [x] Store player configs and database in either Postgres or sqlite
  - [x] Setup Prisma
- [x] Add support for player regions
- [x] Frontend/marketing site
- [x] Add commands for customizing player configs and database state
- [x] Track players that aren't subscribed to by any server & prune from
      database
- [x] Store match objects in S3
- [x] Store generated images in S3
- [x] Use correct username in generated images
- [x] Support unranked queue types
  - Currently it will show LP stats/promos, etc.

### Abuse Protection

- [x] Detect users who haven't played in a while and lower how often they are
      refreshed
- [x] Prune servers where the bot no longer has permissions/where the bot has been
      removed

### Post-match

- [ ] add champ icon
- [x] make vision score easier to see
- [ ] add icons for damage, K/D/A, and gold
