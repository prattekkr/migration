/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: tag-utility-nav
 * Base block: tag-utility-nav
 * Templates: T10 (Stories Listing section 3 — Category Filter + Search)
 * Source: https://www.abbvie.com/who-we-are/our-stories.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM):
 *   <div class="tag-utility-nav cmp-tag-utility-nav ...">
 *     <div class="cmp-tag-utility-nav__search">
 *       <input type="search" placeholder="Search stories..." />
 *     </div>
 *     <ul class="cmp-tag-utility-nav__categories">
 *       <li class="cmp-tag-utility-nav__category" data-tag="neuroscience">
 *         <a href="/who-we-are/our-stories/neuroscience-stories.html">Neuroscience</a>
 *       </li>
 *       ...
 *     </ul>
 *   </div>
 *
 * UE Model fields — block-level (tag-utility-nav):
 *   searchPlaceholder (text)       — placeholder in search input
 *   classes_searchIconType (select)— "no-icon" | "icon-font" | "image"
 *   searchFontIcon (text)          — font icon name for search (if icon-font)
 *   searchInID (text)              — ID of the container to search within
 *   browseCategories (text)        — dropdown label text
 *   clearCategories (text)         — reset button label text
 *
 * UE Model fields — per-category child (tag-utility-nav-category):
 *   categoryTag (text)             — data-tag value for filtering
 *   categoryLink (aem-content)     — category page path
 *   categoryTitle (text)           — display label override
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // ---- Block-level config ------------------------------------------------
  const searchInput = element.querySelector('input[type="search"], input[placeholder]');
  const searchPlaceholder = (searchInput?.getAttribute('placeholder') || 'Search').trim();

  const browseCatEl = element.querySelector(
    '[class*="browse-categories"], [data-browse], select option[value=""]',
  );
  const browseCategories = (browseCatEl?.textContent || 'Browse by Category').trim();

  const clearCatEl = element.querySelector('[class*="clear-categories"], [data-clear]');
  const clearCategories = (clearCatEl?.textContent || '').trim();

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

  const cells = [
    row('searchPlaceholder', searchPlaceholder),
    row('classes_searchIconType', 'icon-font'),
    row('searchFontIcon', 'search'),
    row('browseCategories', browseCategories),
  ];
  if (clearCategories) cells.push(row('clearCategories', clearCategories));

  // ---- Per-category rows -------------------------------------------------
  const catItems = element.querySelectorAll(
    '.cmp-tag-utility-nav__category, [data-tag], li[data-filter], [class*="category-item"]',
  );

  catItems.forEach((item) => {
    const a = item.querySelector('a[href]');
    const categoryTag = (item.getAttribute('data-tag')
      || item.getAttribute('data-filter')
      || a?.textContent || '').trim().toLowerCase().replace(/\s+/g, '-');
    const categoryLink = (a?.getAttribute('href') || '').trim();
    const categoryTitle = (a?.textContent || item.textContent || '').trim();

    if (!categoryTitle) return;

    const catFrag = document.createDocumentFragment();
    catFrag.appendChild(document.createComment(' field:categoryTag '));
    const tagP = document.createElement('p');
    tagP.textContent = categoryTag;
    catFrag.appendChild(tagP);

    catFrag.appendChild(document.createComment(' field:categoryLink '));
    const linkP = document.createElement('p');
    const linkA = document.createElement('a');
    linkA.href = categoryLink;
    linkA.textContent = categoryTitle;
    linkP.appendChild(linkA);
    catFrag.appendChild(linkP);

    catFrag.appendChild(document.createComment(' field:categoryTitle '));
    const titleP = document.createElement('p');
    titleP.textContent = categoryTitle;
    catFrag.appendChild(titleP);

    cells.push([catFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tag-utility-nav', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
