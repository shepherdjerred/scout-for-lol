/* esm.sh - date-fns@4.1.0/lastDayOfDecade */
import{toDate as a}from"./toDate.mjs";function n(r,t){let e=a(r,t?.in),o=e.getFullYear(),l=9+Math.floor(o/10)*10;return e.setFullYear(l+1,0,0),e.setHours(0,0,0,0),a(e,t?.in)}var s=n;export{s as default,n as lastDayOfDecade};
//# sourceMappingURL=lastDayOfDecade.mjs.map