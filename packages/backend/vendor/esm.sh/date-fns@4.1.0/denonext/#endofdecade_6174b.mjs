/* esm.sh - date-fns@4.1.0/endOfDecade */
import{toDate as n}from"./toDate.mjs";function c(t,o){let e=n(t,o?.in),r=e.getFullYear(),a=9+Math.floor(r/10)*10;return e.setFullYear(a,11,31),e.setHours(23,59,59,999),e}var l=c;export{l as default,c as endOfDecade};
//# sourceMappingURL=endOfDecade.mjs.map