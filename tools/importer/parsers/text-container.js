/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: text-container
 * Base block: text-container
 * Source: https://www.abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html
 * Generated: 2026-05-26
 *
 * `text-container` is a container block with child item models:
 *   - text-container-text  (richtext)
 *   - text-container-image (reference + imageAlt)
 *
 * Source DOM patterns on AbbVie AEM:
 *   - .cmp-text                     → text-container-text item
 *   - .cmp-text p, ul, ol, h*       → preserved as-is inside richtext
 *   - .cmp-image / picture / img    → text-container-image item (when inline)
 *
 * Library structure: per child item, one row of two cells:
 *   - text-container-text:   [ <!-- field:text -->,    <richtext-content> ]
 *   - text-container-image:  [ <!-- field:image -->,   <picture/img> ]  +
 *                            [ <!-- field:imageAlt -->,<alt-string> ]
 *
 * This parser emits a single text-container holding all consecutive
 * text/image fragments inside the source element. For story-page body
 * paragraphs (paragraphs only, no inline images) it produces one row per
 * paragraph as text-container-text items.
 *
 * Variant labelling (e.g. "body unica 32 reg", "spacing bottom", "width large",
 * "width x large standard", "width x small") is handled by Section Metadata or
 * by the upstream `block-mapping-manager` skill — the parser does NOT emit
 * variant suffixes on the block name. The sections transformer adds them.
 *
 * Analytics: data-cmp-data-layer preserved at the container level.
 * Accessibility: heading hierarchy + links + alt text inside richtext are kept verbatim.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  const cells = [];

  // Block-level rows: commonProps (removed by applyCommonProps(block, 0))
  cells.push(['']);      // [0] blockId
  cells.push(['none']); // [1] language
  cells.push(['']);      // [2] analyticsId

  // Content rows (after commonProps removal, these become visible)
  const isCmpText = element.matches?.('.cmp-text');
  const hasInlineImage = !!element.querySelector?.('.cmp-image, picture, img');

  if (isCmpText && !hasInlineImage) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = element.innerHTML;
    cells.push([wrapper]);
  } else {
    const candidates = [
      ...element.querySelectorAll(':scope > .cmp-text, :scope > .cmp-image, :scope .cmp-text, :scope .cmp-image, :scope p, :scope ul, :scope ol, :scope picture, :scope img'),
    ];
    const seen = new Set();
    const contentWrapper = document.createElement('div');
    candidates.forEach((node) => {
      if ([...seen].some((s) => s.contains(node))) return;
      seen.add(node);
      if (node.matches?.('.cmp-text')) {
        contentWrapper.innerHTML += node.innerHTML;
      } else {
        contentWrapper.appendChild(node.cloneNode(true));
      }
    });
    cells.push([contentWrapper]);
  }

  if (cells.length === 3) {
    cells.push([document.createElement('p')]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'text-container', cells });
  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
