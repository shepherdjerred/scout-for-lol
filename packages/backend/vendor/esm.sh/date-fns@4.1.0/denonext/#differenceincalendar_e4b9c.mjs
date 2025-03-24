/* esm.sh - date-fns@4.1.0/differenceInCalendarQuarters */
import{normalizeDates as l}from"./_lib/normalizeDates.mjs";import{getQuarter as t}from"./getQuarter.mjs";function u(a,n,o){let[e,r]=l(o?.in,a,n),f=e.getFullYear()-r.getFullYear(),i=t(e)-t(r);return f*4+i}var m=u;export{m as default,u as differenceInCalendarQuarters};
//# sourceMappingURL=differenceInCalendarQuarters.mjs.map