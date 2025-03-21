/* esm.sh - date-fns@4.1.0/constructFrom */
import{constructFromSymbol as n}from"./constants.mjs";function t(r,o){return typeof r=="function"?r(o):r&&typeof r=="object"&&n in r?r[n](o):r instanceof Date?new r.constructor(o):new Date(o)}var f=t;export{t as constructFrom,f as default};
//# sourceMappingURL=constructFrom.mjs.map