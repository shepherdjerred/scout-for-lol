/* esm.sh - twisted@1.63.2/dist/constants/index */
import __Process$ from "node:process";
import * as __0$ from "/lodash@^4.17.21?target=denonext";
import * as __1$ from "/axios@^1.6.2?target=denonext";
var require = (n) => {
  const e = (m) => typeof m.default < "u" ? m.default : m,
    c = (m) => Object.assign({ __esModule: true }, m);
  switch (n) {
    case "lodash":
      return e(__0$);
    case "axios":
      return c(__1$);
    default:
      console.error('module "' + n + '" not found');
      return null;
  }
};
var h = Object.create;
var Z = Object.defineProperty;
var s = Object.getOwnPropertyDescriptor;
var m = Object.getOwnPropertyNames;
var AA = Object.getPrototypeOf, EA = Object.prototype.hasOwnProperty;
var d =
  ((A) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
      ? new Proxy(A, { get: (E, N) => (typeof require < "u" ? require : E)[N] })
      : A)(function (A) {
      if (typeof require < "u") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + A + '" is not supported');
    });
var e = (A, E) => () => (E || A((E = { exports: {} }).exports, E), E.exports);
var NA = (A, E, N, S) => {
  if (E && typeof E == "object" || typeof E == "function") {
    for (let O of m(E)) {
      !EA.call(A, O) && O !== N && Z(A, O, {
        get: () => E[O],
        enumerable: !(S = s(E, O)) || S.enumerable,
      });
    }
  }
  return A;
};
var IA = (
  A,
  E,
  N,
) => (N = A != null ? h(AA(A)) : {},
  NA(
    E || !A || !A.__esModule
      ? Z(N, "default", { value: A, enumerable: !0 })
      : N,
    A,
  ));
