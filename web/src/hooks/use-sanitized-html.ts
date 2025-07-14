import DOMPurify from 'dompurify';
import { useMemo } from 'react';

// Configure DOMPurify options
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'pre', 'code', 'blockquote', 'a', 'strong', 'em',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'width', 'height'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  ADD_TAGS: [],
  ADD_ATTR: [],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
};

export function useSanitizedHTML(html: string): string {
  return useMemo(() => {
    if (!html) return '';
    
    // Add target="_blank" and rel="noopener noreferrer" to all links
    const clean = DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
    
    // Additional safety: ensure no javascript: URLs
    return clean.replace(/javascript:/gi, '');
  }, [html]);
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Remove any HTML tags
  const withoutTags = text.replace(/<[^>]*>/g, '');
  
  // Remove javascript: protocols
  const withoutJS = withoutTags.replace(/javascript:/gi, '');
  
  // Remove any null bytes
  return withoutJS.replace(/\x00/g, '');
}