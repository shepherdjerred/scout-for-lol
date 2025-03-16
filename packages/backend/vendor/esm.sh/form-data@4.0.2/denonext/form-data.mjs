/* esm.sh - form-data@4.0.2 */
import __Process$ from "node:process";
import { Buffer as __Buffer$ } from "node:buffer";
import * as __0$ from "/combined-stream@^1.0.8?target=denonext";
import * as __1$ from "node:util";
import * as __2$ from "node:path";
import * as __3$ from "node:http";
import * as __4$ from "node:https";
import * as __5$ from "node:url";
import * as __6$ from "node:fs";
import * as __7$ from "node:stream";
import * as __8$ from "/mime-types@^2.1.12?target=denonext";
import * as __9$ from "/asynckit@^0.4.0?target=denonext";
var __a$ = (() => {
  var r = (e, t) =>
    Object.defineProperty(e, Symbol.toStringTag, {
      value: t,
      configurable: !0,
    });
  return { default: r };
})();
var require = (n) => {
  const e = (m) => typeof m.default < "u" ? m.default : m,
    c = (m) => Object.assign({ __esModule: true }, m);
  switch (n) {
    case "combined-stream":
      return e(__0$);
    case "node:util":
      return e(__1$);
    case "node:path":
      return e(__2$);
    case "node:http":
      return e(__3$);
    case "node:https":
      return e(__4$);
    case "node:url":
      return e(__5$);
    case "node:fs":
      return e(__6$);
    case "node:stream":
      return e(__7$);
    case "mime-types":
      return e(__8$);
    case "asynckit":
      return e(__9$);
    case "npm:es-set-tostringtag":
      return e(__a$);
    default:
      console.error('module "' + n + '" not found');
      return null;
  }
};
var w = Object.create;
var d = Object.defineProperty;
var O = Object.getOwnPropertyDescriptor;
var A = Object.getOwnPropertyNames;
var P = Object.getPrototypeOf, j = Object.prototype.hasOwnProperty;
var s =
  ((t) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
      ? new Proxy(t, { get: (e, r) => (typeof require < "u" ? require : e)[r] })
      : t)(function (t) {
      if (typeof require < "u") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + t + '" is not supported');
    });
var _ = (t, e) => () => (e || t((e = { exports: {} }).exports, e), e.exports);
var q = (t, e, r, o) => {
  if (e && typeof e == "object" || typeof e == "function") {
    for (let i of A(e)) {
      !j.call(t, i) && i !== r && d(t, i, {
        get: () => e[i],
        enumerable: !(o = O(e, i)) || o.enumerable,
      });
    }
  }
  return t;
};
var v = (
  t,
  e,
  r,
) => (r = t != null ? w(P(t)) : {},
  q(
    e || !t || !t.__esModule
      ? d(r, "default", { value: t, enumerable: !0 })
      : r,
    t,
  ));
