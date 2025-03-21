/* esm.sh - date-fns@4.1.0/addDays */
import{constructFrom as o}from"./constructFrom.mjs";import{toDate as a}from"./toDate.mjs";function f(e,r,i){let t=a(e,i?.in);return isNaN(r)?o(i?.in||e,NaN):(r&&t.setDate(t.getDate()+r),t)}var s=f;export{f as addDays,s as default};
//# sourceMappingURL=addDays.mjs.map