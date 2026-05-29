/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: custom-image
 * Base block: custom-image
 * Source: https://www.abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns:
 *   - <div class="cmp-image"><picture><img alt="..." src="..."></picture></div>
 *   - <div class="cmp-image" data-cmp-src="..."> (lazy loaded)
 *   - <a class="cmp-image__link" href="..."><img>...</a> (linked image)
 *
 * Library structure: 1 column, N rows — field-comment driven.
 * UE Model fields (matches blocks/custom-image/_custom-image.json):
 *   image (reference)               — the picture/img
 *   imageAlt (text, required)       — alternative text
 *   getAltFromDAM (boolean)
 *   imageIsDecorative (boolean)
 *   caption (text)                   — visible caption text
 *   getCaptionFromDAM (boolean)
 *   displayCaptionBelowImage (boolean)
 *   enableLink (boolean)
 *   target (aem-content, conditional) — link target URL
 *   clickBehavior (select)            — _self | _blank | modal | hidden-panel
 *   modalPanelId (text)
 *   enableWarnOnLeave (boolean)
 *   warnOnLeavePath (aem-content)
 *   linkAriaLabel (text)
 *
 * Analytics: data-cmp-data-layer preserved on block element.
 * Accessibility: alt always extracted; if role=presentation set imageIsDecorative.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  const img = element.querySelector('img');
  const picture = element.querySelector('picture') || img?.closest('picture') || img;

  // Lazy-loaded AEM images carry data-cmp-src; promote to actual src
  if (img) {
    const lazySrc = img.getAttribute('data-cmp-src');
    if (lazySrc && !img.getAttribute('src')) img.setAttribute('src', lazySrc);
  }

  const alt = (img?.getAttribute('alt') || '').trim();
  const isDecorative = (img?.getAttribute('role') === 'presentation')
    || (img?.getAttribute('aria-hidden') === 'true');

  // Caption — adjacent figcaption / .cmp-image__caption
  const captionEl = element.querySelector('figcaption, .cmp-image__caption');
  const caption = (captionEl?.textContent || '').trim();

  // Link wiring
  const linkAnchor = element.querySelector('a[href].cmp-image__link, a[href]:has(img)') || null;
  const enableLink = !!linkAnchor;
  const targetHref = linkAnchor?.getAttribute('href') || '';
  const linkAriaLabel = linkAnchor?.getAttribute('aria-label') || '';
  const targetAttr = linkAnchor?.getAttribute('target') || '_self';
  const clickBehavior = targetAttr === '_blank' ? '_blank' : '_self';

  const fieldRow = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (value !== undefined && value !== null && value !== '') {
      if (value instanceof Node) {
        const p = document.createElement('p');
        p.appendChild(value);
        frag.appendChild(p);
      } else {
        const p = document.createElement('p');
        p.textContent = typeof value === 'boolean' ? String(value) : String(value);
        frag.appendChild(p);
      }
    }
    return [frag];
  };

  const cells = [
    fieldRow('image', picture),
    fieldRow('imageAlt', alt),
    fieldRow('getAltFromDAM', false),
    fieldRow('imageIsDecorative', isDecorative),
    fieldRow('caption', caption),
    fieldRow('getCaptionFromDAM', false),
    fieldRow('displayCaptionBelowImage', !!caption),
    fieldRow('enableLink', enableLink),
    fieldRow('target', targetHref),
    fieldRow('clickBehavior', clickBehavior),
    fieldRow('modalPanelId', ''),
    fieldRow('enableWarnOnLeave', false),
    fieldRow('warnOnLeavePath', ''),
    fieldRow('linkAriaLabel', linkAriaLabel),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'custom-image', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
