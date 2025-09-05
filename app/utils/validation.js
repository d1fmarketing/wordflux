// Validation utilities for security and data integrity

// Sanitize user input to prevent XSS
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove script tags and dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .trim();
}

// Validate column ID
export function validateColumnId(columnId) {
  const validColumns = ['Backlog', 'Doing', 'Done'];
  return validColumns.includes(columnId) ? columnId : null;
}

// Validate card title
export function validateCardTitle(title) {
  if (!title || typeof title !== 'string') return null;
  const sanitized = sanitizeInput(title);
  if (sanitized.length === 0 || sanitized.length > 100) return null;
  return sanitized;
}

// Validate priority
export function validatePriority(priority) {
  const validPriorities = ['h', 'm', 'l'];
  return validPriorities.includes(priority) ? priority : 'm';
}

// Safe prompt with validation
export function safePrompt(message, defaultValue = '') {
  try {
    const input = prompt(message, defaultValue);
    if (input === null) return null;
    return sanitizeInput(input);
  } catch (error) {
    console.error('Prompt error:', error);
    return null;
  }
}

// Validate API response
export function validateApiResponse(response) {
  if (!response) throw new Error('Empty response');
  if (response.error) throw new Error(response.error);
  return response;
}

// Rate limiting helper
const rateLimitMap = new Map();

export function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  rateLimitMap.set(key, userLimit);
  return true;
}

// Validate board structure
export function validateBoard(board) {
  if (!board || typeof board !== 'object') return false;
  if (!Array.isArray(board.columns)) return false;
  
  for (const column of board.columns) {
    if (!column.id || !column.name) return false;
    if (!Array.isArray(column.cards)) return false;
  }
  
  return true;
}

// Clean and validate localStorage access
export function safeLocalStorage(operation, key, value) {
  try {
    if (typeof window === 'undefined') return null;
    
    switch(operation) {
      case 'get':
        return localStorage.getItem(key);
      case 'set':
        if (value !== undefined) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
        return true;
      case 'remove':
        localStorage.removeItem(key);
        return true;
      default:
        return null;
    }
  } catch (error) {
    console.error(`localStorage ${operation} failed:`, error);
    return null;
  }
}