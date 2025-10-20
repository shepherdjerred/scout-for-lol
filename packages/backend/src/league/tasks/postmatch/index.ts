import { checkMatchHistory } from "./match-history-polling.js";

export async function checkPostMatch() {
  console.log("🏁 Starting post-match check task");
  const startTime = Date.now();

  try {
    await checkMatchHistory();

    const executionTime = Date.now() - startTime;
    console.log(`✅ Post-match check completed successfully in ${executionTime.toString()}ms`);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Post-match check failed after ${executionTime.toString()}ms:`, error);
    throw error;
  }
}
