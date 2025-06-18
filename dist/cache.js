"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFromCache = getFromCache;
exports.setToCache = setToCache;
exports.clearCache = clearCache;
const cache = new Map();
function getFromCache(key) {
    return cache.get(key);
}
function setToCache(key, value) {
    cache.set(key, value);
}
function clearCache() {
    cache.clear();
}
