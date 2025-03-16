/* esm.sh - proxy-from-env@1.1.0 */
import __Process$ from "node:process";
import * as __0$ from "node:url";
var require = (n) => {
  const e = (m) => typeof m.default < "u" ? m.default : m,
    c = (m) => Object.assign({ __esModule: true }, m);
  switch (n) {
    case "node:url":
      return e(__0$);
    default:
      console.error('module "' + n + '" not found');
      return null;
  }
};
var l = Object.create;
var f = Object.defineProperty;
var g = Object.getOwnPropertyDescriptor;
var h = Object.getOwnPropertyNames;
var v = Object.getPrototypeOf, x = Object.prototype.hasOwnProperty;
var y =
  ((r) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
      ? new Proxy(r, { get: (t, e) => (typeof require < "u" ? require : t)[e] })
      : r)(function (r) {
      if (typeof require < "u") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + r + '" is not supported');
    });
var d = (r, t) => () => (t || r((t = { exports: {} }).exports, t), t.exports);
var _ = (r, t, e, n) => {
  if (t && typeof t == "object" || typeof t == "function") {
    for (let o of h(t)) {
      !x.call(r, o) && o !== e && f(r, o, {
        get: () => t[o],
        enumerable: !(n = g(t, o)) || n.enumerable,
      });
    }
  }
  return r;
};
var P = (
  r,
  t,
  e,
) => (e = r != null ? l(v(r)) : {},
  _(
    t || !r || !r.__esModule
      ? f(e, "default", { value: r, enumerable: !0 })
      : e,
    r,
  ));
var c = d((u) => {
  "use strict";
  var m = y("node:url").parse,
    U = { ftp: 21, gopher: 70, http: 80, https: 443, ws: 80, wss: 443 },
    O = String.prototype.endsWith || function (r) {
      return r.length <= this.length &&
        this.indexOf(r, this.length - r.length) !== -1;
    };
  function w(r) {
    var t = typeof r == "string" ? m(r) : r || {},
      e = t.protocol,
      n = t.host,
      o = t.port;
    if (
      typeof n != "string" || !n || typeof e != "string" ||
      (e = e.split(":", 1)[0],
        n = n.replace(/:\d*$/, ""),
        o = parseInt(o) || U[e] || 0,
        !F(n, o))
    ) return "";
    var s = p("npm_config_" + e + "_proxy") || p(e + "_proxy") ||
      p("npm_config_proxy") || p("all_proxy");
    return s && s.indexOf("://") === -1 && (s = e + "://" + s), s;
  }
  function F(r, t) {
    var e = (p("npm_config_no_proxy") || p("no_proxy")).toLowerCase();
    return e
      ? e === "*" ? !1 : e.split(/[,\s]/).every(function (n) {
        if (!n) return !0;
        var o = n.match(/^(.+):(\d+)$/),
          s = o ? o[1] : n,
          a = o ? parseInt(o[2]) : 0;
        return a && a !== t
          ? !0
          : /^[.*]/.test(s)
          ? (s.charAt(0) === "*" && (s = s.slice(1)), !O.call(r, s))
          : r !== s;
      })
      : !0;
  }
  function p(r) {
    return __Process$.env[r.toLowerCase()] || __Process$.env[r.toUpperCase()] ||
      "";
  }
  u.getProxyForUrl = w;
});
var i = P(c()), { getProxyForUrl: L } = i, j = i.default ?? i;
export { j as default, L as getProxyForUrl };
//# sourceMappingURL=proxy-from-env.mjs.map
