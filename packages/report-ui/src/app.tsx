import { useState, useEffect } from "react";
import { z } from "zod";
import { getExampleMatch } from "./example";
import type { AnyMatch } from "./example";
// Import from browser-safe entry point to avoid satori/resvg dependencies
import { Report } from "@scout-for-lol/report/src/browser";
import { ArenaReport } from "@scout-for-lol/report/src/html/arena/report";

const MatchTypeSchema = z.enum(["ranked", "unranked", "aram", "arena"]);
type MatchType = z.infer<typeof MatchTypeSchema>;

const MATCH_TYPES: { value: MatchType; label: string }[] = [
  { value: "ranked", label: "Ranked Match (Solo)" },
  { value: "unranked", label: "Unranked Match" },
  { value: "aram", label: "ARAM Match" },
  { value: "arena", label: "Arena Match" },
];

function MatchReportRenderer({ match }: { match: AnyMatch }): React.ReactNode {
  if (match.queueType === "arena") {
    return <ArenaReport match={match} />;
  }
  return <Report match={match} />;
}

export function App() {
  const getInitialMatchType = (): MatchType => {
    const params = new URLSearchParams(window.location.search);
    const queryType = params.get("type");
    const result = MatchTypeSchema.safeParse(queryType);
    return result.success ? result.data : "ranked";
  };

  const [matchType, setMatchType] = useState<MatchType>(getInitialMatchType());
  const exampleMatch = getExampleMatch(matchType);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("type", matchType);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [matchType]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Report UI - Match Viewer</h1>
      <p>Browser-compatible report viewer for Scout for LoL</p>

      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="match-type" style={{ marginRight: "10px", fontWeight: "bold" }}>
          Match Type:
        </label>
        <select
          id="match-type"
          value={matchType}
          onChange={(e) => {
            const result = MatchTypeSchema.safeParse(e.target.value);
            if (result.success) {
              setMatchType(result.data);
            }
          }}
          style={{
            padding: "8px 12px",
            fontSize: "14px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          {MATCH_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "14px", color: "#999" }}>Preview at 8.5% zoom (match report card)</h2>
        <div
          style={{
            zoom: 0.085,
            transformOrigin: "top left",
            width: "fit-content",
            padding: "20px",
            maxWidth: "100vw",
          }}
        >
          <MatchReportRenderer match={exampleMatch} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: "14px", color: "#999" }}>Preview at 20% zoom (interactive size)</h2>
        <div
          style={{
            zoom: 0.2,
            transformOrigin: "top left",
            width: "fit-content",
            padding: "20px",
            maxWidth: "100vw",
          }}
        >
          <MatchReportRenderer match={exampleMatch} />
        </div>
      </section>
    </div>
  );
}
