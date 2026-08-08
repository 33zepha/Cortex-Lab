export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly options: {
      maxAttempts: number;
      windowMs: number;
      maxKeys?: number;
    },
  ) {}

  consume(key: string, now = Date.now()): RateLimitDecision {
    this.prune(now);
    const existing = this.buckets.get(key);
    const bucket = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + this.options.windowMs };

    bucket.count += 1;
    this.buckets.set(key, bucket);

    if (bucket.count <= this.options.maxAttempts) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  private prune(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }

    const maxKeys = this.options.maxKeys ?? 5_000;
    if (this.buckets.size < maxKeys) return;
    const oldest = [...this.buckets.entries()].sort((left, right) => left[1].resetAt - right[1].resetAt).slice(0, Math.ceil(maxKeys / 10));
    for (const [key] of oldest) this.buckets.delete(key);
  }
}
