/* esm.sh - debug@4.4.0 */
import __Process$ from "node:process";
import * as __0$ from "node:tty";
import * as __1$ from "node:util";
import * as __2$ from "/supports-color?target=denonext";
import * as __3$ from "/ms@^2.1.3?target=denonext";
var require = (n) => {
  const e = (m) => typeof m.default < "u" ? m.default : m,
    c = (m) => Object.assign({ __esModule: true }, m);
  switch (n) {
    case "node:tty":
      return e(__0$);
    case "node:util":
      return e(__1$);
    case "supports-color":
      return c(__2$);
    case "ms":
      return e(__3$);
    default:
      console.error('module "' + n + '" not found');
      return null;
  }
};
var J = Object.create;
var k = Object.defineProperty;
var P = Object.getOwnPropertyDescriptor;
var T = Object.getOwnPropertyNames;
var W = Object.getPrototypeOf, Z = Object.prototype.hasOwnProperty;
var h =
  ((e) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
      ? new Proxy(e, { get: (o, t) => (typeof require < "u" ? require : o)[t] })
      : e)(function (e) {
      if (typeof require < "u") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + e + '" is not supported');
    });
var b = (e, o) => () => (o || e((o = { exports: {} }).exports, o), o.exports);
var M = (e, o, t, s) => {
  if (o && typeof o == "object" || typeof o == "function") {
    for (let u of T(o)) {
      !Z.call(e, u) && u !== t && k(e, u, {
        get: () => o[u],
        enumerable: !(s = P(o, u)) || s.enumerable,
      });
    }
  }
  return e;
};
var H = (
  e,
  o,
  t,
) => (t = e != null ? J(W(e)) : {},
  M(
    o || !e || !e.__esModule
      ? k(t, "default", { value: e, enumerable: !0 })
      : t,
    e,
  ));
