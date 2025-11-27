import { Suspense } from "react";
import App from "./app";

/**
 * Review tool app wrapped with suspense for React 19 async data loading
 */
export default function AppWithSuspense() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-900 dark:text-white">Loading...</div>}>
      <App />
    </Suspense>
  );
}
