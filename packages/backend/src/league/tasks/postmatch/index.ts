import { getChannelsSubscribedToPlayers } from "../../../database/index";
import { send } from "../../discord/channel";
import { getPlayer } from "../../model/player";
import { getState } from "../../model/state";
import { checkMatch, checkPostMatchInternal, saveMatch } from "./internal";

export async function checkPostMatch() {
  const state = getState();
  await checkPostMatchInternal(
    state,
    saveMatch,
    checkMatch,
    send,
    getPlayer,
    getChannelsSubscribedToPlayers
  );
}
