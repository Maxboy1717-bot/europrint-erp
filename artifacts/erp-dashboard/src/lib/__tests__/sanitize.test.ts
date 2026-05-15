/**
 * @module sanitize.test
 * @description Vitest tests for HTML sanitisation helpers.
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeText } from '../sanitize';

describe('sanitizeHtml', () => {
  it('passes safe formatting tags through unchanged', () => {
    expect(sanitizeHtml('<b>hi</b>')).toBe('<b>hi</b>');
  });

  it('strips <script> tags', () => {
    const out = sanitizeHtml('<p>safe</p><script>alert(1)</script>');
    expect(out).toContain('<p>safe</p>');
    expect(out).not.toContain('<script');
  });

  it('removes inline event handlers like onclick', () => {
    const out = sanitizeHtml('<a href="/x" onclick="alert(1)">link</a>');
    expect(out).not.toContain('onclick');
    expect(out).toContain('<a');
  });

  it('preserves allowed link attributes', () => {
    const out = sanitizeHtml('<a href="/x" title="t">link</a>');
    expect(out).toContain('href="/x"');
    expect(out).toContain('title="t"');
  });

  it('removes disallowed tags but keeps their text content', () => {
    const out = sanitizeHtml('<style>body{}</style>hello');
    expect(out).not.toContain('<style');
    expect(out).toContain('hello');
  });
});

describe('sanitizeText', () => {
  it('strips all HTML tags', () => {
    expect(sanitizeText('<b>hello</b>')).toBe('hello');
  });

  it('strips nested HTML', () => {
    expect(sanitizeText('<p><b>X</b></p>')).toBe('X');
  });

  it('removes scripts entirely (default DOMPurify behaviour)', () => {
    const out = sanitizeText('safe<script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).toContain('safe');
  });

  it('passes plain text through unchanged', () => {
    expect(sanitizeText('plain text')).toBe('plain text');
  });

  it('handles empty string', () => {
    expect(sanitizeText('')).toBe('');
  });
});
