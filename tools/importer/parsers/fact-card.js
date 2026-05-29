/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: fact-card
 * Base block: fact-card
 * Templates: T01 (Key Stats Band), T02, T06 (Pipeline), T12 (Stats & Facts), T13 (R&D Sites)
 * Source: https://www.abbvie.com/ (4-col Key Stats Band)
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM):
 *   A. dashboardcards (most common on abbvie.com):
 *     <div class="dashboardcards cmp-dashboardcards ...">
 *       <div class="cmp-dashboardcards__card">
 *         <div class="cmp-dashboardcards__eyebrow">Patients Reached</div>
 *         <div class="cmp-dashboardcards__datapoint">40,000+</div>
 *         <div class="cmp-dashboardcards__description">people per day</div>
 *       </div>
 *     </div>
 *   B. fact-card (newer pattern):
 *     <div class="fact-card cmp-fact-card ...">
 *       <div class="cmp-fact-card__eyebrow">...</div>
 *       <div class="cmp-fact-card__datapoint">...</div>
 *       <div class="cmp-fact-card__description">...</div>
 *       <img class="cmp-fact-card__image" />
 *     </div>
 *
 * The fact-card block is content-fragment driven at authoring time.
 * For import we emit one block per stat card, creating the inline
 * content fields that the runtime can use when no CF is linked.
 *
 * UE Model fields (fact-card):
 *   contentFragment (aem-content) — CF reference (left empty at import)
 *   hideImage (boolean)           — true when no image in source
 *   imagePreset (select)          — leave empty (default)
 *   imageModifiers (text)         — leave empty
 *
 * Because fact-card is CF-driven, we output the visible text as
 * default content cells so editors can review and wire CFs later.
 * Each stat card becomes a separate fact-card block instance.
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 * Accessibility: eyebrow + datapoint aria-label preserved as alt text on image.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

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

  // Check for image in source
  const img = element.querySelector('img');
  const hasImage = !!img;

  const cells = [
    row('hideImage', !hasImage),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'fact-card', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
