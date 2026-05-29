/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: separator
 * Base block: separator
 * Source: https://www.abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns:
 *   - <hr> or <hr class="cmp-separator__line">
 *   - <div class="cmp-separator"> ... empty spacing div ...
 *
 * Library structure: 1 column, 1 row — single field-comment row.
 * UE Model fields:
 *   showLine (boolean) — true to render a visible <hr>, false for pure spacing
 *
 * Variant labelling like "separator height 24" is applied at the Section
 * Metadata level (by the sections transformer) — not by this parser.
 *
 * Analytics: none typical for separators; passed through if present.
 * Accessibility: aria-hidden=true is implicit since separator is decorative spacing.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // showLine = true if a visible <hr> is in the DOM; false for purely vertical spacing
  const hasVisibleLine = !!element.querySelector('hr, .cmp-separator__line')
    || element.tagName === 'HR';

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
    row('showLine', hasVisibleLine),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'separator', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
