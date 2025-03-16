/* esm.sh - react@19.0.0 */
import __Process$ from "node:process";
var D = Object.create;
var C = Object.defineProperty;
var U = Object.getOwnPropertyDescriptor;
var k = Object.getOwnPropertyNames;
var b = Object.getPrototypeOf, q = Object.prototype.hasOwnProperty;
var S = (t, e) => () => (e || t((e = { exports: {} }).exports, e), e.exports);
var z = (t, e, n, r) => {
  if (e && typeof e == "object" || typeof e == "function") {
    for (let u of k(e)) {
      !q.call(t, u) && u !== n && C(t, u, {
        get: () => e[u],
        enumerable: !(r = U(e, u)) || r.enumerable,
      });
    }
  }
  return t;
};
var G = (
  t,
  e,
  n,
) => (n = t != null ? D(b(t)) : {},
  z(
    e || !t || !t.__esModule
      ? C(n, "default", { value: t, enumerable: !0 })
      : n,
    t,
  ));
var Y = S((o) => {
  "use strict";
  var v = Symbol.for("react.transitional.element"),
    K = Symbol.for("react.portal"),
    W = Symbol.for("react.fragment"),
    B = Symbol.for("react.strict_mode"),
    Q = Symbol.for("react.profiler"),
    X = Symbol.for("react.consumer"),
    Z = Symbol.for("react.context"),
    J = Symbol.for("react.forward_ref"),
    V = Symbol.for("react.suspense"),
    F = Symbol.for("react.memo"),
    j = Symbol.for("react.lazy"),
    A = Symbol.iterator;
  function tt(t) {
    return t === null || typeof t != "object"
      ? null
      : (t = A && t[A] || t["@@iterator"], typeof t == "function" ? t : null);
  }
  var N = {
      isMounted: function () {
        return !1;
      },
      enqueueForceUpdate: function () {},
      enqueueReplaceState: function () {},
      enqueueSetState: function () {},
    },
    H = Object.assign,
    P = {};
  function l(t, e, n) {
    this.props = t, this.context = e, this.refs = P, this.updater = n || N;
  }
  l.prototype.isReactComponent = {};
  l.prototype.setState = function (t, e) {
    if (typeof t != "object" && typeof t != "function" && t != null) {
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables.",
      );
    }
    this.updater.enqueueSetState(this, t, e, "setState");
  };
  l.prototype.forceUpdate = function (t) {
    this.updater.enqueueForceUpdate(this, t, "forceUpdate");
  };
  function $() {}
  $.prototype = l.prototype;
  function m(t, e, n) {
    this.props = t, this.context = e, this.refs = P, this.updater = n || N;
  }
  var R = m.prototype = new $();
  R.constructor = m;
  H(R, l.prototype);
  R.isPureReactComponent = !0;
  var w = Array.isArray,
    i = { H: null, A: null, T: null, S: null },
    I = Object.prototype.hasOwnProperty;
  function T(t, e, n, r, u, f) {
    return n = f.ref,
      { $$typeof: v, type: t, key: e, ref: n !== void 0 ? n : null, props: f };
  }
  function et(t, e) {
    return T(t.type, e, void 0, void 0, void 0, t.props);
  }
  function d(t) {
    return typeof t == "object" && t !== null && t.$$typeof === v;
  }
  function nt(t) {
    var e = { "=": "=0", ":": "=2" };
    return "$" + t.replace(/[=:]/g, function (n) {
      return e[n];
    });
  }
  var O = /\/+/g;
  function y(t, e) {
    return typeof t == "object" && t !== null && t.key != null
      ? nt("" + t.key)
      : e.toString(36);
  }
  function h() {}
  function rt(t) {
    switch (t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw t.reason;
      default:
        switch (
          typeof t.status == "string"
            ? t.then(h, h)
            : (t.status = "pending",
              t.then(function (e) {
                t.status === "pending" && (t.status = "fulfilled", t.value = e);
              }, function (e) {
                t.status === "pending" && (t.status = "rejected", t.reason = e);
              })), t.status
        ) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw t.reason;
        }
    }
    throw t;
  }
  function a(t, e, n, r, u) {
    var f = typeof t;
    (f === "undefined" || f === "boolean") && (t = null);
    var s = !1;
    if (t === null) s = !0;
    else {switch (f) {
        case "bigint":
        case "string":
        case "number":
          s = !0;
          break;
        case "object":
          switch (t.$$typeof) {
            case v:
            case K:
              s = !0;
              break;
            case j:
              return s = t._init, a(s(t._payload), e, n, r, u);
          }
      }}
    if (s) {
      return u = u(t),
        s = r === "" ? "." + y(t, 0) : r,
        w(u)
          ? (n = "",
            s != null && (n = s.replace(O, "$&/") + "/"),
            a(u, e, n, "", function (M) {
              return M;
            }))
          : u != null &&
            (d(u) && (u = et(
              u,
              n + (u.key == null || t && t.key === u.key
                ? ""
                : ("" + u.key).replace(O, "$&/") + "/") +
                s,
            )),
              e.push(u)),
        1;
    }
    s = 0;
    var p = r === "" ? "." : r + ":";
    if (w(t)) {
      for (var c = 0; c < t.length; c++) {
        r = t[c], f = p + y(r, c), s += a(r, e, n, f, u);
      }
    } else if (c = tt(t), typeof c == "function") {
      for (t = c.call(t), c = 0; !(r = t.next()).done;) {
        r = r.value, f = p + y(r, c++), s += a(r, e, n, f, u);
      }
    } else if (f === "object") {
      if (typeof t.then == "function") return a(rt(t), e, n, r, u);
      throw e = String(t),
        Error(
          "Objects are not valid as a React child (found: " +
            (e === "[object Object]"
              ? "object with keys {" + Object.keys(t).join(", ") + "}"
              : e) +
            "). If you meant to render a collection of children, use an array instead.",
        );
    }
    return s;
  }
  function _(t, e, n) {
    if (t == null) return t;
    var r = [], u = 0;
    return a(t, r, "", "", function (f) {
      return e.call(n, f, u++);
    }),
      r;
  }
  function ot(t) {
    if (t._status === -1) {
      var e = t._result;
      e = e(),
        e.then(function (n) {
          (t._status === 0 || t._status === -1) &&
            (t._status = 1, t._result = n);
        }, function (n) {
          (t._status === 0 || t._status === -1) &&
            (t._status = 2, t._result = n);
        }),
        t._status === -1 && (t._status = 0, t._result = e);
    }
    if (t._status === 1) return t._result.default;
    throw t._result;
  }
  var g = typeof reportError == "function" ? reportError : function (t) {
    if (
      typeof globalThis == "object" &&
      typeof globalThis.ErrorEvent == "function"
    ) {
      var e = new globalThis.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message:
          typeof t == "object" && t !== null && typeof t.message == "string"
            ? String(t.message)
            : String(t),
        error: t,
      });
      if (!globalThis.dispatchEvent(e)) return;
    } else if (
      typeof __Process$ == "object" && typeof __Process$.emit == "function"
    ) {
      __Process$.emit("uncaughtException", t);
      return;
    }
    console.error(t);
  };
  function ut() {}
  o.Children = {
    map: _,
    forEach: function (t, e, n) {
      _(t, function () {
        e.apply(this, arguments);
      }, n);
    },
    count: function (t) {
      var e = 0;
      return _(t, function () {
        e++;
      }),
        e;
    },
    toArray: function (t) {
      return _(t, function (e) {
        return e;
      }) || [];
    },
    only: function (t) {
      if (!d(t)) {
        throw Error(
          "React.Children.only expected to receive a single React element child.",
        );
      }
      return t;
    },
  };
  o.Component = l;
  o.Fragment = W;
  o.Profiler = Q;
  o.PureComponent = m;
  o.StrictMode = B;
  o.Suspense = V;
  o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i;
  o.act = function () {
    throw Error("act(...) is not supported in production builds of React.");
  };
  o.cache = function (t) {
    return function () {
      return t.apply(null, arguments);
    };
  };
  o.cloneElement = function (t, e, n) {
    if (t == null) {
      throw Error(
        "The argument must be a React element, but you passed " + t + ".",
      );
    }
    var r = H({}, t.props), u = t.key, f = void 0;
    if (e != null) {
      for (
        s in e.ref !== void 0 && (f = void 0),
          e.key !== void 0 && (u = "" + e.key),
          e
      ) {
        !I.call(e, s) || s === "key" || s === "__self" || s === "__source" ||
          s === "ref" && e.ref === void 0 || (r[s] = e[s]);
      }
    }
    var s = arguments.length - 2;
    if (s === 1) r.children = n;
    else if (1 < s) {
      for (var p = Array(s), c = 0; c < s; c++) p[c] = arguments[c + 2];
      r.children = p;
    }
    return T(t.type, u, void 0, void 0, f, r);
  };
  o.createContext = function (t) {
    return t = {
      $$typeof: Z,
      _currentValue: t,
      _currentValue2: t,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
    },
      t.Provider = t,
      t.Consumer = { $$typeof: X, _context: t },
      t;
  };
  o.createElement = function (t, e, n) {
    var r, u = {}, f = null;
    if (e != null) {
      for (r in e.key !== void 0 && (f = "" + e.key), e) {
        I.call(e, r) && r !== "key" && r !== "__self" && r !== "__source" &&
          (u[r] = e[r]);
      }
    }
    var s = arguments.length - 2;
    if (s === 1) u.children = n;
    else if (1 < s) {
      for (var p = Array(s), c = 0; c < s; c++) p[c] = arguments[c + 2];
      u.children = p;
    }
    if (t && t.defaultProps) {
      for (r in s = t.defaultProps, s) u[r] === void 0 && (u[r] = s[r]);
    }
    return T(t, f, void 0, void 0, null, u);
  };
  o.createRef = function () {
    return { current: null };
  };
  o.forwardRef = function (t) {
    return { $$typeof: J, render: t };
  };
  o.isValidElement = d;
  o.lazy = function (t) {
    return { $$typeof: j, _payload: { _status: -1, _result: t }, _init: ot };
  };
  o.memo = function (t, e) {
    return { $$typeof: F, type: t, compare: e === void 0 ? null : e };
  };
  o.startTransition = function (t) {
    var e = i.T, n = {};
    i.T = n;
    try {
      var r = t(), u = i.S;
      u !== null && u(n, r),
        typeof r == "object" && r !== null && typeof r.then == "function" &&
        r.then(ut, g);
    } catch (f) {
      g(f);
    } finally {
      i.T = e;
    }
  };
  o.unstable_useCacheRefresh = function () {
    return i.H.useCacheRefresh();
  };
  o.use = function (t) {
    return i.H.use(t);
  };
  o.useActionState = function (t, e, n) {
    return i.H.useActionState(t, e, n);
  };
  o.useCallback = function (t, e) {
    return i.H.useCallback(t, e);
  };
  o.useContext = function (t) {
    return i.H.useContext(t);
  };
  o.useDebugValue = function () {};
  o.useDeferredValue = function (t, e) {
    return i.H.useDeferredValue(t, e);
  };
  o.useEffect = function (t, e) {
    return i.H.useEffect(t, e);
  };
  o.useId = function () {
    return i.H.useId();
  };
  o.useImperativeHandle = function (t, e, n) {
    return i.H.useImperativeHandle(t, e, n);
  };
  o.useInsertionEffect = function (t, e) {
    return i.H.useInsertionEffect(t, e);
  };
  o.useLayoutEffect = function (t, e) {
    return i.H.useLayoutEffect(t, e);
  };
  o.useMemo = function (t, e) {
    return i.H.useMemo(t, e);
  };
  o.useOptimistic = function (t, e) {
    return i.H.useOptimistic(t, e);
  };
  o.useReducer = function (t, e, n) {
    return i.H.useReducer(t, e, n);
  };
  o.useRef = function (t) {
    return i.H.useRef(t);
  };
  o.useState = function (t) {
    return i.H.useState(t);
  };
  o.useSyncExternalStore = function (t, e, n) {
    return i.H.useSyncExternalStore(t, e, n);
  };
  o.useTransition = function () {
    return i.H.useTransition();
  };
  o.version = "19.0.0";
});
var L = S((ft, x) => {
  "use strict";
  x.exports = Y();
});
var E = G(L()),
  {
    Children: ct,
    Component: pt,
    Fragment: at,
    Profiler: lt,
    PureComponent: _t,
    StrictMode: Et,
    Suspense: yt,
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: vt,
    act: mt,
    cache: Rt,
    cloneElement: Tt,
    createContext: dt,
    createElement: Ct,
    createRef: St,
    forwardRef: At,
    isValidElement: wt,
    lazy: Ot,
    memo: ht,
    startTransition: gt,
    unstable_useCacheRefresh: jt,
    use: Nt,
    useActionState: Ht,
    useCallback: Pt,
    useContext: $t,
    useDebugValue: It,
    useDeferredValue: Yt,
    useEffect: xt,
    useId: Lt,
    useImperativeHandle: Mt,
    useInsertionEffect: Dt,
    useLayoutEffect: Ut,
    useMemo: kt,
    useOptimistic: bt,
    useReducer: qt,
    useRef: zt,
    useState: Gt,
    useSyncExternalStore: Kt,
    useTransition: Wt,
    version: Bt,
  } = E,
  Qt = E.default ?? E;
export {
  $t as useContext,
  _t as PureComponent,
  At as forwardRef,
  at as Fragment,
  Bt as version,
  bt as useOptimistic,
  Ct as createElement,
  ct as Children,
  Dt as useInsertionEffect,
  dt as createContext,
  Et as StrictMode,
  Gt as useState,
  gt as startTransition,
  Ht as useActionState,
  ht as memo,
  It as useDebugValue,
  jt as unstable_useCacheRefresh,
  Kt as useSyncExternalStore,
  kt as useMemo,
  Lt as useId,
  lt as Profiler,
  Mt as useImperativeHandle,
  mt as act,
  Nt as use,
  Ot as lazy,
  Pt as useCallback,
  pt as Component,
  Qt as default,
  qt as useReducer,
  Rt as cache,
  St as createRef,
  Tt as cloneElement,
  Ut as useLayoutEffect,
  vt as __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  Wt as useTransition,
  wt as isValidElement,
  xt as useEffect,
  Yt as useDeferredValue,
  yt as Suspense,
  zt as useRef,
};
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=react.mjs.map
