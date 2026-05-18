/* eslint-disable */
/* global WebImporter */

/**
 * Parser: text-container (container block with filter)
 *
 * JCR/md2jcr rules:
 * - 3 block-level rows (1 col each): classes group, blockId, language
 * - Child item rows (2 cols): | text-container-text | content |
 * - Field hints on ALL non-empty cells
 * - Empty cells get NO hints
 * - Collapsed fields: none for text-container parent
 *
 * CRITICAL: createBlock strips outer <p> wrappers from cells.
 * All content must be inline nodes (text, <br>, <a>, <strong>, <em>) directly
 * in the cell <div> — NO <p> elements — to avoid multi-paragraph table cells
 * which break md2jcr FieldGroupFieldResolver.
 */

let heroSubtitleDone = false;

export default function parse(element, { document }) {
  const cmpText = element.querySelector('.cmp-text') || element;

  // Build child content cell — all content as inline nodes with <br><br> separators
  // NO <p> elements allowed (they create multi-paragraph markdown cells that break md2jcr)
  const textContentCell = document.createElement('div');
  textContentCell.appendChild(document.createComment(' field:text '));

  let firstPara = true;
  const nodes = cmpText.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const child = nodes[i];
    if (child.nodeType === 3) {
      if (!child.textContent.trim()) continue;
      if (!firstPara) {
        textContentCell.appendChild(document.createElement('br'));
        textContentCell.appendChild(document.createElement('br'));
      }
      textContentCell.appendChild(document.createTextNode(child.textContent));
      firstPara = false;
    } else if (child.nodeType === 1) {
      if (child.tagName === 'DIV' && !child.textContent.trim()) continue;
      if (!child.textContent.trim() && !child.querySelector('img, a')) continue;

      if (!firstPara) {
        textContentCell.appendChild(document.createElement('br'));
        textContentCell.appendChild(document.createElement('br'));
      }
      if (child.tagName === 'P') {
        // Flatten <p> children as inline content
        for (let j = 0; j < child.childNodes.length; j++) {
          textContentCell.appendChild(child.childNodes[j].cloneNode(true));
        }
      } else if (child.tagName === 'UL' || child.tagName === 'OL') {
        textContentCell.appendChild(child.cloneNode(true));
      } else {
        // For other elements (spans, strongs, etc), append inline
        for (let j = 0; j < child.childNodes.length; j++) {
          textContentCell.appendChild(child.childNodes[j].cloneNode(true));
        }
      }
      firstPara = false;
    }
  }

  // Build child type name cell
  const childTypeCell = document.createElement('div');
  childTypeCell.textContent = 'text-container-text';

  // Block-level cells — comments and text directly in div (no <p> wrapper)
  const blockIdCell = document.createElement('div');
  blockIdCell.appendChild(document.createComment(' field:blockId '));
  blockIdCell.appendChild(document.createTextNode('id:'));

  const languageCell = document.createElement('div');
  languageCell.appendChild(document.createComment(' field:language '));
  languageCell.appendChild(document.createTextNode('none'));

  const emptyCell = () => document.createElement('div');

  // 3 block-level rows (1 col) + 1 child row (2 cols)
  const cells = [
    [emptyCell()],                           // Row 0: classes group (empty, no hint)
    [blockIdCell],                           // Row 1: blockId (with hint)
    [languageCell],                          // Row 2: language (with hint)
    [childTypeCell, textContentCell],        // Row 3: child item (2 cols)
  ];

  // Determine variant
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
