/**
 * DEPRECATED: Pre-match detection has been removed
 *
 * This directory previously contained code for detecting when players entered games
 * using the Riot Games Spectator API. The Spectator API has been deprecated and removed
 * by Riot Games, so real-time game detection is no longer possible.
 *
 * The application now uses match history polling to detect completed games.
 * See: src/league/tasks/postmatch/match-history-polling.ts
 */

/**
 * @deprecated Spectator API removed - pre-match detection no longer possible
 */
export function checkPreMatch() {
  console.warn("⚠️  checkPreMatch is deprecated - Spectator API has been removed by Riot Games");
  console.log("ℹ️  Match detection now happens via match history polling in post-match check");
}
