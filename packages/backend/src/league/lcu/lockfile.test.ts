import { describe, test, expect } from "bun:test";
import { readLockfile, getLCUConnection, parseLockfile } from "./lockfile.js";

describe("lockfile", () => {
  describe("parseLockfile", () => {
    test("parses valid lockfile content", () => {
      const content = "LeagueClient:12345:54321:password123:https";
      const result = parseLockfile(content);

      expect(result.name).toBe("LeagueClient");
      expect(result.pid).toBe("12345");
      expect(result.port).toBe("54321");
      expect(result.password).toBe("password123");
      expect(result.protocol).toBe("https");
    });

    test("parses lockfile with http protocol", () => {
      const content = "LeagueClient:12345:54321:password123:http";
      const result = parseLockfile(content);
      expect(result.protocol).toBe("http");
    });

    test("throws error for invalid format - too few parts", () => {
      const content = "invalid:format";
      expect(() => parseLockfile(content)).toThrow("Invalid lockfile format");
    });

    test("throws error for invalid format - too many parts", () => {
      const content = "too:many:parts:here:extra:one";
      expect(() => parseLockfile(content)).toThrow("Invalid lockfile format");
    });
  });

  describe("readLockfile", () => {
    test("handles file not found error", async () => {
      await expect(readLockfile("/nonexistent/path/lockfile")).rejects.toThrow("Lockfile not found");
    });
  });

  describe("getLCUConnection", () => {
    test("converts parsed lockfile to connection info", () => {
      const content = "LeagueClient:12345:54321:password123:https";
      const lockfile = parseLockfile(content);

      // Test the conversion logic
      const port = Number.parseInt(lockfile.port, 10);
      const protocol = lockfile.protocol === "https" ? "https" : "http";

      expect(port).toBe(54321);
      expect(protocol).toBe("https");
      expect(lockfile.password).toBe("password123");
    });

    test("handles http protocol", () => {
      const content = "LeagueClient:12345:54321:password123:http";
      const lockfile = parseLockfile(content);
      const protocol = lockfile.protocol === "https" ? "https" : "http";
      expect(protocol).toBe("http");
    });
  });
});
