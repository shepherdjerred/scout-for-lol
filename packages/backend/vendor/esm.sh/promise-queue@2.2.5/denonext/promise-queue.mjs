/* esm.sh - promise-queue@2.2.5 */
import __Process$ from "node:process";
var l = Object.create;
var d = Object.defineProperty;
var E = Object.getOwnPropertyDescriptor;
var Q = Object.getOwnPropertyNames;
var v = Object.getPrototypeOf, _ = Object.prototype.hasOwnProperty;
var h =
  ((n) =>
    typeof require < "u"
      ? require
      : typeof Proxy < "u"
      ? new Proxy(n, { get: (t, o) => (typeof require < "u" ? require : t)[o] })
      : n)(function (n) {
      if (typeof require < "u") return require.apply(this, arguments);
      throw Error('Dynamic require of "' + n + '" is not supported');
    });
var f = (n, t) => () => (t || n((t = { exports: {} }).exports, t), t.exports);
var j = (n, t, o, u) => {
  if (t && typeof t == "object" || typeof t == "function") {
    for (let e of Q(t)) {
      !_.call(n, e) && e !== o && d(n, e, {
        get: () => t[e],
        enumerable: !(u = E(t, e)) || u.enumerable,
      });
    }
  }
  return n;
};
var w = (
  n,
  t,
  o,
) => (o = n != null ? l(v(n)) : {},
  j(
    t || !n || !n.__esModule
      ? d(o, "default", { value: n, enumerable: !0 })
      : o,
    n,
  ));
var m = f(() => {});
var y = f((g, s) => {
  (function (n, t) {
    "use strict";
    typeof s == "object" && s.exports && typeof h == "function"
      ? s.exports = t()
      : typeof define == "function" && typeof define.amd == "object"
      ? define(t)
      : n.Queue = t();
  })(g, function () {
    "use strict";
    var n = typeof Promise < "u" ? Promise : function () {
        return {
          then: function () {
            throw new Error("Queue.configure() before use Queue");
          },
        };
      },
      t = function () {},
      o = function (e) {
        return e && typeof e.then == "function" ? e : new n(function (i) {
          i(e);
        });
      };
    function u(e, i, r) {
      this.options = r = r || {},
        this.pendingPromises = 0,
        this.maxPendingPromises = typeof e < "u" ? e : 1 / 0,
        this.maxQueuedPromises = typeof i < "u" ? i : 1 / 0,
        this.queue = [];
    }
    return u.configure = function (e) {
      n = e;
    },
      u.prototype.add = function (e) {
        var i = this;
        return new n(function (r, c, q) {
          if (i.queue.length >= i.maxQueuedPromises) {
            c(new Error("Queue limit reached"));
            return;
          }
          i.queue.push({
            promiseGenerator: e,
            resolve: r,
            reject: c,
            notify: q || t,
          }), i._dequeue();
        });
      },
      u.prototype.getPendingLength = function () {
        return this.pendingPromises;
      },
      u.prototype.getQueueLength = function () {
        return this.queue.length;
      },
      u.prototype._dequeue = function () {
        var e = this;
        if (this.pendingPromises >= this.maxPendingPromises) return !1;
        var i = this.queue.shift();
        if (!i) return this.options.onEmpty && this.options.onEmpty(), !1;
        try {
          this.pendingPromises++,
            o(i.promiseGenerator()).then(function (r) {
              e.pendingPromises--, i.resolve(r), e._dequeue();
            }, function (r) {
              e.pendingPromises--, i.reject(r), e._dequeue();
            }, function (r) {
              i.notify(r);
            });
        } catch (r) {
          e.pendingPromises--, i.reject(r), e._dequeue();
        }
        return !0;
      },
      u;
  });
});
var P = f((L, a) => {
  a.exports = __Process$.env.PROMISE_QUEUE_COVERAGE ? m() : y();
});
var p = w(P()), O = p.default ?? p;
export { O as default };
//# sourceMappingURL=promise-queue.mjs.map
