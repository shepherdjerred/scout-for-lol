/* esm.sh - date-fns@4.1.0/lastDayOfMonth */
import{toDate as o}from"./toDate.mjs";function a(n,e){let t=o(n,e?.in),r=t.getMonth();return t.setFullYear(t.getFullYear(),r+1,0),t.setHours(0,0,0,0),o(t,e?.in)}var u=a;export{u as default,a as lastDayOfMonth};
//# sourceMappingURL=lastDayOfMonth.mjs.map