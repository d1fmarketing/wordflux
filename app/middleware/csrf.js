// CSRF protection middleware
import crypto from 'crypto';

// Store CSRF tokens (in production, use Redis or similar)
const csrfTokens = new Map();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// Generate CSRF token
export function generateCSRFToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + TOKEN_EXPIRY;
  
  csrfTokens.set(token, {
    sessionId,
    expiry
  });
  
  // Clean expired tokens
  cleanExpiredTokens();
  
  return token;
}

// Validate CSRF token
export function validateCSRFToken(token, sessionId) {
  const tokenData = csrfTokens.get(token);
  
  if (!tokenData) {
    return false;
  }
  
  if (tokenData.expiry < Date.now()) {
    csrfTokens.delete(token);
    return false;
  }
  
  if (tokenData.sessionId !== sessionId) {
    return false;
  }
  
  // Token is valid, delete it (one-time use)
  csrfTokens.delete(token);
  return true;
}

// Clean expired tokens
function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (data.expiry < now) {
      csrfTokens.delete(token);
    }
  }
}

// Middleware to check CSRF for state-changing requests
export function csrfMiddleware(request) {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }
  
  // Get CSRF token from header or body
  const token = request.headers.get('x-csrf-token');
  
  if (!token) {
    return { 
      valid: false, 
      error: 'CSRF token missing' 
    };
  }
  
  // Get session ID (from cookie, header, etc.)
  // This is a simplified example - implement proper session management
  const sessionId = request.headers.get('x-session-id') || 'default';
  
  const isValid = validateCSRFToken(token, sessionId);
  
  return {
    valid: isValid,
    error: isValid ? null : 'Invalid CSRF token'
  };
}

// Helper to add CSRF protection to API routes
export function withCSRFProtection(handler) {
  return async (request, context) => {
    const csrfCheck = csrfMiddleware(request);
    
    if (!csrfCheck.valid) {
      return new Response(
        JSON.stringify({ error: csrfCheck.error }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request, context);
  };
}