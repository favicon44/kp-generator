/**
 * Простой ограничитель частоты запросов (скользящее окно) в памяти процесса.
 * На serverless каждый инстанс считает отдельно, поэтому это защита от случайного
 * «дребезга» и простого спама. Для продакшена с трафиком — Redis / Upstash.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function check(key: string, now: number = Date.now()): { ok: boolean; retryAfterSec: number } {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      const oldest = recent[0] ?? now;
      hits.set(key, recent);
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
    }
    recent.push(now);
    hits.set(key, recent);

    // Не даём карте разрастаться бесконечно.
    if (hits.size > 5000) {
      for (const [k, times] of hits) {
        if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      }
    }
    return { ok: true, retryAfterSec: 0 };
  };
}
