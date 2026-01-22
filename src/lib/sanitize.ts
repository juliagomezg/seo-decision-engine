/**
 * Sanitize input strings for safe inclusion in LLM prompts.
 * Removes control characters and limits length to prevent injection attacks.
 */
export function sanitizeForPrompt(input: string, maxLength = 500): string {
  if (!input) return '';

  return input
    // Remove control characters (ASCII 0-31 and 127)
    .replace(/[\x00-\x1f\x7f]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a keyword input specifically.
 * More restrictive than general prompt sanitization.
 */
export function sanitizeKeyword(input: string): string {
  return sanitizeForPrompt(input, 200);
}

/**
 * Sanitize location input.
 */
export function sanitizeLocation(input: string): string {
  return sanitizeForPrompt(input, 100);
}
