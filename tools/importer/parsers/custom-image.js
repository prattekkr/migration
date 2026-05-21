/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  // Try multiple sources for the image (handles AEM lazy-loading)
  const img = element.querySelector('img');
  const cmpDiv = element.querySelector('[data-cmp-src]');
  const cmpIs = element.querySelector('[data-cmp-is="image"]');
  let imgSrc = '', imgAlt = '';
  if (img) {
    imgSrc = img.getAttribute('data-cmp-src') || img.getAttribute('src') || '';
    imgAlt = img.getAttribute('alt') || '';
  }
  // Fallback: data-cmp-src on a div (AEM lazy-loading pattern)
  if (!imgSrc && cmpDiv) {
    imgSrc = cmpDiv.getAttribute('data-cmp-src') || '';
    imgAlt = cmpDiv.getAttribute('data-alt') || cmpDiv.getAttribute('alt') || '';
  }
  // Fallback: data-cmp-is="image" element with data-cmp-src (fully lazy, no img rendered)
  if (!imgSrc && cmpIs) {
    imgSrc = cmpIs.getAttribute('data-cmp-src') || '';
    imgAlt = cmpIs.getAttribute('data-alt') || cmpIs.getAttribute('alt') || '';
  }
  // Fallback: check element itself for data-cmp-src
  if (!imgSrc && element.getAttribute('data-cmp-src')) {
    imgSrc = element.getAttribute('data-cmp-src');
  }
  const imageCell = document.createElement('div');
  if (imgSrc && !imgSrc.startsWith('blob:') && !imgSrc.startsWith('data:')) {
    const pic = document.createElement('picture'); const imgEl = document.createElement('img');
    imgEl.setAttribute('src', imgSrc); imgEl.setAttribute('alt', imgAlt); imgEl.setAttribute('loading', 'lazy');
    pic.appendChild(imgEl); imageCell.appendChild(pic);
  }
  const cells = [[imageCell],['false'],['false'],[''],['false'],['false'],['false'],[''],['_self'],[''],['false'],[''],[''],[''],['none'],['']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'custom-image', cells });
  element.replaceWith(block);
}
