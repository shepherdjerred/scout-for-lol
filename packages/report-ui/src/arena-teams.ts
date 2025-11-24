import { type ArenaTeam } from "@scout-for-lol/data";
import { createArenaChampion, createArenaMetrics, createTeamSupport } from "./arena-factories.js";
import { createMasterOfDualityAugment, createCourageAugment } from "./arena-augments.js";

function getTeam1(
  masterAugment: ReturnType<typeof createMasterOfDualityAugment>,
  courageAugment: ReturnType<typeof createCourageAugment>,
): ArenaTeam {
  return {
    teamId: 1 as const,
    placement: 2 as const,
    players: [
      createArenaChampion({
        riotIdGameName: "zombie villager",
        championName: "Aatrox",
        kills: 8,
        deaths: 3,
        assists: 5,
        level: 18,
        items: [3074, 3071, 3071, 3036, 3035, 0, 3364],
        gold: 12450,
        damage: 28500,
        augments: [masterAugment, masterAugment, masterAugment, masterAugment, masterAugment, masterAugment],
        arenaMetrics: createArenaMetrics({
          playerScore0: 8,
          playerScore1: 5,
          playerScore2: 850.5,
          playerScore3: 0.45,
          playerScore4: 7.2,
          playerScore5: 2150.75,
          playerScore6: 5890.25,
          playerScore7: 425.5,
          playerScore8: 52.3,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 1200,
          healsOnTeammate: 450,
          damageTakenPercentage: 28,
        }),
      }),
      createArenaChampion({
        riotIdGameName: "support buddy",
        championName: "Leona",
        kills: 5,
        deaths: 2,
        assists: 12,
        level: 17,
        items: [3858, 3068, 3143, 3025, 3504, 0, 3364],
        gold: 10200,
        damage: 12300,
        augments: [courageAugment, courageAugment, courageAugment, courageAugment, courageAugment, courageAugment],
        arenaMetrics: createArenaMetrics({
          playerScore0: 5,
          playerScore1: 12,
          playerScore2: 720.3,
          playerScore3: 0.38,
          playerScore4: 6.1,
          playerScore5: 1850.2,
          playerScore6: 4200.5,
          playerScore7: 380.2,
          playerScore8: 48.7,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 2800,
          healsOnTeammate: 1200,
          damageTakenPercentage: 35,
        }),
      }),
    ],
  };
}

function getTeam2(): ArenaTeam {
  return {
    teamId: 2 as const,
    placement: 3 as const,
    players: [
      createArenaChampion({
        riotIdGameName: "opponent1",
        championName: "Garen",
        kills: 6,
        deaths: 5,
        assists: 3,
        level: 16,
        items: [3071, 3068, 3036, 0, 0, 0, 3364],
        gold: 9100,
        damage: 18500,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 6,
          playerScore1: 3,
          playerScore2: 650.2,
          playerScore3: 0.35,
          playerScore4: 5.8,
          playerScore5: 1800.5,
          playerScore6: 4100.3,
          playerScore7: 320.1,
          playerScore8: 45.2,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 800,
          healsOnTeammate: 200,
          damageTakenPercentage: 32,
        }),
      }),
      createArenaChampion({
        riotIdGameName: "opponent2",
        championName: "Lux",
        kills: 4,
        deaths: 4,
        assists: 8,
        level: 16,
        items: [3089, 3135, 0, 0, 0, 0, 3364],
        gold: 8500,
        damage: 14200,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 4,
          playerScore1: 8,
          playerScore2: 580.1,
          playerScore3: 0.32,
          playerScore4: 5.2,
          playerScore5: 1600.3,
          playerScore6: 3800.2,
          playerScore7: 290.5,
          playerScore8: 42.1,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 600,
          healsOnTeammate: 350,
          damageTakenPercentage: 40,
        }),
      }),
    ],
  };
}

