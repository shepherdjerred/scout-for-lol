import { type Augment } from "@scout-for-lol/data";
import { startCase } from "@scout-for-lol/data/src/util.ts";
import { getAugmentIconFilename } from "../../assets/augment-icons/augment-id-to-icon-map.ts";

const augmentIconSize = "2rem";

export function renderAugment(augment: Augment) {
  if (augment.type === "full") {
    const rarityName = startCase(augment.rarity);
    const iconUrl = getAugmentIconUrl(augment.id, augment.iconSmall);

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {iconUrl && (
          <img
            src={iconUrl}
            style={{
              width: augmentIconSize,
              height: augmentIconSize,
              flexShrink: 0,
            }}
            width={augmentIconSize}
            height={augmentIconSize}
          />
        )}
        <div>
          {augment.name} ({rarityName})
        </div>
      </div>
    );
  }
  return `Augment ${augment.id.toString()}`;
}

function getAugmentIconUrl(
  augmentId: number,
  iconSmallPath: string | undefined,
): string | null {
  // Try to get icon filename from mapping
  const iconFilename = getAugmentIconFilename(augmentId);
  if (iconFilename) {
    // Construct Community Dragon URL from icon filename
    return `https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons/${iconFilename}`;
  }

  // Fallback: use iconSmall path if available
  if (iconSmallPath) {
    return `https://raw.communitydragon.org/latest/game/${iconSmallPath}`;
  }

  return null;
}
