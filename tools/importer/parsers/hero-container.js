/* eslint-disable */
/* global WebImporter */

function getMimeType(url) {
  const u = (url || '').toLowerCase().split('?')[0];
  if (u.endsWith('.png')) return 'image/png';
  if (u.endsWith('.jpg') || u.endsWith('.jpeg')) return 'image/jpeg';
  if (u.endsWith('.webp')) return 'image/webp';
  if (u.endsWith('.avif')) return 'image/avif';
  if (u.endsWith('.gif')) return 'image/gif';
  if (u.endsWith('.svg')) return 'image/svg+xml';
  if (url.includes('fmt=webp')) return 'image/webp';
  if (url.includes('fmt=png')) return 'image/png';
  if (url.includes('fmt=jpg') || url.includes('fmt=jpeg')) return 'image/jpeg';
  if (url.includes('scene7.com')) return 'image/jpeg';
  return 'image/jpeg';
}

export default function parse(element, { document }) {
  const variantClasses = [];
  ['height-default','height-short','height-tall','height-xx-tall','overlay-height-short','overlay-height-default','overlay-height-tall','overlay-height-xx-tall'].forEach(v => { if (element.classList.contains(v)) variantClasses.push(v); });
  // Default height if none detected (all story articles need a height class)
  if (!variantClasses.some(v => v.startsWith('height-') && !v.startsWith('height-xx'))) variantClasses.unshift('height-default');
  // Always add overlay-height-short (all story articles have it per reference)
  if (!variantClasses.some(v => v.startsWith('overlay-height'))) variantClasses.push('overlay-height-short');
  const blockName = variantClasses.length > 0 ? `hero-container (${variantClasses.join(', ')})` : 'hero-container';
  // Extract hero background image for the child item
  const bgImage = element.querySelector('img.cmp-container__bg-image') || element.querySelector('.cmp-container img') || element.querySelector('img');
  const imageCell = document.createElement('div');
  if (bgImage) {
    const src = bgImage.getAttribute('data-cmp-src') || bgImage.getAttribute('src') || '';
    const alt = bgImage.getAttribute('alt') || '';
    if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
      const pic = document.createElement('picture');
      const mimeType = getMimeType(src);
      const source = document.createElement('source');
      source.setAttribute('type', mimeType);
      source.setAttribute('srcset', src);
      pic.appendChild(source);
      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', alt);
      img.setAttribute('loading', 'lazy');
      pic.appendChild(img);
      imageCell.appendChild(pic);
    }
  }

  const empty = () => document.createElement('div');
  const mimeType = getMimeType(bgImage?.getAttribute('data-cmp-src') || bgImage?.getAttribute('src') || '');
  // Row 0: block-level classes group (1 col, empty — variants handled by block name)
  // Row 1: hero-container-item child (8 cols matching ALL modelFields):
  //   image, imageMimeType, imageAlt, videoUrl, text, bgColor, ctaLabel, ctaUrl
  const mimeCell = document.createElement('div');
  mimeCell.textContent = mimeType;
  const altCell = document.createElement('div');
  altCell.textContent = bgImage?.getAttribute('alt') || '';
  const cells = [
    [empty()],
    [imageCell, mimeCell, altCell, empty(), empty(), empty(), empty(), empty()],
  ];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
