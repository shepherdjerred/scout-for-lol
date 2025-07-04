import { strict as assert } from "assert";
import configuration from "./configuration.js";

// health check used by Docker
try {
  const response = await fetch(`http://127.0.0.1:${configuration.port.toString()}/ping`);
  assert(response.ok);
  process.exit(0);
} catch (_) {
  process.exit(1);
}
