import { latestVersion } from "./version.js";
import { test, expect } from "bun:test";

test("should be able to get version", () => {
  expect(latestVersion).toMatchSnapshot();
});
