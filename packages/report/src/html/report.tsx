import React from "react";
import { CompletedMatch, leaguePointsDelta, lpDiffToString } from "@scout/data";
import "react";
import { palette } from "../assets/colors.ts";
import { RankedBadge } from "./ranked/index.tsx";
import { renderTeam } from "./team.tsx";
import { round } from "remeda";
import { font } from "../assets/index.ts";

export function Report({ match }: { match: CompletedMatch }) {
  const minutes = round(match.durationInSeconds / 60, 0);

  if (!match.teams.red || !match.teams.blue) {
    throw new Error(
      `Match must have both teams: ${JSON.stringify(match.teams)}`,
    );
  }

  const wins = match.player.wins;
  const losses = match.player.losses;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      <div
        style={{
          display: "flex",
          padding: "5rem",
          color: palette.grey[1],
          background:
            `linear-gradient(90deg, ${palette.blue.gradient.dark.start} 0%, ${palette.blue.gradient.dark.end} 50%, ${palette.blue.gradient.dark.start} 100%)`,
          flexDirection: "column",
          fontSize: "5rem",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: font.title,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            alignSelf: "flex-start",
            marginBottom: "5rem",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: "12rem",
              display: "flex",
              gap: "10rem",
              alignItems: "flex-end",
              justifyContent: "space-between",
              alignSelf: "flex-start",
            }}
          >
            <span style={{ color: palette.gold[4] }}>
              {match.player.outcome}
            </span>
            <div
              style={{
                fontSize: "6rem",
                display: "flex",
                marginBottom: "1rem",
              }}
            >
              {minutes}min {match.durationInSeconds % 60}s
            </div>
            <div
              style={{
                display: "flex",
                gap: "2rem",
                fontSize: "4rem",
                color: palette.grey[1],
                marginBottom: "1.5rem",
              }}
            >
              <span>
                {/* Check both before and after a match; this handles placements */}
                {match.player.rankBeforeMatch &&
                  match.player.rankAfterMatch &&
                  lpDiffToString(
                    leaguePointsDelta(
                      match.player.rankBeforeMatch,
                      match.player.rankAfterMatch,
                    ),
                  )}
              </span>
              {wins !== undefined && losses !== undefined && (
                <div
                  style={{
                    display: "flex",
                    gap: "2rem",
                  }}
                >
                  <span>Wins: {wins}</span>
                  <span>Losses: {losses}</span>
                </div>
              )}
            </div>
          </div>
          {match.player.rankAfterMatch && (
            <RankedBadge
              oldRank={match.player.rankBeforeMatch}
              newRank={match.player.rankAfterMatch}
            />
          )}
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            gap: "6rem",
            flexDirection: "column",
          }}
        >
          {renderTeam(
            match.teams.blue,
            "blue",
            match.player.champion.championName,
            match.durationInSeconds / 60,
          )}
          {renderTeam(
            match.teams.red,
            "red",
            match.player.champion.championName,
            match.durationInSeconds / 60,
          )}
        </div>
      </div>
    </div>
  );
}
