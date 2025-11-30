import { summoner } from "@scout-for-lol/report/dataDragon/summoner.ts";
import { test, expect } from "bun:test";

test("should be able to get champion data", () => {
  expect(summoner).toMatchSnapshot();
});
