import type { Match } from "../../locale/types.d.ts";
import { ValueSetter } from "./Setter.d.ts";
import type { ParseFlags, ParseResult, ParserOptions } from "./types.d.ts";
export declare abstract class Parser<Value> {
  abstract incompatibleTokens: string[] | "*";
  abstract priority: number;
  subPriority?: number;
  run(
    dateString: string,
    token: string,
    match: Match,
    options: ParserOptions,
  ): {
    setter: ValueSetter<Value>;
    rest: string;
  } | null;
  protected abstract parse(
    dateString: string,
    token: string,
    match: Match,
    options: ParserOptions,
  ): ParseResult<Value>;
  protected validate<DateType extends Date>(
    _utcDate: DateType,
    _value: Value,
    _options: ParserOptions,
  ): boolean;
  protected abstract set<DateType extends Date>(
    date: DateType,
    flags: ParseFlags,
    value: Value,
    options: ParserOptions,
  ): DateType | [DateType, ParseFlags];
}
