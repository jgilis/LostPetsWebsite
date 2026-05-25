const MIN_DELAY_MS = 1000;

type QueueEntry<T> = {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

const queue: QueueEntry<unknown>[] = [];
let processing = false;
let lastFinishedAt = 0;

async function drainQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const elapsed = Date.now() - lastFinishedAt;
    const waitMs = Math.max(0, MIN_DELAY_MS - elapsed);
    if (waitMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, waitMs);
      });
    }

    const entry = queue.shift() as QueueEntry<unknown> | undefined;
    if (!entry) break;

    try {
      const value = await entry.run();
      entry.resolve(value);
    } catch (reason) {
      entry.reject(reason);
    }

    lastFinishedAt = Date.now();
  }

  processing = false;
}

export function enqueueReverseGeocodeRequest<T>(
  run: () => Promise<T>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({
      run,
      resolve: resolve as (value: unknown) => void,
      reject,
    });
    void drainQueue();
  });
}
