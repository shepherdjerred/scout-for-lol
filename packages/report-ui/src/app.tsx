import { useState, useEffect } from "react";
import { z } from "zod";
import { getExampleMatch } from "@scout-for-lol/report-ui/example";
import type { AnyMatch } from "@scout-for-lol/report-ui/example";
// Import from browser-safe entry point to avoid satori/resvg dependencies
import { Report } from "@scout-for-lol/report/src/browser";
import { ArenaReport } from "@scout-for-lol/report/src/html/arena/report";
import { AIReviewRater } from "@scout-for-lol/report-ui/ai-review-rater";
import { AIReviewAnalytics } from "@scout-for-lol/report-ui/ai-review-analytics";

const MatchTypeSchema = z.enum(["ranked", "unranked", "aram", "arena"]);
type MatchType = z.infer<typeof MatchTypeSchema>;

const ViewModeSchema = z.enum(["match-viewer", "ai-rater", "ai-analytics"]);
type ViewMode = z.infer<typeof ViewModeSchema>;

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
  const getInitialViewMode = (): ViewMode => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const result = ViewModeSchema.safeParse(view);
    return result.success ? result.data : "match-viewer";
  };

  const getInitialMatchType = (): MatchType => {
    const params = new URLSearchParams(window.location.search);
    const queryType = params.get("type");
    const result = MatchTypeSchema.safeParse(queryType);
    return result.success ? result.data : "ranked";
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode());
  const [matchType, setMatchType] = useState<MatchType>(getInitialMatchType());
  const [matchId, setMatchId] = useState("");
  const [region, setRegion] = useState("na1");
  const [apiToken, setApiToken] = useState(localStorage.getItem("riot-api-token") ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleMatch = getExampleMatch(matchType);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", viewMode);
    if (viewMode === "match-viewer") {
      params.set("type", matchType);
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [viewMode, matchType]);

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
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Header with tabs */}
      <div
        style={{
          backgroundColor: "white",
          borderBottom: "2px solid #e5e7eb",
          padding: "0 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1f2937", margin: "16px 0" }}>
            Scout for LoL - Report UI
          </h1>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => {
                setViewMode("match-viewer");
              }}
              style={{
                padding: "12px 20px",
                backgroundColor: viewMode === "match-viewer" ? "#3b82f6" : "transparent",
                color: viewMode === "match-viewer" ? "white" : "#6b7280",
                border: "none",
                borderBottom: viewMode === "match-viewer" ? "2px solid #3b82f6" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              Match Viewer
            </button>
            <button
              onClick={() => {
                setViewMode("ai-rater");
              }}
              style={{
                padding: "12px 20px",
                backgroundColor: viewMode === "ai-rater" ? "#3b82f6" : "transparent",
                color: viewMode === "ai-rater" ? "white" : "#6b7280",
                border: "none",
                borderBottom: viewMode === "ai-rater" ? "2px solid #3b82f6" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              Rate AI Images
            </button>
            <button
              onClick={() => {
                setViewMode("ai-analytics");
              }}
              style={{
                padding: "12px 20px",
                backgroundColor: viewMode === "ai-analytics" ? "#3b82f6" : "transparent",
                color: viewMode === "ai-analytics" ? "white" : "#6b7280",
                border: "none",
                borderBottom: viewMode === "ai-analytics" ? "2px solid #3b82f6" : "2px solid transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      {viewMode === "ai-rater" && <AIReviewRater />}
      {viewMode === "ai-analytics" && <AIReviewAnalytics />}
      {viewMode === "match-viewer" && (
        <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
          <h2 style={{ marginBottom: "8px" }}>Match Viewer</h2>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>Browser-compatible report viewer for Scout for LoL</p>

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

          <section>
            <h2 style={{ fontSize: "14px", color: "#999" }}>Preview</h2>
            <div
              style={{
                zoom: 0.6,
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
      )}
    </div>
  );
}
