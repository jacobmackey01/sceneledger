export function createRequestGuard({
  maxConcurrent = 2,
  maxRequests = 3,
  windowMs = 15 * 60 * 1000,
  now = () => Date.now(),
} = {}) {
  let active = 0;
  const requests = new Map();

  function tryEnter(key) {
    const timestamp = now();
    const recent = (requests.get(key) || []).filter((value) => timestamp - value < windowMs);

    if (recent.length >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (timestamp - recent[0])) / 1000));
      requests.set(key, recent);
      return { ok: false, status: 429, retryAfterSeconds };
    }

    if (active >= maxConcurrent) {
      return { ok: false, status: 503, retryAfterSeconds: 10 };
    }

    recent.push(timestamp);
    requests.set(key, recent);
    active += 1;
    let released = false;

    return {
      ok: true,
      release() {
        if (released) return;
        released = true;
        active = Math.max(0, active - 1);
      },
    };
  }

  return { tryEnter };
}
