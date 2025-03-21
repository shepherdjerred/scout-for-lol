/* esm.sh - date-fns@4.1.0/getISOWeeksInYear */
import{addWeeks as a}from"./addWeeks.mjs";import{millisecondsInWeek as s}from"./constants.mjs";import{startOfISOWeekYear as t}from"./startOfISOWeekYear.mjs";function f(r,o){let e=t(r,o),n=+t(a(e,60))-+e;return Math.round(n/s)}var p=f;export{p as default,f as getISOWeeksInYear};
//# sourceMappingURL=getISOWeeksInYear.mjs.map