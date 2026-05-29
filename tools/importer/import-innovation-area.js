/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import linklistParser from './parsers/linklist.js';
import videoParser from './parsers/video.js';
import columnsParser from './parsers/columns.js';
import accordionParser from './parsers/accordion.js';
import storyCardsParser from './parsers/story-cards.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'linklist': linklistParser,
  'video': videoParser,
  'columns': columnsParser,
  'accordion': accordionParser,
  'story-cards': storyCardsParser,
};

// T04 — Innovation Area Page
const PAGE_TEMPLATE = {
  name: 'innovation-area',
  description: 'AbbVie science/areas-of-innovation pages: hero, intro text, linklist nav, 1–2 video embeds, 3-col columns, feature section, application areas accordion, featured story cards, careers CTA',
  urls: [
    'https://www.abbvie.com/science/areas-of-innovation/ai-and-data-convergence.html',
    'https://www.abbvie.com/science/areas-of-innovation/genomics.html',
    'https://www.abbvie.com/science/areas-of-innovation/precision-medicine.html',
    'https://www.abbvie.com/science/areas-of-innovation/patient-focused-drug-development.html',
    'https://www.abbvie.com/science/areas-of-innovation/therapeutic-modalities-and-platforms.html',
    'https://www.abbvie.com/science/areas-of-innovation/data-convergence.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'linklist', instances: ['.list.cmp-list, nav.linklist, .cmp-linklist'] },
    {
      name: 'video',
      instances: [
        '.embed.cmp-embed iframe[src*="youtube"], .embed.cmp-embed iframe[src*="vimeo"]',
        '.cmp-embed, .embed:not(:has(video-js)):not(:has([data-account]))',
      ],
    },
    {
      name: 'columns',
      instances: [
        '.container.cmp-container-full-width > .cmp-container > .grid.grid-row:has(.grid-row__col-with-4)',
        '.container:not(.cmp-container-full-width) > .cmp-container > .grid.grid-row:has(.grid-row__col-with-6)',
        '.container:not(.cmp-container-full-width) > .cmp-container > .grid.grid-row:has(.grid-row__col-with-5)',
      ],
    },
    { name: 'accordion', instances: ['.accordion.cmp-accordion, .accordion.panelcontainer:not(.show-tabs-desktop)'] },
    { name: 'story-cards', instances: ['.story-cards, .cmp-story-cards, .cardpagestory-list, .cardpagestory'] },
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
      name: 'Introduction Text',
      selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):not(:has(.accordion)):not(:has(.cmp-list)):first-of-type',
      style: null,
      blocks: [],
      defaultContent: ['text'],
    },
    {
      id: 'section-3-linklist',
      name: 'Related Topics Nav',
      selector: '.container.cmp-container-full-width:has(.cmp-list)',
      style: null,
      blocks: ['linklist'],
      defaultContent: [],
    },
    {
      id: 'section-4-video',
      name: 'Video Embeds',
      selector: '.container.cmp-container-full-width:has(.cmp-embed)',
      style: null,
      blocks: ['video'],
      defaultContent: [],
    },
    {
      id: 'section-5-columns',
      name: 'Content Columns (3-col)',
      selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4):not(:has(.accordion)):not(:has(.story-cards))',
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'section-6-feature',
      name: 'Feature Section',
      selector: '.container:not(.cmp-container-full-width):has(.grid-row__col-with-5)',
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'section-7-accordion',
      name: 'Application Areas Accordion',
      selector: '.container.cmp-container-full-width:has(.accordion)',
      style: null,
      blocks: ['accordion'],
      defaultContent: [],
    },
    {
      id: 'section-8-story-cards',
      name: 'Featured Story Cards',
      selector: '.container.cmp-container-full-width:has(.story-cards)',
      style: null,
      blocks: ['story-cards'],
      defaultContent: [],
    },
    {
      id: 'section-9-cta',
      name: 'Careers CTA',
      selector: '.container.cmp-container-full-width.medium-radius:has(.cmp-button):last-of-type',
      style: 'highlight',
      blocks: ['columns'],
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
    console.warn(`[import-innovation-area] parser "${name}" failed on`, element, e);
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
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4):not(:has(.accordion))', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
      { selector: '.container:not(.cmp-container-full-width):has(.grid-row__col-with-5)', childStyles: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer("afterTransform", document.body, { document, url, html, params, template: PAGE_TEMPLATE });
    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'innovation-area');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },
  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
