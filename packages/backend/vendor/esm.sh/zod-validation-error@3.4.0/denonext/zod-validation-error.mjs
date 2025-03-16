/* esm.sh - zod-validation-error@3.4.0 */
import * as l from "/zod@^3.18.0?target=denonext";
import * as a from "/zod@^3.18.0?target=denonext";
function m(r) {
  return r instanceof Error && r.name === "ZodError" && "issues" in r &&
    Array.isArray(r.issues);
}
var i = class extends Error {
  name;
  details;
  constructor(r, e) {
    super(r, e), this.name = "ZodValidationError", this.details = S(e);
  }
  toString() {
    return this.message;
  }
};
function S(r) {
  if (r) {
    let e = r.cause;
    if (m(e)) return e.issues;
  }
  return [];
}
function V(r) {
  return r instanceof i;
}
function $(r) {
  return r instanceof Error && r.name === "ZodValidationError";
}
function g(r) {
  return r.length !== 0;
}
var v = /[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u;
function Z(r) {
  return r.length === 1 ? r[0].toString() : r.reduce((e, n) => {
    if (typeof n == "number") return e + "[" + n.toString() + "]";
    if (n.includes('"')) return e + '["' + _(n) + '"]';
    if (!v.test(n)) return e + '["' + n + '"]';
    let s = e.length === 0 ? "" : ".";
    return e + s + n;
  }, "");
}
function _(r) {
  return r.replace(/"/g, '\\"');
}
var A = "; ", B = 99, E = "Validation error", y = ": ", R = ", or ";
function p(r = {}) {
  let {
    issueSeparator: e = A,
    unionSeparator: n = R,
    prefixSeparator: s = y,
    prefix: o = E,
    includePath: t = !0,
    maxIssuesInMessage: f = B,
  } = r;
  return (u) => {
    let c = u.slice(0, f).map((I) =>
      d({ issue: I, issueSeparator: e, unionSeparator: n, includePath: t })
    ).join(e);
    return w(c, o, s);
  };
}
function d(r) {
  let { issue: e, issueSeparator: n, unionSeparator: s, includePath: o } = r;
  if (e.code === a.ZodIssueCode.invalid_union) {
    return e.unionErrors.reduce((t, f) => {
      let u = f.issues.map((c) =>
        d({ issue: c, issueSeparator: n, unionSeparator: s, includePath: o })
      ).join(n);
      return t.includes(u) || t.push(u), t;
    }, []).join(s);
  }
  if (e.code === a.ZodIssueCode.invalid_arguments) {
    return [
      e.message,
      ...e.argumentsError.issues.map((t) =>
        d({ issue: t, issueSeparator: n, unionSeparator: s, includePath: o })
      ),
    ].join(n);
  }
  if (e.code === a.ZodIssueCode.invalid_return_type) {
    return [
      e.message,
      ...e.returnTypeError.issues.map((t) =>
        d({ issue: t, issueSeparator: n, unionSeparator: s, includePath: o })
      ),
    ].join(n);
  }
  if (o && g(e.path)) {
    if (e.path.length === 1) {
      let t = e.path[0];
      if (typeof t == "number") return `${e.message} at index ${t}`;
    }
    return `${e.message} at "${Z(e.path)}"`;
  }
  return e.message;
}
function w(r, e, n) {
  return e !== null ? r.length > 0 ? [e, r].join(n) : e : r.length > 0 ? r : E;
}
function M(r, e = {}) {
  let s = P(e)([r]);
  return new i(s, { cause: new l.ZodError([r]) });
}
function P(r) {
  return "messageBuilder" in r ? r.messageBuilder : p(r);
}
var F = (r, e) => ({
  message: M({ ...r, message: r.message ?? e.defaultError }).message,
});
function z(r, e = {}) {
  if (!m(r)) {
    throw new TypeError(
      `Invalid zodError param; expected instance of ZodError. Did you mean to use the "${O.name}" method instead?`,
    );
  }
  return h(r, e);
}
function h(r, e = {}) {
  let n = r.errors, s;
  return g(n) ? s = j(e)(n) : s = r.message, new i(s, { cause: r });
}
function j(r) {
  return "messageBuilder" in r ? r.messageBuilder : p(r);
}
var x = (r = {}) => (e) =>
  m(e)
    ? h(e, r)
    : e instanceof Error
    ? new i(e.message, { cause: e })
    : new i("Unknown error");
function O(r, e = {}) {
  return x(e)(r);
}
export {
  $ as isValidationErrorLike,
  F as errorMap,
  i as ValidationError,
  M as fromZodIssue,
  m as isZodErrorLike,
  O as fromError,
  p as createMessageBuilder,
  V as isValidationError,
  x as toValidationError,
  z as fromZodError,
};
//# sourceMappingURL=zod-validation-error.mjs.map
