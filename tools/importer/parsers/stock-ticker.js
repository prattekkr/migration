/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: stock-ticker
 * Base block: stock-ticker
 * Templates: T01 (section 10), T02 (section 7)
 * Source: https://www.abbvie.com/ (Investor Resources + Stock Ticker)
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM):
 *   <div class="stock-ticker cmp-stock-ticker ...">
 *     <div class="cmp-stock-ticker__source-label">Source: NYSE</div>
 *     <div class="cmp-stock-ticker__data">
 *       <span class="cmp-stock-ticker__symbol">ABBV</span>
 *       <span class="cmp-stock-ticker__price">...</span>
 *       <span class="cmp-stock-ticker__change">...</span>
 *     </div>
 *   </div>
 *
 * The stock-ticker block fetches live data at runtime — only the
 * sourceLabel field needs to be set at authoring time.
 *
 * UE Model fields (stock-ticker):
 *   sourceLabel (text) — e.g. "Source: NYSE" (extracted from DOM)
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  const sourceLabelEl = element.querySelector(
    '.cmp-stock-ticker__source-label, .cmp-stock-ticker__source, [class*="source-label"], [class*="source"]',
  );
  const sourceLabel = (sourceLabelEl?.textContent || 'Source: NYSE').trim();

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
    row('sourceLabel', sourceLabel),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'stock-ticker', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
