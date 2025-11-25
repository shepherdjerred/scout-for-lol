import { type ArenaTeam } from "@scout-for-lol/data";
import { createMasterOfDualityAugment, createCourageAugment } from "./arena-augments.js";
import { getTeam1 } from "./arena-teams-1.js";
import { getTeam2 } from "./arena-teams-2.js";
import { getTeam3 } from "./arena-teams-3.js";
import { getTeam4 } from "./arena-teams-4.js";
import { getTeam5 } from "./arena-teams-5.js";
import { getTeam6 } from "./arena-teams-6.js";
import { getTeam7 } from "./arena-teams-7.js";
import { getTeam8 } from "./arena-teams-8.js";

export function getTeams() {
  const masterAugment = createMasterOfDualityAugment();
  const courageAugment = createCourageAugment();

  return [
    getTeam1(masterAugment, courageAugment),
    getTeam2(),
    getTeam3(),
    getTeam4(),
    getTeam5(),
    getTeam6(),
    getTeam7(),
    getTeam8(),
  ] satisfies ArenaTeam[];
}
