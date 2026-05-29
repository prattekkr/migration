/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import accordionParser from './parsers/accordion.js';
import linklistParser from './parsers/linklist.js';
import tabsParser from './parsers/tabs.js';
import tableParser from './parsers/table.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'columns': columnsParser,
  'accordion': accordionParser,
  'linklist': linklistParser,
  'tabs': tabsParser,
  'table': tableParser,
};

// T08 — Pipeline Page (science/pipeline.html)
// AbbVie's drug pipeline: hero, intro text, phase filter tabs or linklist,
// pipeline table (disease area × phase), optional disclosure accordion.
const PAGE_TEMPLATE = {
  name: 'pipeline',
  description: 'AbbVie pipeline page: hero, intro text (centered), optional phase filter linklist/tabs, pipeline data table, optional disclosure/notes accordion',
  urls: [
    'https://www.abbvie.com/science/pipeline.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'linklist', instances: ['.list.cmp-list, nav.linklist, .cmp-linklist'] },
    { name: 'tabs', instances: ['.tabs.cmp-tabs'] },
    { name: 'table', instances: ['table, .cmp-table, [class*="pipeline-table"]'] },
    { name: 'accordion', instances: ['.accordion.cmp-accordion, .accordion.panelcontainer:not(.show-tabs-desktop)'] },
    { name: 'columns', instances: ['.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-4, .grid-row__col-with-6)'] },
  ],
  sections: [
    { id: 'section-1-hero', name: 'Hero', selector: '.container.overlap-predecessor', style: 'navy-overlap', blocks: ['hero'], defaultContent: [] },
    { id: 'section-2-intro', name: 'Intro Text', selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text)', style: 'container large', blocks: [], defaultContent: ['text'] },
    { id: 'section-3-filter', name: 'Phase Filter', selector: '.container.cmp-container-full-width:has(.cmp-list, .cmp-tabs):not(:has(table))', style: null, blocks: ['linklist', 'tabs'], defaultContent: [] },
    { id: 'section-4-table', name: 'Pipeline Table', selector: '.container.cmp-container-full-width:has(table, .cmp-table, [class*="pipeline"])', style: 'container x-large', blocks: ['table'], defaultContent: [] },
    { id: 'section-5-accordion', name: 'Notes / Disclosures', selector: '.container.cmp-container-full-width:has(.accordion)', style: null, blocks: ['accordion'], defaultContent: [] },
  ],
};

function runParser(name, element, helpers) {
  const parser = parsers[name];
  if (!parser) return;
  try {
    parser(element, helpers);
  } catch (e) {
    console.warn(`[import-pipeline] parser "${name}" failed on`, element, e);
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

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer('afterTransform', document.body, { document, url, html, params, template: PAGE_TEMPLATE });

    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'pipeline');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
