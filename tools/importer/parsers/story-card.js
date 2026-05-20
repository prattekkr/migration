/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const categoryLink = element.querySelector('a[href]');
  let pageHref = categoryLink?.getAttribute('href') || '';
  if (pageHref.startsWith('/')) pageHref = 'https://www.abbvie.com' + pageHref;
  const linkCell = document.createElement('div');
  if (pageHref) { const a = document.createElement('a'); a.href = pageHref; a.textContent = pageHref; linkCell.appendChild(a); }
  const cells = [['storyCardInfo'],['false'],['false'],['true'],['true'],['true'],[''],[''], [linkCell],['false'],[''],['']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'story-card', cells });
  element.replaceWith(block);
}
