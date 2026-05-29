/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import factCardParser from './parsers/fact-card.js';
import teaserParser from './parsers/teaser.js';
import columnsParser from './parsers/columns.js';
import accordionParser from './parsers/accordion.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'fact-card': factCardParser,
  'teaser': teaserParser,
  'columns': columnsParser,
  'accordion': accordionParser,
};

// T13 — R&D Sites Page (rd-sites.html — only page)
const PAGE_TEMPLATE = {
  name: 'rd-sites',
  description: 'AbbVie R&D sites page: hero, intro text + key stats (fact-card), global map section (placeholder), location spotlight card (teaser/columns), location details accordion',
  urls: [
    'https://www.abbvie.com/science/rd-sites.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'fact-card', instances: ['.dashboardcards, .cmp-dashboardcards, .fact-card'] },
    {
      name: 'teaser',
      instances: ['.teaser.cmp-teaser:not(.storyCardInfo):not(.cardpagestory)'],
    },
    {
      name: 'columns',
      instances: ['.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-6, .grid-row__col-with-5)'],
    },
    { name: 'accordion', instances: ['.accordion.cmp-accordion, .accordion.panelcontainer:not(.show-tabs-desktop)'] },
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
      id: 'section-2-intro-stats',
      name: 'Intro Text + Key Stats',
      selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text, .dashboardcards)',
      style: null,
      blocks: ['fact-card'],
      defaultContent: ['text'],
    },
    {
      id: 'section-3-map',
      name: 'Global Map',
      selector: '.container.cmp-container-full-width:has([class*="map"], [class*="rd-sites-map"])',
      style: null,
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-4-spotlight',
      name: 'Location Spotlight',
      selector: '.container:not(.cmp-container-full-width):has(.grid-row__col-with-5, .grid-row__col-with-6):has(.cmp-teaser)',
      style: null,
      blocks: ['teaser', 'columns'],
      defaultContent: [],
    },
    {
      id: 'section-5-accordion',
      name: 'Location Details Accordion',
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
    console.warn(`[import-rd-sites] parser "${name}" failed on`, element, e);
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
      { selector: '.container:not(.cmp-container-full-width):has(.cmp-teaser)', childStyles: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer("afterTransform", document.body, { document, url, html, params, template: PAGE_TEMPLATE });
    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'rd-sites');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },
  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
