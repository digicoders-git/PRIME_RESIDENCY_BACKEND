const cache = new Map();

/**
 * Helper to generate a unique cache key based on route context and query params.
 */
const getCacheKey = (prefix, req) => {
    // Sort query keys to ensure same queries in different orders hit the same cache
    const sortedQuery = {};
    if (req.query) {
        Object.keys(req.query)
            .sort()
            .forEach(key => {
                sortedQuery[key] = req.query[key];
            });
    }
    const queryStr = JSON.stringify(sortedQuery);
    
    // Incorporate the authenticated user's property context if available (critical for Manager roles!)
    const userProperty = (req.user && req.user.property) || '';
    const userRole = (req.user && req.user.role) || '';
    
    return `${prefix}:${req.baseUrl || ''}${req.path}:${queryStr}:${userProperty}:${userRole}`;
};

/**
 * Express middleware to cache responses in memory.
 * @param {string} keyPrefix - The prefix for the cache key namespace (e.g., 'rooms', 'gallery').
 * @param {number} ttlSeconds - Time-To-Live in seconds (defaults to 300 seconds / 5 minutes).
 */
const cacheMiddleware = (keyPrefix, ttlSeconds = 300) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = getCacheKey(keyPrefix, req);
        const cached = cache.get(key);

        if (cached) {
            // Check if expired
            if (Date.now() < cached.expiry) {
                // console.log(`[CACHE HIT] ${req.method} ${req.originalUrl} - returning cached data`);
                return res.status(200).json(cached.data);
            } else {
                // Delete expired cache entry
                cache.delete(key);
            }
        }

        // Intercept res.json to cache the response data before sending it
        const originalJson = res.json;
        res.json = function (body) {
            // Only cache successful responses (2xx) and check that body is not an error response
            if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
                cache.set(key, {
                    data: body,
                    expiry: Date.now() + (ttlSeconds * 1000)
                });
                // console.log(`[CACHE SET] Cached response for key: ${key} for ${ttlSeconds} seconds.`);
            }
            return originalJson.call(this, body);
        };

        next();
    };
};

/**
 * Clears cache keys that start with the given prefix namespace.
 * @param {string} keyPrefix - The prefix of keys to invalidate (e.g., 'rooms', 'gallery').
 */
const clearCache = (keyPrefix) => {
    let count = 0;
    for (const key of cache.keys()) {
        if (key.startsWith(keyPrefix)) {
            cache.delete(key);
            count++;
        }
    }
    if (count > 0) {
        console.log(`[CACHE CLEAR] Invalidated ${count} cache entries for prefix namespace: "${keyPrefix}"`);
    }
};

module.exports = {
    cacheMiddleware,
    clearCache
};