var L = _((S, m) => {
  m.exports = function (t, e) {
    return Object.keys(e).forEach(function (r) {
      t[r] = t[r] || e[r];
    }),
      t;
  };
});
var E = _((U, B) => {
  var l = s("combined-stream"),
    N = s("node:util"),
    y = s("node:path"),
    C = s("node:http"),
    K = s("node:https"),
    D = s("node:url").parse,
    I = s("node:fs"),
    M = s("node:stream").Stream,
    c = s("mime-types"),
    R = s("asynckit"),
    k = s("npm:es-set-tostringtag"),
    g = L();
  B.exports = n;
  N.inherits(n, l);
  function n(t) {
    if (!(this instanceof n)) return new n(t);
    this._overheadLength = 0,
      this._valueLength = 0,
      this._valuesToMeasure = [],
      l.call(this),
      t = t || {};
    for (var e in t) this[e] = t[e];
  }
  n.LINE_BREAK = `\r
`;
  n.DEFAULT_CONTENT_TYPE = "application/octet-stream";
  n.prototype.append = function (t, e, r) {
    r = r || {}, typeof r == "string" && (r = { filename: r });
    var o = l.prototype.append.bind(this);
    if (typeof e == "number" && (e = "" + e), Array.isArray(e)) {
      this._error(new Error("Arrays are not supported."));
      return;
    }
    var i = this._multiPartHeader(t, e, r), h = this._multiPartFooter();
    o(i), o(e), o(h), this._trackLength(i, e, r);
  };
  n.prototype._trackLength = function (t, e, r) {
    var o = 0;
    r.knownLength != null
      ? o += +r.knownLength
      : __Buffer$.isBuffer(e)
      ? o = e.length
      : typeof e == "string" && (o = __Buffer$.byteLength(e)),
      this._valueLength += o,
      this._overheadLength += __Buffer$.byteLength(t) + n.LINE_BREAK.length,
      !(!e ||
        !e.path &&
          !(e.readable &&
            Object.prototype.hasOwnProperty.call(e, "httpVersion")) &&
          !(e instanceof M)) &&
      (r.knownLength || this._valuesToMeasure.push(e));
  };
  n.prototype._lengthRetriever = function (t, e) {
    Object.prototype.hasOwnProperty.call(t, "fd")
      ? t.end != null && t.end != 1 / 0 && t.start != null
        ? e(null, t.end + 1 - (t.start ? t.start : 0))
        : I.stat(t.path, function (r, o) {
          var i;
          if (r) {
            e(r);
            return;
          }
          i = o.size - (t.start ? t.start : 0), e(null, i);
        })
      : Object.prototype.hasOwnProperty.call(t, "httpVersion")
      ? e(null, +t.headers["content-length"])
      : Object.prototype.hasOwnProperty.call(t, "httpModule")
      ? (t.on("response", function (r) {
        t.pause(), e(null, +r.headers["content-length"]);
      }),
        t.resume())
      : e("Unknown stream");
  };
  n.prototype._multiPartHeader = function (t, e, r) {
    if (typeof r.header == "string") return r.header;
    var o = this._getContentDisposition(e, r),
      i = this._getContentType(e, r),
      h = "",
      f = {
        "Content-Disposition": ["form-data", 'name="' + t + '"'].concat(
          o || [],
        ),
        "Content-Type": [].concat(i || []),
      };
    typeof r.header == "object" && g(f, r.header);
    var a;
    for (var p in f) {
      if (Object.prototype.hasOwnProperty.call(f, p)) {
        if (a = f[p], a == null) continue;
        Array.isArray(a) || (a = [a]),
          a.length && (h += p + ": " + a.join("; ") + n.LINE_BREAK);
      }
    }
    return "--" + this.getBoundary() + n.LINE_BREAK + h + n.LINE_BREAK;
  };
  n.prototype._getContentDisposition = function (t, e) {
    var r, o;
    return typeof e.filepath == "string"
      ? r = y.normalize(e.filepath).replace(/\\/g, "/")
      : e.filename || t.name || t.path
      ? r = y.basename(e.filename || t.name || t.path)
      : t.readable && Object.prototype.hasOwnProperty.call(t, "httpVersion") &&
        (r = y.basename(t.client._httpMessage.path || "")),
      r && (o = 'filename="' + r + '"'),
      o;
  };
  n.prototype._getContentType = function (t, e) {
    var r = e.contentType;
    return !r && t.name && (r = c.lookup(t.name)),
      !r && t.path && (r = c.lookup(t.path)),
      !r && t.readable &&
      Object.prototype.hasOwnProperty.call(t, "httpVersion") &&
      (r = t.headers["content-type"]),
      !r && (e.filepath || e.filename) &&
      (r = c.lookup(e.filepath || e.filename)),
      !r && typeof t == "object" && (r = n.DEFAULT_CONTENT_TYPE),
      r;
  };
  n.prototype._multiPartFooter = function () {
    return function (t) {
      var e = n.LINE_BREAK, r = this._streams.length === 0;
      r && (e += this._lastBoundary()), t(e);
    }.bind(this);
  };
  n.prototype._lastBoundary = function () {
    return "--" + this.getBoundary() + "--" + n.LINE_BREAK;
  };
  n.prototype.getHeaders = function (t) {
    var e,
      r = {
        "content-type": "multipart/form-data; boundary=" + this.getBoundary(),
      };
    for (e in t) {
      Object.prototype.hasOwnProperty.call(t, e) && (r[e.toLowerCase()] = t[e]);
    }
    return r;
  };
  n.prototype.setBoundary = function (t) {
    this._boundary = t;
  };
  n.prototype.getBoundary = function () {
    return this._boundary || this._generateBoundary(), this._boundary;
  };
  n.prototype.getBuffer = function () {
    for (
      var t = new __Buffer$.alloc(0),
        e = this.getBoundary(),
        r = 0,
        o = this._streams.length;
      r < o;
      r++
    ) {
      typeof this._streams[r] != "function" &&
        (__Buffer$.isBuffer(this._streams[r])
          ? t = __Buffer$.concat([t, this._streams[r]])
          : t = __Buffer$.concat([t, __Buffer$.from(this._streams[r])]),
          (typeof this._streams[r] != "string" ||
            this._streams[r].substring(2, e.length + 2) !== e) &&
          (t = __Buffer$.concat([t, __Buffer$.from(n.LINE_BREAK)])));
    }
    return __Buffer$.concat([t, __Buffer$.from(this._lastBoundary())]);
  };
  n.prototype._generateBoundary = function () {
    for (var t = "--------------------------", e = 0; e < 24; e++) {
      t += Math.floor(Math.random() * 10).toString(16);
    }
    this._boundary = t;
  };
  n.prototype.getLengthSync = function () {
    var t = this._overheadLength + this._valueLength;
    return this._streams.length && (t += this._lastBoundary().length),
      this.hasKnownLength() ||
      this._error(
        new Error("Cannot calculate proper length in synchronous way."),
      ),
      t;
  };
  n.prototype.hasKnownLength = function () {
    var t = !0;
    return this._valuesToMeasure.length && (t = !1), t;
  };
  n.prototype.getLength = function (t) {
    var e = this._overheadLength + this._valueLength;
    if (
      this._streams.length && (e += this._lastBoundary().length),
        !this._valuesToMeasure.length
    ) {
      __Process$.nextTick(t.bind(this, null, e));
      return;
    }
    R.parallel(this._valuesToMeasure, this._lengthRetriever, function (r, o) {
      if (r) {
        t(r);
        return;
      }
      o.forEach(function (i) {
        e += i;
      }), t(null, e);
    });
  };
  n.prototype.submit = function (t, e) {
    var r, o, i = { method: "post" };
    return typeof t == "string"
      ? (t = D(t),
        o = g({
          port: t.port,
          path: t.pathname,
          host: t.hostname,
          protocol: t.protocol,
        }, i))
      : (o = g(t, i), o.port || (o.port = o.protocol == "https:" ? 443 : 80)),
      o.headers = this.getHeaders(t.headers),
      o.protocol == "https:" ? r = K.request(o) : r = C.request(o),
      this.getLength(function (h, f) {
        if (h && h !== "Unknown stream") {
          this._error(h);
          return;
        }
        if (f && r.setHeader("Content-Length", f), this.pipe(r), e) {
          var a,
            p = function (T, b) {
              return r.removeListener("error", p),
                r.removeListener("response", a),
                e.call(this, T, b);
            };
          a = p.bind(this, null), r.on("error", p), r.on("response", a);
        }
      }.bind(this)),
      r;
  };
  n.prototype._error = function (t) {
    this.error || (this.error = t, this.pause(), this.emit("error", t));
  };
  n.prototype.toString = function () {
    return "[object FormData]";
  };
  k(n, "FormData");
});
var u = v(E()),
  { LINE_BREAK: x, DEFAULT_CONTENT_TYPE: H } = u,
  V = u.default ?? u;
export { H as DEFAULT_CONTENT_TYPE, V as default, x as LINE_BREAK };
//# sourceMappingURL=form-data.mjs.map
