import { Stat } from "@scout-for-lol/report/html/champion/shared/stat.tsx";

export function Gold({ value, durationInMinutes }: { value: number; durationInMinutes: number }) {
  const rateValue = value / durationInMinutes || 0;
  const mainValue = `${value.toLocaleString()} gold`;

  return <Stat mainValue={mainValue} rateValue={rateValue} rateLabel="/ min" ratePrecision={0} />;
}
