/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: custom-title
 * Base block: custom-title
 * Source: https://www.abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html
 * Generated: 2026-05-26
 *
 * AbbVie story pages use the `custom-title` block for the page H1 (variant
 * "h1 size") and for in-article subheadings (variant "h5 size, width large").
 *
 * Source DOM patterns:
 *   - .cmp-title h1/h2/h3/h4/h5/h6  (Core Components title)
 *   - .cmp-title-xx-large / -x-large / -large / -medium / -small  (size class)
 *   - Bare <h1>...<h6> within a content section
 *
 * Library structure: 1 column, N rows.
 * UE Model fields:
 *   title (text)       — heading text content
 *   titleType (select) — h1 | h2 | h3 | h4 | h5 | h6
 *
 * Variant size hints (size class on source → CSS variant in EDS):
 *   xx-large → h1 size
 *   x-large  → h2 size
 *   large    → h3 size
 *   medium   → h4 size
 *   (default) → h5 size, width large  (most article body headings)
 *
 * Analytics: data-cmp-data-layer preserved
 * Accessibility: heading level NEVER changed — exact tagName from source kept.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // Find the heading element
  const heading = element.matches('h1, h2, h3, h4, h5, h6')
    ? element
    : element.querySelector('h1, h2, h3, h4, h5, h6, .cmp-title__text');

  const tagName = heading?.tagName?.toLowerCase() || 'h2';
  const titleType = /^h[1-6]$/.test(tagName) ? tagName : 'h2';
  const titleText = (heading?.textContent || '').trim();

  const row = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (value !== undefined && value !== null && value !== '') {
      const p = document.createElement('p');
      p.textContent = String(value);
      frag.appendChild(p);
    }
    return [frag];
  };

  const cells = [
    row('title', titleText),
    row('titleType', titleType),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'custom-title', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
