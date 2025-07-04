import { summoner } from "./summoner.js";
import { test, expect } from "bun:test";

test("should be able to get champion data", () => {
  expect(summoner).toMatchSnapshot();
});
