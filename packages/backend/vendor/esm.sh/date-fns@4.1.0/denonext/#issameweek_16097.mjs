/* esm.sh - date-fns@4.1.0/isSameWeek */
import{constructFrom as i}from"./constructFrom.mjs";function n(t,...r){let e=i.bind(null,t||r.find(o=>typeof o=="object"));return r.map(e)}import{startOfWeek as a}from"./startOfWeek.mjs";function f(t,r,e){let[o,m]=n(e?.in,t,r);return+a(o,e)==+a(m,e)}var s=f;export{s as default,f as isSameWeek};
//# sourceMappingURL=isSameWeek.mjs.map