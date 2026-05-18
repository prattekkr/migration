/* eslint-disable */
/* global WebImporter */

/**
 * Parser: custom-title (simple block, no children)
 *
 * JCR/md2jcr rules:
 * - titleType: collapsed (ends with Type) → no row
 * - 4 field groups: title, classes, blockId, language
 *   Wait — FieldGroup groups by _ prefix: classes_customDynamicClass + classes_commonCustomClass = 1 group
 *   title = own group, blockId = own group, language = own group
 *   Total: 4 groups → 4 rows
 * - Field hints on non-empty cells
 *
 * Rows (4 total, 1 col each):
 *   Row 0: <!-- field:title --><h1>text</h1>
 *   Row 1: [empty]                              ← classes group
 *   Row 2: <!-- field:blockId -->id:
 *   Row 3: <!-- field:language -->none
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('h1, h2, h3, h4, h5, h6');
  const headingText = heading?.textContent?.trim() || '';
  const headingTag = heading?.tagName?.toLowerCase() || 'h5';

  const titleCell = document.createElement('div');
  titleCell.appendChild(document.createComment(' field:title '));
  const h = document.createElement(headingTag);
  h.textContent = headingText;
  if (heading?.id) h.id = heading.id;
  titleCell.appendChild(h);

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
    [titleCell],                     // Row 0: title (with hint)
    [empty()],                       // Row 1: classes group (empty, no hint)
    [hintVal('blockId', 'id:')],     // Row 2: blockId (with hint)
    [hintVal('language', 'none')],   // Row 3: language (with hint)
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
