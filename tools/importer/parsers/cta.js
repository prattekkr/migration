/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cta
 * Reference: can-unlocking-one-million-genomes.plain.html (manually migrated)
 * Structure: 11 rows, 1 col each. No field hints.
 */
export default function parse(element, { document }) {
  const linkEl = element.querySelector('a.cmp-button')
    || element.querySelector('a[class*="cmp-button"]')
    || element.querySelector('a');

  const linkText = element.querySelector('.cmp-button__text')?.textContent?.trim()
    || linkEl?.textContent?.trim() || '';
  const href = linkEl?.getAttribute('href') || '';
  const target = linkEl?.getAttribute('target') || '_self';

  const linkCell = document.createElement('div');
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = linkText;
    linkCell.appendChild(a);
  }

  const val = (v) => {
    const d = document.createElement('div');
    if (v) d.textContent = v;
    return d;
  };

  const cells = [
    [linkCell],          // Row 0: link
    [val('')],           // Row 1: aria-label
    [val(target)],       // Row 2: ctaTarget
    [val('none')],       // Row 3: iconVariation
    [val('chevron')],    // Row 4: iconFont
    [val('')],           // Row 5: iconImage
    [val('before')],     // Row 6: iconPosition
    [val('false')],      // Row 7: ariaHidden
    [val('')],           // Row 8: blockId
    [val('none')],       // Row 9: language
    [val('')],           // Row 10: classes group
  ];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cta',
    variants: ['default-cta', 'back-cta'],
    cells,
  });
  element.replaceWith(block);
}