function getTeam3(): ArenaTeam {
  return {
    teamId: 3 as const,
    placement: 1 as const,
    players: [
      createArenaChampion({
        riotIdGameName: "winner1",
        championName: "Ahri",
        kills: 10,
        deaths: 2,
        assists: 7,
        level: 18,
        items: [3135, 3089, 3145, 3020, 0, 0, 3364],
        gold: 15200,
        damage: 35800,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 10,
          playerScore1: 7,
          playerScore2: 950.8,
          playerScore3: 0.55,
          playerScore4: 8.5,
          playerScore5: 2500.2,
          playerScore6: 6800.5,
          playerScore7: 520.3,
          playerScore8: 58.9,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 400,
          healsOnTeammate: 250,
          damageTakenPercentage: 25,
        }),
      }),
      createArenaChampion({
        riotIdGameName: "winner2",
        championName: "Thresh",
        kills: 7,
        deaths: 1,
        assists: 14,
        level: 18,
        items: [3091, 3060, 3504, 3001, 0, 0, 3364],
        gold: 13800,
        damage: 10500,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 7,
          playerScore1: 14,
          playerScore2: 820.6,
          playerScore3: 0.5,
          playerScore4: 7.8,
          playerScore5: 2200.1,
          playerScore6: 5200.4,
          playerScore7: 480.2,
          playerScore8: 55.3,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 3200,
          healsOnTeammate: 600,
          damageTakenPercentage: 22,
        }),
      }),
    ],
  };
}

function getTeam4(): ArenaTeam {
  return {
    teamId: 4 as const,
    placement: 4 as const,
    players: [
      createArenaChampion({
        riotIdGameName: "p4_1",
        championName: "Veigar",
        kills: 3,
        deaths: 6,
        assists: 2,
        level: 14,
        items: [3089, 0, 0, 0, 0, 0, 3364],
        gold: 5200,
        damage: 8900,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 3,
          playerScore1: 2,
          playerScore2: 420.1,
          playerScore3: 0.25,
          playerScore4: 3.5,
          playerScore5: 900.2,
          playerScore6: 2100.5,
          playerScore7: 180.1,
          playerScore8: 28.5,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 200,
          healsOnTeammate: 100,
          damageTakenPercentage: 55,
        }),
      }),
      createArenaChampion({
        riotIdGameName: "p4_2",
        championName: "Morgana",
        kills: 2,
        deaths: 5,
        assists: 3,
        level: 14,
        items: [3020, 0, 0, 0, 0, 0, 3364],
        gold: 4800,
        damage: 5200,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 2,
          playerScore1: 3,
          playerScore2: 380.2,
          playerScore3: 0.22,
          playerScore4: 3.1,
          playerScore5: 800.5,
          playerScore6: 1900.3,
          playerScore7: 160.2,
          playerScore8: 25.2,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 500,
          healsOnTeammate: 350,
          damageTakenPercentage: 60,
        }),
      }),
    ],
  };
}

function getTeam5(): ArenaTeam {
  return {
    teamId: 5 as const,
    placement: 5 as const,
    players: [
      createArenaChampion({
        riotIdGameName: "p5_1",
        championName: "Ezreal",
        kills: 4,
        deaths: 7,
        assists: 1,
        level: 13,
        items: [3006, 0, 0, 0, 0, 0, 3364],
        gold: 4100,
        damage: 9200,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 4,
          playerScore1: 1,
          playerScore2: 350.5,
          playerScore3: 0.2,
          playerScore4: 2.9,
          playerScore5: 700.3,
          playerScore6: 1800.2,
          playerScore7: 140.5,
          playerScore8: 22.1,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 100,
          healsOnTeammate: 50,
          damageTakenPercentage: 65,
        }),
      }),
      createArenaChampion({
        riotIdGameName: "p5_2",
        championName: "Evelynn",
        kills: 3,
        deaths: 6,
        assists: 2,
        level: 13,
        items: [0, 0, 0, 0, 0, 0, 3364],
        gold: 3500,
        damage: 4800,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 3,
          playerScore1: 2,
          playerScore2: 320.1,
          playerScore3: 0.18,
          playerScore4: 2.6,
          playerScore5: 620.2,
          playerScore6: 1600.1,
          playerScore7: 120.3,
          playerScore8: 19.8,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 50,
          healsOnTeammate: 0,
          damageTakenPercentage: 70,
        }),
      }),
    ],
  };
}

