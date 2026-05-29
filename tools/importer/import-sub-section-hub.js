/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import accordionParser from './parsers/accordion.js';
import linklistParser from './parsers/linklist.js';
import teaserParser from './parsers/teaser.js';
import cardsParser from './parsers/cards.js';
import brightcoveVideoParser from './parsers/brightcove-video.js';
import videoParser from './parsers/video.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'columns': columnsParser,
  'accordion': accordionParser,
  'linklist': linklistParser,
  'teaser': teaserParser,
  'cards': cardsParser,
  'brightcove-video': brightcoveVideoParser,
  'video': videoParser,
};

// T05 — Sub-Section Hub Pages
// science/partner-with-us, science/independent-educational-grants,
// science/abbvie-research-collaborative-*, science/the-case-for-big-bets
const PAGE_TEMPLATE = {
  name: 'sub-section-hub',
  description: 'AbbVie sub-section hub pages under /science/: hero, intro text (centered), optional linklist nav, optional columns (2-col or 3-col), optional accordion, optional cards, optional video, careers CTA (highlight)',
  urls: [
    'https://www.abbvie.com/science/partner-with-us.html',
    'https://www.abbvie.com/science/independent-educational-grants.html',
    'https://www.abbvie.com/science/abbvie-research-collaborative-endometrosis.html',
    'https://www.abbvie.com/science/abbvie-research-collaborative-migraine.html',
    'https://www.abbvie.com/science/the-case-for-big-bets.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'linklist', instances: ['.list.cmp-list, nav.linklist, .cmp-linklist'] },
    { name: 'columns', instances: ['.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-4, .grid-row__col-with-5, .grid-row__col-with-6)'] },
    { name: 'accordion', instances: ['.accordion.cmp-accordion, .accordion.panelcontainer:not(.show-tabs-desktop)'] },
    { name: 'cards', instances: ['.cards.cmp-cards, .cmp-card-list'] },
    { name: 'teaser', instances: ['.teaser.cmp-teaser:not(.storyCardInfo):not(.cardpagestory)'] },
    { name: 'brightcove-video', instances: ['.cmp-video.cmp-video-full-width, .video.cmp-video-full-width, video-js[data-account], [data-video-id]'] },
    { name: 'video', instances: ['.embed.cmp-embed:not(:has(video-js)):not(:has([data-account]))'] },
  ],
  sections: [
    { id: 'section-1-hero', name: 'Hero', selector: '.container.overlap-predecessor', style: 'navy-overlap', blocks: ['hero'], defaultContent: [] },
    { id: 'section-2-intro', name: 'Intro Text', selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):first-of-type', style: 'container large', blocks: [], defaultContent: ['text'] },
    { id: 'section-3-linklist', name: 'Related Topics Nav', selector: '.container.cmp-container-full-width:has(.cmp-list)', style: null, blocks: ['linklist'], defaultContent: [] },
    { id: 'section-4-columns', name: 'Content Columns', selector: '.container.cmp-container-full-width:has(.grid-row__col-with-6):not(:has(.accordion))', style: 'grid container', blocks: ['columns'], defaultContent: [], childSections: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
    { id: 'section-5-3col', name: '3-Col Content', selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4):not(:has(.accordion))', style: 'grid container', blocks: ['columns'], defaultContent: [], childSections: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
    { id: 'section-6-cards', name: 'Cards', selector: '.container.cmp-container-full-width:has(.cards, .cmp-card-list)', style: null, blocks: ['cards'], defaultContent: [] },
    { id: 'section-7-accordion', name: 'Accordion', selector: '.container.cmp-container-full-width:has(.accordion)', style: null, blocks: ['accordion'], defaultContent: [] },
    { id: 'section-8-video', name: 'Video', selector: '.container.cmp-container-full-width:has(.cmp-video, .cmp-embed)', style: null, blocks: ['brightcove-video', 'video'], defaultContent: [] },
    { id: 'section-9-cta', name: 'Careers CTA', selector: '.container.cmp-container-full-width.medium-radius:last-of-type', style: 'highlight', blocks: ['columns'], defaultContent: [] },
  ],
};

function runParser(name, element, helpers) {
  const parser = parsers[name];
  if (!parser) return;
  try {
    parser(element, helpers);
  } catch (e) {
    console.warn(`[import-sub-section-hub] parser "${name}" failed on`, element, e);
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
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-6):not(:has(.accordion))', childStyles: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4):not(:has(.accordion))', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer('afterTransform', document.body, { document, url, html, params, template: PAGE_TEMPLATE });

    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'sub-section-hub');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
