import { match, P } from "ts-pattern";
import { palette } from "@scout-for-lol/report/assets/colors.ts";
import { latestVersion } from "@scout-for-lol/report/dataDragon/version.ts";
import { last, map, pipe, take } from "remeda";

const dimension = "7.5rem";

function isPrismaticItem(itemId: number): boolean {
  // Prismatic items in Arena have IDs starting with 44
  return itemId.toString().startsWith("44");
}

function getItemIconUrl(itemId: number): string {
  // All items (including prismatic) use Data Dragon
  // Prismatic items have IDs starting with 44 and are available via Data Dragon
  return `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/item/${itemId.toString()}.png`;
}

function renderItem(item: number) {
  if (item !== 0) {
    const isPrismatic = isPrismaticItem(item);
    const iconUrl = getItemIconUrl(item);
    return (
      <div
        style={{
          width: dimension,
          height: dimension,
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={iconUrl}
          alt=""
          style={{
            backgroundColor: palette.blue[5],
            border: isPrismatic ? `.15rem solid transparent` : `.01rem solid ${palette.gold.bright}`,
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
          width={"100%"}
          height={"100%"}
        />
        {isPrismatic && (
          <div
            style={{
              display: "block",
              position: "absolute",
              top: "-.15rem",
              left: "-.15rem",
              right: "-.15rem",
              bottom: "-.15rem",
              border: `.2rem solid #8338ec`,
              borderRadius: `.25rem`,
              pointerEvents: "none",
              boxShadow: `0 0 .6rem rgba(131, 56, 236, 0.9)`,
            }}
          />
        )}
      </div>
    );
  } else {
    return (
      <div
        style={{
          width: dimension,
          height: dimension,
          display: "flex",
          backgroundColor: palette.blue[5],
          border: `.01rem solid ${palette.gold.bright}`,
        }}
      />
    );
  }
}

export function renderItems(items: number[], visionScore: number, isArena = false) {
  const mainItems = pipe(items, take(6), map(renderItem));

  const lastItem = last(items);
  const visionItem = match([lastItem, isArena])
    .with([undefined, false], () => {
      throw new Error(`Last item must exist in normal games: ${items.toString()}`);
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
