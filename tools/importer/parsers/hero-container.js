/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero-container (container block with filter)
 *
 * JCR/md2jcr rules:
 * - 1 block-level row (1 col): classes group (overlayHeight) — empty required
 * - Child item row (2 cols): | hero-container-item | image content |
 *   hero-container-item has 6 non-collapsed fields: image, videoUrl, text, bgColor, ctaLabel, ctaUrl
 *   Collapsed: imageMimeType, imageAlt (collapse into img attributes)
 * - Field hints on non-empty cells
 *
 * Structure:
 *   Row 0: [empty]                              ← classes group (1 col)
 *   Row 1: [hero-container-item | <!-- field:image --><picture>... | | | | | ]  ← child (7 cols)
 */
export default function parse(element, { document }) {
  const bgImage = element.querySelector('img.cmp-container__bg-image')
    || element.querySelector('img[class*="bg-image"]')
    || element.querySelector('.cmp-container > img');

  const imageCell = document.createElement('div');
  if (bgImage) {
    imageCell.appendChild(document.createComment(' field:image '));
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.src = bgImage.getAttribute('src') || bgImage.getAttribute('data-cmp-src') || '';
    img.alt = bgImage.getAttribute('alt') || '';
    pic.appendChild(img);
    imageCell.appendChild(pic);
  }

  const empty = () => document.createElement('div');

  const variants = [];
  const cls = element.className || '';
  if (cls.includes('height-short')) variants.push('height-short');
  else if (cls.includes('height-default')) variants.push('height-default');
  else if (cls.includes('height-tall')) variants.push('height-tall');
  if (cls.includes('semi-transparent-layer')) variants.push('navy');

  // Child type name cell
  const childTypeCell = document.createElement('div');
  childTypeCell.textContent = 'hero-container-item';

  // Row 0: classes group (1 col, empty)
  // Row 1: child item (7 cols: type + 6 fields)
  const cells = [
    [empty()],
    [childTypeCell, imageCell, empty(), empty(), empty(), empty(), empty()],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-container', variants, cells });
  element.replaceWith(block);
}
