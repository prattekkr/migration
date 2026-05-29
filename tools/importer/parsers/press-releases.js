/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: press-releases
 * Base block: press-releases
 * Templates: T01 (Homepage section 1), T02 (Section Landing)
 * Source: https://www.abbvie.com/
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM):
 *   <div class="press-releases cmp-press-releases ...">
 *     <ul class="cmp-press-releases__items">
 *       <li class="cmp-press-releases__item">
 *         <span class="cmp-press-releases__date">Nov 01, 2024</span>
 *         <a class="cmp-press-releases__link" href="/news/...">Headline text</a>
 *       </li>
 *       ...
 *     </ul>
 *   </div>
 *
 * The press-releases block is a data-driven block — at authoring time only
 * numberOfItems is set; the actual release list is fetched from a feed at
 * runtime. The parser therefore only emits the block-level config row.
 *
 * UE Model fields (press-releases):
 *   numberOfItems (number) — how many items to fetch (1-5, default 5)
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 * Accessibility: No static content; runtime-rendered list handled by block JS.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // Detect how many items are actually rendered in the source DOM —
  // use that as the numberOfItems hint (capped at 5 per model max).
  const items = element.querySelectorAll(
    '.cmp-press-releases__item, .press-release-item, li[class*="press-release"]',
  );
  const numberOfItems = Math.min(Math.max(items.length || 5, 1), 5);

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
    row('numberOfItems', numberOfItems),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'press-releases', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
