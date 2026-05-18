/* eslint-disable */
/* global WebImporter */

/**
 * Parser: separator
 * Field groups: showLine, classes, blockId, language = 4 rows
 * Field hints on non-empty cells.
 */
export default function parse(element, { document }) {
  const hasHr = !!element.querySelector('hr, .cmp-separator__horizontal-rule');

  const hintVal = (fieldName, v) => {
    const d = document.createElement('div');
    const p = document.createElement('p');
    p.appendChild(document.createComment(' field:' + fieldName + ' '));
    p.appendChild(document.createTextNode(v));
    d.appendChild(p);
    return d;
  };
  const empty = () => document.createElement('div');

  const cells = [
    [hintVal('showLine', hasHr ? 'true' : 'false')],  // Row 0: showLine
    [empty()],                                          // Row 1: classes group
    [empty()],                                          // Row 2: blockId (empty)
    [hintVal('language', 'none')],                      // Row 3: language
  ];

  const variants = [];
  const cls = element.className || '';
  const heightMatch = cls.match(/separator-height-(\d+)/);
  if (heightMatch) variants.push('separator-height-' + heightMatch[1]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'separator', variants, cells });
  element.replaceWith(block);
}
