import { summoner } from "./summoner.js";
import { test, expect } from "bun:test";

test("should be able to get champion data", async () => {
  expect(summoner).toMatchSnapshot();
});
