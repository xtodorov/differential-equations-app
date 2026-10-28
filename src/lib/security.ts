const windows = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, limit: number, interval = 60000) {
  const now = Date.now();
  if (windows.size > 10000)
    for (const [k, v] of windows) if (v.until < now) windows.delete(k);
  const old = windows.get(key);
  if (!old || old.until < now) {
    windows.set(key, { count: 1, until: now + interval });
    return true;
  }
  if (old.count >= limit) return false;
  old.count++;
  return true;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  return origin === expected;
}
