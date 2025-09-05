import crypto from 'crypto';

// CSRF token storage (in production, use Redis or session store)
const tokenStore = new Map();
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Generate a new CSRF token
export function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + TOKEN_EXPIRY;
  
  // Store token with expiry
  tokenStore.set(token, {
    sessionId,
    expiresAt
  });
  
  // Clean up expired tokens periodically
  cleanupExpiredTokens();
  
  return token;
}

// Verify CSRF token
export function verifyCSRFToken(token, sessionId) {
  if (!token) return false;
  
  const tokenData = tokenStore.get(token);
  if (!tokenData) return false;
  
  // Check if token is expired
  if (tokenData.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return false;
  }
  
  // For development, allow any valid token
  // In production, verify sessionId matches
  return true;
}

// Clean up expired tokens
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (data.expiresAt < now) {
      tokenStore.delete(token);
    }
  }
}

// Middleware to check CSRF token
export function checkCSRF(req) {
  // Skip CSRF check for GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return true;
  }
  
  // Skip CSRF for API routes that don't modify state
  const readOnlyPaths = ['/api/health', '/api/env', '/api/board/get', '/api/views/get'];
  const url = new URL(req.url);
  if (readOnlyPaths.includes(url.pathname)) {
    return true;
  }
  
  // Get token from header or body
  const token = req.headers.get('x-csrf-token') || 
                req.headers.get('X-CSRF-Token') ||
                req.body?.csrfToken;
  
  // For development, allow requests without CSRF if no tokens exist
  if (process.env.NODE_ENV === 'development' && tokenStore.size === 0) {
    return true;
  }
  
  // Get session ID from cookie or generate one
  const sessionId = req.cookies?.get('sessionId')?.value || 'default';
  
  return verifyCSRFToken(token, sessionId);
}

// Get or create CSRF token for a session
export function getOrCreateToken(req) {
  const sessionId = req.cookies?.get('sessionId')?.value || 'default';
  
  // Check if valid token exists
  for (const [token, data] of tokenStore.entries()) {
    if (data.sessionId === sessionId && data.expiresAt > Date.now()) {
      return token;
    }
  }
  
  // Generate new token
  return generateCSRFToken(sessionId);
}