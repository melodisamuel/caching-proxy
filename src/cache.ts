const cache = new Map<string, any>();

export function getFromCache(key: string) {
    return cache.get(key);
}

export function setToCache(key: string, value: any) {
    cache.set(key, value);
}

export function clearCache() {
    cache.clear(); 
}