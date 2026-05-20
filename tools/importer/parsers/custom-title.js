/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const heading = element.querySelector('h1,h2,h3,h4,h5,h6') || element.querySelector('.cmp-title__text');
  const headingText = heading?.textContent?.trim() || '';
  const headingTag = heading?.tagName?.toLowerCase() || 'h5';
  const variants = [];
  if (element.classList.contains('light-theme') || element.closest('.light-theme')) variants.push('h1-size');
  else if (element.classList.contains('h5-size') || element.classList.contains('medium-weight')) variants.push('h5-size', 'width-large');
  const blockName = variants.length > 0 ? `custom-title (${variants.join(', ')})` : 'custom-title';
  const titleCell = document.createElement('div');
  const h = document.createElement(headingTag);
  h.id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  h.textContent = headingText;
  titleCell.appendChild(h);
  const cells = [[titleCell], ['id:'], ['lang:none'], ['']];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
