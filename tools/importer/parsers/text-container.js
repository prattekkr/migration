/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const isInHero = !!(element.closest('.cmp-container-full-width') || element.closest('.container.height-default') || (element.classList.contains('light-theme') && element.classList.contains('cmp-text-xx-large')));
  const variantClasses = [];
  if (element.classList.contains('cmp-text-xx-large')) {
    if (isInHero) variantClasses.push('body-unica-32-reg');
    else variantClasses.push('spacing-bottom', 'width-large');
  } else if (element.classList.contains('cmp-text-x-large')) {
    variantClasses.push('spacing-bottom', 'width-large', 'body-unica-20-reg');
  } else {
    variantClasses.push('spacing-bottom', 'width-large');
  }
  const blockName = variantClasses.length > 0 ? `text-container (${variantClasses.join(', ')})` : 'text-container';
  const cmpText = element.querySelector('.cmp-text') || element;
  const contentCell = document.createElement('div');
  const children = cmpText.children;
  if (children.length > 0) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child.textContent.trim() && !child.querySelector('img, a')) continue;
      contentCell.appendChild(child.cloneNode(true));
    }
  }
  if (contentCell.childNodes.length === 0 && cmpText.textContent.trim()) contentCell.textContent = cmpText.textContent.trim();
  const cells = [[isInHero ? 'id:' : ''], ['none'], [contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}