import * as Sentry from "@sentry/node";

export function logErrors(fn: () => Promise<unknown>) {
  return async () => {
    try {
      await fn();
    } catch (e) {
      Sentry.captureException(e);
      console.error(e);
    }
  };
}
