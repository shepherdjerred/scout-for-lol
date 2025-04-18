import type {
  FirstWeekContainsDateOptions,
  Locale,
  LocalizedOptions,
  WeekOptions,
} from "../types.d.ts";
export type DefaultOptions = LocalizedOptions<keyof Locale> &
  WeekOptions &
  FirstWeekContainsDateOptions;
export declare function getDefaultOptions(): DefaultOptions;
export declare function setDefaultOptions(newOptions: DefaultOptions): void;
