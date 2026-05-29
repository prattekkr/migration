/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: eyebrow-text
 * Base block: eyebrow-text
 * Source: https://www.abbvie.com/who-we-are/our-stories/five-technologies-supporting-progress-in-challenging-diseases.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM):
 *   - <p class="cmp-text--pretitle"> / <p class="eyebrow"> / <p class="cmp-text__pretitle">
 *   - <span class="cmp-text-eyebrow"> / <div class="cmp-text-eyebrow">
 *   - <div class="text cmp-text-eyebrow ..."> ... <p>TOPICS</p> ... </div>
 *   - <h2 class="cmp-title__text--eyebrow"> (less common — title-styled eyebrow)
 *
 * Library structure: 1 column, 1 row.
 * UE Model fields (eyebrow-text):
 *   text (richtext) — the eyebrow label, typically a single short phrase
 *
 * Variant labelling ("regular font", "small font", etc.) is applied at the
 * Section Metadata / block-variant level — not by this parser.
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer + data-track to block.
 * Accessibility: eyebrow is a visual cue; the block decoration adds
 *   role="heading" aria-level=2 via blocks/eyebrow-text/eyebrow-text.js.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // Locate the eyebrow text container. Some pages have nested wrappers
  // (component → .cmp-text → <p>); look for the innermost paragraph or span.
  const textEl = element.querySelector('.cmp-text__text p, .cmp-text p, .cmp-text__pretitle, .cmp-text--pretitle, p, span')
    || element;

  // Build the field-comment row with the richtext content (clone <p> so we
  // keep inline formatting if any).
  const row = (field, node) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (node) frag.appendChild(node);
    return [frag];
  };

  let textNode;
  if (textEl.tagName === 'P' || textEl.tagName === 'SPAN') {
    // Preserve as a <p> so the richtext column stores it correctly
    const p = document.createElement('p');
    p.innerHTML = textEl.innerHTML;
    textNode = p;
  } else {
    const p = document.createElement('p');
    p.textContent = textEl.textContent.trim();
    textNode = p;
  }

  // Trim and bail out on empty content so we don't generate an empty block
  if (!textNode.textContent || !textNode.textContent.trim()) {
    element.replaceWith(document.createTextNode(''));
    return;
  }

  const cells = [
    row('text', textNode),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'eyebrow-text', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
