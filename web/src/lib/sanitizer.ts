// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import DOMPurify from "dompurify";

/**
 * Configures DOMPurify for safe HTML sanitization
 */
export function createSanitizer() {
  // Configure DOMPurify to be extra strict
  const config: any = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "span",
      "div",
      "a",
      "b",
      "i",
      "u",
      "strong",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "hr",
    ],
    ALLOWED_ATTR: [
      "href",
      "title",
      "target",
      "rel",
      "class",
      "id",
      "src",
      "alt",
      "width",
      "height",
    ],
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: true,
    SANITIZE_DOM: true,
    IN_PLACE: false,
    USE_PROFILES: { html: true },
    // Prevent XSS through SVG
    FORBID_TAGS: [
      "svg",
      "math",
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "form",
      "input",
    ],
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "style",
    ],
  };

  return {
    /**
     * Sanitizes HTML string for safe rendering
     */
    sanitizeHTML(dirty: string): string {
      return DOMPurify.sanitize(dirty, config) as unknown as string;
    },

    /**
     * Sanitizes HTML and strips all tags, returning plain text
     */
    sanitizeToText(dirty: string): string {
      const cleaned = DOMPurify.sanitize(dirty, {
        ...config,
        ALLOWED_TAGS: [],
        KEEP_CONTENT: true,
      });
      return cleaned as unknown as string;
    },

    /**
     * Sanitizes markdown-specific content
     */
    sanitizeMarkdown(markdown: string): string {
      // First pass: sanitize any HTML within markdown
      const sanitized = DOMPurify.sanitize(markdown, {
        ...config,
        ALLOWED_TAGS: [
          ...(config.ALLOWED_TAGS || []),
          "kbd",
          "sup",
          "sub",
          "mark",
        ],
        // Allow data URLs for images in markdown
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      });

      return sanitized as unknown as string;
    },

    /**
     * Checks if a URL is safe
     */
    isSafeURL(url: string): boolean {
      try {
        const parsed = new URL(url);
        const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
        return allowedProtocols.includes(parsed.protocol);
      } catch {
        return false;
      }
    },
  };
}

// Export a singleton instance
export const sanitizer = createSanitizer();
