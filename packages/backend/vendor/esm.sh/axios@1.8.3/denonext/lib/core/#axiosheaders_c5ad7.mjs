/* esm.sh - axios@1.8.3/lib/core/AxiosHeaders */
import o from "../../unsafe/utils.mjs";
import S from "../../unsafe/utils.mjs";
var E = S.toObjectSet([
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "user-agent",
  ]),
  b = (i) => {
    let t = {}, s, e, n;
    return i && i.split(`
`).forEach(function (c) {
      n = c.indexOf(":"),
        s = c.substring(0, n).trim().toLowerCase(),
        e = c.substring(n + 1).trim(),
        !(!s || t[s] && E[s]) &&
        (s === "set-cookie"
          ? t[s] ? t[s].push(e) : t[s] = [e]
          : t[s] = t[s] ? t[s] + ", " + e : e);
    }),
      t;
  };
var d = Symbol("internals");
function a(i) {
  return i && String(i).trim().toLowerCase();
}
function g(i) {
  return i === !1 || i == null ? i : o.isArray(i) ? i.map(g) : String(i);
}
function k(i) {
  let t = Object.create(null), s = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g, e;
  for (; e = s.exec(i);) t[e[1]] = e[2];
  return t;
}
var x = (i) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(i.trim());
function h(i, t, s, e, n) {
  if (o.isFunction(e)) return e.call(this, t, s);
  if (n && (t = s), !!o.isString(t)) {
    if (o.isString(e)) return t.indexOf(e) !== -1;
    if (o.isRegExp(e)) return e.test(t);
  }
}
function O(i) {
  return i.trim().toLowerCase().replace(
    /([a-z\d])(\w*)/g,
    (t, s, e) => s.toUpperCase() + e,
  );
}
function j(i, t) {
  let s = o.toCamelCase(" " + t);
  ["get", "set", "has"].forEach((e) => {
    Object.defineProperty(i, e + s, {
      value: function (n, r, c) {
        return this[e].call(this, t, n, r, c);
      },
      configurable: !0,
    });
  });
}
var l = class {
  constructor(t) {
    t && this.set(t);
  }
  set(t, s, e) {
    let n = this;
    function r(f, u, p) {
      let m = a(u);
      if (!m) throw new Error("header name must be a non-empty string");
      let y = o.findKey(n, m);
      (!y || n[y] === void 0 || p === !0 || p === void 0 && n[y] !== !1) &&
        (n[y || u] = g(f));
    }
    let c = (f, u) => o.forEach(f, (p, m) => r(p, m, u));
    if (o.isPlainObject(t) || t instanceof this.constructor) c(t, s);
    else if (o.isString(t) && (t = t.trim()) && !x(t)) c(b(t), s);
    else if (o.isHeaders(t)) { for (let [f, u] of t.entries()) r(u, f, e); }
    else t != null && r(s, t, e);
    return this;
  }
  get(t, s) {
    if (t = a(t), t) {
      let e = o.findKey(this, t);
      if (e) {
        let n = this[e];
        if (!s) return n;
        if (s === !0) return k(n);
        if (o.isFunction(s)) return s.call(this, n, e);
        if (o.isRegExp(s)) return s.exec(n);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(t, s) {
    if (t = a(t), t) {
      let e = o.findKey(this, t);
      return !!(e && this[e] !== void 0 && (!s || h(this, this[e], e, s)));
    }
    return !1;
  }
  delete(t, s) {
    let e = this, n = !1;
    function r(c) {
      if (c = a(c), c) {
        let f = o.findKey(e, c);
        f && (!s || h(e, e[f], f, s)) && (delete e[f], n = !0);
      }
    }
    return o.isArray(t) ? t.forEach(r) : r(t), n;
  }
  clear(t) {
    let s = Object.keys(this), e = s.length, n = !1;
    for (; e--;) {
      let r = s[e];
      (!t || h(this, this[r], r, t, !0)) && (delete this[r], n = !0);
    }
    return n;
  }
  normalize(t) {
    let s = this, e = {};
    return o.forEach(this, (n, r) => {
      let c = o.findKey(e, r);
      if (c) {
        s[c] = g(n), delete s[r];
        return;
      }
      let f = t ? O(r) : String(r).trim();
      f !== r && delete s[r], s[f] = g(n), e[f] = !0;
    }),
      this;
  }
  concat(...t) {
    return this.constructor.concat(this, ...t);
  }
  toJSON(t) {
    let s = Object.create(null);
    return o.forEach(this, (e, n) => {
      e != null && e !== !1 && (s[n] = t && o.isArray(e) ? e.join(", ") : e);
    }),
      s;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([t, s]) => t + ": " + s).join(`
`);
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(t) {
    return t instanceof this ? t : new this(t);
  }
  static concat(t, ...s) {
    let e = new this(t);
    return s.forEach((n) => e.set(n)), e;
  }
  static accessor(t) {
    let e = (this[d] = this[d] = { accessors: {} }).accessors,
      n = this.prototype;
    function r(c) {
      let f = a(c);
      e[f] || (j(n, c), e[f] = !0);
    }
    return o.isArray(t) ? t.forEach(r) : r(t), this;
  }
};
l.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization",
]);
o.reduceDescriptors(l.prototype, ({ value: i }, t) => {
  let s = t[0].toUpperCase() + t.slice(1);
  return {
    get: () => i,
    set(e) {
      this[s] = e;
    },
  };
});
o.freezeMethods(l);
var C = l;
export { C as default };

import "https://deno.land/x/xhr@0.3.0/mod.ts"; //# sourceMappingURL=AxiosHeaders.mjs.map
