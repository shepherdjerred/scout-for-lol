/* esm.sh - date-fns@4.1.0/areIntervalsOverlapping */
import{toDate as r}from"./toDate.mjs";function c(i,a,t){let[m,d]=[+r(i.start,t?.in),+r(i.end,t?.in)].sort((e,n)=>e-n),[f,u]=[+r(a.start,t?.in),+r(a.end,t?.in)].sort((e,n)=>e-n);return t?.inclusive?m<=u&&f<=d:m<u&&f<d}var s=c;export{c as areIntervalsOverlapping,s as default};
//# sourceMappingURL=areIntervalsOverlapping.mjs.map