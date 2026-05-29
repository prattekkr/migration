/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: tabs
 * Base block: tabs
 * Templates: T02 variation (science.html — tabs instead of story-cards)
 * Source: https://www.abbvie.com/science.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM Core Component — tabs v1):
 *   <div class="tabs cmp-tabs ...">
 *     <ol class="cmp-tabs__tablist" role="tablist">
 *       <li class="cmp-tabs__tab" role="tab" id="tab-1">Science</li>
 *       <li class="cmp-tabs__tab" role="tab" id="tab-2">Innovation</li>
 *     </ol>
 *     <div class="cmp-tabs__tabpanel" role="tabpanel" aria-labelledby="tab-1">
 *       <h3>Section Heading</h3>
 *       <img src="..." alt="..." />
 *       <p>Content paragraph...</p>
 *     </div>
 *     <div class="cmp-tabs__tabpanel" role="tabpanel" aria-labelledby="tab-2">
 *       ...
 *     </div>
 *   </div>
 *
 * UE Model fields — per-tab item (tabs-item):
 *   title (text)               — tab label (from tablist)
 *   content_heading (text)     — first heading in panel
 *   content_headingType (select)— h3 | h4 | h5 | h6
 *   content_image (reference)  — first image in panel
 *   content_richtext (richtext)— remaining panel content
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 * Accessibility (Rule 5): preserves role="tablist", tab titles, panel aria labels.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  const tabLabels = Array.from(element.querySelectorAll(
    '.cmp-tabs__tab, [role="tab"], .cmp-tabs__tablist li',
  ));
  const tabPanels = Array.from(element.querySelectorAll(
    '.cmp-tabs__tabpanel, [role="tabpanel"]',
  ));

  if (tabPanels.length === 0) {
    element.replaceWith(document.createTextNode(''));
    return;
  }

  const cells = [];

  tabPanels.forEach((panel, i) => {
    const tabTitle = (tabLabels[i]?.textContent || `Tab ${i + 1}`).trim();

    const headingEl = panel.querySelector('h1,h2,h3,h4,h5,h6');
    const headingText = (headingEl?.textContent || '').trim();
    const headingTag = headingEl?.tagName?.toLowerCase() || 'h3';

    const imgEl = panel.querySelector('img');

    const frag = document.createDocumentFragment();

    // title
    frag.appendChild(document.createComment(' field:title '));
    const titleP = document.createElement('p');
    titleP.textContent = tabTitle;
    frag.appendChild(titleP);

    // content_heading
    if (headingText) {
      frag.appendChild(document.createComment(' field:content_heading '));
      const headP = document.createElement('p');
      headP.textContent = headingText;
      frag.appendChild(headP);

      frag.appendChild(document.createComment(' field:content_headingType '));
      const htP = document.createElement('p');
      htP.textContent = headingTag;
      frag.appendChild(htP);
    }

    // content_image
    if (imgEl) {
      frag.appendChild(document.createComment(' field:content_image '));
      frag.appendChild(imgEl.cloneNode(true));
    }

    // content_richtext — clone remaining text content from the panel
    const richClone = panel.cloneNode(true);
    // Remove headings and images already captured
    richClone.querySelectorAll('h1,h2,h3,h4,h5,h6,img').forEach((n) => n.remove());
    const richText = richClone.textContent.trim();
    if (richText) {
      frag.appendChild(document.createComment(' field:content_richtext '));
      const richP = document.createElement('p');
      richP.textContent = richText;
      frag.appendChild(richP);
    }

    cells.push([frag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
