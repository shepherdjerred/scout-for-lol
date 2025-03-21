/* esm.sh - date-fns@4.1.0/startOfDecade */
import{toDate as n}from"./toDate.mjs";function s(e,o){let t=n(e,o?.in),r=t.getFullYear(),a=Math.floor(r/10)*10;return t.setFullYear(a,0,1),t.setHours(0,0,0,0),t}var l=s;export{l as default,s as startOfDecade};
//# sourceMappingURL=startOfDecade.mjs.map