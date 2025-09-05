import { useState, useEffect } from 'react';

// Hook to manage CSRF token
export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState(null);
  
  useEffect(() => {
    // Fetch CSRF token on mount
    const fetchToken = async () => {
      try {
        const res = await fetch('/api/csrf/token');
        if (res.ok) {
          const data = await res.json();
          setCSRFToken(data.token);
        }
      } catch (err) {
        console.warn('Failed to fetch CSRF token:', err);
      }
    };
    
    fetchToken();
  }, []);
  
  // Helper function to add CSRF token to request headers
  const withCSRF = (options = {}) => {
    if (!csrfToken) return options;
    
    return {
      ...options,
      headers: {
        ...options.headers,
        'X-CSRF-Token': csrfToken
      }
    };
  };
  
  return { csrfToken, withCSRF };
}

// Global CSRF token storage for non-component code
let globalCSRFToken = null;

export async function getGlobalCSRFToken() {
  if (globalCSRFToken) return globalCSRFToken;
  
  try {
    const res = await fetch('/api/csrf/token');
    if (res.ok) {
      const data = await res.json();
      globalCSRFToken = data.token;
      return globalCSRFToken;
    }
  } catch (err) {
    console.warn('Failed to fetch global CSRF token:', err);
  }
  
  return null;
}

// Helper to add CSRF to fetch options
export async function addCSRFToRequest(options = {}) {
  const token = await getGlobalCSRFToken();
  
  if (!token) return options;
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token
    }
  };
}