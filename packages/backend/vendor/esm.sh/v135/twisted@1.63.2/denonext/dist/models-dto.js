/* esm.sh - esbuild bundle(twisted@1.63.2/dist/models-dto) denonext production */
var sn = Object.create;
var ke = Object.defineProperty;
var dn = Object.getOwnPropertyDescriptor;
var ln = Object.getOwnPropertyNames;
var _n = Object.getPrototypeOf, fn = Object.prototype.hasOwnProperty;
var u = (t, r) => () => (r || t((r = { exports: {} }).exports, r), r.exports),
  On = (t, r) => {
    for (var e in r) ke(t, e, { get: r[e], enumerable: !0 });
  },
  xe = (t, r, e, n) => {
    if (r && typeof r == "object" || typeof r == "function") {
      for (let i of ln(r)) {
        !fn.call(t, i) && i !== e && ke(t, i, {
          get: () => r[i],
          enumerable: !(n = dn(r, i)) || n.enumerable,
        });
      }
    }
    return t;
  },
  S = (t, r, e) => (xe(t, r, "default"), e && xe(e, r, "default")),
  Or = (
    t,
    r,
    e,
  ) => (e = t != null ? sn(_n(t)) : {},
    xe(
      r || !t || !t.__esModule
        ? ke(e, "default", { value: t, enumerable: !0 })
        : e,
      t,
    ));
