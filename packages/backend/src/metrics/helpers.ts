/**
 * Helper utilities for instrumenting code with Prometheus metrics
 */

/**
 * Wraps an async function with metric collection for duration and success/error counting
 *
 * @example
 * ```typescript
 * const wrappedFn = withMetrics(
 *   myAsyncFunction,
 *   {
 *     counter: myCounter,
 *     histogram: myHistogram,
 *     labels: { operation: "my_operation" }
 *   }
 * );
 *
 * await wrappedFn(arg1, arg2);
 * ```
 */
export function withMetrics<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: {
    counter: {
      inc: (labels: { status: string; [key: string]: string }) => void;
    };
    histogram?: {
      observe: (labels: { [key: string]: string }, value: number) => void;
    };
    labels: { [key: string]: string };
  }
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const duration = (Date.now() - startTime) / 1000;

      // Record success
      options.counter.inc({ ...options.labels, status: "success" });

      if (options.histogram) {
        options.histogram.observe(options.labels, duration);
      }

      return result;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;

      // Record error
      options.counter.inc({ ...options.labels, status: "error" });

      if (options.histogram) {
        options.histogram.observe(options.labels, duration);
      }

      throw error;
    }
  };
}

/**
 * Creates a timer that can be stopped to record duration
 *
 * @example
 * ```typescript
 * const timer = startTimer(myHistogram, { operation: "my_operation" });
 * // ... do work ...
 * timer.stop();
 * ```
 */
export function startTimer(
  histogram: {
    observe: (labels: { [key: string]: string }, value: number) => void;
  },
  labels: { [key: string]: string }
): { stop: () => number } {
  const startTime = Date.now();

  return {
    stop: () => {
      const duration = (Date.now() - startTime) / 1000;
      histogram.observe(labels, duration);
      return duration;
    },
  };
}

