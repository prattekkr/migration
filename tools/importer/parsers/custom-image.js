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
  const img = element.querySelector('img');
  const cmpDiv = element.querySelector('[data-cmp-src]');
  const cmpIs = element.querySelector('[data-cmp-is="image"]');
  let imgSrc = '', imgAlt = '';
  if (img) { imgSrc = img.getAttribute('data-cmp-src') || img.getAttribute('src') || ''; imgAlt = img.getAttribute('alt') || ''; }
  if (!imgSrc && cmpDiv) { imgSrc = cmpDiv.getAttribute('data-cmp-src') || ''; imgAlt = cmpDiv.getAttribute('data-alt') || ''; }
  if (!imgSrc && cmpIs) { imgSrc = cmpIs.getAttribute('data-cmp-src') || ''; }
  const imageCell = document.createElement('div');
  if (imgSrc && !imgSrc.startsWith('blob:') && !imgSrc.startsWith('data:')) {
    const pic = document.createElement('picture');
    const mimeType = getMimeType(imgSrc);
    const source = document.createElement('source');
    source.setAttribute('type', mimeType);
    source.setAttribute('srcset', imgSrc);
    pic.appendChild(source);
    const imgEl = document.createElement('img');
    imgEl.setAttribute('src', imgSrc); imgEl.setAttribute('alt', imgAlt); imgEl.setAttribute('loading', 'lazy');
    pic.appendChild(imgEl); imageCell.appendChild(pic);
  }
  const cells = [[imageCell],['false'],['false'],[''],['false'],['false'],['false'],[''],['_self'],[''],['false'],[''],[''],[''],['none'],['']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'custom-image', cells });
  element.replaceWith(block);
}
