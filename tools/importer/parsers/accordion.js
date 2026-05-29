/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: accordion
 * Base block: accordion (+ accordion-item child)
 * Sources:
 *   - https://www.abbvie.com/science/our-people.html (FAQ accordion)
 *   - https://www.abbvie.com/who-we-are/our-stories/the-math-of-migraine.html (References accordion w/ Expand-All)
 *   - https://www.abbvie.com/who-we-are/our-stories/five-technologies-supporting-progress-in-challenging-diseases.html
 *
 * Source DOM patterns (AEM Core Components — accordion v1):
 *   <div class="accordion panelcontainer cmp-accordion-..."
 *        data-cmp-single-expansion="true"
 *        data-cmp-icon-type="font|image">
 *     <div class="cmp-accordion">
 *       <div class="cmp-accordion__item" data-cmp-expanded="false">
 *         <h{2..5} class="cmp-accordion__header">
 *           <button class="cmp-accordion__button" aria-expanded="..." aria-controls="..."
 *                   data-cmp-expand-label="Expand" data-cmp-collapse-label="Collapse">
 *             <span class="cmp-accordion__title">References</span>
 *             <span class="cmp-accordion__icon" />
 *           </button>
 *         </h{2..5}>
 *         <div class="cmp-accordion__panel" role="region">
 *            ... rich-text body ...
 *         </div>
 *       </div>
 *       (...more items...)
 *     </div>
 *     <button class="cmp-accordion__toggle-all">Expand All</button>  (optional)
 *   </div>
 *
 * Library structure (block + children):
 *   Row 0..N-1: block-level field-comment rows (one cell each, value-only)
 *     • blockHeading                — e.g. "References"
 *     • classes_showExpandCollapseAll
 *     • expandAllLabel              — e.g. "Expand All"
 *     • collapseAllLabel            — e.g. "Collapse All"
 *     • classes_iconType            — "accordion-icon-font" | "accordion-icon-image"
 *     • expandIcon / collapseIcon   — font icon names (default "plus" / "minus")
 *   Row N..: per-accordion-item rows, 2 cells each:
 *     • cell 1: summary (text)
 *     • cell 2: text (richtext body)
 *
 * UE Model fields:
 *   accordion       : blockHeading, classes_showExpandCollapseAll, expandAllLabel,
 *                     collapseAllLabel, classes_iconType, expandIcon, collapseIcon,
 *                     ariaExpandAllLabel, ariaCollapseAllLabel
 *   accordion-item  : summary (text), text (richtext)
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer + data-track to block.
 * Accessibility (Rule 5):
 *   • Preserves the heading semantic from .cmp-accordion__header (h2/h3/h4/h5)
 *     via the summary text — block JS adds role=button + aria-controls.
 *   • Captures aria-expand-all/aria-collapse-all labels when present on the
 *     toggle-all button.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  const accordionRoot = element.matches('.cmp-accordion') ? element : (element.querySelector('.cmp-accordion') || element);

  // ---- Block-level configuration -----------------------------------------
  // Block heading: sibling .cmp-title above the accordion, or self header.
  let blockHeading = '';
  const headerEl = element.previousElementSibling?.querySelector?.('.cmp-title h1, .cmp-title h2, .cmp-title h3, .cmp-title h4, .cmp-title h5')
    || element.parentElement?.querySelector?.(':scope > .cmp-title h1, :scope > .cmp-title h2, :scope > .cmp-title h3, :scope > .cmp-title h4, :scope > .cmp-title h5')
    || element.querySelector(':scope > .cmp-header, :scope > h2, :scope > h3, :scope > h4');
  if (headerEl) blockHeading = headerEl.textContent.trim();

  // Toggle-all button (Expand-All / Collapse-All)
  const toggleAllBtn = element.querySelector('.cmp-accordion__toggle-all, [data-cmp-hook-accordion="toggleAll"], .cmp-accordion__expand-all, .cmp-accordion__collapse-all');
  const showExpandCollapseAll = !!toggleAllBtn
    || element.classList.contains('show-expand-collapse-all')
    || !!element.querySelector('button[aria-label*="Expand all" i], button[aria-label*="Collapse all" i]');

  const expandAllBtn = element.querySelector('.cmp-accordion__expand-all, button[data-cmp-action="expandAll"], button[aria-label*="Expand all" i]');
  const collapseAllBtn = element.querySelector('.cmp-accordion__collapse-all, button[data-cmp-action="collapseAll"], button[aria-label*="Collapse all" i]');
  const expandAllLabel = (expandAllBtn?.textContent?.trim() || toggleAllBtn?.textContent?.trim() || 'Expand All').replace(/Collapse All.*$/i, '').trim() || 'Expand All';
  const collapseAllLabel = (collapseAllBtn?.textContent?.trim() || 'Collapse All').trim();

  const ariaExpandAllLabel = (expandAllBtn?.getAttribute('aria-label') || toggleAllBtn?.getAttribute('aria-label') || '').trim();
  const ariaCollapseAllLabel = (collapseAllBtn?.getAttribute('aria-label') || '').trim();

  // Icon type
  const iconTypeRaw = (element.getAttribute('data-cmp-icon-type') || '').toLowerCase();
  let classes_iconType = 'accordion-icon-font';
  if (iconTypeRaw === 'image' || element.querySelector('.cmp-accordion__icon img')) {
    classes_iconType = 'accordion-icon-image';
  }

  // ---- Item extraction ---------------------------------------------------
  const items = accordionRoot.querySelectorAll(
    ':scope > .cmp-accordion__item, .cmp-accordion__item, [class*="accordion__item"]',
  );

  const row = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (value !== undefined && value !== null && value !== '') {
      const p = document.createElement('p');
      p.textContent = String(value);
      frag.appendChild(p);
    }
    return [frag];
  };

  // Block-level config rows (only included when there's a meaningful value)
  const cells = [];
  if (blockHeading) cells.push(row('blockHeading', blockHeading));
  cells.push(row('classes_showExpandCollapseAll', showExpandCollapseAll));
  if (showExpandCollapseAll) {
    cells.push(row('expandAllLabel', expandAllLabel));
    cells.push(row('collapseAllLabel', collapseAllLabel));
  }
  cells.push(row('classes_iconType', classes_iconType));
  if (ariaExpandAllLabel) cells.push(row('ariaExpandAllLabel', ariaExpandAllLabel));
  if (ariaCollapseAllLabel) cells.push(row('ariaCollapseAllLabel', ariaCollapseAllLabel));

  // Item rows (2 cells: summary | body)
  let itemCount = 0;
  items.forEach((item) => {
    const titleEl = item.querySelector(
      '.cmp-accordion__title, .cmp-accordion__button span, .cmp-accordion__header button, .cmp-accordion__header',
    );
    const panelEl = item.querySelector(
      '.cmp-accordion__panel, [class*="accordion__panel"], [class*="accordion__content"]',
    );

    const summaryText = titleEl ? titleEl.textContent.trim() : '';

    const bodyFrag = document.createDocumentFragment();
    if (panelEl) {
      // Clone children so we leave the source DOM intact for downstream
      // section transforms (avoids "node already adopted" issues)
      Array.from(panelEl.childNodes).forEach((child) => {
        bodyFrag.appendChild(child.cloneNode(true));
      });
    }

    if (!summaryText && !bodyFrag.childNodes.length) return;

    cells.push([summaryText, bodyFrag]);
    itemCount += 1;
  });

  if (itemCount === 0) {
    element.replaceWith(document.createTextNode(''));
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
