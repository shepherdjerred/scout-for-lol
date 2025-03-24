/* esm.sh - date-fns@4.1.0/intlFormat */
import{toDate as o}from"./toDate.mjs";function r(t,e,n){let i;return f(e)?i=e:n=e,new Intl.DateTimeFormat(n?.locale,i).format(o(t))}function f(t){return t!==void 0&&!("locale"in t)}var u=r;export{u as default,r as intlFormat};
//# sourceMappingURL=intlFormat.mjs.map