/* esm.sh - date-fns@4.1.0/previousDay */
import{getDay as f}from"./getDay.mjs";import{subDays as u}from"./subDays.mjs";function a(t,o,e){let r=f(t,e)-o;return r<=0&&(r+=7),u(t,r,e)}var p=a;export{p as default,a as previousDay};
//# sourceMappingURL=previousDay.mjs.map