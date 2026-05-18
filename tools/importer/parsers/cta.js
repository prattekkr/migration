/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cta (simple block)
 *
 * JCR/md2jcr rules:
 * - linkText: collapsed (ends with Text) → no row, collapses into link <a> text
 * - Field groups: link, aria-label, ctaTarget, iconVariation, iconFont, iconImage,
 *   iconPosition, ariaHidden, classes, blockId, language = 11 groups
 * - Actually: classes_customDynamicClass + classes_commonCustomClass = 1 classes group
 *   So: link, aria-label, ctaTarget, iconVariation, iconFont, iconImage, iconPosition,
 *       ariaHidden, classes, blockId, language = 11 rows
 * - Field hints on non-empty cells
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
    const p = document.createElement('p');
    p.appendChild(document.createComment(' field:link '));
    const a = document.createElement('a');
    a.href = href;
    a.textContent = linkText;
    p.appendChild(a);
    linkCell.appendChild(p);
  }

  const hintVal = (fieldName, v) => {
    const d = document.createElement('div');
    if (v) {
      const p = document.createElement('p');
      p.appendChild(document.createComment(' field:' + fieldName + ' '));
      p.appendChild(document.createTextNode(v));
      d.appendChild(p);
    }
    return d;
  };

  const empty = () => document.createElement('div');

  const cells = [
    [linkCell],                               // Row 0: link (with hint)
    [empty()],                                // Row 1: aria-label (empty)
    [hintVal('ctaTarget', target)],           // Row 2: ctaTarget
    [hintVal('iconVariation', 'none')],       // Row 3: iconVariation
    [hintVal('iconFont', 'chevron')],         // Row 4: iconFont
    [empty()],                                // Row 5: iconImage (empty)
    [hintVal('iconPosition', 'before')],      // Row 6: iconPosition
    [hintVal('ariaHidden', 'false')],         // Row 7: ariaHidden
    [empty()],                                // Row 8: classes group (empty)
    [hintVal('blockId', '')],                 // Row 9: blockId (empty value = no hint needed)
    [hintVal('language', 'none')],            // Row 10: language
  ];

  // Fix: empty blockId should have no hint
  cells[9] = [empty()];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cta',
    variants: ['default-cta', 'back-cta'],
    cells,
  });
  element.replaceWith(block);
}
