/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const hasHr = !!element.querySelector('hr, .cmp-separator__horizontal-rule');
  const variants = [];
  const cls = element.className || '';
  if (cls.includes('separator-height-24')) variants.push('separator-height-24');
  else if (cls.includes('separator-height-48')) variants.push('separator-height-48');
  else if (cls.includes('separator-height-80')) variants.push('separator-height-80');
  const blockName = variants.length > 0 ? `separator (${variants.join(', ')})` : 'separator';
  const cells = [[hasHr ? 'true' : 'false'], [''], ['none'], ['']];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
