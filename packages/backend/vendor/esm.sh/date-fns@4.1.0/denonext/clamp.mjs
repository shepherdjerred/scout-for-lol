/* esm.sh - date-fns@4.1.0/clamp */
import{normalizeDates as n}from"./_lib/normalizeDates.mjs";import{max as f}from"./max.mjs";import{min as d}from"./min.mjs";function i(m,t,r){let[e,a,o]=n(r?.in,m,t.start,t.end);return d([f([e,a],r),o],r)}var x=i;export{i as clamp,x as default};
//# sourceMappingURL=clamp.mjs.map