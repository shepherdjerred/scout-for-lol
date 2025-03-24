/* esm.sh - date-fns@4.1.0/lastDayOfQuarter */
import{toDate as s}from"./toDate.mjs";function a(n,e){let t=s(n,e?.in),o=t.getMonth(),r=o-o%3+3;return t.setMonth(r,0),t.setHours(0,0,0,0),t}var c=a;export{c as default,a as lastDayOfQuarter};
//# sourceMappingURL=lastDayOfQuarter.mjs.map