import { UUIDTypes } from './types.d.ts';
export { DNS, URL } from './v35.d.ts';
declare function v5(value: string | Uint8Array, namespace: UUIDTypes, buf?: undefined, offset?: number): string;
declare function v5<TBuf extends Uint8Array = Uint8Array>(value: string | Uint8Array, namespace: UUIDTypes, buf: TBuf, offset?: number): TBuf;
declare namespace v5 {
    var DNS: string;
    var URL: string;
}
export default v5;
