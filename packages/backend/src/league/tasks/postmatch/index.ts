import { getChannelsSubscribedToPlayers } from "../../../database/index";
import { send } from "../../discord/channel";
import { getPlayer } from "../../model/player";
import { getState } from "../../model/state";
import { checkMatch, checkPostMatchInternal, saveMatch } from "./internal";

export async function checkPostMatch() {
  console.log("🏁 Starting post-match check task");
  const startTime = Date.now();

  try {
    const state = getState();
    console.log(`📊 Current state: ${state.gamesStarted.length.toString()} games in progress`);

    await checkPostMatchInternal(state, saveMatch, checkMatch, send, getPlayer, getChannelsSubscribedToPlayers);

    const executionTime = Date.now() - startTime;
    console.log(`✅ Post-match check completed successfully in ${executionTime.toString()}ms`);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Post-match check failed after ${executionTime.toString()}ms:`, error);
    throw error;
  }
}
