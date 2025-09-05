// Idempotency cache for preventing duplicate write operations
const requestCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Store request result
export function cacheRequest(requestId, result) {
  if (!requestId) return;
  
  requestCache.set(requestId, {
    result,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL
  });
  
  // Clean up expired entries
  cleanupExpired();
}

// Get cached request result
export function getCachedRequest(requestId) {
  if (!requestId) return null;
  
  const cached = requestCache.get(requestId);
  if (!cached) return null;
  
  // Check if expired
  if (cached.expiresAt < Date.now()) {
    requestCache.delete(requestId);
    return null;
  }
  
  return cached.result;
}

// Clean up expired entries
function cleanupExpired() {
  const now = Date.now();
  for (const [id, data] of requestCache.entries()) {
    if (data.expiresAt < now) {
      requestCache.delete(id);
    }
  }
}

// Get cache stats
export function getCacheStats() {
  cleanupExpired();
  return {
    size: requestCache.size,
    entries: Array.from(requestCache.entries()).map(([id, data]) => ({
      id,
      age: Date.now() - data.timestamp,
      expiresIn: data.expiresAt - Date.now()
    }))
  };
}

// Clear cache (for testing)
export function clearCache() {
  requestCache.clear();
}