/* eslint-disable */
/* global WebImporter */

/**
 * Parser: text-container (container block)
 *
 * Structure: 5 rows total (4 block-level + 1 child item)
 *   Row 0: empty              ← classes group (classes_customDynamicClass + classes_commonCustomClass)
 *   Row 1: empty              ← blockId
 *   Row 2: none               ← language (default "none")
 *   Row 3: empty              ← analytics_id
 *   Row 4: text-container-text | <richtext content>   ← child item (2 cols)
 *
 * Since filter has 2 child types (text-container-image, text-container-text),
 * the type identifier is mandatory in col 1 of the child row.
 */
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

  // Build richtext content cell preserving <p>, <a>, <em>, <strong>, <ul>, <ol>
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

  // Child type identifier
  const childTypeCell = document.createElement('div');
  childTypeCell.textContent = 'text-container-text';

  // 4 block-level rows (1 col each) + 1 child item row (2 cols)
  const cells = [
    [''],                              // Row 0: classes group (empty)
    [''],                              // Row 1: blockId (empty)
    ['none'],                          // Row 2: language
    [''],                              // Row 3: analytics_id (empty)
    [childTypeCell, contentCell],       // Row 4: child item (type + richtext)
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
