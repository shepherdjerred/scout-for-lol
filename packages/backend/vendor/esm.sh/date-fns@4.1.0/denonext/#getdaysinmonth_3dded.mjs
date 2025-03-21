/* esm.sh - date-fns@4.1.0/getDaysInMonth */
import{constructFrom as s}from"./constructFrom.mjs";import{toDate as c}from"./toDate.mjs";function u(e,n){let t=c(e,n?.in),r=t.getFullYear(),a=t.getMonth(),o=s(t,0);return o.setFullYear(r,a+1,0),o.setHours(0,0,0,0),o.getDate()}var f=u;export{f as default,u as getDaysInMonth};
//# sourceMappingURL=getDaysInMonth.mjs.map