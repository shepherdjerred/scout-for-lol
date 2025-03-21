/* esm.sh - date-fns@4.1.0/endOfMonth */
import{toDate as r}from"./toDate.mjs";function u(e,o){let t=r(e,o?.in),n=t.getMonth();return t.setFullYear(t.getFullYear(),n+1,0),t.setHours(23,59,59,999),t}var l=u;export{l as default,u as endOfMonth};
//# sourceMappingURL=endOfMonth.mjs.map