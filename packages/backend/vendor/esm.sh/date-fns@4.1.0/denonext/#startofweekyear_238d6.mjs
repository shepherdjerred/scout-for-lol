/* esm.sh - date-fns@4.1.0/startOfWeekYear */
import{getDefaultOptions as n}from"./_lib/defaultOptions.mjs";import{constructFrom as i}from"./constructFrom.mjs";import{getWeekYear as f}from"./getWeekYear.mjs";import{startOfWeek as c}from"./startOfWeek.mjs";function k(r,t){let o=n(),a=t?.firstWeekContainsDate??t?.locale?.options?.firstWeekContainsDate??o.firstWeekContainsDate??o.locale?.options?.firstWeekContainsDate??1,s=f(r,t),e=i(t?.in||r,0);return e.setFullYear(s,0,a),e.setHours(0,0,0,0),c(e,t)}var D=k;export{D as default,k as startOfWeekYear};
//# sourceMappingURL=startOfWeekYear.mjs.map