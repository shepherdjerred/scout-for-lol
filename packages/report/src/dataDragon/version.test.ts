import { latestVersion } from "@scout-for-lol/report/dataDragon/version.js";
import { test, expect } from "bun:test";

test("should be able to get version", () => {
  expect(latestVersion).toMatchSnapshot();
});
