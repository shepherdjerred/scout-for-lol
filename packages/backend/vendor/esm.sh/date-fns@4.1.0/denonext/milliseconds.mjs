/* esm.sh - date-fns@4.1.0/milliseconds */
import{daysInYear as c}from"./constants.mjs";function p({years:i,months:l,weeks:o,days:r,hours:a,minutes:e,seconds:n}){let t=0;i&&(t+=i*c),l&&(t+=l*(c/12)),o&&(t+=o*7),r&&(t+=r);let f=t*24*60*60;return a&&(f+=a*60*60),e&&(f+=e*60),n&&(f+=n),Math.trunc(f*1e3)}var u=p;export{u as default,p as milliseconds};
//# sourceMappingURL=milliseconds.mjs.map