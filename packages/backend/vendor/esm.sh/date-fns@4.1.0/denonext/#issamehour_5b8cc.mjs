/* esm.sh - date-fns@4.1.0/isSameHour */
import{constructFrom as a}from"./constructFrom.mjs";function n(o,...t){let r=a.bind(null,o||t.find(e=>typeof e=="object"));return t.map(r)}import{startOfHour as i}from"./startOfHour.mjs";function f(o,t,r){let[e,m]=n(r?.in,o,t);return+i(e)==+i(m)}var s=f;export{s as default,f as isSameHour};
//# sourceMappingURL=isSameHour.mjs.map