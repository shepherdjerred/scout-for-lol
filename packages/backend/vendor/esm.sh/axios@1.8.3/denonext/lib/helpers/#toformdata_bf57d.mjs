/* esm.sh - axios@1.8.3/lib/helpers/toFormData */
import { Buffer as __Buffer$ } from "node:buffer";
import t from "../../unsafe/utils.mjs";
import S from "../core/AxiosError.mjs";
import T from "/form-data@^4.0.0?target=denonext";
var A = T;
function m(i) {
  return t.isPlainObject(i) || t.isArray(i);
}
function h(i) {
  return t.endsWith(i, "[]") ? i.slice(0, -2) : i;
}
function O(i, e, o) {
  return i
    ? i.concat(e).map(function (s, d) {
      return s = h(s), !o && d ? "[" + s + "]" : s;
    }).join(o ? "." : "")
    : e;
}
function U(i) {
  return t.isArray(i) && !i.some(m);
}
var g = t.toFlatObject(t, {}, null, function (e) {
  return /^is[A-Z]/.test(e);
});
function V(i, e, o) {
  if (!t.isObject(i)) throw new TypeError("target must be an object");
  e = e || new (A || FormData)(),
    o = t.toFlatObject(
      o,
      { metaTokens: !0, dots: !1, indexes: !1 },
      !1,
      function (n, u) {
        return !t.isUndefined(u[n]);
      },
    );
  let p = o.metaTokens,
    s = o.visitor || F,
    d = o.dots,
    B = o.indexes,
    w = (o.Blob || typeof Blob < "u" && Blob) && t.isSpecCompliantForm(e);
  if (!t.isFunction(s)) throw new TypeError("visitor must be a function");
  function b(r) {
    if (r === null) return "";
    if (t.isDate(r)) return r.toISOString();
    if (!w && t.isBlob(r)) {
      throw new S("Blob is not supported. Use a Buffer instead.");
    }
    return t.isArrayBuffer(r) || t.isTypedArray(r)
      ? w && typeof Blob == "function" ? new Blob([r]) : __Buffer$.from(r)
      : r;
  }
  function F(r, n, u) {
    let f = r;
    if (r && !u && typeof r == "object") {
      if (t.endsWith(n, "{}")) {
        n = p ? n : n.slice(0, -2), r = JSON.stringify(r);
      } else if (
        t.isArray(r) && U(r) ||
        (t.isFileList(r) || t.endsWith(n, "[]")) && (f = t.toArray(r))
      ) {
        return n = h(n),
          f.forEach(function (l, E) {
            !(t.isUndefined(l) || l === null) &&
              e.append(
                B === !0 ? O([n], E, d) : B === null ? n : n + "[]",
                b(l),
              );
          }),
          !1;
      }
    }
    return m(r) ? !0 : (e.append(O(u, n, d), b(r)), !1);
  }
  let a = [],
    x = Object.assign(g, {
      defaultVisitor: F,
      convertValue: b,
      isVisitable: m,
    });
  function j(r, n) {
    if (!t.isUndefined(r)) {
      if (a.indexOf(r) !== -1) {
        throw Error("Circular reference detected in " + n.join("."));
      }
      a.push(r),
        t.forEach(r, function (f, c) {
          (!(t.isUndefined(f) || f === null) &&
                s.call(e, f, t.isString(c) ? c.trim() : c, n, x)) === !0 &&
            j(f, n ? n.concat(c) : [c]);
        }),
        a.pop();
    }
  }
  if (!t.isObject(i)) throw new TypeError("data must be an object");
  return j(i), e;
}
var J = V;
export { J as default };

import "https://deno.land/x/xhr@0.3.0/mod.ts"; //# sourceMappingURL=toFormData.mjs.map
