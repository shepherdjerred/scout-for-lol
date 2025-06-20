import type { ZodErrorMap } from "./ZodError.d.ts";
import defaultErrorMap from "./locales/en.d.ts";
export { defaultErrorMap };
export declare function setErrorMap(map: ZodErrorMap): void;
export declare function getErrorMap(): ZodErrorMap;
