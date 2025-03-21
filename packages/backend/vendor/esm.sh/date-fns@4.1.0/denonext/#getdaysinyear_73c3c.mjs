/* esm.sh - date-fns@4.1.0/getDaysInYear */
import{isLeapYear as a}from"./isLeapYear.mjs";import{toDate as o}from"./toDate.mjs";function i(t,e){let r=o(t,e?.in);return Number.isNaN(+r)?NaN:a(r)?366:365}var m=i;export{m as default,i as getDaysInYear};
//# sourceMappingURL=getDaysInYear.mjs.map