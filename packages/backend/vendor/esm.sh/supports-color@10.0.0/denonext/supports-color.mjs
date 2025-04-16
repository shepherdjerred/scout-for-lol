/* esm.sh - supports-color@10.0.0 */
var r="navigator"in globalThis?globalThis.navigator.userAgentData&&navigator.userAgentData.brands.find(({brand:a})=>a==="Chromium")?.version>93?3:/\b(Chrome|Chromium)\//.test(globalThis.navigator.userAgent)?1:0:0,t=r!==0&&{level:r,hasBasic:!0,has256:r>=2,has16m:r>=3},o={stdout:t,stderr:t},s=o;export{s as default};
//# sourceMappingURL=supports-color.mjs.map