function getTeam6(): ArenaTeam {
  return {
    teamId: 6 as const,
    placement: 6 as const,
    players: [
      createArenaChampion({
        riotIdGameName: "p6_1",
        championName: "Yasuo",
        kills: 2,
        deaths: 8,
        assists: 1,
        level: 12,
        items: [0, 0, 0, 0, 0, 0, 3364],
        gold: 2800,
        damage: 6500,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 2,
          playerScore1: 1,
          playerScore2: 280.3,
          playerScore3: 0.15,
          playerScore4: 2.2,
          playerScore5: 500.1,
          playerScore6: 1400.2,
          playerScore7: 100.1,
          playerScore8: 16.5,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 0,
          healsOnTeammate: 0,
          damageTakenPercentage: 75,
        }),
      }),
      createArenaChampion({
        riotIdGameName: "p6_2",
        championName: "Zed",
        kills: 1,
        deaths: 7,
        assists: 0,
        level: 12,
        items: [0, 0, 0, 0, 0, 0, 3364],
        gold: 2400,
        damage: 5100,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 1,
          playerScore1: 0,
          playerScore2: 250.5,
          playerScore3: 0.12,
          playerScore4: 1.9,
          playerScore5: 420.3,
          playerScore6: 1200.1,
          playerScore7: 80.2,
          playerScore8: 13.2,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 0,
          healsOnTeammate: 0,
          damageTakenPercentage: 80,
        }),
      }),
    ],
  };
}

function getTeam7(): ArenaTeam {
  return {
    teamId: 7 as const,
    placement: 7 as const,
    players: [
      createArenaChampion({
        riotIdGameName: "p7_1",
        championName: "Taliyah",
        kills: 1,
        deaths: 9,
        assists: 0,
        level: 11,
        items: [0, 0, 0, 0, 0, 0, 3364],
        gold: 1800,
        damage: 3200,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 1,
          playerScore1: 0,
          playerScore2: 200.2,
          playerScore3: 0.1,
          playerScore4: 1.5,
          playerScore5: 300.1,
          playerScore6: 900.3,
          playerScore7: 60.1,
          playerScore8: 10.1,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 0,
          healsOnTeammate: 0,
          damageTakenPercentage: 85,
        }),
      }),
      createArenaChampion({
        riotIdGameName: "p7_2",
        championName: "Karthus",
        kills: 0,
        deaths: 8,
        assists: 0,
        level: 11,
        items: [0, 0, 0, 0, 0, 0, 3364],
        gold: 1500,
        damage: 2800,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 0,
          playerScore1: 0,
          playerScore2: 180.1,
          playerScore3: 0.08,
          playerScore4: 1.2,
          playerScore5: 250.2,
          playerScore6: 750.2,
          playerScore7: 50.2,
          playerScore8: 8.5,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 0,
          healsOnTeammate: 0,
          damageTakenPercentage: 90,
        }),
      }),
    ],
  };
}

function getTeam8(): ArenaTeam {
  return {
    teamId: 8 as const,
    placement: 8 as const,
    players: [
      createArenaChampion({
        riotIdGameName: "p8_1",
        championName: "Lissandra",
        kills: 0,
        deaths: 10,
        assists: 0,
        level: 10,
        items: [0, 0, 0, 0, 0, 0, 3364],
        gold: 1200,
        damage: 1500,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 0,
          playerScore1: 0,
          playerScore2: 150.1,
          playerScore3: 0.05,
          playerScore4: 1.0,
          playerScore5: 200.1,
          playerScore6: 600.1,
          playerScore7: 40.1,
          playerScore8: 6.2,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 0,
          healsOnTeammate: 0,
          damageTakenPercentage: 95,
        }),
      }),
      createArenaChampion({
        riotIdGameName: "p8_2",
        championName: "Ryze",
        kills: 0,
        deaths: 9,
        assists: 0,
        level: 10,
        items: [0, 0, 0, 0, 0, 0, 3364],
        gold: 1000,
        damage: 1200,
        augments: [],
        arenaMetrics: createArenaMetrics({
          playerScore0: 0,
          playerScore1: 0,
          playerScore2: 130.2,
          playerScore3: 0.04,
          playerScore4: 0.8,
          playerScore5: 150.2,
          playerScore6: 500.3,
          playerScore7: 30.1,
          playerScore8: 4.8,
        }),
        teamSupport: createTeamSupport({
          damageShieldedOnTeammate: 0,
          healsOnTeammate: 0,
          damageTakenPercentage: 95,
        }),
      }),
    ],
  };
}

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
