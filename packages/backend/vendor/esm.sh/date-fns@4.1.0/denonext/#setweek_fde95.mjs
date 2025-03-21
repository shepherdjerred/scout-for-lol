/* esm.sh - date-fns@4.1.0/setWeek */
import{getWeek as n}from"./getWeek.mjs";import{toDate as r}from"./toDate.mjs";function i(f,o,t){let e=r(f,t?.in),a=n(e,t)-o;return e.setDate(e.getDate()-a*7),r(e,t?.in)}var d=i;export{d as default,i as setWeek};
//# sourceMappingURL=setWeek.mjs.map