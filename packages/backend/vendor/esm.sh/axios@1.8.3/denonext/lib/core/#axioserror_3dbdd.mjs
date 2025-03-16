/* esm.sh - axios@1.8.3/lib/core/AxiosError */
import a from "../../unsafe/utils.mjs";
function e(t, i, o, E, r) {
  Error.call(this),
    Error.captureStackTrace
      ? Error.captureStackTrace(this, this.constructor)
      : this.stack = new Error().stack,
    this.message = t,
    this.name = "AxiosError",
    i && (this.code = i),
    o && (this.config = o),
    E && (this.request = E),
    r && (this.response = r, this.status = r.status ? r.status : null);
}
a.inherits(e, Error, {
  toJSON: function () {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: a.toJSONObject(this.config),
      code: this.code,
      status: this.status,
    };
  },
});
var u = e.prototype, R = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL",
].forEach((t) => {
  R[t] = { value: t };
});
Object.defineProperties(e, R);
Object.defineProperty(u, "isAxiosError", { value: !0 });
e.from = (t, i, o, E, r, c) => {
  let s = Object.create(u);
  return a.toFlatObject(t, s, function (h) {
    return h !== Error.prototype;
  }, (n) => n !== "isAxiosError"),
    e.call(s, t.message, i, o, E, r),
    s.cause = t,
    s.name = t.name,
    c && Object.assign(s, c),
    s;
};
var m = e;
export { m as default };

import "https://deno.land/x/xhr@0.3.0/mod.ts"; //# sourceMappingURL=AxiosError.mjs.map
