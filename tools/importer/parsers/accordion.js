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
    // Get the heading/summary text from the accordion button
    const headingEl = item.querySelector('.cmp-accordion__button span, .cmp-accordion__header button, .cmp-accordion__button');
    const headingText = headingEl?.textContent?.trim() || '';
    // Get the panel content — only direct text/paragraph children, not nested blocks
    const panelEl = item.querySelector('.cmp-accordion__panel');
    const bodyCell = document.createElement('div');
    if (panelEl) {
      // Get only the .cmp-text content inside the panel (not nested block tables)
      const cmpText = panelEl.querySelector('.cmp-text');
      if (cmpText) {
        Array.from(cmpText.children).forEach(child => {
          if (child.textContent.trim()) bodyCell.appendChild(child.cloneNode(true));
        });
      } else {
        // Fallback: get direct <p> children only (not nested divs which could be blocks)
        const directPs = panelEl.querySelectorAll(':scope > p, :scope > .cmp-text > p');
        if (directPs.length > 0) {
          directPs.forEach(p => { if (p.textContent.trim()) bodyCell.appendChild(p.cloneNode(true)); });
        } else if (panelEl.textContent.trim()) {
          const p = document.createElement('p');
          p.textContent = panelEl.textContent.trim();
          bodyCell.appendChild(p);
        }
      }
    }
    // Exact reference format: 5 cols [summary, text, "accordion-item", empty, empty]
    cells.push([headingText, bodyCell, 'accordion-item', '', '']);
  });
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
