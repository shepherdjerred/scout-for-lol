/* esm.sh - date-fns@4.1.0/isSameMonth */
import{constructFrom as i}from"./constructFrom.mjs";function a(o,...t){let r=i.bind(null,o||t.find(e=>typeof e=="object"));return t.map(r)}function l(o,t,r){let[e,n]=a(r?.in,o,t);return e.getFullYear()===n.getFullYear()&&e.getMonth()===n.getMonth()}var f=l;export{f as default,l as isSameMonth};
//# sourceMappingURL=isSameMonth.mjs.map