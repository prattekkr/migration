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

  // Combine all paragraphs into a SINGLE <p> with <br> between them.
  // This is required because md2jcr's FieldGroupFieldResolver.resolve() fails
  // for container blocks with richtext child items containing multiple paragraphs.
  // Multiple <p> tags create multiple mdast paragraph nodes which exhaust the field.
  const textCell = document.createElement('div');
  const singleP = document.createElement('p');
  let firstPara = true;
  for (let i = 0; i < cmpText.children.length; i++) {
    const child = cmpText.children[i];
    if (child.tagName === 'DIV' && !child.textContent.trim()) continue;
    if (!child.textContent.trim()) continue;

    if (!firstPara) {
      singleP.appendChild(document.createElement('br'));
      singleP.appendChild(document.createElement('br'));
    }
    // Append the text content (strip outer <p> tags if present)
    if (child.tagName === 'P') {
      // Copy inner content of <p> without the <p> wrapper
      for (let j = 0; j < child.childNodes.length; j++) {
        singleP.appendChild(child.childNodes[j].cloneNode(true));
      }
    } else {
      singleP.appendChild(child.cloneNode(true));
    }
    firstPara = false;
  }
  if (singleP.childNodes.length > 0) {
    textCell.appendChild(singleP);
  }

  const val = (v) => {
    const d = document.createElement('div');
    if (v) d.textContent = v;
    return d;
  };

  // Reference markdown structure (from manually migrated page that passes md2jcr):
  //   Row 1: id:       (blockId)
  //   Row 2: none      (language — plain "none", not "lang:none")
  //   Row 3: (empty)   (classes group)
  //   Row 4: text      (content — single paragraph)
  const cells = [
    [val('id:')],    // Row 0: blockId
    [val('none')],   // Row 1: language
    [val('')],       // Row 2: classes group
    [textCell],      // Row 3: text content (single <p> with <br><br> for multi-paragraph)
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
