/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const anchor = element.querySelector('a.cmp-button') || element.querySelector('a');
  const linkText = element.querySelector('.cmp-button__text')?.textContent?.trim() || anchor?.textContent?.trim() || '';
  let href = anchor?.getAttribute('href') || '';
  if (href.startsWith('/')) href = 'https://www.abbvie.com' + href;
  const target = anchor?.getAttribute('target') || '_self';
  const variantClasses = element.classList.contains('back-cta') ? ['default-cta','back-cta'] : ['default-cta'];
  const blockName = `cta (${variantClasses.join(', ')})`;
  const linkCell = document.createElement('div');
  if (href) { const a = document.createElement('a'); a.href = href; a.textContent = linkText; linkCell.appendChild(a); }
  const cells = [[linkCell],[''], [target],['none'],['chevron'],[''],['before'],['false'],[''],['none'],['']];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
