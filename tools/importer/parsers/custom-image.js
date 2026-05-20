/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const img = element.querySelector('img');
  let imgSrc = '', imgAlt = '';
  if (img) { imgSrc = img.getAttribute('data-cmp-src') || img.getAttribute('src') || ''; imgAlt = img.getAttribute('alt') || ''; }
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
