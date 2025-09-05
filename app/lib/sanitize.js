// Sanitization utilities for user input

export function sanitizeText(text, maxLength = 2000) {
  if (!text) return '';
  
  // Convert to string and remove dangerous content
  let clean = String(text)
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers (onclick, onmouseover, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Remove data URIs that could contain scripts
    .replace(/data:text\/html[^,]*,/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript:/gi, '')
    // Remove about: protocol
    .replace(/about:/gi, '');
  
  // Trim whitespace and limit length
  clean = clean.trim();
  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  
  return clean;
}

export function sanitizeCard(data) {
  const sanitized = {
    ...data
  };
  
  // Sanitize text fields with appropriate max lengths
  if (data.title !== undefined) {
    sanitized.title = sanitizeText(data.title, 100);
  }
  
  if (data.desc !== undefined || data.description !== undefined) {
    sanitized.desc = sanitizeText(data.desc || data.description, 2000);
    sanitized.description = sanitized.desc;
  }
  
  if (data.owner !== undefined) {
    sanitized.owner = sanitizeText(data.owner, 50);
  }
  
  // Sanitize arrays
  if (data.labels && Array.isArray(data.labels)) {
    sanitized.labels = data.labels.map(label => sanitizeText(label, 30));
  }
  
  if (data.assignees && Array.isArray(data.assignees)) {
    sanitized.assignees = data.assignees.map(assignee => sanitizeText(assignee, 50));
  }
  
  return sanitized;
}

export function sanitizeColumn(data) {
  const sanitized = {
    ...data
  };
  
  if (data.name !== undefined) {
    sanitized.name = sanitizeText(data.name, 50);
  }
  
  if (data.newName !== undefined) {
    sanitized.newName = sanitizeText(data.newName, 50);
  }
  
  return sanitized;
}

export function sanitizeComment(data) {
  const sanitized = {
    ...data
  };
  
  if (data.text !== undefined) {
    sanitized.text = sanitizeText(data.text, 500);
  }
  
  if (data.author !== undefined) {
    sanitized.author = sanitizeText(data.author, 50);
  }
  
  return sanitized;
}