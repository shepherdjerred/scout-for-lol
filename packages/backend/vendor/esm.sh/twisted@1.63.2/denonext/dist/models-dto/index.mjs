/* esm.sh - twisted@1.63.2/dist/models-dto/index */
var nn = Object.create;
var dr = Object.defineProperty;
var un = Object.getOwnPropertyDescriptor;
var an = Object.getOwnPropertyNames;
var on = Object.getPrototypeOf, cn = Object.prototype.hasOwnProperty;
var u = (t, i) => () => (i || t((i = { exports: {} }).exports, i), i.exports);
var sn = (t, i, e, n) => {
  if (i && typeof i == "object" || typeof i == "function") {
    for (let r of an(i)) {
      !cn.call(t, r) && r !== e && dr(t, r, {
        get: () => i[r],
        enumerable: !(n = un(i, r)) || n.enumerable,
      });
    }
  }
  return t;
};
var dn = (
  t,
  i,
  e,
) => (e = t != null ? nn(on(t)) : {},
  sn(
    i || !t || !t.__esModule
      ? dr(e, "default", { value: t, enumerable: !0 })
      : e,
    t,
  ));
var lr = u((G) => {
  "use strict";
  Object.defineProperty(G, "__esModule", { value: !0 });
  G.ApiResponseDTO = void 0;
  var Ne = class {};
  G.ApiResponseDTO = Ne;
});
var _r = u((T) => {
  "use strict";
  var ln = T && T.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    _n = T && T.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          ln(i, t, e);
      }
    };
  Object.defineProperty(T, "__esModule", { value: !0 });
  _n(lr(), T);
});
var fr = u((E) => {
  "use strict";
  Object.defineProperty(E, "__esModule", { value: !0 });
  E.ChampionMasteryDTO = void 0;
  var xe = class {};
  E.ChampionMasteryDTO = xe;
});
var Or = u((V) => {
  "use strict";
  Object.defineProperty(V, "__esModule", { value: !0 });
  V.ChampionRotationV3DTO = void 0;
  var ke = class {};
  V.ChampionRotationV3DTO = ke;
});
var vr = u((K) => {
  "use strict";
  Object.defineProperty(K, "__esModule", { value: !0 });
  K.ChampionsScoreDTO = void 0;
  var et = class {};
  K.ChampionsScoreDTO = et;
});
var br = u((y) => {
  "use strict";
  var fn = y && y.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    tt = y && y.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          fn(i, t, e);
      }
    };
  Object.defineProperty(y, "__esModule", { value: !0 });
  tt(fr(), y);
  tt(Or(), y);
  tt(vr(), y);
});
var Mr = u((A) => {
  "use strict";
  Object.defineProperty(A, "__esModule", { value: !0 });
  A.RealmDTO = A.RealmNTO = void 0;
  var rt = class {};
  A.RealmNTO = rt;
  var it = class {};
  A.RealmDTO = it;
});
var Pr = u((D) => {
  "use strict";
  Object.defineProperty(D, "__esModule", { value: !0 });
  D.ChampionsDataDragon =
    D.ChampionsDataDragonDetailsSolo =
    D
      .ChampionsDataDragonDetails =
      void 0;
  var z = class {};
  D.ChampionsDataDragonDetails = z;
  var nt = class extends z {};
  D.ChampionsDataDragonDetailsSolo = nt;
  var ut = class {};
  D.ChampionsDataDragon = ut;
});
var hr = u((J) => {
  "use strict";
  Object.defineProperty(J, "__esModule", { value: !0 });
  J.QueuesDataDragonDTO = void 0;
  var at = class {};
  J.QueuesDataDragonDTO = at;
});
var yr = u((Q) => {
  "use strict";
  Object.defineProperty(Q, "__esModule", { value: !0 });
  Q.MapsDataDragonDTO = void 0;
  var ot = class {};
  Q.MapsDataDragonDTO = ot;
});
var jr = u((Y) => {
  "use strict";
  Object.defineProperty(Y, "__esModule", { value: !0 });
  Y.GameModesDataDragonDTO = void 0;
  var ct = class {};
  Y.GameModesDataDragonDTO = ct;
});
var Dr = u((f) => {
  "use strict";
  var On = f && f.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    U = f && f.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          On(i, t, e);
      }
    };
  Object.defineProperty(f, "__esModule", { value: !0 });
  U(Mr(), f);
  U(Pr(), f);
  U(hr(), f);
  U(yr(), f);
  U(jr(), f);
});
var pr = u((W) => {
  "use strict";
  Object.defineProperty(W, "__esModule", { value: !0 });
  W.LeagueEntryDTO = void 0;
  var st = class {};
  W.LeagueEntryDTO = st;
});
var gr = u((X) => {
  "use strict";
  Object.defineProperty(X, "__esModule", { value: !0 });
  X.LeagueItemDTO = void 0;
  var dt = class {};
  X.LeagueItemDTO = dt;
});
var Tr = u((Z) => {
  "use strict";
  Object.defineProperty(Z, "__esModule", { value: !0 });
  Z.LeagueListDTO = void 0;
  var lt = class {};
  Z.LeagueListDTO = lt;
});
var Sr = u(($) => {
  "use strict";
  Object.defineProperty($, "__esModule", { value: !0 });
  $.MiniSeriesDTO = void 0;
  var _t = class {};
  $.MiniSeriesDTO = _t;
});
var qr = u((m) => {
  "use strict";
  Object.defineProperty(m, "__esModule", { value: !0 });
  m.SummonerLeagueDto = void 0;
  var ft = class {};
  m.SummonerLeagueDto = ft;
});
var wr = u((O) => {
  "use strict";
  var vn = O && O.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    H = O && O.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          vn(i, t, e);
      }
    };
  Object.defineProperty(O, "__esModule", { value: !0 });
  H(pr(), O);
  H(gr(), O);
  H(Tr(), O);
  H(Sr(), O);
  H(qr(), O);
});
var Cr = u((N) => {
  "use strict";
  Object.defineProperty(N, "__esModule", { value: !0 });
  N.MatchDto = void 0;
  var Ot = class {};
  N.MatchDto = Ot;
});
var Rr = u((x) => {
  "use strict";
  Object.defineProperty(x, "__esModule", { value: !0 });
  x.MatchParticipantDTO = void 0;
  var vt = class {};
  x.MatchParticipantDTO = vt;
});
var Ar = u((k) => {
  "use strict";
  Object.defineProperty(k, "__esModule", { value: !0 });
  k.MatchParticipantsIdentitiesDto = void 0;
  var bt = class {};
  k.MatchParticipantsIdentitiesDto = bt;
});
var Br = u((ee) => {
  "use strict";
  Object.defineProperty(ee, "__esModule", { value: !0 });
  ee.MatchParticipantsIdentitiesPlayerDto = void 0;
  var Mt = class {};
  ee.MatchParticipantsIdentitiesPlayerDto = Mt;
});
var Lr = u((te) => {
  "use strict";
  Object.defineProperty(te, "__esModule", { value: !0 });
  te.MatchParticipantsMasteryDto = void 0;
  var Pt = class {};
  te.MatchParticipantsMasteryDto = Pt;
});
var Ur = u((re) => {
  "use strict";
  Object.defineProperty(re, "__esModule", { value: !0 });
  re.MatchParticipantsRuneDto = void 0;
  var ht = class {};
  re.MatchParticipantsRuneDto = ht;
});
var Hr = u((ie) => {
  "use strict";
  Object.defineProperty(ie, "__esModule", { value: !0 });
  ie.MatchParticipantsStatsDto = void 0;
  var yt = class {};
  ie.MatchParticipantsStatsDto = yt;
});
var Ir = u((ne) => {
  "use strict";
  Object.defineProperty(ne, "__esModule", { value: !0 });
  ne.MatchParticipantsTimelineDto = void 0;
  var jt = class {};
  ne.MatchParticipantsTimelineDto = jt;
});
var Fr = u((ue) => {
  "use strict";
  Object.defineProperty(ue, "__esModule", { value: !0 });
  ue.MatchTeamsDto = void 0;
  var Dt = class {};
  ue.MatchTeamsDto = Dt;
});
var Gr = u((ae) => {
  "use strict";
  Object.defineProperty(ae, "__esModule", { value: !0 });
  ae.BannedChampion = void 0;
  var pt = class {};
  ae.BannedChampion = pt;
});
var Er = u((o) => {
  "use strict";
  var bn = o && o.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    M = o && o.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          bn(i, t, e);
      }
    };
  Object.defineProperty(o, "__esModule", { value: !0 });
  M(Cr(), o);
  M(Rr(), o);
  M(Ar(), o);
  M(Br(), o);
  M(Lr(), o);
  M(Ur(), o);
  M(Hr(), o);
  M(Ir(), o);
  M(Fr(), o);
  M(Gr(), o);
});
var Kr = u((oe) => {
  "use strict";
  Object.defineProperty(oe, "__esModule", { value: !0 });
  oe.MatchV5TimelineDTOs = void 0;
  var Vr;
  (function (t) {
    let i;
    (function (r) {
      r.Ashe = "Ashe",
        r.Braum = "Braum",
        r.Darius = "Darius",
        r.Evelynn = "Evelynn",
        r.Graves = "Graves",
        r.Gwen = "Gwen",
        r.HAAPChaosTurret = "HA_AP_ChaosTurret",
        r.HAAPChaosTurret2 = "HA_AP_ChaosTurret2",
        r.HAAPChaosTurret3 = "HA_AP_ChaosTurret3",
        r.HAAPOrderTurret = "HA_AP_OrderTurret",
        r.HAAPOrderTurret3 = "HA_AP_OrderTurret3",
        r.HAChaosMinionMelee = "HA_ChaosMinionMelee",
        r.HAChaosMinionRanged = "HA_ChaosMinionRanged",
        r.HAChaosMinionSiege = "HA_ChaosMinionSiege",
        r.HAChaosMinionSuper = "HA_ChaosMinionSuper",
        r.HAOrderMinionMelee = "HA_OrderMinionMelee",
        r.HAOrderMinionRanged = "HA_OrderMinionRanged",
        r.HAOrderMinionSiege = "HA_OrderMinionSiege",
        r.HAOrderMinionSuper = "HA_OrderMinionSuper",
        r.Jax = "Jax",
        r.Jinx = "Jinx",
        r.Kassadin = "Kassadin",
        r.Khazix = "Khazix",
        r.Lissandra = "Lissandra",
        r.Nami = "Nami",
        r.Nidalee = "Nidalee",
        r.Pyke = "Pyke",
        r.SRUAPTurretChaos1 = "SRUAP_Turret_Chaos1",
        r.SRUAPTurretOrder1 = "SRUAP_Turret_Order1",
        r.SRUChaosMinionMelee = "SRU_ChaosMinionMelee",
        r.SRUChaosMinionRanged = "SRU_ChaosMinionRanged",
        r.SRUChaosMinionSiege = "SRU_ChaosMinionSiege",
        r.SRUKrug = "SRU_Krug",
        r.SRUKrugMini = "SRU_KrugMini",
        r.SRUOrderMinionMelee = "SRU_OrderMinionMelee",
        r.SRUOrderMinionRanged = "SRU_OrderMinionRanged",
        r.SRUOrderMinionSiege = "SRU_OrderMinionSiege",
        r.SRURazorbeakMini = "SRU_RazorbeakMini",
        r.Sylas = "Sylas",
        r.TwistedFate = "TwistedFate",
        r.Varus = "Varus",
        r.Vayne = "Vayne",
        r.Yone = "Yone";
    })(i || (i = {}));
    let e;
    (function (r) {
      r.Minion = "MINION",
        r.Monster = "MONSTER",
        r.Other = "OTHER",
        r.Tower = "TOWER";
    })(e || (e = {}));
    let n;
    (function (r) {
      r.BlueTrinket = "BLUE_TRINKET",
        r.ControlWard = "CONTROL_WARD",
        r.SightWard = "SIGHT_WARD",
        r.Undefined = "UNDEFINED",
        r.YellowTrinket = "YELLOW_TRINKET";
    })(n || (n = {}));
  })(Vr || (oe.MatchV5TimelineDTOs = Vr = {}));
});
var Jr = u((zr) => {
  "use strict";
  Object.defineProperty(zr, "__esModule", { value: !0 });
});
var Yr = u((p) => {
  "use strict";
  var Mn = p && p.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    Qr = p && p.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Mn(i, t, e);
      }
    };
  Object.defineProperty(p, "__esModule", { value: !0 });
  Qr(Kr(), p);
  Qr(Jr(), p);
});
var Wr = u((ce) => {
  "use strict";
  Object.defineProperty(ce, "__esModule", { value: !0 });
  ce.MatchListingDto = void 0;
  var gt = class {};
  ce.MatchListingDto = gt;
});
var Xr = u((se) => {
  "use strict";
  Object.defineProperty(se, "__esModule", { value: !0 });
  se.MatchListingMatches = void 0;
  var Tt = class {};
  se.MatchListingMatches = Tt;
});
var $r = u((g) => {
  "use strict";
  var Pn = g && g.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    Zr = g && g.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Pn(i, t, e);
      }
    };
  Object.defineProperty(g, "__esModule", { value: !0 });
  Zr(Wr(), g);
  Zr(Xr(), g);
});
var mr = u((de) => {
  "use strict";
  Object.defineProperty(de, "__esModule", { value: !0 });
  de.MatchEventDto = void 0;
  var St = class {};
  de.MatchEventDto = St;
});
var Nr = u((le) => {
  "use strict";
  Object.defineProperty(le, "__esModule", { value: !0 });
  le.MatchParticipantFrameDto = void 0;
  var qt = class {};
  le.MatchParticipantFrameDto = qt;
});
var xr = u((_e) => {
  "use strict";
  Object.defineProperty(_e, "__esModule", { value: !0 });
  _e.MatchPositionDto = void 0;
  var wt = class {};
  _e.MatchPositionDto = wt;
});
var kr = u((fe) => {
  "use strict";
  Object.defineProperty(fe, "__esModule", { value: !0 });
  fe.MatchTimelineDto = void 0;
  var Ct = class {};
  fe.MatchTimelineDto = Ct;
});
var ei = u((Oe) => {
  "use strict";
  Object.defineProperty(Oe, "__esModule", { value: !0 });
  Oe.MatchTimeLineFrameDto = void 0;
  var Rt = class {};
  Oe.MatchTimeLineFrameDto = Rt;
});
var ti = u((v) => {
  "use strict";
  var hn = v && v.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    I = v && v.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          hn(i, t, e);
      }
    };
  Object.defineProperty(v, "__esModule", { value: !0 });
  I(mr(), v);
  I(Nr(), v);
  I(xr(), v);
  I(kr(), v);
  I(ei(), v);
});
var ri = u((ve) => {
  "use strict";
  Object.defineProperty(ve, "__esModule", { value: !0 });
  ve.MatchQueryDTO = void 0;
  var At = class {};
  ve.MatchQueryDTO = At;
});
var ii = u((S) => {
  "use strict";
  var yn = S && S.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    jn = S && S.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          yn(i, t, e);
      }
    };
  Object.defineProperty(S, "__esModule", { value: !0 });
  jn(ri(), S);
});
var ni = u((be) => {
  "use strict";
  Object.defineProperty(be, "__esModule", { value: !0 });
  be.CompanionDto = void 0;
  var Bt = class {};
  be.CompanionDto = Bt;
});
var ui = u((Me) => {
  "use strict";
  Object.defineProperty(Me, "__esModule", { value: !0 });
  Me.InfoDto = void 0;
  var Lt = class {};
  Me.InfoDto = Lt;
});
var ai = u((Pe) => {
  "use strict";
  Object.defineProperty(Pe, "__esModule", { value: !0 });
  Pe.MatchTFTDTO = void 0;
  var Ut = class {};
  Pe.MatchTFTDTO = Ut;
});
var oi = u((he) => {
  "use strict";
  Object.defineProperty(he, "__esModule", { value: !0 });
  he.MetadataDto = void 0;
  var Ht = class {};
  he.MetadataDto = Ht;
});
var ci = u((ye) => {
  "use strict";
  Object.defineProperty(ye, "__esModule", { value: !0 });
  ye.ParticipantDto = void 0;
  var It = class {};
  ye.ParticipantDto = It;
});
var si = u((je) => {
  "use strict";
  Object.defineProperty(je, "__esModule", { value: !0 });
  je.TraitDto = void 0;
  var Ft = class {};
  je.TraitDto = Ft;
});
var di = u((De) => {
  "use strict";
  Object.defineProperty(De, "__esModule", { value: !0 });
  De.UnitDto = void 0;
  var Gt = class {};
  De.UnitDto = Gt;
});
var li = u((s) => {
  "use strict";
  var Dn = s && s.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    q = s && s.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Dn(i, t, e);
      }
    };
  Object.defineProperty(s, "__esModule", { value: !0 });
  q(ni(), s);
  q(ui(), s);
  q(ai(), s);
  q(oi(), s);
  q(ci(), s);
  q(si(), s);
  q(di(), s);
});
var _i = u((d) => {
  "use strict";
  var pn = d && d.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    B = d && d.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          pn(i, t, e);
      }
    };
  Object.defineProperty(d, "__esModule", { value: !0 });
  B(Er(), d);
  B(Yr(), d);
  B($r(), d);
  B(ti(), d);
  B(ii(), d);
  B(li(), d);
});
var fi = u((pe) => {
  "use strict";
  Object.defineProperty(pe, "__esModule", { value: !0 });
  pe.RateLimitDto = void 0;
  var Et = class {};
  pe.RateLimitDto = Et;
});
var Oi = u((w) => {
  "use strict";
  var gn = w && w.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    Tn = w && w.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          gn(i, t, e);
      }
    };
  Object.defineProperty(w, "__esModule", { value: !0 });
  Tn(fi(), w);
});
var vi = u((ge) => {
  "use strict";
  Object.defineProperty(ge, "__esModule", { value: !0 });
  ge.CurrentGameInfoDTO = void 0;
  var Vt = class {};
  ge.CurrentGameInfoDTO = Vt;
});
var bi = u((Te) => {
  "use strict";
  Object.defineProperty(Te, "__esModule", { value: !0 });
  Te.CurrentGameParticipantDTO = void 0;
  var Kt = class {};
  Te.CurrentGameParticipantDTO = Kt;
});
var Mi = u((Se) => {
  "use strict";
  Object.defineProperty(Se, "__esModule", { value: !0 });
  Se.FeaturedGameInfo = void 0;
  var zt = class {};
  Se.FeaturedGameInfo = zt;
});
var Pi = u((qe) => {
  "use strict";
  Object.defineProperty(qe, "__esModule", { value: !0 });
  qe.FeaturedGamesDTO = void 0;
  var Jt = class {};
  qe.FeaturedGamesDTO = Jt;
});
var hi = u((we) => {
  "use strict";
  Object.defineProperty(we, "__esModule", { value: !0 });
  we.GameCustomizationObjectDTO = void 0;
  var Qt = class {};
  we.GameCustomizationObjectDTO = Qt;
});
var yi = u((Ce) => {
  "use strict";
  Object.defineProperty(Ce, "__esModule", { value: !0 });
  Ce.ObserverDTO = void 0;
  var Yt = class {};
  Ce.ObserverDTO = Yt;
});
var ji = u((Re) => {
  "use strict";
  Object.defineProperty(Re, "__esModule", { value: !0 });
  Re.ParticipantDTO = void 0;
  var Wt = class {};
  Re.ParticipantDTO = Wt;
});
var Di = u((Ae) => {
  "use strict";
  Object.defineProperty(Ae, "__esModule", { value: !0 });
  Ae.PerksDTO = void 0;
  var Xt = class {};
  Ae.PerksDTO = Xt;
});
var pi = u((Be) => {
  "use strict";
  Object.defineProperty(Be, "__esModule", { value: !0 });
  Be.SpectatorNotAvailableDTO = void 0;
  var Zt = class {};
  Be.SpectatorNotAvailableDTO = Zt;
});
var gi = u((c) => {
  "use strict";
  var Sn = c && c.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    j = c && c.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Sn(i, t, e);
      }
    };
  Object.defineProperty(c, "__esModule", { value: !0 });
  j(vi(), c);
  j(bi(), c);
  j(Mi(), c);
  j(Pi(), c);
  j(hi(), c);
  j(yi(), c);
  j(ji(), c);
  j(Di(), c);
  j(pi(), c);
});
var Ti = u((Le) => {
  "use strict";
  Object.defineProperty(Le, "__esModule", { value: !0 });
  Le.TFTChampionsDTO = void 0;
  var $t = class {};
  Le.TFTChampionsDTO = $t;
});
var Si = u((Ue) => {
  "use strict";
  Object.defineProperty(Ue, "__esModule", { value: !0 });
  Ue.TFTHexesDto = void 0;
  var mt = class {};
  Ue.TFTHexesDto = mt;
});
var qi = u((He) => {
  "use strict";
  Object.defineProperty(He, "__esModule", { value: !0 });
  He.TFTItemsDTO = void 0;
  var Nt = class {};
  He.TFTItemsDTO = Nt;
});
var wi = u((Ie) => {
  "use strict";
  Object.defineProperty(Ie, "__esModule", { value: !0 });
  Ie.TFTTraitsDTO = void 0;
  var xt = class {};
  Ie.TFTTraitsDTO = xt;
});
var Ci = u((P) => {
  "use strict";
  var qn = P && P.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    Fe = P && P.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          qn(i, t, e);
      }
    };
  Object.defineProperty(P, "__esModule", { value: !0 });
  Fe(Ti(), P);
  Fe(Si(), P);
  Fe(qi(), P);
  Fe(wi(), P);
});
var Ri = u((Ge) => {
  "use strict";
  Object.defineProperty(Ge, "__esModule", { value: !0 });
  Ge.LolStatusDTO = void 0;
  var kt = class {};
  Ge.LolStatusDTO = kt;
});
var Ai = u((Ee) => {
  "use strict";
  Object.defineProperty(Ee, "__esModule", { value: !0 });
  Ee.LolStatusServiceDTO = void 0;
  var er = class {};
  Ee.LolStatusServiceDTO = er;
});
var Bi = u((Ve) => {
  "use strict";
  Object.defineProperty(Ve, "__esModule", { value: !0 });
  Ve.LolStatusServiceIncidentsUpdate = void 0;
  var tr = class {};
  Ve.LolStatusServiceIncidentsUpdate = tr;
});
var Li = u((Ke) => {
  "use strict";
  Object.defineProperty(Ke, "__esModule", { value: !0 });
  Ke.LolStatusServiceStatusIncident = void 0;
  var rr = class {};
  Ke.LolStatusServiceStatusIncident = rr;
});
var Ui = u((ze) => {
  "use strict";
  Object.defineProperty(ze, "__esModule", { value: !0 });
  ze.LolStatusIncidentsUpdateTranslations = void 0;
  var ir = class {};
  ze.LolStatusIncidentsUpdateTranslations = ir;
});
var Hi = u((Je) => {
  "use strict";
  Object.defineProperty(Je, "__esModule", { value: !0 });
  Je.LolStatusContentDTO = void 0;
  var nr = class {};
  Je.LolStatusContentDTO = nr;
});
var Ii = u((Qe) => {
  "use strict";
  Object.defineProperty(Qe, "__esModule", { value: !0 });
  Qe.LolStatusPlatformDataDTO = void 0;
  var ur = class {};
  Qe.LolStatusPlatformDataDTO = ur;
});
var Fi = u((Ye) => {
  "use strict";
  Object.defineProperty(Ye, "__esModule", { value: !0 });
  Ye.LolStatusStatusDTO = void 0;
  var ar = class {};
  Ye.LolStatusStatusDTO = ar;
});
var Gi = u((We) => {
  "use strict";
  Object.defineProperty(We, "__esModule", { value: !0 });
  We.LolStatusUpdateDTO = void 0;
  var or = class {};
  We.LolStatusUpdateDTO = or;
});
var Ei = u((h) => {
  "use strict";
  var wn = h && h.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    Xe = h && h.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          wn(i, t, e);
      }
    };
  Object.defineProperty(h, "__esModule", { value: !0 });
  Xe(Hi(), h);
  Xe(Ii(), h);
  Xe(Fi(), h);
  Xe(Gi(), h);
});
var Vi = u((l) => {
  "use strict";
  var Cn = l && l.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    L = l && l.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Cn(i, t, e);
      }
    };
  Object.defineProperty(l, "__esModule", { value: !0 });
  L(Ri(), l);
  L(Ai(), l);
  L(Bi(), l);
  L(Li(), l);
  L(Ui(), l);
  L(Ei(), l);
});
var Ki = u((Ze) => {
  "use strict";
  Object.defineProperty(Ze, "__esModule", { value: !0 });
  Ze.SummonerV4DTO = void 0;
  var cr = class {};
  Ze.SummonerV4DTO = cr;
});
var zi = u((C) => {
  "use strict";
  var Rn = C && C.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    An = C && C.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Rn(i, t, e);
      }
    };
  Object.defineProperty(C, "__esModule", { value: !0 });
  An(Ki(), C);
});
var Ji = u(($e) => {
  "use strict";
  Object.defineProperty($e, "__esModule", { value: !0 });
  $e.ThirdPartyCodeDTO = void 0;
  var sr = class {};
  $e.ThirdPartyCodeDTO = sr;
});
var Qi = u((R) => {
  "use strict";
  var Bn = R && R.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    Ln = R && R.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Bn(i, t, e);
      }
    };
  Object.defineProperty(R, "__esModule", { value: !0 });
  Ln(Ji(), R);
});
var Wi = u((Yi) => {
  "use strict";
  Object.defineProperty(Yi, "__esModule", { value: !0 });
});
var Zi = u((Xi) => {
  "use strict";
  Object.defineProperty(Xi, "__esModule", { value: !0 });
});
var mi = u(($i) => {
  "use strict";
  Object.defineProperty($i, "__esModule", { value: !0 });
});
var xi = u((Ni) => {
  "use strict";
  Object.defineProperty(Ni, "__esModule", { value: !0 });
});
var en = u((ki) => {
  "use strict";
  Object.defineProperty(ki, "__esModule", { value: !0 });
});
var tn = u((b) => {
  "use strict";
  var Un = b && b.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    F = b && b.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Un(i, t, e);
      }
    };
  Object.defineProperty(b, "__esModule", { value: !0 });
  F(Wi(), b);
  F(Zi(), b);
  F(mi(), b);
  F(xi(), b);
  F(en(), b);
});
var rn = u((a) => {
  "use strict";
  var Hn = a && a.__createBinding || (Object.create
      ? function (t, i, e, n) {
        n === void 0 && (n = e);
        var r = Object.getOwnPropertyDescriptor(i, e);
        (!r || ("get" in r ? !i.__esModule : r.writable || r.configurable)) &&
        (r = {
          enumerable: !0,
          get: function () {
            return i[e];
          },
        }), Object.defineProperty(t, n, r);
      }
      : function (t, i, e, n) {
        n === void 0 && (n = e), t[n] = i[e];
      }),
    _ = a && a.__exportStar || function (t, i) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(i, e) &&
          Hn(i, t, e);
      }
    };
  Object.defineProperty(a, "__esModule", { value: !0 });
  _(_r(), a);
  _(br(), a);
  _(Dr(), a);
  _(wr(), a);
  _(_i(), a);
  _(Oi(), a);
  _(gi(), a);
  _(Ci(), a);
  _(Vi(), a);
  _(zi(), a);
  _(Qi(), a);
  _(tn(), a);
});
var me = dn(rn()),
  {
    __esModule: ya,
    ThirdPartyCodeDTO: ja,
    SummonerV4DTO: Da,
    LolStatusUpdateDTO: pa,
    LolStatusStatusDTO: ga,
    LolStatusPlatformDataDTO: Ta,
    LolStatusContentDTO: Sa,
    LolStatusIncidentsUpdateTranslations: qa,
    LolStatusServiceStatusIncident: wa,
    LolStatusServiceIncidentsUpdate: Ca,
    LolStatusServiceDTO: Ra,
    LolStatusDTO: Aa,
    TFTTraitsDTO: Ba,
    TFTItemsDTO: La,
    TFTHexesDto: Ua,
    TFTChampionsDTO: Ha,
    SpectatorNotAvailableDTO: Ia,
    PerksDTO: Fa,
    ParticipantDTO: Ga,
    ObserverDTO: Ea,
    GameCustomizationObjectDTO: Va,
    FeaturedGamesDTO: Ka,
    FeaturedGameInfo: za,
    CurrentGameParticipantDTO: Ja,
    CurrentGameInfoDTO: Qa,
    RateLimitDto: Ya,
    UnitDto: Wa,
    TraitDto: Xa,
    ParticipantDto: Za,
    MetadataDto: $a,
    MatchTFTDTO: ma,
    InfoDto: Na,
    CompanionDto: xa,
    MatchQueryDTO: ka,
    MatchTimeLineFrameDto: eo,
    MatchTimelineDto: to,
    MatchPositionDto: ro,
    MatchParticipantFrameDto: io,
    MatchEventDto: no,
    MatchListingMatches: uo,
    MatchListingDto: ao,
    MatchV5TimelineDTOs: oo,
    BannedChampion: co,
    MatchTeamsDto: so,
    MatchParticipantsTimelineDto: lo,
    MatchParticipantsStatsDto: _o,
    MatchParticipantsRuneDto: fo,
    MatchParticipantsMasteryDto: Oo,
    MatchParticipantsIdentitiesPlayerDto: vo,
    MatchParticipantsIdentitiesDto: bo,
    MatchParticipantDTO: Mo,
    MatchDto: Po,
    SummonerLeagueDto: ho,
    MiniSeriesDTO: yo,
    LeagueListDTO: jo,
    LeagueItemDTO: Do,
    LeagueEntryDTO: po,
    GameModesDataDragonDTO: go,
    MapsDataDragonDTO: To,
    QueuesDataDragonDTO: So,
    ChampionsDataDragon: qo,
    ChampionsDataDragonDetailsSolo: wo,
    ChampionsDataDragonDetails: Co,
    RealmDTO: Ro,
    RealmNTO: Ao,
    ChampionsScoreDTO: Bo,
    ChampionRotationV3DTO: Lo,
    ChampionMasteryDTO: Uo,
    ApiResponseDTO: Ho,
  } = me,
  Io = me.default ?? me;
