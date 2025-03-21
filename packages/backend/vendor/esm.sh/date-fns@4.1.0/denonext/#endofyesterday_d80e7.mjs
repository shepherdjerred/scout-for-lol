/* esm.sh - date-fns@4.1.0/endOfYesterday */
import{constructFrom as o}from"./constructFrom.mjs";import{constructNow as n}from"./constructNow.mjs";function u(r){let t=n(r?.in),e=o(r?.in,0);return e.setFullYear(t.getFullYear(),t.getMonth(),t.getDate()-1),e.setHours(23,59,59,999),e}var a=u;export{a as default,u as endOfYesterday};
//# sourceMappingURL=endOfYesterday.mjs.map