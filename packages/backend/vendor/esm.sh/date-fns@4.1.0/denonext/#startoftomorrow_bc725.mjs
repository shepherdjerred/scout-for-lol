/* esm.sh - date-fns@4.1.0/startOfTomorrow */
import{constructFrom as s}from"./constructFrom.mjs";import{constructNow as a}from"./constructNow.mjs";function u(r){let t=a(r?.in),e=t.getFullYear(),n=t.getMonth(),c=t.getDate(),o=s(r?.in,0);return o.setFullYear(e,n,c+1),o.setHours(0,0,0,0),o}var l=u;export{l as default,u as startOfTomorrow};
//# sourceMappingURL=startOfTomorrow.mjs.map