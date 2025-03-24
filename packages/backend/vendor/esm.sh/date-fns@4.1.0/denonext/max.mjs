/* esm.sh - date-fns@4.1.0/max */
import{constructFrom as n}from"./constructFrom.mjs";import{toDate as c}from"./toDate.mjs";function l(f,i){let t,o=i?.in;return f.forEach(r=>{!o&&typeof r=="object"&&(o=n.bind(null,r));let e=c(r,o);(!t||t<e||isNaN(+e))&&(t=e)}),n(o,t||NaN)}var a=l;export{a as default,l as max};
//# sourceMappingURL=max.mjs.map