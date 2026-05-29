/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: linklist
 * Base block: linklist
 * Templates: T01 (Positions PDF Links), T03/T04 (Related Topics Nav),
 *            T14 (Portal CTA Links), T17 (Related Topics Nav)
 * Source: https://www.abbvie.com/ (section 12 — Positions PDF Links)
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM):
 *   A. List component:
 *     <div class="list cmp-list ...">
 *       <ul class="cmp-list__items">
 *         <li class="cmp-list__item">
 *           <a class="cmp-list__item-link" href="/path/doc.pdf">Title</a>
 *           <span class="cmp-list__item-date">Jan 2024</span>
 *         </li>
 *       </ul>
 *     </div>
 *   B. Navigation list / topic links:
 *     <nav class="linklist ...">
 *       <ul><li><a href="/path">Label</a></li></ul>
 *     </nav>
 *   C. Inline <ul>/<ol> of links in a container
 *
 * UE Model fields (linklist — per-item child model):
 *   link (aem-content)     — destination URL
 *   linkText (text)        — link label
 *   openInNewTab (boolean) — true for external/PDF links
 *   iconType (select)      — "icon-font" | "icon-image" (default icon-font)
 *   fontIcon (text)        — icon name (e.g. "download" for PDFs)
 *   iconPosition (select)  — "left" | "right"
 *
 * Block-level fields:
 *   ariaLabel (text)       — nav aria-label
 *   layout (select)        — "horizontal" | "vertical" (inferred from CSS)
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 * Accessibility: aria-label on nav container preserved; PDF links get
 *   "download" icon hint; external links set openInNewTab=true.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

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

  // Block-level aria-label
  const ariaLabel = (element.getAttribute('aria-label')
    || element.querySelector('nav')?.getAttribute('aria-label')
    || '').trim();

  // Detect horizontal layout (e.g. topics nav uses flex row)
  const isHorizontal = /horizontal|row|inline/.test(element.className || '');
  const layout = isHorizontal ? 'horizontal' : 'vertical';

  // Collect all links
  const links = Array.from(element.querySelectorAll('a[href]'));

  if (links.length === 0) {
    element.replaceWith(document.createTextNode(''));
    return;
  }

  const cells = [];

  // Block-level config rows
  if (ariaLabel) cells.push(row('ariaLabel', ariaLabel));
  cells.push(row('layout', layout));

  // Per-link item rows
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const linkText = a.textContent.trim();
    const isPdf = /\.pdf($|\?)/i.test(href);
    const isExternal = /^https?:\/\//.test(href) && !href.includes('abbvie.com');
    const openInNewTab = isPdf || isExternal || a.getAttribute('target') === '_blank';
    const fontIcon = isPdf ? 'download' : '';

    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:link '));
    const linkP = document.createElement('p');
    const linkA = document.createElement('a');
    linkA.href = href;
    linkA.textContent = linkText;
    linkP.appendChild(linkA);
    frag.appendChild(linkP);

    if (linkText) {
      frag.appendChild(document.createComment(' field:linkText '));
      const ltP = document.createElement('p');
      ltP.textContent = linkText;
      frag.appendChild(ltP);
    }

    if (openInNewTab) {
      frag.appendChild(document.createComment(' field:openInNewTab '));
      const otP = document.createElement('p');
      otP.textContent = 'true';
      frag.appendChild(otP);
    }

    if (fontIcon) {
      frag.appendChild(document.createComment(' field:fontIcon '));
      const fiP = document.createElement('p');
      fiP.textContent = fontIcon;
      frag.appendChild(fiP);
    }

    cells.push([frag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'linklist', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