var A = b((ae, D) => {
  function K(e) {
    t.debug = t,
      t.default = t,
      t.coerce = S,
      t.disable = z,
      t.enable = u,
      t.enabled = U,
      t.humanize = h("ms"),
      t.destroy = G,
      Object.keys(e).forEach((n) => {
        t[n] = e[n];
      }),
      t.names = [],
      t.skips = [],
      t.formatters = {};
    function o(n) {
      let r = 0;
      for (let i = 0; i < n.length; i++) {
        r = (r << 5) - r + n.charCodeAt(i), r |= 0;
      }
      return t.colors[Math.abs(r) % t.colors.length];
    }
    t.selectColor = o;
    function t(n) {
      let r, i = null, l, F;
      function C(...f) {
        if (!C.enabled) return;
        let p = C, g = Number(new Date()), L = g - (r || g);
        p.diff = L,
          p.prev = r,
          p.curr = g,
          r = g,
          f[0] = t.coerce(f[0]),
          typeof f[0] != "string" && f.unshift("%O");
        let m = 0;
        f[0] = f[0].replace(/%([a-zA-Z%])/g, (O, N) => {
          if (O === "%%") return "%";
          m++;
          let j = t.formatters[N];
          if (typeof j == "function") {
            let $ = f[m];
            O = j.call(p, $), f.splice(m, 1), m--;
          }
          return O;
        }),
          t.formatArgs.call(p, f),
          (p.log || t.log).apply(p, f);
      }
      return C.namespace = n,
        C.useColors = t.useColors(),
        C.color = t.selectColor(n),
        C.extend = s,
        C.destroy = t.destroy,
        Object.defineProperty(C, "enabled", {
          enumerable: !0,
          configurable: !1,
          get: () =>
            i !== null
              ? i
              : (l !== t.namespaces && (l = t.namespaces, F = t.enabled(n)), F),
          set: (f) => {
            i = f;
          },
        }),
        typeof t.init == "function" && t.init(C),
        C;
    }
    function s(n, r) {
      let i = t(this.namespace + (typeof r > "u" ? ":" : r) + n);
      return i.log = this.log, i;
    }
    function u(n) {
      t.save(n), t.namespaces = n, t.names = [], t.skips = [];
      let r = (typeof n == "string" ? n : "").trim().replace(" ", ",").split(
        ",",
      ).filter(Boolean);
      for (let i of r) {
        i[0] === "-" ? t.skips.push(i.slice(1)) : t.names.push(i);
      }
    }
    function d(n, r) {
      let i = 0, l = 0, F = -1, C = 0;
      for (; i < n.length;) {
        if (l < r.length && (r[l] === n[i] || r[l] === "*")) {
          r[l] === "*" ? (F = l, C = i, l++) : (i++, l++);
        } else if (F !== -1) l = F + 1, C++, i = C;
        else return !1;
      }
      for (; l < r.length && r[l] === "*";) l++;
      return l === r.length;
    }
    function z() {
      let n = [...t.names, ...t.skips.map((r) => "-" + r)].join(",");
      return t.enable(""), n;
    }
    function U(n) {
      for (let r of t.skips) if (d(n, r)) return !1;
      for (let r of t.names) if (d(n, r)) return !0;
      return !1;
    }
    function S(n) {
      return n instanceof Error ? n.stack || n.message : n;
    }
    function G() {
      console.warn(
        "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
      );
    }
    return t.enable(t.load()), t;
  }
  D.exports = K;
});
var E = b((a, y) => {
  a.formatArgs = R;
  a.save = V;
  a.load = X;
  a.useColors = Q;
  a.storage = Y();
  a.destroy = (() => {
    let e = !1;
    return () => {
      e ||
        (e = !0,
          console.warn(
            "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
          ));
    };
  })();
  a.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33",
  ];
  function Q() {
    if (
      typeof globalThis < "u" && globalThis.process &&
      (globalThis.process.type === "renderer" || globalThis.process.__nwjs)
    ) return !0;
    if (
      typeof navigator < "u" && navigator.userAgent &&
      navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
    ) return !1;
    let e;
    return typeof document < "u" && document.documentElement &&
        document.documentElement.style &&
        document.documentElement.style.WebkitAppearance ||
      typeof globalThis < "u" && globalThis.console &&
        (globalThis.console.firebug ||
          globalThis.console.exception && globalThis.console.table) ||
      typeof navigator < "u" && navigator.userAgent &&
        (e = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) &&
        parseInt(e[1], 10) >= 31 ||
      typeof navigator < "u" && navigator.userAgent &&
        navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function R(e) {
    if (
      e[0] = (this.useColors ? "%c" : "") + this.namespace +
        (this.useColors ? " %c" : " ") + e[0] + (this.useColors ? "%c " : " ") +
        "+" + y.exports.humanize(this.diff), !this.useColors
    ) return;
    let o = "color: " + this.color;
    e.splice(1, 0, o, "color: inherit");
    let t = 0, s = 0;
    e[0].replace(/%[a-zA-Z%]/g, (u) => {
      u !== "%%" && (t++, u === "%c" && (s = t));
    }), e.splice(s, 0, o);
  }
  a.log = console.debug || console.log || (() => {});
  function V(e) {
    try {
      e ? a.storage.setItem("debug", e) : a.storage.removeItem("debug");
    } catch {}
  }
  function X() {
    let e;
    try {
      e = a.storage.getItem("debug");
    } catch {}
    return !e && typeof __Process$ < "u" && "env" in __Process$ &&
      (e = __Process$.env.DEBUG),
      e;
  }
  function Y() {
    try {
      return localStorage;
    } catch {}
  }
  y.exports = A()(a);
  var { formatters: ee } = y.exports;
  ee.j = function (e) {
    try {
      return JSON.stringify(e);
    } catch (o) {
      return "[UnexpectedJSONParseError]: " + o.message;
    }
  };
});
var q = b((c, v) => {
  var te = h("node:tty"), w = h("node:util");
  c.init = le;
  c.log = se;
  c.formatArgs = ne;
  c.save = ie;
  c.load = ce;
  c.useColors = oe;
  c.destroy = w.deprecate(
    () => {},
    "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
  );
  c.colors = [6, 2, 3, 4, 5, 1];
  try {
    let e = h("supports-color");
    e && (e.stderr || e).level >= 2 &&
      (c.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221,
      ]);
  } catch {}
  c.inspectOpts = Object.keys(__Process$.env).filter((e) => /^debug_/i.test(e))
    .reduce((e, o) => {
      let t = o.substring(6).toLowerCase().replace(
          /_([a-z])/g,
          (u, d) => d.toUpperCase(),
        ),
        s = __Process$.env[o];
      return /^(yes|on|true|enabled)$/i.test(s)
        ? s = !0
        : /^(no|off|false|disabled)$/i.test(s)
        ? s = !1
        : s === "null"
        ? s = null
        : s = Number(s),
        e[t] = s,
        e;
    }, {});
  function oe() {
    return "colors" in c.inspectOpts
      ? !!c.inspectOpts.colors
      : te.isatty(__Process$.stderr.fd);
  }
  function ne(e) {
    let { namespace: o, useColors: t } = this;
    if (t) {
      let s = this.color,
        u = "\x1B[3" + (s < 8 ? s : "8;5;" + s),
        d = `  ${u};1m${o} \x1B[0m`;
      e[0] = d + e[0].split(`
`).join(
        `
` + d,
      ), e.push(u + "m+" + v.exports.humanize(this.diff) + "\x1B[0m");
    } else e[0] = re() + o + " " + e[0];
  }
  function re() {
    return c.inspectOpts.hideDate ? "" : new Date().toISOString() + " ";
  }
  function se(...e) {
    return __Process$.stderr.write(
      w.formatWithOptions(c.inspectOpts, ...e) + `
`,
    );
  }
  function ie(e) {
    e ? __Process$.env.DEBUG = e : delete __Process$.env.DEBUG;
  }
  function ce() {
    return __Process$.env.DEBUG;
  }
  function le(e) {
    e.inspectOpts = {};
    let o = Object.keys(c.inspectOpts);
    for (let t = 0; t < o.length; t++) {
      e.inspectOpts[o[t]] = c.inspectOpts[o[t]];
    }
  }
  v.exports = A()(c);
  var { formatters: B } = v.exports;
  B.o = function (e) {
    return this.inspectOpts.colors = this.useColors,
      w.inspect(e, this.inspectOpts).split(`
`).map((o) => o.trim()).join(" ");
  };
  B.O = function (e) {
    return this.inspectOpts.colors = this.useColors,
      w.inspect(e, this.inspectOpts);
  };
});
var _ = b((fe, I) => {
  typeof __Process$ > "u" || __Process$.type === "renderer" ||
    __Process$.browser === !0 || __Process$.__nwjs
    ? I.exports = E()
    : I.exports = q();
});
var x = H(_()),
  {
    formatArgs: de,
    save: pe,
    load: Fe,
    useColors: ge,
    storage: me,
    destroy: he,
    colors: be,
    log: ye,
  } = x,
  we = x.default ?? x;
export {
  be as colors,
  de as formatArgs,
  Fe as load,
  ge as useColors,
  he as destroy,
  me as storage,
  pe as save,
  we as default,
  ye as log,
};
//# sourceMappingURL=debug.mjs.map
