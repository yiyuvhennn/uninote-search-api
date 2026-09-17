type CacheItem<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheItem<unknown>>();
const MAX_CACHE_ENTRIES = 500;

function removeExpiredItems() {
  const now = Date.now();
  for (const [key, item] of cache) {
    if (now > item.expiresAt) cache.delete(key);
  }
}

export function getCache<T = unknown>(key: string): T | null {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }

  return item.data as T;
}

export function setCache<T = unknown>(
  key: string,
  data: T,
  ttlSeconds = 60
) {
  removeExpiredItems();
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }

  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function clearCache() {
  cache.clear();
}