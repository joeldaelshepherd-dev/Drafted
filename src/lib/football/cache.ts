/**
 * Tiny TTL cache + token-bucket rate limiter shared by provider adapters.
 * Keeps us under provider quotas (API-Football free tier is ~100 req/day,
 * paid tiers per-minute) without a Redis dependency for the scaffold.
 *
 * TODO(drafted): swap the in-memory store for Upstash/Vercel KV in production
 * so the cache survives across serverless invocations.
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const value = await loader();
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return value;
}

export function invalidate(prefix: string): void {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}

// ── Token bucket ─────────────────────────────────────────────────────────
class RateLimiter {
  private tokens: number;
  private last = Date.now();
  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {
    this.tokens = capacity;
  }
  async take(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitMs = ((1 - this.tokens) / this.refillPerSec) * 1000;
    await new Promise((r) => setTimeout(r, waitMs));
    this.refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }
  private refill() {
    const now = Date.now();
    this.tokens = Math.min(
      this.capacity,
      this.tokens + ((now - this.last) / 1000) * this.refillPerSec,
    );
    this.last = now;
  }
}

// API-Football: ~300/min on paid plans → 5/sec, burst 10.
export const apiFootballLimiter = new RateLimiter(10, 5);
