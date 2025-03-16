/* esm.sh - delayed-stream@1.0.0 */
import * as __0$ from "node:stream";
import * as __1$ from "node:util";
var require = (n) => {
  const e = (m) => typeof m.default < "u" ? m.default : m,
    c = (m) => Object.assign({ __esModule: true }, m);
  switch (n) {
    case "node:stream":
      return e(__0$);
    case "node:util":
      return e(__1$);
    default:
      console.error('module "' + n + '" not found');
      return null;
  }
};
var d = Object.create;
var u = Object.defineProperty;
var c = Object.getOwnPropertyDescriptor;
var m = Object.getOwnPropertyNames;
var l = Object.getPrototypeOf, y = Object.prototype.hasOwnProperty;
var h =
  ((e) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
      ? new Proxy(e, { get: (t, r) => (typeof require < "u" ? require : t)[r] })
      : e)(function (e) {
      if (typeof require < "u") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + e + '" is not supported');
    });
var S = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var x = (e, t, r, s) => {
  if (t && typeof t == "object" || typeof t == "function") {
    for (let i of m(t)) {
      !y.call(e, i) && i !== r && u(e, i, {
        get: () => t[i],
        enumerable: !(s = c(t, i)) || s.enumerable,
      });
    }
  }
  return e;
};
var E = (
  e,
  t,
  r,
) => (r = e != null ? d(l(e)) : {},
  x(
    t || !e || !e.__esModule
      ? u(r, "default", { value: e, enumerable: !0 })
      : r,
    e,
  ));
var p = S((b, f) => {
  var o = h("node:stream").Stream, _ = h("node:util");
  f.exports = a;
  function a() {
    this.source = null,
      this.dataSize = 0,
      this.maxDataSize = 1024 * 1024,
      this.pauseStream = !0,
      this._maxDataSizeExceeded = !1,
      this._released = !1,
      this._bufferedEvents = [];
  }
  _.inherits(a, o);
  a.create = function (e, t) {
    var r = new this();
    t = t || {};
    for (var s in t) r[s] = t[s];
    r.source = e;
    var i = e.emit;
    return e.emit = function () {
      return r._handleEmit(arguments), i.apply(e, arguments);
    },
      e.on("error", function () {}),
      r.pauseStream && e.pause(),
      r;
  };
  Object.defineProperty(a.prototype, "readable", {
    configurable: !0,
    enumerable: !0,
    get: function () {
      return this.source.readable;
    },
  });
  a.prototype.setEncoding = function () {
    return this.source.setEncoding.apply(this.source, arguments);
  };
  a.prototype.resume = function () {
    this._released || this.release(), this.source.resume();
  };
  a.prototype.pause = function () {
    this.source.pause();
  };
  a.prototype.release = function () {
    this._released = !0,
      this._bufferedEvents.forEach(function (e) {
        this.emit.apply(this, e);
      }.bind(this)),
      this._bufferedEvents = [];
  };
  a.prototype.pipe = function () {
    var e = o.prototype.pipe.apply(this, arguments);
    return this.resume(), e;
  };
  a.prototype._handleEmit = function (e) {
    if (this._released) {
      this.emit.apply(this, e);
      return;
    }
    e[0] === "data" &&
    (this.dataSize += e[1].length, this._checkIfMaxDataSizeExceeded()),
      this._bufferedEvents.push(e);
  };
  a.prototype._checkIfMaxDataSizeExceeded = function () {
    if (!this._maxDataSizeExceeded && !(this.dataSize <= this.maxDataSize)) {
      this._maxDataSizeExceeded = !0;
      var e = "DelayedStream#maxDataSize of " + this.maxDataSize +
        " bytes exceeded.";
      this.emit("error", new Error(e));
    }
  };
});
var n = E(p()), { create: v } = n, D = n.default ?? n;
export { D as default, v as create };
//# sourceMappingURL=delayed-stream.mjs.map