var v = e((u) => {
  "use strict";
  Object.defineProperty(u, "__esModule", { value: !0 });
  u.Divisions = void 0;
  var B;
  (function (A) {
    A.I = "I", A.II = "II", A.III = "III", A.IV = "IV";
  })(B || (u.Divisions = B = {}));
});
var W = e((M) => {
  "use strict";
  Object.defineProperty(M, "__esModule", { value: !0 });
  M.GameModes = void 0;
  var b;
  (function (A) {
    A.CLASSIC = "CLASSIC",
      A.ODIN = "ODIN",
      A.ARAM = "ARAM",
      A.TUTORIAL = "TUTORIAL",
      A.URF = "URF",
      A.DOOMBOTSTEEMO = "DOOMBOTSTEEMO",
      A.ONEFORALL = "ONEFORALL",
      A.ASCENSION = "ASCENSION",
      A.FIRSTBLOOD = "FIRSTBLOOD",
      A.KINGPORO = "KINGPORO",
      A.SIEGE = "SIEGE",
      A.ASSASSINATE = "ASSASSINATE",
      A.ARSR = "ARSR",
      A.DARKSTAR = "DARKSTAR",
      A.STARGUARDIAN = "STARGUARDIAN",
      A.PROJECT = "PROJECT",
      A.GAMEMODEX = "GAMEMODEX",
      A.ODYSSEY = "ODYSSEY";
  })(b || (M.GameModes = b = {}));
});
var X = e((D) => {
  "use strict";
  Object.defineProperty(D, "__esModule", { value: !0 });
  D.GameTypes = void 0;
  var F;
  (function (A) {
    A.CUSTOM_GAME = "CUSTOM_GAME",
      A.TUTORIAL_GAME = "TUTORIAL_GAME",
      A.MATCHED_GAME = "MATCHED_GAME";
  })(F || (D.GameTypes = F = {}));
});
var J = e((c) => {
  "use strict";
  Object.defineProperty(c, "__esModule", { value: !0 });
  c.Queues = void 0;
  var y;
  (function (A) {
    A.RANKED_SOLO_5x5 = "RANKED_SOLO_5x5",
      A.RANKED_TFT = "RANKED_TFT",
      A.RANKED_FLEX_SR = "RANKED_FLEX_SR",
      A.RANKED_FLEX_TT = "RANKED_FLEX_TT";
  })(y || (c.Queues = y = {}));
});
var g = e((U) => {
  "use strict";
  Object.defineProperty(U, "__esModule", { value: !0 });
  U.Seasons = void 0;
  var j;
  (function (A) {
    A[A.PRESEASON_3 = 0] = "PRESEASON_3",
      A[A.SEASON_3 = 1] = "SEASON_3",
      A[A.PRESEASON_2014 = 2] = "PRESEASON_2014",
      A[A.SEASON_2014 = 3] = "SEASON_2014",
      A[A.PRESEASON_2015 = 4] = "PRESEASON_2015",
      A[A.SEASON_2015 = 5] = "SEASON_2015",
      A[A.PRESEASON_2016 = 6] = "PRESEASON_2016",
      A[A.SEASON_2016 = 7] = "SEASON_2016",
      A[A.PRESEASON_2017 = 8] = "PRESEASON_2017",
      A[A.SEASON_2017 = 9] = "SEASON_2017",
      A[A.PRESEASON_2018 = 10] = "PRESEASON_2018",
      A[A.SEASON_2018 = 11] = "SEASON_2018";
  })(j || (U.Seasons = j = {}));
});
var q = e((K) => {
  "use strict";
  Object.defineProperty(K, "__esModule", { value: !0 });
  K.Tiers = void 0;
  var w;
  (function (A) {
    A.CHALLENGER = "CHALLENGER",
      A.GRANDMASTER = "GRANDMASTER",
      A.MASTER = "MASTER",
      A.DIAMOND = "DIAMOND",
      A.EMERALD = "EMERALD",
      A.PLATINUM = "PLATINUM",
      A.GOLD = "GOLD",
      A.SILVER = "SILVER",
      A.BRONZE = "BRONZE",
      A.IRON = "IRON";
  })(w || (K.Tiers = w = {}));
});
var $ = e((T) => {
  "use strict";
  var Q = T && T.__importDefault || function (A) {
    return A && A.__esModule ? A : { default: A };
  };
  Object.defineProperty(T, "__esModule", { value: !0 });
  T.getChampionNameCapital = T.getChampionName = T.Champions = void 0;
  var RA = d("lodash"), SA = Q(d("axios")), OA = Q(d("lodash")), V;
  (function (A) {
    A[A.EMPTY_CHAMPION = 0] = "EMPTY_CHAMPION",
      A[A.ANNIE = 1] = "ANNIE",
      A[A.OLAF = 2] = "OLAF",
      A[A.GALIO = 3] = "GALIO",
      A[A.TWISTED_FATE = 4] = "TWISTED_FATE",
      A[A.XIN_ZHAO = 5] = "XIN_ZHAO",
      A[A.URGOT = 6] = "URGOT",
      A[A.LEBLANC = 7] = "LEBLANC",
      A[A.VLADIMIR = 8] = "VLADIMIR",
      A[A.FIDDLESTICKS = 9] = "FIDDLESTICKS",
      A[A.KAYLE = 10] = "KAYLE",
      A[A.MASTER_YI = 11] = "MASTER_YI",
      A[A.ALISTAR = 12] = "ALISTAR",
      A[A.RYZE = 13] = "RYZE",
      A[A.SION = 14] = "SION",
      A[A.SIVIR = 15] = "SIVIR",
      A[A.SORAKA = 16] = "SORAKA",
      A[A.TEEMO = 17] = "TEEMO",
      A[A.TRISTANA = 18] = "TRISTANA",
      A[A.WARWICK = 19] = "WARWICK",
      A[A.NUNU = 20] = "NUNU",
      A[A.MISS_FORTUNE = 21] = "MISS_FORTUNE",
      A[A.ASHE = 22] = "ASHE",
      A[A.TRYNDAMERE = 23] = "TRYNDAMERE",
      A[A.JAX = 24] = "JAX",
      A[A.MORGANA = 25] = "MORGANA",
      A[A.ZILEAN = 26] = "ZILEAN",
      A[A.SINGED = 27] = "SINGED",
      A[A.EVELYNN = 28] = "EVELYNN",
      A[A.TWITCH = 29] = "TWITCH",
      A[A.KARTHUS = 30] = "KARTHUS",
      A[A.CHOGATH = 31] = "CHOGATH",
      A[A.AMUMU = 32] = "AMUMU",
      A[A.RAMMUS = 33] = "RAMMUS",
      A[A.ANIVIA = 34] = "ANIVIA",
      A[A.SHACO = 35] = "SHACO",
      A[A.DR_MUNDO = 36] = "DR_MUNDO",
      A[A.SONA = 37] = "SONA",
      A[A.KASSADIN = 38] = "KASSADIN",
      A[A.IRELIA = 39] = "IRELIA",
      A[A.JANNA = 40] = "JANNA",
      A[A.GANGPLANK = 41] = "GANGPLANK",
      A[A.CORKI = 42] = "CORKI",
      A[A.KARMA = 43] = "KARMA",
      A[A.TARIC = 44] = "TARIC",
      A[A.VEIGAR = 45] = "VEIGAR",
      A[A.TRUNDLE = 48] = "TRUNDLE",
      A[A.SWAIN = 50] = "SWAIN",
      A[A.CAITLYN = 51] = "CAITLYN",
      A[A.BLITZCRANK = 53] = "BLITZCRANK",
      A[A.MALPHITE = 54] = "MALPHITE",
      A[A.KATARINA = 55] = "KATARINA",
      A[A.NOCTURNE = 56] = "NOCTURNE",
      A[A.MAOKAI = 57] = "MAOKAI",
      A[A.RENEKTON = 58] = "RENEKTON",
      A[A.JARVAN_IV = 59] = "JARVAN_IV",
      A[A.ELISE = 60] = "ELISE",
      A[A.ORIANNA = 61] = "ORIANNA",
      A[A.MONKEY_KING = 62] = "MONKEY_KING",
      A[A.BRAND = 63] = "BRAND",
      A[A.LEE_SIN = 64] = "LEE_SIN",
      A[A.VAYNE = 67] = "VAYNE",
      A[A.RUMBLE = 68] = "RUMBLE",
      A[A.CASSIOPEIA = 69] = "CASSIOPEIA",
      A[A.SKARNER = 72] = "SKARNER",
      A[A.HEIMERDINGER = 74] = "HEIMERDINGER",
      A[A.NASUS = 75] = "NASUS",
      A[A.NIDALEE = 76] = "NIDALEE",
      A[A.UDYR = 77] = "UDYR",
      A[A.POPPY = 78] = "POPPY",
      A[A.GRAGAS = 79] = "GRAGAS",
      A[A.PANTHEON = 80] = "PANTHEON",
      A[A.EZREAL = 81] = "EZREAL",
      A[A.MORDEKAISER = 82] = "MORDEKAISER",
      A[A.YORICK = 83] = "YORICK",
      A[A.AKALI = 84] = "AKALI",
      A[A.KENNEN = 85] = "KENNEN",
      A[A.GAREN = 86] = "GAREN",
      A[A.LEONA = 89] = "LEONA",
      A[A.MALZAHAR = 90] = "MALZAHAR",
      A[A.TALON = 91] = "TALON",
      A[A.RIVEN = 92] = "RIVEN",
      A[A.KOG_MAW = 96] = "KOG_MAW",
      A[A.SHEN = 98] = "SHEN",
      A[A.LUX = 99] = "LUX",
      A[A.XERATH = 101] = "XERATH",
      A[A.SHYVANA = 102] = "SHYVANA",
      A[A.AHRI = 103] = "AHRI",
      A[A.GRAVES = 104] = "GRAVES",
      A[A.FIZZ = 105] = "FIZZ",
      A[A.VOLIBEAR = 106] = "VOLIBEAR",
      A[A.RENGAR = 107] = "RENGAR",
      A[A.VARUS = 110] = "VARUS",
      A[A.NAUTILUS = 111] = "NAUTILUS",
      A[A.VIKTOR = 112] = "VIKTOR",
      A[A.SEJUANI = 113] = "SEJUANI",
      A[A.FIORA = 114] = "FIORA",
      A[A.ZIGGS = 115] = "ZIGGS",
      A[A.LULU = 117] = "LULU",
      A[A.DRAVEN = 119] = "DRAVEN",
      A[A.HECARIM = 120] = "HECARIM",
      A[A.KHAZIX = 121] = "KHAZIX",
      A[A.DARIUS = 122] = "DARIUS",
      A[A.JAYCE = 126] = "JAYCE",
      A[A.LISSANDRA = 127] = "LISSANDRA",
      A[A.DIANA = 131] = "DIANA",
      A[A.QUINN = 133] = "QUINN",
      A[A.SYNDRA = 134] = "SYNDRA",
      A[A.AURELION_SOL = 136] = "AURELION_SOL",
      A[A.KAYN = 141] = "KAYN",
      A[A.ZOE = 142] = "ZOE",
      A[A.ZYRA = 143] = "ZYRA",
      A[A.KAISA = 145] = "KAISA",
      A[A.GNAR = 150] = "GNAR",
      A[A.ZAC = 154] = "ZAC",
      A[A.YASUO = 157] = "YASUO",
      A[A.VELKOZ = 161] = "VELKOZ",
      A[A.TALIYAH = 163] = "TALIYAH",
      A[A.CAMILLE = 164] = "CAMILLE",
      A[A.BRAUM = 201] = "BRAUM",
      A[A.JHIN = 202] = "JHIN",
      A[A.KINDRED = 203] = "KINDRED",
      A[A.JINX = 222] = "JINX",
      A[A.TAHM_KENCH = 223] = "TAHM_KENCH",
      A[A.LUCIAN = 236] = "LUCIAN",
      A[A.ZED = 238] = "ZED",
      A[A.KLED = 240] = "KLED",
      A[A.EKKO = 245] = "EKKO",
      A[A.QIYANA = 246] = "QIYANA",
      A[A.VI = 254] = "VI",
      A[A.AATROX = 266] = "AATROX",
      A[A.NAMI = 267] = "NAMI",
      A[A.AZIR = 268] = "AZIR",
      A[A.YUUMI = 350] = "YUUMI",
      A[A.THRESH = 412] = "THRESH",
      A[A.ILLAOI = 420] = "ILLAOI",
      A[A.REKSAI = 421] = "REKSAI",
      A[A.IVERN = 427] = "IVERN",
      A[A.KALISTA = 429] = "KALISTA",
      A[A.BARD = 432] = "BARD",
      A[A.RAKAN = 497] = "RAKAN",
      A[A.XAYAH = 498] = "XAYAH",
      A[A.ORNN = 516] = "ORNN",
      A[A.SYLAS = 517] = "SYLAS",
      A[A.NEEKO = 518] = "NEEKO",
      A[A.APHELIOS = 523] = "APHELIOS",
      A[A.PYKE = 555] = "PYKE",
      A[A.SENNA = 235] = "SENNA",
      A[A.SETT = 875] = "SETT",
      A[A.LILLIA = 876] = "LILLIA",
      A[A.YONE = 777] = "YONE",
      A[A.SAMIRA = 360] = "SAMIRA",
      A[A.SERAPHINE = 147] = "SERAPHINE",
      A[A.RELL = 526] = "RELL",
      A[A.VIEGO = 234] = "VIEGO",
      A[A.GWEN = 887] = "GWEN",
      A[A.AKSHAN = 166] = "AKSHAN",
      A[A.VEX = 711] = "VEX",
      A[A.ZERI = 221] = "ZERI",
      A[A.RENATA_GLASC = 888] = "RENATA_GLASC",
      A[A.BELVETH = 200] = "BELVETH",
      A[A.NILAH = 895] = "NILAH",
      A[A.KSANTE = 897] = "KSANTE",
      A[A.MILIO = 902] = "MILIO",
      A[A.HWEI = 910] = "HWEI",
      A[A.AURORA = 893] = "AURORA",
      A[A.AMBESSA = 799] = "AMBESSA";
  })(V || (T.Champions = V = {}));
  var L = (0, RA.invert)(V);
  if (__Process$.env.UPDATE_CHAMPION_IDS) {
    let A = () => {
      let E =
        "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json";
      try {
        (0, SA.default)(E).then(({ data: N }) => {
          N.forEach(({ id: S, alias: O }) => {
            let f = O.replace(/[a-z][A-Z]/g, (l) => l[0] + "_" + l[1])
              .toUpperCase();
            L[S] || (L[S] = L[S] || f, L[f] = L[f] || "" + S);
          });
        });
      } catch {
        console.warn("Updating champion IDs failed");
      }
    };
    setInterval(A, 1e3 * 60 * 60 * 24), A();
  }
  function z(A) {
    let E = L[A];
    if (!E) throw new Error(`Invalid champ id ${A}`);
    return E;
  }
  T.getChampionName = z;
  function eA(A) {
    let E = typeof A == "number" ? z(A) : A;
    switch (
      E = OA.default.camelCase(E.toLowerCase()),
        E = E.charAt(0).toUpperCase() + E.slice(1),
        E
    ) {
      case "Reksai":
        return "RekSai";
      case "JarvanIv":
        return "JarvanIV";
    }
    return E;
  }
  T.getChampionNameCapital = eA;
});
var x = e((r) => {
  "use strict";
  Object.defineProperty(r, "__esModule", { value: !0 });
  r.regionToRegionGroup = r.RegionGroups = r.Regions = void 0;
  var I;
  (function (A) {
    A.BRAZIL = "BR1",
      A.EU_EAST = "EUN1",
      A.EU_WEST = "EUW1",
      A.KOREA = "KR",
      A.LAT_NORTH = "LA1",
      A.LAT_SOUTH = "LA2",
      A.AMERICA_NORTH = "NA1",
      A.OCEANIA = "OC1",
      A.TURKEY = "TR1",
      A.RUSSIA = "RU",
      A.JAPAN = "JP1",
      A.VIETNAM = "VN2",
      A.TAIWAN = "TW2",
      A.SINGAPORE = "SG2",
      A.MIDDLE_EAST = "ME1",
      A.PBE = "PBE1";
  })(I || (r.Regions = I = {}));
  var _;
  (function (A) {
    A.ASIA = "ASIA",
      A.AMERICAS = "AMERICAS",
      A.EUROPE = "EUROPE",
      A.SEA = "SEA";
  })(_ || (r.RegionGroups = _ = {}));
  function tA(A) {
    switch (A) {
      case I.AMERICA_NORTH:
      case I.BRAZIL:
      case I.LAT_NORTH:
      case I.LAT_SOUTH:
        return _.AMERICAS;
      case I.EU_EAST:
      case I.EU_WEST:
      case I.TURKEY:
      case I.RUSSIA:
      case I.MIDDLE_EAST:
        return _.EUROPE;
      case I.JAPAN:
      case I.KOREA:
        return _.ASIA;
      case I.OCEANIA:
      case I.SINGAPORE:
      case I.TAIWAN:
      case I.VIETNAM:
        return _.SEA;
    }
    throw new Error(`Unexpected region: ${A}`);
  }
  r.regionToRegionGroup = tA;
});
var i = e((H) => {
  "use strict";
  Object.defineProperty(H, "__esModule", { value: !0 });
  H.RealmServers = void 0;
  var k;
  (function (A) {
    A.BRAZIL = "br",
      A.EU_WEST = "euw",
      A.KOREA = "kr",
      A.LAT_NORTH = "lan",
      A.LAT_SOUTH = "las",
      A.AMERICA_NORTH = "na",
      A.OCEANIA = "oce",
      A.TURKEY = "tr",
      A.RUSSIA = "ru",
      A.JAPAN = "jp",
      A.PBE = "pbe";
  })(k || (H.RealmServers = k = {}));
});
var n = e((P) => {
  "use strict";
  Object.defineProperty(P, "__esModule", { value: !0 });
  P.DataSeed = void 0;
  var a;
  (function (A) {
    A.BASE =
      "https://s3-us-west-1.amazonaws.com/riot-developer-portal/seed-data";
  })(a || (P.DataSeed = a = {}));
});
var C = e((G) => {
  "use strict";
  Object.defineProperty(G, "__esModule", { value: !0 });
  G.Levels = void 0;
  var o;
  (function (A) {
    A.NONE = "NONE",
      A.IRON = "IRON",
      A.BRONZE = "BRONZE",
      A.SILVER = "SILVER",
      A.GOLD = "GOLD",
      A.PLATINUM = "PLATINUM",
      A.DIAMOND = "DIAMOND",
      A.MASTER = "MASTER",
      A.GRANDMASTER = "GRANDMASTER",
      A.CHALLENGER = "CHALLENGER",
      A.HIGHEST_NOT_LEADERBOARD_ONLY = "HIGHEST_NOT_LEADERBOARD_ONLY",
      A.HIGHEST = "HIGHEST",
      A.LOWEST = "LOWEST";
  })(o || (G.Levels = o = {}));
});
var p = e((R) => {
  "use strict";
  var TA = R && R.__createBinding || (Object.create
      ? function (A, E, N, S) {
        S === void 0 && (S = N);
        var O = Object.getOwnPropertyDescriptor(E, N);
        (!O || ("get" in O ? !E.__esModule : O.writable || O.configurable)) &&
        (O = {
          enumerable: !0,
          get: function () {
            return E[N];
          },
        }), Object.defineProperty(A, S, O);
      }
      : function (A, E, N, S) {
        S === void 0 && (S = N), A[S] = E[N];
      }),
    t = R && R.__exportStar || function (A, E) {
      for (var N in A) {
        N !== "default" && !Object.prototype.hasOwnProperty.call(E, N) &&
          TA(E, A, N);
      }
    };
  Object.defineProperty(R, "__esModule", { value: !0 });
  t(v(), R);
  t(W(), R);
  t(X(), R);
  t(J(), R);
  t(g(), R);
  t(q(), R);
  t($(), R);
  t(x(), R);
  t(i(), R);
  t(n(), R);
  t(C(), R);
});
var Y = IA(p()),
  {
    __esModule: fA,
    Levels: dA,
    DataSeed: VA,
    RealmServers: lA,
    regionToRegionGroup: ZA,
    RegionGroups: BA,
    Regions: vA,
    getChampionNameCapital: bA,
    getChampionName: WA,
    Champions: FA,
    Tiers: XA,
    Seasons: yA,
    Queues: JA,
    GameTypes: jA,
    GameModes: gA,
    Divisions: wA,
  } = Y,
  qA = Y.default ?? Y;
export {
  BA as RegionGroups,
  bA as getChampionNameCapital,
  dA as Levels,
  FA as Champions,
  fA as __esModule,
  gA as GameModes,
  JA as Queues,
  jA as GameTypes,
  lA as RealmServers,
  qA as default,
  VA as DataSeed,
  vA as Regions,
  WA as getChampionName,
  wA as Divisions,
  XA as Tiers,
  yA as Seasons,
  ZA as regionToRegionGroup,
};
//# sourceMappingURL=index.mjs.map
