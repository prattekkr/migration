/* eslint-disable */
/* global WebImporter */

/**
 * Parser: separator
 * Reference: can-unlocking-one-million-genomes.plain.html (manually migrated)
 * Structure: 4 rows, 1 col each. No field hints.
 *   Row 0: showLine → "false"
 *   Row 1: blockId → empty
 *   Row 2: language → "none"
 *   Row 3: classes group → empty
 */
export default function parse(element, { document }) {
  const hasHr = !!element.querySelector('hr, .cmp-separator__horizontal-rule');

  const val = (v) => {
    const d = document.createElement('div');
    if (v) d.textContent = v;
    return d;
  };

  const cells = [
    [val(hasHr ? 'true' : 'false')],
    [val('')],
    [val('none')],
    [val('')],
  ];

  const variants = [];
  const cls = element.className || '';
  const heightMatch = cls.match(/separator-height-(\d+)/);
  if (heightMatch) variants.push('separator-height-' + heightMatch[1]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'separator', variants, cells });
  element.replaceWith(block);
}
