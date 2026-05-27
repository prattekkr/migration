/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const blockName = 'accordion (accordion-icon-font, h5-size, width-large)';
  const title = element.querySelector('.cmp-accordion__title, [class*="accordion__title"]')?.textContent?.trim() || 'References';
  const expandBtn = element.querySelector('.cmp-accordion__expand-all, [class*="expand-all"]');
  const collapseBtn = element.querySelector('.cmp-accordion__collapse-all, [class*="collapse-all"]');
  const cells = [[title],[expandBtn?.textContent?.trim()||'Expand All'],[collapseBtn?.textContent?.trim()||'Collapse All'],['plus'],['minus'],['plus'],['minus'],[''],[''],[''],[''],[''],[''],[''],['none'],['']];
  const items = element.querySelectorAll('.cmp-accordion__item');
  items.forEach(item => {
    const headingEl = item.querySelector('.cmp-accordion__header button, .cmp-accordion__button');
    const panelEl = item.querySelector('.cmp-accordion__panel');
    const headingText = headingEl?.textContent?.trim() || '';
    const bodyCell = document.createElement('div');
    if (panelEl) {
      const pc = panelEl.querySelectorAll('p, div, ul, ol');
      if (pc.length > 0) pc.forEach(c => { if (c.textContent.trim()) bodyCell.appendChild(c.cloneNode(true)); });
      else if (panelEl.textContent.trim()) { const p = document.createElement('p'); p.textContent = panelEl.textContent.trim(); bodyCell.appendChild(p); }
    }
    cells.push([headingText, bodyCell, 'accordion-item', '', '']);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
