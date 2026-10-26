interface Bucket {
  count: number;
  resetAt: number;
}

/** Simple process-local rate limiter keyed by arbitrary strings (e.g. user IDs). */
const buckets = new Map<string, Bucket>();

/**
 * Check whether a request is within the allowed limit.
 * Windows are rolling: the first request in a window starts a fresh bucket.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}
