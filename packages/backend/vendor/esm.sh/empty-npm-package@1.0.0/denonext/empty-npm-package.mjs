/* esm.sh - empty-npm-package@1.0.0 */
var n = Object.create;
var r = Object.defineProperty;
var p = Object.getOwnPropertyDescriptor;
var f = Object.getOwnPropertyNames;
var g = Object.getPrototypeOf, l = Object.prototype.hasOwnProperty;
var d = (s, o) => () => (o || s((o = { exports: {} }).exports, o), o.exports);
var u = (s, o, e, m) => {
  if (o && typeof o == "object" || typeof o == "function") {
    for (let t of f(o)) {
      !l.call(s, t) && t !== e && r(s, t, {
        get: () => o[t],
        enumerable: !(m = p(o, t)) || m.enumerable,
      });
    }
  }
  return s;
};
var h = (
  s,
  o,
  e,
) => (e = s != null ? n(g(s)) : {},
  u(
    o || !s || !s.__esModule
      ? r(e, "default", { value: s, enumerable: !0 })
      : e,
    s,
  ));
var i = d((c) => {
  c.printMsg = function () {
    console.log("This is a message from the demo package");
  };
});
var a = h(i()), { printMsg: M } = a, k = a.default ?? a;
export { k as default, M as printMsg };
//# sourceMappingURL=empty-npm-package.mjs.map
