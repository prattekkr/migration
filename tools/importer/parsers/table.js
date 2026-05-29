/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: table
 * Base block: table
 * Templates: T14 (Patient Assistance section 5 — Income Criteria Table)
 * Source: https://www.abbvie.com/patients/patient-support/patient-assistance/income-criteria.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM):
 *   <div class="table cmp-table ..."> or a raw <table> element
 *     <table>
 *       <thead>
 *         <tr><th>Family Size</th><th>Annual Income</th><th>Monthly Income</th></tr>
 *       </thead>
 *       <tbody>
 *         <tr><td>1</td><td>$30,120</td><td>$2,510</td></tr>
 *         ...
 *       </tbody>
 *     </table>
 *   </div>
 *
 * UE Model fields — block-level (table):
 *   classes (multiselect) — "striped" | "bordered" | "no-header"
 *   filter (select)       — column count variant: "table" | "table-2-columns" | ... "table-4-columns"
 *
 * UE Model fields — per-row child (table-col-N):
 *   column1text … column4text (richtext) — cell content per column
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  const tableEl = element.tagName === 'TABLE'
    ? element
    : element.querySelector('table');

  if (!tableEl) {
    element.replaceWith(document.createTextNode(''));
    return;
  }

  const allRows = Array.from(tableEl.querySelectorAll('tr'));
  if (allRows.length === 0) {
    element.replaceWith(document.createTextNode(''));
    return;
  }

  // Detect column count from first row
  const firstRow = allRows[0];
  const colCount = firstRow.querySelectorAll('th, td').length;
  const filterValue = colCount <= 1 ? 'table'
    : colCount === 2 ? 'table-2-columns'
    : colCount === 3 ? 'table-3-columns'
    : 'table-4-columns';

  // Detect whether there's a thead (use "no-header" class if not)
  const hasThead = !!tableEl.querySelector('thead');
  const classes = hasThead ? 'striped' : 'striped, no-header';

  const row = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    const p = document.createElement('p');
    p.textContent = String(value);
    frag.appendChild(p);
    return [frag];
  };

  const cells = [
    row('classes', classes),
    row('filter', filterValue),
  ];

  // ---- Per-row data rows ------------------------------------------------
  allRows.forEach((tr) => {
    const cellEls = Array.from(tr.querySelectorAll('th, td'));
    if (cellEls.length === 0) return;

    const colNames = ['column1text', 'column2text', 'column3text', 'column4text'];
    const rowFrag = document.createDocumentFragment();

    cellEls.forEach((td, i) => {
      if (i >= colNames.length) return;
      rowFrag.appendChild(document.createComment(` field:${colNames[i]} `));
      const p = document.createElement('p');
      // Preserve bold/emphasis in th cells
      if (td.tagName === 'TH') {
        const strong = document.createElement('strong');
        strong.textContent = td.textContent.trim();
        p.appendChild(strong);
      } else {
        p.textContent = td.textContent.trim();
      }
      rowFrag.appendChild(p);
    });

    cells.push([rowFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
