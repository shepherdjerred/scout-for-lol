/* esm.sh - date-fns@4.1.0/getWeek */
import{millisecondsInWeek as f}from"./constants.mjs";import{startOfWeek as m}from"./startOfWeek.mjs";import{startOfWeekYear as a}from"./startOfWeekYear.mjs";import{toDate as i}from"./toDate.mjs";function n(r,t){let e=i(r,t?.in),o=+m(e,t)-+a(e,t);return Math.round(o/f)+1}var s=n;export{s as default,n as getWeek};
//# sourceMappingURL=getWeek.mjs.map