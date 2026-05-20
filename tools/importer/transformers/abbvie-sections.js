/* eslint-disable */
/* global WebImporter */
export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const { document } = payload;
  const main = document.body;
  const heroMeta = WebImporter.Blocks.createBlock(document, { name: 'section-metadata (content-wide, medium-radius)', cells: [['language', 'none']] });
  const gridContainerMeta = WebImporter.Blocks.createBlock(document, { name: 'section-metadata (grid-container, content-regular)', cells: [['language', 'none']] });
  const leftSpacerMeta = WebImporter.Blocks.createBlock(document, { name: 'section-metadata (grid-cols-2)', cells: [['', '']] });
  const mainContentMeta = WebImporter.Blocks.createBlock(document, { name: 'section-metadata (grid-section, grid-cols-8)', cells: [['', '']] });
  const rightSpacerMeta = WebImporter.Blocks.createBlock(document, { name: 'section-metadata (grid-cols-2)', cells: [['', '']] });
  const overlapContainer = main.querySelector('.container.overlap-predecessor');
  const gridEl = main.querySelector('.grid');
  if (overlapContainer) {
    let lastHeroEl = overlapContainer;
    while (lastHeroEl.nextElementSibling && lastHeroEl.nextElementSibling !== gridEl) lastHeroEl = lastHeroEl.nextElementSibling;
    lastHeroEl.after(heroMeta); heroMeta.after(document.createElement('hr'));
  }
  if (gridEl) {
    gridEl.before(gridContainerMeta); gridContainerMeta.after(document.createElement('hr'));
    const mainCol = main.querySelector('.grid-row__col-with-8');
    if (mainCol) {
      mainCol.before(leftSpacerMeta); leftSpacerMeta.after(document.createElement('hr'));
      mainCol.appendChild(mainContentMeta);
      mainCol.after(document.createElement('hr')); mainCol.after(rightSpacerMeta);
    }
  }
}
