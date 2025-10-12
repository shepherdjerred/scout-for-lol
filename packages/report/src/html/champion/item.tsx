import { match, P } from "ts-pattern";
import { palette } from "../../assets/colors.ts";
import { latestVersion } from "../../dataDragon/version.ts";
import { last, map, pipe, take } from "remeda";

const dimension = "7.5rem";

export function renderItem(item: number) {
  if (item !== 0) {
    return (
      <div style={{ width: dimension, height: dimension, display: "flex" }}>
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${item.toString()}.png`}
          style={{
            backgroundColor: palette.blue[5],
            border: `.01rem solid ${palette.gold.bright}`,
          }}
          width={"100%"}
          height={"100%"}
        />
      </div>
    );
  } else {
    return (
      <div
        style={{
          width: dimension,
          height: dimension,
          backgroundColor: palette.blue[5],
          border: `.01rem solid ${palette.gold.bright}`,
        }}
      />
    );
  }
}

export function renderItems(
  items: number[],
  visionScore: number,
  isArena = false,
) {
  const mainItems = pipe(items, take(6), map(renderItem));

  const lastItem = last(items);
  const visionItem = match([lastItem, isArena])
    .with([undefined, false], () => {
      throw new Error(
        `Last item must exist in normal games: ${items.toString()}`,
      );
    })
    .with([P.any, true], () => {
      return null;
    })
    .with([P.not(undefined), false], ([lastItem]) => {
      return (
        <div
          style={{
            display: "flex",
            position: "relative",
            width: dimension,
            height: dimension,
          }}
        >
          {renderItem(lastItem)}
          <span
            style={{
              position: "absolute",
              color: palette.white[1],
              textShadow: "8px 8px #000",
              bottom: "-10px",
              right: "5px",
              fontWeight: 700,
              stroke: "#000",
              strokeWidth: "100px",
            }}
          >
            {visionScore}
          </span>
        </div>
      );
    })
    .exhaustive();

  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      {mainItems}
      {visionItem}
    </div>
  );
}
