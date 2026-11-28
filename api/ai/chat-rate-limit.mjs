const DEFAULT_LIMIT = 15;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_TRACKED_USERS = 10_000;
const CLEANUP_EVERY = 128;

export function createRateLimiter(options = {}) {
  const limit = Number.isInteger(options.limit) && options.limit > 0
    ? options.limit
    : DEFAULT_LIMIT;
  const windowMs = Number.isInteger(options.windowMs) && options.windowMs > 0
    ? options.windowMs
    : DEFAULT_WINDOW_MS;
  const maxTrackedUsers = Number.isInteger(options.maxTrackedUsers) && options.maxTrackedUsers > 0
    ? options.maxTrackedUsers
    : DEFAULT_MAX_TRACKED_USERS;
  const now = typeof options.now === 'function' ? options.now : Date.now;
  const counters = new Map();
  let callsSinceCleanup = 0;

  function pruneExpired(currentTime) {
    for (const [userId, counter] of counters) {
      if (currentTime - counter.windowStartedAt >= windowMs) {
        counters.delete(userId);
      }
    }
  }

  function allow(userId) {
    if (typeof userId !== 'string' || !userId.trim()) return false;

    const currentTime = now();
    callsSinceCleanup += 1;
    if (callsSinceCleanup >= CLEANUP_EVERY) {
      pruneExpired(currentTime);
      callsSinceCleanup = 0;
    }

    const current = counters.get(userId);
    if (current && currentTime - current.windowStartedAt < windowMs) {
      if (current.count >= limit) return false;
      current.count += 1;
      return true;
    }

    if (current) counters.delete(userId);
    if (counters.size >= maxTrackedUsers) pruneExpired(currentTime);

    // Fail closed when capacity is exhausted rather than evicting an active
    // user's counter and accidentally allowing that user to bypass the limit.
    if (counters.size >= maxTrackedUsers) return false;

    counters.set(userId, { count: 1, windowStartedAt: currentTime });
    return true;
  }

  return {
    allow,
    get size() {
      return counters.size;
    },
  };
}

const assistantRateLimiter = createRateLimiter();

export function allowAssistantRequest(userId) {
  return assistantRateLimiter.allow(userId);
}
