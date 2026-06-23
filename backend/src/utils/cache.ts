type CacheItem<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheItem<unknown>>();

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
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function clearCache() {
  cache.clear();
}