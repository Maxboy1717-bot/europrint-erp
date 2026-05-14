/**
 * @module sanitize
 * @description Frontend utility / library module.
 */

import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML strings using DOMPurify to prevent XSS attacks
 * Allows safe HTML tags like b, i, em, strong, a, ul, ol, li, br, p
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'p', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(html, config);
}

/**
 * Strips all HTML tags from text, returning plain text
 * Useful for contexts where HTML should not be rendered
 * @param text - Text that may contain HTML
 * @returns Plain text with all HTML tags removed
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}
