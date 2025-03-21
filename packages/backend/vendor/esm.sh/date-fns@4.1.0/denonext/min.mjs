/* esm.sh - date-fns@4.1.0/min */
import{constructFrom as n}from"./constructFrom.mjs";import{toDate as c}from"./toDate.mjs";function l(i,f){let t,o=f?.in;return i.forEach(r=>{!o&&typeof r=="object"&&(o=n.bind(null,r));let e=c(r,o);(!t||t>e||isNaN(+e))&&(t=e)}),n(o,t||NaN)}var p=l;export{p as default,l as min};
//# sourceMappingURL=min.mjs.map