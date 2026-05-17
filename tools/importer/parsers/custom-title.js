/* eslint-disable */
/* global WebImporter */

/**
 * Parser: custom-title
 * Reference: can-unlocking-one-million-genomes.plain.html (manually migrated)
 * Structure: 4 rows, 1 col each. No field hints.
 *   Row 0: title → <h1>text</h1> or <h5>text</h5>
 *   Row 1: blockId → empty (or "id:" for hero)
 *   Row 2: language → "none" (or "lang:none" for hero)
 *   Row 3: classes group → empty
 *
 * Variant classes pass through from AEM source.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
  const headingText = heading?.textContent?.trim() || '';
  const headingTag = heading?.tagName?.toLowerCase() || 'h5';
  const isHero = headingTag === 'h1';

  const titleCell = document.createElement('div');
  const h = document.createElement(headingTag);
  h.textContent = headingText;
  if (heading?.id) h.id = heading.id;
  titleCell.appendChild(h);

  const val = (v) => {
    const d = document.createElement('div');
    if (v) d.textContent = v;
    return d;
  };

  const cells = [
    [titleCell],
    [val(isHero ? 'id:' : '')],
    [val(isHero ? 'lang:none' : 'none')],
    [val('')],
  ];

  const variants = [];
  const cls = element.className || '';
  if (cls.includes('h1-size')) variants.push('h1-size');
  else if (cls.includes('h3-size')) variants.push('h3-size');
  else if (cls.includes('h5-size')) variants.push('h5-size');
  if (cls.includes('width-large')) variants.push('width-large');
  if (cls.includes('medium-weight')) variants.push('medium-weight');
  if (cls.includes('light-theme')) variants.push('light-theme');

  const block = WebImporter.Blocks.createBlock(document, { name: 'custom-title', variants, cells });
  element.replaceWith(block);
}
