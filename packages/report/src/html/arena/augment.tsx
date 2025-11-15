import { type Augment } from "@scout-for-lol/data";
import { startCase } from "@scout-for-lol/data/src/util.ts";

const augmentIconSize = "2rem";

export function renderAugment(augment: Augment) {
  if (augment.type === "full") {
    const rarityName = startCase(augment.rarity);
    // Use iconSmall path directly from the augment data
    const iconUrl = augment.iconSmall ? `https://raw.communitydragon.org/latest/game/${augment.iconSmall}` : null;

    if (iconUrl) {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
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
          <div style={{ display: "contents" }}>{`${augment.name} (${rarityName})`}</div>
        </div>
      );
    }

    return <div style={{ display: "contents" }}>{`${augment.name} (${rarityName})`}</div>;
  }
  // For minimal augments (type === "id"), return text as JSX
  return <div style={{ display: "contents" }}>{`Augment ${augment.id.toString()}`}</div>;
}
