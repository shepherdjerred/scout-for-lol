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
  const [matchId, setMatchId] = useState("");
  const [region, setRegion] = useState("na1");
  const [apiToken, setApiToken] = useState(localStorage.getItem("riot-api-token") ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleMatch = getExampleMatch(matchType);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("type", matchType);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [matchType]);

  const handleFetchMatch = async () => {
    if (!matchId || !apiToken) {
      setError("Please enter both match ID and API token");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { fetchMatchFromRiot } = await import("./api");
      const result = await fetchMatchFromRiot(matchId, region, apiToken);

      if (result.error) {
        setError(result.error);
      } else {
        // result.match is always null for now
        console.log("Match parsing not yet implemented");
        setError("Match parsing not yet implemented");
      }
    } catch (err) {
      const ErrorOrStringSchema = z.union([z.instanceof(Error), z.string()]);
      const errorZod = ErrorOrStringSchema.safeParse(err);
      let errorMessage = "Unknown error";
      if (errorZod.success) {
        const errorData = errorZod.data;
        // eslint-disable-next-line no-restricted-syntax -- ok, we're type narrowing
        if (errorData instanceof Error) {
          errorMessage = errorData.message;
        } else {
          errorMessage = errorData;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }

    // Save API token to localStorage
    if (apiToken) {
      localStorage.setItem("riot-api-token", apiToken);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Report UI - Match Viewer</h1>
      <p>Browser-compatible report viewer for Scout for LoL</p>

      {/* Example Match Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="match-type" style={{ marginRight: "10px", fontWeight: "bold" }}>
          Example Match Type:
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

      {/* Riot API Match Fetcher */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          borderRadius: "4px",
          backgroundColor: "#f5f5f5",
          border: "1px solid #ddd",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Fetch Real Match from Riot API</h3>
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Riot API Token:</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => {
              setApiToken(e.target.value);
            }}
            placeholder="Paste your API token here"
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              marginBottom: "10px",
            }}
          />
          <small style={{ color: "#666" }}>
            Get a token at{" "}
            <a href="https://developer.riotgames.com" target="_blank" rel="noreferrer">
              developer.riotgames.com
            </a>
            . Saved locally in browser storage.
          </small>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Match ID:</label>
            <input
              type="text"
              value={matchId}
              onChange={(e) => {
                setMatchId(e.target.value);
              }}
              placeholder="e.g., NA1_1234567890"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 0.5 }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Region:</label>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
              }}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            >
              <option value="na1">NA1</option>
              <option value="euw1">EUW1</option>
              <option value="kr">KR</option>
              <option value="br1">BR1</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            void handleFetchMatch();
          }}
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            backgroundColor: isLoading ? "#ccc" : "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "default" : "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {isLoading ? "Loading..." : "Fetch Match"}
        </button>

        {error && <div style={{ marginTop: "10px", color: "#d32f2f", fontSize: "14px" }}>⚠️ {error}</div>}
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
