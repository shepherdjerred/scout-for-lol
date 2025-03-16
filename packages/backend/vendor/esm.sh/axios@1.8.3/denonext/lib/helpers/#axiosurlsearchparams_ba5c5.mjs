/* esm.sh - axios@1.8.3/lib/helpers/AxiosURLSearchParams */
import a from "./toFormData.mjs";
function i(n) {
  let t = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0",
  };
  return encodeURIComponent(n).replace(/[!'()~]|%20|%00/g, function (r) {
    return t[r];
  });
}
function c(n, t) {
  this._pairs = [], n && a(n, this, t);
}
var p = c.prototype;
p.append = function (t, o) {
  this._pairs.push([t, o]);
};
p.toString = function (t) {
  let o = t
    ? function (r) {
      return t.call(this, r, i);
    }
    : i;
  return this._pairs.map(function (e) {
    return o(e[0]) + "=" + o(e[1]);
  }, "").join("&");
};
var u = c;
export { u as default };

import "https://deno.land/x/xhr@0.3.0/mod.ts"; //# sourceMappingURL=AxiosURLSearchParams.mjs.map
