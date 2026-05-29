/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: hero
 * Base block: hero
 * Source: https://www.abbvie.com/science/our-people.html
 * Generated: 2026-02-27
 *
 * Hero uses AbbVie's overlap-predecessor pattern:
 *   - Previous sibling .container.large-radius has the background image
 *   - This element .container.overlap-predecessor has h1 heading and description
 *
 * Library structure: 1 column, 2 rows
 *   Row 1: Background image (field:image)
 *   Row 2: Richtext — heading + description (field:text)
 *
 * UE Model fields: image (reference), imageAlt (collapsed), text (richtext)
 * Analytics: data-cmp-data-layer, data-track from source container
 * Accessibility: img alt text preserved, heading hierarchy preserved
 */
export default function parse(element, { document }) {
  // Determine invocation pattern:
  // A) Element is overlap-predecessor → bg image in previousSibling, text in element
  // B) Element is bg-image container → bg image in element, text in nextSibling (overlap)
  const isOverlap = (element.className || '').includes('overlap-predecessor');
  const prevSibling = element.previousElementSibling;
  const nextSibling = element.nextElementSibling;

  let bgPicture;
  let heading;
  let description;

  if (isOverlap) {
    // Pattern A: standard overlap-predecessor invocation
    bgPicture = prevSibling?.querySelector('picture')
      || prevSibling?.querySelector('.cmp-container__bg-image')
      || prevSibling?.querySelector('img');
    heading = element.querySelector('.cmp-title h1, h1, .cmp-title h2, h2');
    description = element.querySelector('.cmp-text p, .cmp-text');
  } else {
    // Pattern B: invoked on the bg-image container itself
    bgPicture = element.querySelector('img.cmp-container__bg-image')
      || element.querySelector('picture')
      || element.querySelector('img');
    // Text content is in the next sibling (overlap-predecessor)
    const textSource = (nextSibling?.className || '').includes('overlap-predecessor') ? nextSibling : element;
    heading = textSource.querySelector('.cmp-title h1, h1, .cmp-title h2, h2');
    description = textSource.querySelector('.cmp-text p, .cmp-text');
  }

  // Build cells: Row 1 = image, Row 2 = text (per library spec)
  const cells = [];

  // Row 1: Background image with field hint
  const imgFrag = document.createDocumentFragment();
  imgFrag.appendChild(document.createComment(' field:image '));
  if (bgPicture) {
    const pic = bgPicture.tagName === 'PICTURE' ? bgPicture : bgPicture.closest('picture') || bgPicture;
    imgFrag.appendChild(pic);
  }
  cells.push([imgFrag]);

  // Row 2: Text content with field hint
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));
  if (heading) textFrag.appendChild(heading);
  if (description) textFrag.appendChild(description);
  cells.push([textFrag]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });

  // Rule 4: Carry analytics from source container to block element
  applyAnalytics(element, block, document);

  element.replaceWith(block);

  if (isOverlap) {
    // Pattern A: remove the now-empty previous sibling (bg-image container)
    if (prevSibling) prevSibling.remove();
  } else {
    // Pattern B: remove the next sibling overlap-predecessor if we consumed its content
    if (nextSibling && (nextSibling.className || '').includes('overlap-predecessor')) {
      nextSibling.remove();
    }
  }
}
