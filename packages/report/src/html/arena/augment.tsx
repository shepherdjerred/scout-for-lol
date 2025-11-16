import { type Augment } from "@scout-for-lol/data";

const augmentIconSize = "2rem";

export function renderAugment(augment: Augment) {
  if (augment.type === "full") {
    // Use iconSmall path directly from the augment data
    const iconUrl = augment.iconSmall ? `https://raw.communitydragon.org/latest/game/${augment.iconLarge}` : null;

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
              // filter: `drop-shadow(0 0 16px ${rarityColor}) drop-shadow(0 0 8px ${rarityColor})`,
            }}
            width={augmentIconSize}
            height={augmentIconSize}
          />
          <div style={{ display: "contents" }}>{augment.name}</div>
        </div>
      );
    }

    return <div style={{ display: "contents" }}>{augment.name}</div>;
  }
  // For minimal augments (type === "id"), return text as JSX
  return <div style={{ display: "contents" }}>{`Augment ${augment.id.toString()}`}</div>;
}
