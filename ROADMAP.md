# ROADMAP

There seems to be a fair bit of coupling. Examples:

- Some parts of the app are not runnable without config, resvg, React, Discord,
  etc.
- Unrelated concerns should be runnable

## Misc

- [ ] Strict TS config for Dagger
- [x] Fix KDA ratio
- [x] Fix image width
- [x] Show CS
- [x] Show lane images
- [x] Better rank support, show message for placements
- [x] Better duo/flex squeue support
- [x] Remove use of deprecated flags (--unstable)

## Bugs

- [ ] Handle error gracefully when the bot doesn't have permission to post to a
      channel
- [ ] Duplicate messages when a user is tracked in multiple servers

## MVP

- [x] Store player configs and database in either Postgres or sqlite
  - [x] Setup Prisma
- [x] Add support for player regions
- [ ] Frontend/marketing site
- [ ] Add commands for customizing player configs and database state
- [ ] Track players that aren't subscribed to by any server & prune from
      database
- [ ] Store match objects in S3
- [ ] Store generated images in S3
- [x] Use correct username in generated images
- [x] Support unranked queue types
  - Currently it will show LP stats/promos, etc.

### Setup Flow

- User adds bot to a Discord server
- User uses commands to subscribe to players

## Misc

- Detect users who haven't played in a while and lower how often they are
  refreshed
- Prune servers where the bot no longer has permissions/where the bot has been
  removed

## Post-match

- [ ] add champ icon
- [ ] make vision score easier to see
- [ ] add icons for damage, K/D/A, and gold