var vr = u((V) => {
  "use strict";
  Object.defineProperty(V, "__esModule", { value: !0 });
  V.ApiResponseDTO = void 0;
  var et = class {};
  V.ApiResponseDTO = et;
});
var br = u((q) => {
  "use strict";
  var vn = q && q.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    bn = q && q.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          vn(r, t, e);
      }
    };
  Object.defineProperty(q, "__esModule", { value: !0 });
  bn(vr(), q);
});
var Mr = u((K) => {
  "use strict";
  Object.defineProperty(K, "__esModule", { value: !0 });
  K.ChampionMasteryDTO = void 0;
  var tt = class {};
  K.ChampionMasteryDTO = tt;
});
var Pr = u((z) => {
  "use strict";
  Object.defineProperty(z, "__esModule", { value: !0 });
  z.ChampionRotationV3DTO = void 0;
  var rt = class {};
  z.ChampionRotationV3DTO = rt;
});
var hr = u((J) => {
  "use strict";
  Object.defineProperty(J, "__esModule", { value: !0 });
  J.ChampionsScoreDTO = void 0;
  var it = class {};
  J.ChampionsScoreDTO = it;
});
var yr = u((y) => {
  "use strict";
  var Mn = y && y.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    nt = y && y.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Mn(r, t, e);
      }
    };
  Object.defineProperty(y, "__esModule", { value: !0 });
  nt(Mr(), y);
  nt(Pr(), y);
  nt(hr(), y);
});
var jr = u((L) => {
  "use strict";
  Object.defineProperty(L, "__esModule", { value: !0 });
  L.RealmDTO = L.RealmNTO = void 0;
  var ut = class {};
  L.RealmNTO = ut;
  var at = class {};
  L.RealmDTO = at;
});
var Dr = u((D) => {
  "use strict";
  Object.defineProperty(D, "__esModule", { value: !0 });
  D.ChampionsDataDragon =
    D.ChampionsDataDragonDetailsSolo =
    D
      .ChampionsDataDragonDetails =
      void 0;
  var Q = class {};
  D.ChampionsDataDragonDetails = Q;
  var ot = class extends Q {};
  D.ChampionsDataDragonDetailsSolo = ot;
  var ct = class {};
  D.ChampionsDataDragon = ct;
});
var pr = u((Y) => {
  "use strict";
  Object.defineProperty(Y, "__esModule", { value: !0 });
  Y.QueuesDataDragonDTO = void 0;
  var st = class {};
  Y.QueuesDataDragonDTO = st;
});
var gr = u((W) => {
  "use strict";
  Object.defineProperty(W, "__esModule", { value: !0 });
  W.MapsDataDragonDTO = void 0;
  var dt = class {};
  W.MapsDataDragonDTO = dt;
});
var Tr = u((X) => {
  "use strict";
  Object.defineProperty(X, "__esModule", { value: !0 });
  X.GameModesDataDragonDTO = void 0;
  var lt = class {};
  X.GameModesDataDragonDTO = lt;
});
var Sr = u((f) => {
  "use strict";
  var Pn = f && f.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    I = f && f.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Pn(r, t, e);
      }
    };
  Object.defineProperty(f, "__esModule", { value: !0 });
  I(jr(), f);
  I(Dr(), f);
  I(pr(), f);
  I(gr(), f);
  I(Tr(), f);
});
var qr = u((Z) => {
  "use strict";
  Object.defineProperty(Z, "__esModule", { value: !0 });
  Z.LeagueEntryDTO = void 0;
  var _t = class {};
  Z.LeagueEntryDTO = _t;
});
var wr = u(($) => {
  "use strict";
  Object.defineProperty($, "__esModule", { value: !0 });
  $.LeagueItemDTO = void 0;
  var ft = class {};
  $.LeagueItemDTO = ft;
});
var Cr = u((m) => {
  "use strict";
  Object.defineProperty(m, "__esModule", { value: !0 });
  m.LeagueListDTO = void 0;
  var Ot = class {};
  m.LeagueListDTO = Ot;
});
var Rr = u((N) => {
  "use strict";
  Object.defineProperty(N, "__esModule", { value: !0 });
  N.MiniSeriesDTO = void 0;
  var vt = class {};
  N.MiniSeriesDTO = vt;
});
var Ar = u((x) => {
  "use strict";
  Object.defineProperty(x, "__esModule", { value: !0 });
  x.SummonerLeagueDto = void 0;
  var bt = class {};
  x.SummonerLeagueDto = bt;
});
var Br = u((O) => {
  "use strict";
  var hn = O && O.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    F = O && O.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          hn(r, t, e);
      }
    };
  Object.defineProperty(O, "__esModule", { value: !0 });
  F(qr(), O);
  F(wr(), O);
  F(Cr(), O);
  F(Rr(), O);
  F(Ar(), O);
});
var Lr = u((k) => {
  "use strict";
  Object.defineProperty(k, "__esModule", { value: !0 });
  k.MatchDto = void 0;
  var Mt = class {};
  k.MatchDto = Mt;
});
var Ur = u((ee) => {
  "use strict";
  Object.defineProperty(ee, "__esModule", { value: !0 });
  ee.MatchParticipantDTO = void 0;
  var Pt = class {};
  ee.MatchParticipantDTO = Pt;
});
var Hr = u((te) => {
  "use strict";
  Object.defineProperty(te, "__esModule", { value: !0 });
  te.MatchParticipantsIdentitiesDto = void 0;
  var ht = class {};
  te.MatchParticipantsIdentitiesDto = ht;
});
var Ir = u((re) => {
  "use strict";
  Object.defineProperty(re, "__esModule", { value: !0 });
  re.MatchParticipantsIdentitiesPlayerDto = void 0;
  var yt = class {};
  re.MatchParticipantsIdentitiesPlayerDto = yt;
});
var Fr = u((ie) => {
  "use strict";
  Object.defineProperty(ie, "__esModule", { value: !0 });
  ie.MatchParticipantsMasteryDto = void 0;
  var jt = class {};
  ie.MatchParticipantsMasteryDto = jt;
});
var Gr = u((ne) => {
  "use strict";
  Object.defineProperty(ne, "__esModule", { value: !0 });
  ne.MatchParticipantsRuneDto = void 0;
  var Dt = class {};
  ne.MatchParticipantsRuneDto = Dt;
});
var Er = u((ue) => {
  "use strict";
  Object.defineProperty(ue, "__esModule", { value: !0 });
  ue.MatchParticipantsStatsDto = void 0;
  var pt = class {};
  ue.MatchParticipantsStatsDto = pt;
});
var Vr = u((ae) => {
  "use strict";
  Object.defineProperty(ae, "__esModule", { value: !0 });
  ae.MatchParticipantsTimelineDto = void 0;
  var gt = class {};
  ae.MatchParticipantsTimelineDto = gt;
});
var Kr = u((oe) => {
  "use strict";
  Object.defineProperty(oe, "__esModule", { value: !0 });
  oe.MatchTeamsDto = void 0;
  var Tt = class {};
  oe.MatchTeamsDto = Tt;
});
var zr = u((ce) => {
  "use strict";
  Object.defineProperty(ce, "__esModule", { value: !0 });
  ce.BannedChampion = void 0;
  var St = class {};
  ce.BannedChampion = St;
});
var Jr = u((o) => {
  "use strict";
  var yn = o && o.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    M = o && o.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          yn(r, t, e);
      }
    };
  Object.defineProperty(o, "__esModule", { value: !0 });
  M(Lr(), o);
  M(Ur(), o);
  M(Hr(), o);
  M(Ir(), o);
  M(Fr(), o);
  M(Gr(), o);
  M(Er(), o);
  M(Vr(), o);
  M(Kr(), o);
  M(zr(), o);
});
var Yr = u((se) => {
  "use strict";
  Object.defineProperty(se, "__esModule", { value: !0 });
  se.MatchV5TimelineDTOs = void 0;
  var Qr;
  (function (t) {
    let r;
    (function (i) {
      i.Ashe = "Ashe",
        i.Braum = "Braum",
        i.Darius = "Darius",
        i.Evelynn = "Evelynn",
        i.Graves = "Graves",
        i.Gwen = "Gwen",
        i.HAAPChaosTurret = "HA_AP_ChaosTurret",
        i.HAAPChaosTurret2 = "HA_AP_ChaosTurret2",
        i.HAAPChaosTurret3 = "HA_AP_ChaosTurret3",
        i.HAAPOrderTurret = "HA_AP_OrderTurret",
        i.HAAPOrderTurret3 = "HA_AP_OrderTurret3",
        i.HAChaosMinionMelee = "HA_ChaosMinionMelee",
        i.HAChaosMinionRanged = "HA_ChaosMinionRanged",
        i.HAChaosMinionSiege = "HA_ChaosMinionSiege",
        i.HAChaosMinionSuper = "HA_ChaosMinionSuper",
        i.HAOrderMinionMelee = "HA_OrderMinionMelee",
        i.HAOrderMinionRanged = "HA_OrderMinionRanged",
        i.HAOrderMinionSiege = "HA_OrderMinionSiege",
        i.HAOrderMinionSuper = "HA_OrderMinionSuper",
        i.Jax = "Jax",
        i.Jinx = "Jinx",
        i.Kassadin = "Kassadin",
        i.Khazix = "Khazix",
        i.Lissandra = "Lissandra",
        i.Nami = "Nami",
        i.Nidalee = "Nidalee",
        i.Pyke = "Pyke",
        i.SRUAPTurretChaos1 = "SRUAP_Turret_Chaos1",
        i.SRUAPTurretOrder1 = "SRUAP_Turret_Order1",
        i.SRUChaosMinionMelee = "SRU_ChaosMinionMelee",
        i.SRUChaosMinionRanged = "SRU_ChaosMinionRanged",
        i.SRUChaosMinionSiege = "SRU_ChaosMinionSiege",
        i.SRUKrug = "SRU_Krug",
        i.SRUKrugMini = "SRU_KrugMini",
        i.SRUOrderMinionMelee = "SRU_OrderMinionMelee",
        i.SRUOrderMinionRanged = "SRU_OrderMinionRanged",
        i.SRUOrderMinionSiege = "SRU_OrderMinionSiege",
        i.SRURazorbeakMini = "SRU_RazorbeakMini",
        i.Sylas = "Sylas",
        i.TwistedFate = "TwistedFate",
        i.Varus = "Varus",
        i.Vayne = "Vayne",
        i.Yone = "Yone";
    })(r || (r = {}));
    let e;
    (function (i) {
      i.Minion = "MINION",
        i.Monster = "MONSTER",
        i.Other = "OTHER",
        i.Tower = "TOWER";
    })(e || (e = {}));
    let n;
    (function (i) {
      i.BlueTrinket = "BLUE_TRINKET",
        i.ControlWard = "CONTROL_WARD",
        i.SightWard = "SIGHT_WARD",
        i.Undefined = "UNDEFINED",
        i.YellowTrinket = "YELLOW_TRINKET";
    })(n || (n = {}));
  })(Qr || (se.MatchV5TimelineDTOs = Qr = {}));
});
var Xr = u((Wr) => {
  "use strict";
  Object.defineProperty(Wr, "__esModule", { value: !0 });
});
var $r = u((p) => {
  "use strict";
  var jn = p && p.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    Zr = p && p.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          jn(r, t, e);
      }
    };
  Object.defineProperty(p, "__esModule", { value: !0 });
  Zr(Yr(), p);
  Zr(Xr(), p);
});
var mr = u((de) => {
  "use strict";
  Object.defineProperty(de, "__esModule", { value: !0 });
  de.MatchListingDto = void 0;
  var qt = class {};
  de.MatchListingDto = qt;
});
var Nr = u((le) => {
  "use strict";
  Object.defineProperty(le, "__esModule", { value: !0 });
  le.MatchListingMatches = void 0;
  var wt = class {};
  le.MatchListingMatches = wt;
});
var kr = u((g) => {
  "use strict";
  var Dn = g && g.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    xr = g && g.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Dn(r, t, e);
      }
    };
  Object.defineProperty(g, "__esModule", { value: !0 });
  xr(mr(), g);
  xr(Nr(), g);
});
var ei = u((_e) => {
  "use strict";
  Object.defineProperty(_e, "__esModule", { value: !0 });
  _e.MatchEventDto = void 0;
  var Ct = class {};
  _e.MatchEventDto = Ct;
});
var ti = u((fe) => {
  "use strict";
  Object.defineProperty(fe, "__esModule", { value: !0 });
  fe.MatchParticipantFrameDto = void 0;
  var Rt = class {};
  fe.MatchParticipantFrameDto = Rt;
});
var ri = u((Oe) => {
  "use strict";
  Object.defineProperty(Oe, "__esModule", { value: !0 });
  Oe.MatchPositionDto = void 0;
  var At = class {};
  Oe.MatchPositionDto = At;
});
var ii = u((ve) => {
  "use strict";
  Object.defineProperty(ve, "__esModule", { value: !0 });
  ve.MatchTimelineDto = void 0;
  var Bt = class {};
  ve.MatchTimelineDto = Bt;
});
var ni = u((be) => {
  "use strict";
  Object.defineProperty(be, "__esModule", { value: !0 });
  be.MatchTimeLineFrameDto = void 0;
  var Lt = class {};
  be.MatchTimeLineFrameDto = Lt;
});
var ui = u((v) => {
  "use strict";
  var pn = v && v.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    G = v && v.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          pn(r, t, e);
      }
    };
  Object.defineProperty(v, "__esModule", { value: !0 });
  G(ei(), v);
  G(ti(), v);
  G(ri(), v);
  G(ii(), v);
  G(ni(), v);
});
var ai = u((Me) => {
  "use strict";
  Object.defineProperty(Me, "__esModule", { value: !0 });
  Me.MatchQueryDTO = void 0;
  var Ut = class {};
  Me.MatchQueryDTO = Ut;
});
var oi = u((w) => {
  "use strict";
  var gn = w && w.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    Tn = w && w.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          gn(r, t, e);
      }
    };
  Object.defineProperty(w, "__esModule", { value: !0 });
  Tn(ai(), w);
});
var ci = u((Pe) => {
  "use strict";
  Object.defineProperty(Pe, "__esModule", { value: !0 });
  Pe.CompanionDto = void 0;
  var Ht = class {};
  Pe.CompanionDto = Ht;
});
var si = u((he) => {
  "use strict";
  Object.defineProperty(he, "__esModule", { value: !0 });
  he.InfoDto = void 0;
  var It = class {};
  he.InfoDto = It;
});
var di = u((ye) => {
  "use strict";
  Object.defineProperty(ye, "__esModule", { value: !0 });
  ye.MatchTFTDTO = void 0;
  var Ft = class {};
  ye.MatchTFTDTO = Ft;
});
var li = u((je) => {
  "use strict";
  Object.defineProperty(je, "__esModule", { value: !0 });
  je.MetadataDto = void 0;
  var Gt = class {};
  je.MetadataDto = Gt;
});
var _i = u((De) => {
  "use strict";
  Object.defineProperty(De, "__esModule", { value: !0 });
  De.ParticipantDto = void 0;
  var Et = class {};
  De.ParticipantDto = Et;
});
var fi = u((pe) => {
  "use strict";
  Object.defineProperty(pe, "__esModule", { value: !0 });
  pe.TraitDto = void 0;
  var Vt = class {};
  pe.TraitDto = Vt;
});
var Oi = u((ge) => {
  "use strict";
  Object.defineProperty(ge, "__esModule", { value: !0 });
  ge.UnitDto = void 0;
  var Kt = class {};
  ge.UnitDto = Kt;
});
var vi = u((s) => {
  "use strict";
  var Sn = s && s.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    C = s && s.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Sn(r, t, e);
      }
    };
  Object.defineProperty(s, "__esModule", { value: !0 });
  C(ci(), s);
  C(si(), s);
  C(di(), s);
  C(li(), s);
  C(_i(), s);
  C(fi(), s);
  C(Oi(), s);
});
var bi = u((d) => {
  "use strict";
  var qn = d && d.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    U = d && d.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          qn(r, t, e);
      }
    };
  Object.defineProperty(d, "__esModule", { value: !0 });
  U(Jr(), d);
  U($r(), d);
  U(kr(), d);
  U(ui(), d);
  U(oi(), d);
  U(vi(), d);
});
var Mi = u((Te) => {
  "use strict";
  Object.defineProperty(Te, "__esModule", { value: !0 });
  Te.RateLimitDto = void 0;
  var zt = class {};
  Te.RateLimitDto = zt;
});
var Pi = u((R) => {
  "use strict";
  var wn = R && R.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    Cn = R && R.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          wn(r, t, e);
      }
    };
  Object.defineProperty(R, "__esModule", { value: !0 });
  Cn(Mi(), R);
});
var hi = u((Se) => {
  "use strict";
  Object.defineProperty(Se, "__esModule", { value: !0 });
  Se.CurrentGameInfoDTO = void 0;
  var Jt = class {};
  Se.CurrentGameInfoDTO = Jt;
});
var yi = u((qe) => {
  "use strict";
  Object.defineProperty(qe, "__esModule", { value: !0 });
  qe.CurrentGameParticipantDTO = void 0;
  var Qt = class {};
  qe.CurrentGameParticipantDTO = Qt;
});
var ji = u((we) => {
  "use strict";
  Object.defineProperty(we, "__esModule", { value: !0 });
  we.FeaturedGameInfo = void 0;
  var Yt = class {};
  we.FeaturedGameInfo = Yt;
});
var Di = u((Ce) => {
  "use strict";
  Object.defineProperty(Ce, "__esModule", { value: !0 });
  Ce.FeaturedGamesDTO = void 0;
  var Wt = class {};
  Ce.FeaturedGamesDTO = Wt;
});
var pi = u((Re) => {
  "use strict";
  Object.defineProperty(Re, "__esModule", { value: !0 });
  Re.GameCustomizationObjectDTO = void 0;
  var Xt = class {};
  Re.GameCustomizationObjectDTO = Xt;
});
var gi = u((Ae) => {
  "use strict";
  Object.defineProperty(Ae, "__esModule", { value: !0 });
  Ae.ObserverDTO = void 0;
  var Zt = class {};
  Ae.ObserverDTO = Zt;
});
var Ti = u((Be) => {
  "use strict";
  Object.defineProperty(Be, "__esModule", { value: !0 });
  Be.ParticipantDTO = void 0;
  var $t = class {};
  Be.ParticipantDTO = $t;
});
var Si = u((Le) => {
  "use strict";
  Object.defineProperty(Le, "__esModule", { value: !0 });
  Le.PerksDTO = void 0;
  var mt = class {};
  Le.PerksDTO = mt;
});
var qi = u((Ue) => {
  "use strict";
  Object.defineProperty(Ue, "__esModule", { value: !0 });
  Ue.SpectatorNotAvailableDTO = void 0;
  var Nt = class {};
  Ue.SpectatorNotAvailableDTO = Nt;
});
var wi = u((c) => {
  "use strict";
  var Rn = c && c.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    j = c && c.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Rn(r, t, e);
      }
    };
  Object.defineProperty(c, "__esModule", { value: !0 });
  j(hi(), c);
  j(yi(), c);
  j(ji(), c);
  j(Di(), c);
  j(pi(), c);
  j(gi(), c);
  j(Ti(), c);
  j(Si(), c);
  j(qi(), c);
});
var Ci = u((He) => {
  "use strict";
  Object.defineProperty(He, "__esModule", { value: !0 });
  He.TFTChampionsDTO = void 0;
  var xt = class {};
  He.TFTChampionsDTO = xt;
});
var Ri = u((Ie) => {
  "use strict";
  Object.defineProperty(Ie, "__esModule", { value: !0 });
  Ie.TFTHexesDto = void 0;
  var kt = class {};
  Ie.TFTHexesDto = kt;
});
var Ai = u((Fe) => {
  "use strict";
  Object.defineProperty(Fe, "__esModule", { value: !0 });
  Fe.TFTItemsDTO = void 0;
  var er = class {};
  Fe.TFTItemsDTO = er;
});
var Bi = u((Ge) => {
  "use strict";
  Object.defineProperty(Ge, "__esModule", { value: !0 });
  Ge.TFTTraitsDTO = void 0;
  var tr = class {};
  Ge.TFTTraitsDTO = tr;
});
var Li = u((P) => {
  "use strict";
  var An = P && P.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    Ee = P && P.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          An(r, t, e);
      }
    };
  Object.defineProperty(P, "__esModule", { value: !0 });
  Ee(Ci(), P);
  Ee(Ri(), P);
  Ee(Ai(), P);
  Ee(Bi(), P);
});
var Ui = u((Ve) => {
  "use strict";
  Object.defineProperty(Ve, "__esModule", { value: !0 });
  Ve.LolStatusDTO = void 0;
  var rr = class {};
  Ve.LolStatusDTO = rr;
});
var Hi = u((Ke) => {
  "use strict";
  Object.defineProperty(Ke, "__esModule", { value: !0 });
  Ke.LolStatusServiceDTO = void 0;
  var ir = class {};
  Ke.LolStatusServiceDTO = ir;
});
var Ii = u((ze) => {
  "use strict";
  Object.defineProperty(ze, "__esModule", { value: !0 });
  ze.LolStatusServiceIncidentsUpdate = void 0;
  var nr = class {};
  ze.LolStatusServiceIncidentsUpdate = nr;
});
var Fi = u((Je) => {
  "use strict";
  Object.defineProperty(Je, "__esModule", { value: !0 });
  Je.LolStatusServiceStatusIncident = void 0;
  var ur = class {};
  Je.LolStatusServiceStatusIncident = ur;
});
var Gi = u((Qe) => {
  "use strict";
  Object.defineProperty(Qe, "__esModule", { value: !0 });
  Qe.LolStatusIncidentsUpdateTranslations = void 0;
  var ar = class {};
  Qe.LolStatusIncidentsUpdateTranslations = ar;
});
var Ei = u((Ye) => {
  "use strict";
  Object.defineProperty(Ye, "__esModule", { value: !0 });
  Ye.LolStatusContentDTO = void 0;
  var or = class {};
  Ye.LolStatusContentDTO = or;
});
var Vi = u((We) => {
  "use strict";
  Object.defineProperty(We, "__esModule", { value: !0 });
  We.LolStatusPlatformDataDTO = void 0;
  var cr = class {};
  We.LolStatusPlatformDataDTO = cr;
});
var Ki = u((Xe) => {
  "use strict";
  Object.defineProperty(Xe, "__esModule", { value: !0 });
  Xe.LolStatusStatusDTO = void 0;
  var sr = class {};
  Xe.LolStatusStatusDTO = sr;
});
var zi = u((Ze) => {
  "use strict";
  Object.defineProperty(Ze, "__esModule", { value: !0 });
  Ze.LolStatusUpdateDTO = void 0;
  var dr = class {};
  Ze.LolStatusUpdateDTO = dr;
});
var Ji = u((h) => {
  "use strict";
  var Bn = h && h.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    $e = h && h.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Bn(r, t, e);
      }
    };
  Object.defineProperty(h, "__esModule", { value: !0 });
  $e(Ei(), h);
  $e(Vi(), h);
  $e(Ki(), h);
  $e(zi(), h);
});
var Qi = u((l) => {
  "use strict";
  var Ln = l && l.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    H = l && l.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Ln(r, t, e);
      }
    };
  Object.defineProperty(l, "__esModule", { value: !0 });
  H(Ui(), l);
  H(Hi(), l);
  H(Ii(), l);
  H(Fi(), l);
  H(Gi(), l);
  H(Ji(), l);
});
var Yi = u((me) => {
  "use strict";
  Object.defineProperty(me, "__esModule", { value: !0 });
  me.SummonerV4DTO = void 0;
  var lr = class {};
  me.SummonerV4DTO = lr;
});
var Wi = u((A) => {
  "use strict";
  var Un = A && A.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    Hn = A && A.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Un(r, t, e);
      }
    };
  Object.defineProperty(A, "__esModule", { value: !0 });
  Hn(Yi(), A);
});
var Xi = u((Ne) => {
  "use strict";
  Object.defineProperty(Ne, "__esModule", { value: !0 });
  Ne.ThirdPartyCodeDTO = void 0;
  var _r = class {};
  Ne.ThirdPartyCodeDTO = _r;
});
var Zi = u((B) => {
  "use strict";
  var In = B && B.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    Fn = B && B.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          In(r, t, e);
      }
    };
  Object.defineProperty(B, "__esModule", { value: !0 });
  Fn(Xi(), B);
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
var rn = u((tn) => {
  "use strict";
  Object.defineProperty(tn, "__esModule", { value: !0 });
});
var un = u((nn) => {
  "use strict";
  Object.defineProperty(nn, "__esModule", { value: !0 });
});
var an = u((b) => {
  "use strict";
  var Gn = b && b.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    E = b && b.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          Gn(r, t, e);
      }
    };
  Object.defineProperty(b, "__esModule", { value: !0 });
  E(mi(), b);
  E(xi(), b);
  E(en(), b);
  E(rn(), b);
  E(un(), b);
});
var fr = u((a) => {
  "use strict";
  var En = a && a.__createBinding || (Object.create
      ? function (t, r, e, n) {
        n === void 0 && (n = e);
        var i = Object.getOwnPropertyDescriptor(r, e);
        (!i || ("get" in i ? !r.__esModule : i.writable || i.configurable)) &&
        (i = {
          enumerable: !0,
          get: function () {
            return r[e];
          },
        }), Object.defineProperty(t, n, i);
      }
      : function (t, r, e, n) {
        n === void 0 && (n = e), t[n] = r[e];
      }),
    _ = a && a.__exportStar || function (t, r) {
      for (var e in t) {
        e !== "default" && !Object.prototype.hasOwnProperty.call(r, e) &&
          En(r, t, e);
      }
    };
  Object.defineProperty(a, "__esModule", { value: !0 });
  _(br(), a);
  _(yr(), a);
  _(Sr(), a);
  _(Br(), a);
  _(bi(), a);
  _(Pi(), a);
  _(wi(), a);
  _(Li(), a);
  _(Qi(), a);
  _(Wi(), a);
  _(Zi(), a);
  _(an(), a);
});
var T = {};
On(T, {
  ApiResponseDTO: () => ea,
  BannedChampion: () => wu,
  ChampionMasteryDTO: () => ku,
  ChampionRotationV3DTO: () => xu,
  ChampionsDataDragon: () => Wu,
  ChampionsDataDragonDetails: () => Zu,
  ChampionsDataDragonDetailsSolo: () => Xu,
  ChampionsScoreDTO: () => Nu,
  CompanionDto: () => Pu,
  CurrentGameInfoDTO: () => du,
  CurrentGameParticipantDTO: () => su,
  FeaturedGameInfo: () => cu,
  FeaturedGamesDTO: () => ou,
  GameCustomizationObjectDTO: () => au,
  GameModesDataDragonDTO: () => Ju,
  InfoDto: () => Mu,
  LeagueEntryDTO: () => zu,
  LeagueItemDTO: () => Ku,
  LeagueListDTO: () => Vu,
  LolStatusContentDTO: () => Wn,
  LolStatusDTO: () => Nn,
  LolStatusIncidentsUpdateTranslations: () => Xn,
  LolStatusPlatformDataDTO: () => Yn,
  LolStatusServiceDTO: () => mn,
  LolStatusServiceIncidentsUpdate: () => $n,
  LolStatusServiceStatusIncident: () => Zn,
  LolStatusStatusDTO: () => Qn,
  LolStatusUpdateDTO: () => Jn,
  MapsDataDragonDTO: () => Qu,
  MatchDto: () => Fu,
  MatchEventDto: () => gu,
  MatchListingDto: () => Su,
  MatchListingMatches: () => Tu,
  MatchParticipantDTO: () => Iu,
  MatchParticipantFrameDto: () => pu,
  MatchParticipantsIdentitiesDto: () => Hu,
  MatchParticipantsIdentitiesPlayerDto: () => Uu,
  MatchParticipantsMasteryDto: () => Lu,
  MatchParticipantsRuneDto: () => Bu,
  MatchParticipantsStatsDto: () => Au,
  MatchParticipantsTimelineDto: () => Ru,
  MatchPositionDto: () => Du,
  MatchQueryDTO: () => hu,
  MatchTFTDTO: () => bu,
  MatchTeamsDto: () => Cu,
  MatchTimeLineFrameDto: () => yu,
  MatchTimelineDto: () => ju,
  MatchV5TimelineDTOs: () => qu,
  MetadataDto: () => vu,
  MiniSeriesDTO: () => Eu,
  ObserverDTO: () => uu,
  ParticipantDTO: () => nu,
  ParticipantDto: () => Ou,
  PerksDTO: () => iu,
  QueuesDataDragonDTO: () => Yu,
  RateLimitDto: () => lu,
  RealmDTO: () => $u,
  RealmNTO: () => mu,
  SpectatorNotAvailableDTO: () => ru,
  SummonerLeagueDto: () => Gu,
  SummonerV4DTO: () => zn,
  TFTChampionsDTO: () => tu,
  TFTHexesDto: () => eu,
  TFTItemsDTO: () => kn,
  TFTTraitsDTO: () => xn,
  ThirdPartyCodeDTO: () => Kn,
  TraitDto: () => fu,
  UnitDto: () => _u,
  __esModule: () => Vn,
  default: () => ra,
});
var cn = Or(fr());
S(T, Or(fr()));
var {
    __esModule: Vn,
    ThirdPartyCodeDTO: Kn,
    SummonerV4DTO: zn,
    LolStatusUpdateDTO: Jn,
    LolStatusStatusDTO: Qn,
    LolStatusPlatformDataDTO: Yn,
    LolStatusContentDTO: Wn,
    LolStatusIncidentsUpdateTranslations: Xn,
    LolStatusServiceStatusIncident: Zn,
    LolStatusServiceIncidentsUpdate: $n,
    LolStatusServiceDTO: mn,
    LolStatusDTO: Nn,
    TFTTraitsDTO: xn,
    TFTItemsDTO: kn,
    TFTHexesDto: eu,
    TFTChampionsDTO: tu,
    SpectatorNotAvailableDTO: ru,
    PerksDTO: iu,
    ParticipantDTO: nu,
    ObserverDTO: uu,
    GameCustomizationObjectDTO: au,
    FeaturedGamesDTO: ou,
    FeaturedGameInfo: cu,
    CurrentGameParticipantDTO: su,
    CurrentGameInfoDTO: du,
    RateLimitDto: lu,
    UnitDto: _u,
    TraitDto: fu,
    ParticipantDto: Ou,
    MetadataDto: vu,
    MatchTFTDTO: bu,
    InfoDto: Mu,
    CompanionDto: Pu,
    MatchQueryDTO: hu,
    MatchTimeLineFrameDto: yu,
    MatchTimelineDto: ju,
    MatchPositionDto: Du,
    MatchParticipantFrameDto: pu,
    MatchEventDto: gu,
    MatchListingMatches: Tu,
    MatchListingDto: Su,
    MatchV5TimelineDTOs: qu,
    BannedChampion: wu,
    MatchTeamsDto: Cu,
    MatchParticipantsTimelineDto: Ru,
    MatchParticipantsStatsDto: Au,
    MatchParticipantsRuneDto: Bu,
    MatchParticipantsMasteryDto: Lu,
    MatchParticipantsIdentitiesPlayerDto: Uu,
    MatchParticipantsIdentitiesDto: Hu,
    MatchParticipantDTO: Iu,
    MatchDto: Fu,
    SummonerLeagueDto: Gu,
    MiniSeriesDTO: Eu,
    LeagueListDTO: Vu,
    LeagueItemDTO: Ku,
    LeagueEntryDTO: zu,
    GameModesDataDragonDTO: Ju,
    MapsDataDragonDTO: Qu,
    QueuesDataDragonDTO: Yu,
    ChampionsDataDragon: Wu,
    ChampionsDataDragonDetailsSolo: Xu,
    ChampionsDataDragonDetails: Zu,
    RealmDTO: $u,
    RealmNTO: mu,
    ChampionsScoreDTO: Nu,
    ChampionRotationV3DTO: xu,
    ChampionMasteryDTO: ku,
    ApiResponseDTO: ea,
  } = cn,
  { default: on, ...ta } = cn,
  ra = on !== void 0 ? on : ta;
