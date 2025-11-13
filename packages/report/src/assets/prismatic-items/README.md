# Prismatic Item Icons

This directory contains prismatic item icons downloaded from Community Dragon.

## Icon Source

Icons are downloaded from:
`https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons/`

## Mapping

The mapping from item ID to icon filename is stored in `item-id-to-icon-map.ts`.

To populate the mapping:
1. Find the API name or internal name for each prismatic item ID
2. Convert to lowercase and append `_small.png`
3. Add to the mapping object

Example:
- Item ID `443054` → API name `SomeItemName` → Icon filename `someitemname_small.png`

## Downloading Icons

Run the download script:
```bash
bun scripts/download-prismatic-item-icons.ts
```

The script will:
1. Extract prismatic item IDs from test data
2. Try to find icons using various patterns
3. Download found icons to this directory
4. Report which items couldn't be found

## Usage

Icons are referenced by item ID in the rendering code. The mapping file provides the lookup function.