export {
  $a as MetadataDto,
  _o as MatchParticipantsStatsDto,
  Aa as LolStatusDTO,
  Ao as RealmNTO,
  ao as MatchListingDto,
  Ba as TFTTraitsDTO,
  Bo as ChampionsScoreDTO,
  bo as MatchParticipantsIdentitiesDto,
  Ca as LolStatusServiceIncidentsUpdate,
  Co as ChampionsDataDragonDetails,
  co as BannedChampion,
  Da as SummonerV4DTO,
  Do as LeagueItemDTO,
  Ea as ObserverDTO,
  eo as MatchTimeLineFrameDto,
  Fa as PerksDTO,
  fo as MatchParticipantsRuneDto,
  Ga as ParticipantDTO,
  ga as LolStatusStatusDTO,
  go as GameModesDataDragonDTO,
  Ha as TFTChampionsDTO,
  Ho as ApiResponseDTO,
  ho as SummonerLeagueDto,
  Ia as SpectatorNotAvailableDTO,
  Io as default,
  io as MatchParticipantFrameDto,
  Ja as CurrentGameParticipantDTO,
  ja as ThirdPartyCodeDTO,
  jo as LeagueListDTO,
  Ka as FeaturedGamesDTO,
  ka as MatchQueryDTO,
  La as TFTItemsDTO,
  Lo as ChampionRotationV3DTO,
  lo as MatchParticipantsTimelineDto,
  ma as MatchTFTDTO,
  Mo as MatchParticipantDTO,
  Na as InfoDto,
  no as MatchEventDto,
  Oo as MatchParticipantsMasteryDto,
  oo as MatchV5TimelineDTOs,
  pa as LolStatusUpdateDTO,
  Po as MatchDto,
  po as LeagueEntryDTO,
  Qa as CurrentGameInfoDTO,
  qa as LolStatusIncidentsUpdateTranslations,
  qo as ChampionsDataDragon,
  Ra as LolStatusServiceDTO,
  Ro as RealmDTO,
  ro as MatchPositionDto,
  Sa as LolStatusContentDTO,
  So as QueuesDataDragonDTO,
  so as MatchTeamsDto,
  Ta as LolStatusPlatformDataDTO,
  To as MapsDataDragonDTO,
  to as MatchTimelineDto,
  Ua as TFTHexesDto,
  Uo as ChampionMasteryDTO,
  uo as MatchListingMatches,
  Va as GameCustomizationObjectDTO,
  vo as MatchParticipantsIdentitiesPlayerDto,
  Wa as UnitDto,
  wa as LolStatusServiceStatusIncident,
  wo as ChampionsDataDragonDetailsSolo,
  Xa as TraitDto,
  xa as CompanionDto,
  Ya as RateLimitDto,
  ya as __esModule,
  yo as MiniSeriesDTO,
  Za as ParticipantDto,
  za as FeaturedGameInfo,
};
//# sourceMappingURL=index.mjs.map
