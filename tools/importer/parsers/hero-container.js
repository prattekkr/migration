/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const variantClasses = [];
  ['height-default','height-short','height-tall','height-xx-tall','overlay-height-short','overlay-height-default','overlay-height-tall','overlay-height-xx-tall'].forEach(v => { if (element.classList.contains(v)) variantClasses.push(v); });
  const blockName = variantClasses.length > 0 ? `hero-container (${variantClasses.join(', ')})` : 'hero-container';
  const bgImage = element.querySelector('img.cmp-container__bg-image') || element.querySelector('.cmp-container img') || element.querySelector('img');
  const imageCell = document.createElement('div');
  if (bgImage) {
    const src = bgImage.getAttribute('data-cmp-src') || bgImage.getAttribute('src') || '';
    const alt = bgImage.getAttribute('alt') || '';
    if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.setAttribute('src', src); img.setAttribute('alt', alt); img.setAttribute('loading', 'lazy');
      pic.appendChild(img); imageCell.appendChild(pic);
    }
  }
  const empty = () => document.createElement('div');
  // 1 row × 6 cols matching hero-container-item fields: image, videoUrl, text, bgColor, ctaLabel, ctaUrl
  const cells = [[imageCell, empty(), empty(), empty(), empty(), empty()]];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}