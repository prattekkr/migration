/* eslint-disable */
/* global WebImporter */

/**
 * Parser: text-container (container block with filter)
 *
 * md2jcr FieldGroup creates 4 parent field groups:
 *   1. classes (classes_customDynamicClass + classes_commonCustomClass)
 *   2. blockId
 *   3. language
 *   4. analytics (analytics_id)
 *
 * md2jcr removes fieldGroup.fields.length + 1 rows from top (header + 4 groups).
 * Remaining rows become child items.
 *
 * Structure: 5+ data rows (4 parent + N child):
 *   Row 0: classes group → empty
 *   Row 1: blockId → empty
 *   Row 2: language → "none"
 *   Row 3: analytics group → empty
 *   Row 4+: child text-container-text content
 */

let heroSubtitleDone = false;

export default function parse(element, { document }) {
  const cmpText = element.querySelector('.cmp-text') || element;

  const textCell = document.createElement('div');
  for (let i = 0; i < cmpText.children.length; i++) {
    const child = cmpText.children[i];
    if (child.tagName === 'DIV' && !child.textContent.trim()) continue;
    textCell.appendChild(child.cloneNode(true));
  }

  const val = (v) => {
    const d = document.createElement('div');
    if (v) d.textContent = v;
    return d;
  };

  // component-models.json has 3 field groups: classes, blockId, language
  // md2jcr splice(0, 3+1=4) removes first 4 rows as parent.
  // Row 5 (index 4) becomes child item.
  // Total: 4 parent rows + 1 child = 5 data rows.
  const cells = [
    [val('')],       // Row 0: splice +1 (extra row consumed)
    [val('')],       // Row 1: classes group
    [val('')],       // Row 2: blockId
    [val('none')],   // Row 3: language
    [textCell],      // Row 4: child text-container-text content
  ];

  const variants = [];
  const cls = element.className || '';

  if (!heroSubtitleDone && cls.includes('cmp-text-xx-large') && cls.includes('light-theme')) {
    variants.push('body-unica-32-reg');
    heroSubtitleDone = true;
  } else if (cls.includes('cmp-text-x-large')) {
    variants.push('standard', 'width-large');
  } else {
    variants.push('spacing-bottom', 'width-large');
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'text-container', variants, cells });
  element.replaceWith(block);
}
