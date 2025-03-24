/* esm.sh - date-fns@4.1.0/setISOWeek */
import{getISOWeek as a}from"./getISOWeek.mjs";import{toDate as n}from"./toDate.mjs";function i(o,r,e){let t=n(o,e?.in),f=a(t,e)-r;return t.setDate(t.getDate()-f*7),t}var d=i;export{d as default,i as setISOWeek};
//# sourceMappingURL=setISOWeek.mjs.map