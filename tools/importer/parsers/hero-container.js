/* eslint-disable */
/* global WebImporter */

/**
 * Parser: hero-container
 * Reference: can-unlocking-one-million-genomes.plain.html (manually migrated)
 * Structure: 1 row, 6 cols → image | videoUrl | text | bgColor | ctaLabel | ctaUrl
 * No classes group row. No field hints.
 */
export default function parse(element, { document }) {
  const bgImage = element.querySelector('img.cmp-container__bg-image')
    || element.querySelector('img[class*="bg-image"]')
    || element.querySelector('.cmp-container > img');

  const imageCell = document.createElement('div');
  if (bgImage) {
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
  if (cls.includes('overlay-height-short')) variants.push('overlay-height-short');
  else if (cls.includes('overlay-height-default')) variants.push('overlay-height-default');
  if (cls.includes('semi-transparent-layer')) variants.push('navy');

  const cells = [
    [imageCell, empty(), empty(), empty(), empty(), empty()],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-container', variants, cells });
  element.replaceWith(block);
}
