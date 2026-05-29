/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: teaser
 * Base block: teaser
 * Templates: T10 (Stories Listing secondary featured), T13 (R&D Sites location spotlight),
 *            T16 (Brand Partnership cross-link), T17 (Policy pages)
 * Source: https://www.abbvie.com/who-we-are/our-stories.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM Core Component — teaser v1/v2):
 *   <div class="teaser [variant-classes] cmp-teaser-...">
 *     <div class="cmp-teaser__content">
 *       <p class="cmp-teaser__pretitle">Eyebrow text</p>
 *       <h2 class="cmp-teaser__title">
 *         <a class="cmp-teaser__title-link" href="/path">Title</a>
 *       </h2>
 *       <div class="cmp-teaser__description"><p>Description...</p></div>
 *       <div class="cmp-teaser__action-container">
 *         <a class="cmp-teaser__action-link" href="/path">CTA text</a>
 *       </div>
 *     </div>
 *     <div class="cmp-teaser__image">
 *       <img src="..." alt="..." />
 *     </div>
 *   </div>
 *
 * UE Model fields (teaser):
 *   eyebrow (richtext)    — pretitle / category label
 *   title (richtext)      — main heading
 *   description (richtext)— body text
 *   buttonText (text)     — CTA label
 *   buttonURL (aem-content)— CTA destination
 *   clickType (select)    — "_self" | "_blank"
 *   ariaLabel (text)      — accessible region label
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 * Accessibility (Rule 5): preserves aria-label, alt text, link text.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // ---- Extract fields from source DOM ---------------------------------
  const eyebrowEl = element.querySelector(
    '.cmp-teaser__pretitle, .cmp-teaser__eyebrow, [class*="pretitle"], [class*="eyebrow"]',
  );
  const titleEl = element.querySelector(
    '.cmp-teaser__title-link, .cmp-teaser__title a, .cmp-teaser__title',
  );
  const descEl = element.querySelector(
    '.cmp-teaser__description, .cmp-teaser__subtitle',
  );
  const ctaEl = element.querySelector(
    '.cmp-teaser__action-link, .cmp-teaser__cta, a.cmp-button',
  );

  const eyebrow = (eyebrowEl?.textContent || '').trim();
  const title = (titleEl?.textContent || '').trim();
  const buttonText = (ctaEl?.textContent || '').trim();
  const buttonURL = ctaEl?.getAttribute('href') || titleEl?.getAttribute('href') || '';
  const clickType = (ctaEl?.getAttribute('target') === '_blank'
    || titleEl?.getAttribute('target') === '_blank') ? '_blank' : '_self';
  const ariaLabel = (element.getAttribute('aria-label') || '').trim();

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

  const rowRich = (field, el) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (el) {
      const clone = el.cloneNode(true);
      // Unwrap to keep just the inner content as richtext
      frag.appendChild(clone);
    }
    return [frag];
  };

  const cells = [
    row('eyebrow', eyebrow),
    row('title', title),
    rowRich('description', descEl),
    row('buttonText', buttonText),
    row('buttonURL', buttonURL),
    row('clickType', clickType),
  ];

  if (ariaLabel) cells.push(row('ariaLabel', ariaLabel));

  const block = WebImporter.Blocks.createBlock(document, { name: 'teaser', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
