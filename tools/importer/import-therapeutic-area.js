/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import brightcoveVideoParser from './parsers/brightcove-video.js';
import linklistParser from './parsers/linklist.js';
import carouselParser from './parsers/carousel.js';
import accordionParser from './parsers/accordion.js';
import columnsParser from './parsers/columns.js';
import storyCardsParser from './parsers/story-cards.js';

// TRANSFORMER IMPORTS
import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

// PARSER REGISTRY
const parsers = {
  'hero': heroParser,
  'brightcove-video': brightcoveVideoParser,
  'linklist': linklistParser,
  'carousel': carouselParser,
  'accordion': accordionParser,
  'columns': columnsParser,
  'story-cards': storyCardsParser,
};

// T03 — Therapeutic Area Page
const PAGE_TEMPLATE = {
  name: 'therapeutic-area',
  description: 'AbbVie science/therapeutic-area pages: hero, optional video, intro text, related topics linklist, optional carousel (neuroscience), disease accordion, 3-col commitments, featured story cards, careers CTA',
  urls: [
    'https://www.abbvie.com/science/areas-of-focus/immunology.html',
    'https://www.abbvie.com/science/areas-of-focus/oncology.html',
    'https://www.abbvie.com/science/areas-of-focus/neuroscience.html',
    'https://www.abbvie.com/science/areas-of-focus/eye-care.html',
    'https://www.abbvie.com/science/areas-of-focus/aesthetics.html',
    'https://www.abbvie.com/science/areas-of-focus/other-specialties.html',
  ],
  blocks: [
    {
      name: 'hero',
      instances: ['.container.overlap-predecessor'],
    },
    {
      name: 'brightcove-video',
      instances: ['.cmp-video.cmp-video-full-width, .video.cmp-video-full-width, video-js[data-account], [data-video-id]'],
    },
    {
      name: 'linklist',
      instances: ['.list.cmp-list, nav.linklist, .cmp-linklist, .cmp-navigation--sub'],
    },
    {
      name: 'carousel',
      instances: ['.carousel.cmp-carousel'],
    },
    {
      name: 'accordion',
      instances: ['.accordion.cmp-accordion, .cmp-accordion--default, .accordion.panelcontainer:not(.show-tabs-desktop)'],
    },
    {
      name: 'columns',
      instances: [
        '.container.cmp-container-full-width > .cmp-container > .grid.grid-row:has(.grid-row__col-with-4)',
        '.container:not(.cmp-container-full-width) > .cmp-container > .grid.grid-row',
      ],
    },
    {
      name: 'story-cards',
      instances: ['.story-cards, .cmp-story-cards, .cardpagestory-list, .cardpagestory'],
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
      id: 'section-2-video',
      name: 'Video (optional)',
      selector: '.container.cmp-container-full-width:has(.cmp-video)',
      style: null,
      blocks: ['brightcove-video'],
      defaultContent: [],
    },
    {
      id: 'section-3-intro',
      name: 'Introduction Text',
      selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):not(:has(.accordion))',
      style: null,
      blocks: [],
      defaultContent: ['text'],
    },
    {
      id: 'section-4-linklist',
      name: 'Related Topics Nav',
      selector: '.container.cmp-container-full-width:has(.cmp-list)',
      style: null,
      blocks: ['linklist'],
      defaultContent: [],
    },
    {
      id: 'section-5-carousel',
      name: 'Carousel (neuroscience only)',
      selector: '.container.cmp-container-full-width:has(.carousel)',
      style: null,
      blocks: ['carousel'],
      defaultContent: [],
    },
    {
      id: 'section-6-accordion',
      name: 'Disease Accordion',
      selector: '.container.cmp-container-full-width:has(.accordion)',
      style: null,
      blocks: ['accordion'],
      defaultContent: [],
    },
    {
      id: 'section-7-commitments',
      name: 'Key Commitments',
      selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4)',
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'section-8-story-cards',
      name: 'Featured Article Cards',
      selector: '.container.cmp-container-full-width:has(.story-cards, .cardpagestory-list)',
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
  try {
    parser(element, helpers);
  } catch (e) {
    console.warn(`[import-therapeutic-area] parser "${name}" failed on`, element, e);
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


    // 3a. Wire grid child sections
    [
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
      { selector: '.container.cmp-container-full-width:has(.story-cards)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer("afterTransform", document.body, { document, url, html, params, template: PAGE_TEMPLATE });

    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'therapeutic-area');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
