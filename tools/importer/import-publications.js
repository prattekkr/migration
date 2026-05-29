/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import linklistParser from './parsers/linklist.js';
import cardsParser from './parsers/cards.js';
import pressReleasesParser from './parsers/press-releases.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'columns': columnsParser,
  'linklist': linklistParser,
  'cards': cardsParser,
  'press-releases': pressReleasesParser,
};

// T06 — Publications Page (science/publications.html)
// Search + filter interface for scientific publications with optional hero,
// optional intro text, optional linklist, publication filter/search component,
// optional related cards.
const PAGE_TEMPLATE = {
  name: 'publications',
  description: 'AbbVie publications page: optional hero, intro text (centered), optional linklist nav, publications search/filter component (press-releases), optional 3-col related cards',
  urls: [
    'https://www.abbvie.com/science/publications.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'linklist', instances: ['.list.cmp-list, nav.linklist, .cmp-linklist'] },
    { name: 'press-releases', instances: ['.cmp-press-releases, .press-releases, [class*="publication"], [class*="search-results"]'] },
    { name: 'cards', instances: ['.cards.cmp-cards, .cmp-card-list'] },
    { name: 'columns', instances: ['.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-4)'] },
  ],
  sections: [
    { id: 'section-1-hero', name: 'Hero', selector: '.container.overlap-predecessor', style: 'navy-overlap', blocks: ['hero'], defaultContent: [] },
    { id: 'section-2-intro', name: 'Intro Text', selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text)', style: 'container large', blocks: [], defaultContent: ['text'] },
    { id: 'section-3-linklist', name: 'Topic Nav', selector: '.container.cmp-container-full-width:has(.cmp-list)', style: null, blocks: ['linklist'], defaultContent: [] },
    { id: 'section-4-publications', name: 'Publications Search', selector: '.container.cmp-container-full-width:has(.cmp-press-releases, [class*="publication"], [class*="search"])', style: null, blocks: ['press-releases'], defaultContent: [] },
    { id: 'section-5-related', name: 'Related Cards', selector: '.container.cmp-container-full-width:has(.cards, .cmp-card-list)', style: 'grid container', blocks: ['cards', 'columns'], defaultContent: [], childSections: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
  ],
};

function runParser(name, element, helpers) {
  const parser = parsers[name];
  if (!parser) return;
  try {
    parser(element, helpers);
  } catch (e) {
    console.warn(`[import-publications] parser "${name}" failed on`, element, e);
  }
}

export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    const helpers = { document, url, html, params };

    PAGE_TEMPLATE.blocks.forEach(({ name, instances }) => {
      instances.forEach((selector) => {
        let elements;
        try {
          elements = document.querySelectorAll(selector);
        } catch {
          return;
        }
        elements.forEach((el) => runParser(name, el, helpers));
      });
    });

    // Wire grid child sections
    [
      { selector: '.container.cmp-container-full-width:has(.cards, .cmp-card-list)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer('afterTransform', document.body, { document, url, html, params, template: PAGE_TEMPLATE });

    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'publications');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
