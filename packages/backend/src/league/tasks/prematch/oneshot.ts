import { checkPreMatch } from "./index";

console.log("🚀 Starting oneshot prematch check");
console.log("⏰ Timestamp:", new Date().toISOString());

try {
  await checkPreMatch();
  console.log("✅ Oneshot prematch check completed successfully");
} catch (error) {
  console.error("❌ Oneshot prematch check failed:", error);
  process.exit(1);
}
