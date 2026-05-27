/* eslint-disable */
/* global WebImporter */

// Track if hero subtitle has been found (only first light-theme text is hero)
let heroSubtitleFound = false;

export default function parse(element, { document }) {
  // Hero subtitle: FIRST text with light-theme + cmp-text-xx-large only
  let isInHero = false;
  if (!heroSubtitleFound && element.classList.contains('light-theme') && element.classList.contains('cmp-text-xx-large')) {
    isInHero = true;
    heroSubtitleFound = true;
  }
  const variantClasses = [];
  if (element.classList.contains('cmp-text-xx-large')) {
    if (isInHero) variantClasses.push('body-unica-32-reg');
    else variantClasses.push('spacing-bottom', 'width-large');
  } else if (element.classList.contains('cmp-text-x-large')) {
    variantClasses.push('spacing-bottom', 'width-large', 'body-unica-20-reg');
  } else {
    variantClasses.push('spacing-bottom', 'width-large');
  }
  if (element.classList.contains('section-padding')) variantClasses.push('section-padding');
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
  const childTypeCell = document.createElement('div');
  childTypeCell.textContent = 'text-container-text';
  const cells = [[''], [''], ['none'], [''], [childTypeCell, contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
