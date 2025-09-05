// API utility functions for consistent error handling and responses
import { NextResponse } from 'next/server';

// Standard API response helpers
export function apiSuccess(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message, status = 500, details = null) {
  const errorBody = { error: message };
  
  if (details) {
    errorBody.details = details;
  }
  
  // Log error for debugging
  console.error(`[API Error] ${message}`, details || '');
  
  return NextResponse.json(errorBody, { status });
}

// Wrap async route handlers with error catching
export function withErrorHandling(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('[Unhandled API Error]', error);
      
      // Check for known error types
      if (error.name === 'ValidationError') {
        return apiError(error.message, 400, error.details);
      }
      
      if (error.name === 'NotFoundError') {
        return apiError(error.message, 404);
      }
      
      if (error.name === 'ConflictError') {
        return apiError(error.message, 409, error.details);
      }
      
      if (error.name === 'AbortError') {
        return apiError('Request timeout', 408);
      }
      
      // Generic error
      return apiError(
        error.message || 'Internal server error',
        500,
        process.env.NODE_ENV === 'development' ? error.stack : undefined
      );
    }
  };
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ConflictError';
    this.details = details;
  }
}

// Validate required fields
export function validateRequired(data, fields) {
  const missing = [];
  
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing }
    );
  }
  
  return true;
}

// Safe JSON parsing
export async function parseJsonBody(request) {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }
}