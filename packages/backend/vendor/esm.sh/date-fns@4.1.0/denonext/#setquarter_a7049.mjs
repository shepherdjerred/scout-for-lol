/* esm.sh - date-fns@4.1.0/setQuarter */
import{setMonth as f}from"./setMonth.mjs";import{toDate as u}from"./toDate.mjs";function c(o,r,e){let t=u(o,e?.in),n=Math.trunc(t.getMonth()/3)+1,a=r-n;return f(t,t.getMonth()+a*3)}var d=c;export{d as default,c as setQuarter};
//# sourceMappingURL=setQuarter.mjs.map