export {
  $n as LolStatusServiceIncidentsUpdate,
  $u as RealmDTO,
  _u as UnitDto,
  Au as MatchParticipantsStatsDto,
  au as GameCustomizationObjectDTO,
  Bu as MatchParticipantsRuneDto,
  bu as MatchTFTDTO,
  Cu as MatchTeamsDto,
  cu as FeaturedGameInfo,
  Du as MatchPositionDto,
  du as CurrentGameInfoDTO,
  ea as ApiResponseDTO,
  Eu as MiniSeriesDTO,
  eu as TFTHexesDto,
  Fu as MatchDto,
  fu as TraitDto,
  Gu as SummonerLeagueDto,
  gu as MatchEventDto,
  Hu as MatchParticipantsIdentitiesDto,
  hu as MatchQueryDTO,
  Iu as MatchParticipantDTO,
  iu as PerksDTO,
  Jn as LolStatusUpdateDTO,
  Ju as GameModesDataDragonDTO,
  ju as MatchTimelineDto,
  Kn as ThirdPartyCodeDTO,
  kn as TFTItemsDTO,
  Ku as LeagueItemDTO,
  ku as ChampionMasteryDTO,
  Lu as MatchParticipantsMasteryDto,
  lu as RateLimitDto,
  mn as LolStatusServiceDTO,
  Mu as InfoDto,
  mu as RealmNTO,
  Nn as LolStatusDTO,
  Nu as ChampionsScoreDTO,
  nu as ParticipantDTO,
  Ou as ParticipantDto,
  ou as FeaturedGamesDTO,
  Pu as CompanionDto,
  pu as MatchParticipantFrameDto,
  Qn as LolStatusStatusDTO,
  Qu as MapsDataDragonDTO,
  qu as MatchV5TimelineDTOs,
  ra as default,
  Ru as MatchParticipantsTimelineDto,
  ru as SpectatorNotAvailableDTO,
  Su as MatchListingDto,
  su as CurrentGameParticipantDTO,
  Tu as MatchListingMatches,
  tu as TFTChampionsDTO,
  Uu as MatchParticipantsIdentitiesPlayerDto,
  uu as ObserverDTO,
  Vn as __esModule,
  Vu as LeagueListDTO,
  vu as MetadataDto,
  Wn as LolStatusContentDTO,
  Wu as ChampionsDataDragon,
  wu as BannedChampion,
  Xn as LolStatusIncidentsUpdateTranslations,
  xn as TFTTraitsDTO,
  Xu as ChampionsDataDragonDetailsSolo,
  xu as ChampionRotationV3DTO,
  Yn as LolStatusPlatformDataDTO,
  Yu as QueuesDataDragonDTO,
  yu as MatchTimeLineFrameDto,
  Zn as LolStatusServiceStatusIncident,
  zn as SummonerV4DTO,
  Zu as ChampionsDataDragonDetails,
  zu as LeagueEntryDTO,
};
//# sourceMappingURL=models-dto.js.map
