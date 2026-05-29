/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import cardsParser from './parsers/cards.js';
import factCardParser from './parsers/fact-card.js';
import accordionParser from './parsers/accordion.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'columns': columnsParser,
  'cards': cardsParser,
  'fact-card': factCardParser,
  'accordion': accordionParser,
};

// T12 — Stats & Facts Page (key-facts.html — only page)
const PAGE_TEMPLATE = {
  name: 'key-facts',
  description: 'AbbVie key-facts.html: hero, intro text, report download cards (3-col), key metrics fact-card grid, recognition accordion',
  urls: [
    'https://www.abbvie.com/who-we-are/key-facts.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    {
      name: 'cards',
      instances: ['.cards.cmp-cards, .cmp-card-list, .cardpagestory-list:not(:has(.storyCardInfo))'],
    },
    {
      name: 'fact-card',
      instances: ['.dashboardcards, .cmp-dashboardcards, .fact-card'],
    },
    {
      name: 'columns',
      instances: ['.container.cmp-container-full-width > .cmp-container > .grid.grid-row:has(.grid-row__col-with-4)'],
    },
    {
      name: 'accordion',
      instances: ['.accordion.cmp-accordion, .accordion.panelcontainer:not(.show-tabs-desktop)'],
    },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero',
      selector: ['.container.overlap-predecessor', '.container.large-radius.cmp-container-full-width.height-default'],
      style: 'navy-overlap',
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'section-2-intro',
      name: 'Intro Text',
      selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text)',
      style: null,
      blocks: [],
      defaultContent: ['text'],
    },
    {
      id: 'section-3-report-cards',
      name: 'Report Download Cards',
      selector: '.container.cmp-container-full-width:has(.cards, .cmp-card-list)',
      style: null,
      blocks: ['cards', 'columns'],
      defaultContent: [],
    },
    {
      id: 'section-4-metrics',
      name: 'Key Metrics Grid',
      selector: '.container.cmp-container-full-width:has(.dashboardcards)',
      style: null,
      blocks: ['fact-card'],
      defaultContent: [],
    },
    {
      id: 'section-5-recognition',
      name: 'Recognition Accordion',
      selector: '.container.cmp-container-full-width:has(.accordion)',
      style: null,
      blocks: ['accordion'],
      defaultContent: [],
    },
  ],
};

const processed = new WeakSet();

function runParser(name, element, helpers) {
  if (!element || processed.has(element)) return;
  processed.add(element);
  const parser = parsers[name];
  if (!parser) return;
  try { parser(element, helpers); } catch (e) {
    console.warn(`[import-key-facts] parser "${name}" failed on`, element, e);
  }
}

export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });
    const helpers = { document, url, html, params };
    PAGE_TEMPLATE.blocks.forEach(({ name, instances }) => {
      instances.forEach((selector) => {
        let elements;
        try { elements = document.querySelectorAll(selector); } catch { return; }
        elements.forEach((el) => runParser(name, el, helpers));
      });
    });

    // 3a. Wire grid child sections
    [
      { selector: '.container.cmp-container-full-width:has(.cards, .cmp-card-list)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
      { selector: '.container.cmp-container-full-width:has(.dashboardcards)', childStyles: [{ style: 'grid section, grid cols 3' }, { style: 'grid section, grid cols 3' }, { style: 'grid section, grid cols 3' }, { style: 'grid section, grid cols 3' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer("afterTransform", document.body, { document, url, html, params, template: PAGE_TEMPLATE });
    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'key-facts');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },
  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
