/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: cta
 * Base block: cta
 * Source: https://www.abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html
 * Generated: 2026-05-26
 *
 * AbbVie story / article pages use a "Back to <Listing>" CTA at the top of the
 * intro section (style class `back-cta`). Source DOM patterns observed on
 * AbbVie AEM:
 *   - <a class="cmp-button back-button" href="...">All Stories</a>
 *   - <a class="cmp-breadcrumb__link" href="..."><span>All Stories</span></a>
 *   - <div class="cmp-button"><a class="cmp-button__link"><span>...</span></a></div>
 *
 * Library structure: 1 column, N rows (each field = own row, field-comment driven).
 * UE Model fields:
 *   linkText (text)               — visible button text
 *   link (aem-content)            — target URL
 *   aria-label (text)             — accessible name
 *   ctaTarget (select)            — _self | _blank
 *   iconVariation (select)        — none | icon-font | image
 *   iconFont (text)               — e.g. chevron, play  (conditional)
 *   iconPosition (select)         — before | after      (conditional)
 *   ariaHidden (boolean)          — hide from a11y tree
 *   classes (template literal)    — e.g. "default-cta back-cta" (style variant)
 *
 * Analytics: data-track / data-cmp-data-layer / data-analytics preserved
 * Accessibility: aria-label preserved, target=_blank wiring kept
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // Find the underlying anchor — supports button-wrapped and direct anchor cases
  const anchor = element.tagName === 'A'
    ? element
    : (element.querySelector('a.cmp-button__link, a.cmp-breadcrumb__link, a.back-button, a[href]'));

  // Derive linkText: prefer span text, fall back to anchor textContent
  const labelEl = anchor?.querySelector('.cmp-button__text, span') || anchor;
  const linkText = (labelEl?.textContent || '').trim();
  const href = anchor?.getAttribute('href') || '';
  const targetAttr = anchor?.getAttribute('target') || '_self';
  const ariaLabel = anchor?.getAttribute('aria-label') || '';
  const ariaHidden = anchor?.getAttribute('aria-hidden') === 'true';

  // Detect icon hint from class names (e.g. .has-chevron, .icon-chevron-left)
  let iconFont = '';
  let iconVariation = 'none';
  let iconPosition = 'before';
  if (anchor) {
    const cls = anchor.className || '';
    if (/chevron|arrow-left|back/.test(cls)) {
      iconFont = 'chevron';
      iconVariation = 'icon-font';
      iconPosition = 'before';
    }
  }

  // Style variant — back CTA at top of stories
  // Default to "default-cta back-cta" if explicit class hint present in source
  let classes = 'default-cta';
  const src = (element.className + ' ' + (anchor?.className || '')).toLowerCase();
  if (/back-button|back-cta|breadcrumb/.test(src)) {
    classes = 'default-cta back-cta';
  }

  // Helper to build a single-cell row with a field hint comment
  const row = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (value !== undefined && value !== null && value !== '') {
      const p = document.createElement('p');
      if (value instanceof Node) p.appendChild(value);
      else p.textContent = String(value);
      frag.appendChild(p);
    }
    return [frag];
  };

  const cells = [
    row('linkText', linkText),
    row('link', href),
    row('aria-label', ariaLabel),
    row('ctaTarget', targetAttr),
    row('iconVariation', iconVariation),
    row('iconFont', iconFont),
    row('iconPosition', iconPosition),
    row('ariaHidden', ariaHidden ? 'true' : 'false'),
    row('classes', classes),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'cta', cells });

  // Rule 4: preserve analytics
  applyAnalytics(element, block, document);

  element.replaceWith(block);
}
