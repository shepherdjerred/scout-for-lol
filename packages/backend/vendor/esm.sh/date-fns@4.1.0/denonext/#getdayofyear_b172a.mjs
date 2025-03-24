/* esm.sh - date-fns@4.1.0/getDayOfYear */
import{differenceInCalendarDays as f}from"./differenceInCalendarDays.mjs";import{startOfYear as a}from"./startOfYear.mjs";import{toDate as o}from"./toDate.mjs";function n(t,e){let r=o(t,e?.in);return f(r,a(r))+1}var s=n;export{s as default,n as getDayOfYear};
//# sourceMappingURL=getDayOfYear.mjs.map