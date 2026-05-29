/* eslint-disable */
/* global WebImporter */


import { applyAnalytics } from './utils/analytics.js';
/**
 * Parser: quote
 * Base block: quote
 * Source: https://www.abbvie.com/science/our-people.html
 * Generated: 2026-02-27
 * Updated: 2026-03-13 — Align with component model: each field as own row
 * Updated: 2026-05-26 — Renamed quoteType→quoteVariant, attributionTitle→attributionRole
 *                        to match current blocks/quote/_quote.json field names.
 *
 * Quote section with background image, pull quote, and attribution.
 *
 * Library structure: 1 column, N rows — field-comment driven, in model order:
 *   quoteVariant (select)               — "basic" | "content-fragment"
 *   quotation (richtext)                — the quote text
 *   attributionName (text)              — author name
 *   attributionRole (text)              — author title / role
 *   attributionImage (custom-asset)     — author headshot
 *   quoteFragment (aem-content)         — content fragment ref (cf variant)
 *   backgroundImage (custom-asset)      — section background image
 *   backgroundImagePreset (select)      — Feature | Hero | Responsive | Square | Tall | VideoThumbnail
 *   backgroundImageModifiers (text)     — additional image modifiers
 *   backgroundImageAlt (text)           — background image alt text
 *
 * Source DOM: .cmp-quote with .cmp-quote__text and .cmp-quote__author-block
 * Author block has span.author-name and span.author-title (or .cmp-quote__author-name / __author-title)
 * Background image from parent .container via .cmp-container__bg-image
 * Analytics: data-cmp-data-layer, data-track, data-analytics preserved
 * Accessibility: alt text on background image preserved in backgroundImageAlt
 */
export default function parse(element, { document }) {
  // Extract quotation text
  const quoteEl = element.querySelector('.cmp-quote__text')
    || element.querySelector('blockquote')
    || element.querySelector('p');

  // Extract author name and title from AbbVie DOM structure
  // Uses span.author-name and span.author-title inside .cmp-quote__author-block
  const authorName = element.querySelector('.author-name, .cmp-quote__author-name');
  const authorTitle = element.querySelector('.author-title, .cmp-quote__author-title');

  // Find background image in parent container (outside .cmp-quote)
  const container = element.closest('.container') || element.parentElement;
  let bgPicture = null;
  let bgAlt = '';

  if (container) {
    // AEM background image patterns
    const bgImg = container.querySelector('img.cmp-container__bg-image')
      || container.querySelector('img[data-cmp-src]');

    // Fallback: any picture/img in the container that is NOT inside .cmp-quote
    const fallbackImg = !bgImg
      ? [...container.querySelectorAll('picture, img')].find(
          (el) => !el.closest('.cmp-quote') && el !== element && !element.contains(el),
        )
      : null;

    const foundImg = bgImg || fallbackImg;
    if (foundImg) {
      const actualImg = foundImg.tagName === 'IMG' ? foundImg : foundImg.querySelector('img');
      bgAlt = actualImg?.getAttribute('alt') || '';
      bgPicture = foundImg.tagName === 'PICTURE' ? foundImg : (foundImg.closest('picture') || foundImg);

      // Remove from DOM to prevent duplication as section default content
      const bgParent = bgPicture.parentElement;
      if (bgParent) {
        bgParent.removeChild(bgPicture);
        // Clean up empty wrapper <p>
        if (bgParent.tagName === 'P' && !bgParent.childNodes.length) {
          bgParent.parentElement?.removeChild(bgParent);
        }
      }
    }
  }

  // Build N rows — each field is its own row, field-comment driven.

  const row = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (value !== undefined && value !== null && value !== '') {
      if (value instanceof Node) {
        const p = document.createElement('p');
        p.appendChild(value);
        frag.appendChild(p);
      } else {
        const p = document.createElement('p');
        p.textContent = String(value);
        frag.appendChild(p);
      }
    }
    return [frag];
  };

  const cells = [
    row('quoteVariant', 'basic'),
    row('quotation', quoteEl ? quoteEl.textContent.trim() : ''),
    row('attributionName', authorName?.textContent?.trim() || ''),
    row('attributionRole', authorTitle?.textContent?.trim() || ''),
    row('attributionImage', ''),
    row('quoteFragment', ''),
    row('backgroundImage', bgPicture || ''),
    row('backgroundImagePreset', ''),
    row('backgroundImageModifiers', ''),
    row('backgroundImageAlt', bgAlt || ''),
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', cells });

  // Rule 4: Carry analytics from source to block
  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
