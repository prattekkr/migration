/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import quoteParser from './parsers/quote.js';
import teaserParser from './parsers/teaser.js';
import columnsParser from './parsers/columns.js';
import storyCardsParser from './parsers/story-cards.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'quote': quoteParser,
  'teaser': teaserParser,
  'columns': columnsParser,
  'story-cards': storyCardsParser,
};

// T16 — Brand Partnership (3 pages)
const PAGE_TEMPLATE = {
  name: 'brand-partnership',
  description: 'AbbVie brand partnership pages: hero, campaign intro + donation stat (default content), player testimonial quote, partnership cross-link teaser, partner feature columns (2-col), related story cards',
  urls: [
    'https://www.abbvie.com/who-we-are/brand-partnerships.html',
    'https://www.abbvie.com/who-we-are/brand-partnerships/cubs.html',
    'https://www.abbvie.com/who-we-are/brand-partnerships/major-league-baseball.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'quote', instances: ['.quote.cmp-quote, blockquote.cmp-quote'] },
    {
      name: 'teaser',
      instances: ['.teaser.cmp-teaser:not(.storyCardInfo):not(.cardpagestory):not(.sidePanel)'],
    },
    {
      name: 'columns',
      instances: ['.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-5, .grid-row__col-with-6)'],
    },
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
      id: 'section-2-campaign-intro',
      name: 'Campaign Intro + Donation Stat',
      selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):not(:has(.cmp-quote))',
      style: null,
      blocks: [],
      defaultContent: ['text'],
    },
    {
      id: 'section-3-quote',
      name: 'Player Testimonial Quote',
      selector: '.container.cmp-container-full-width:has(.cmp-quote)',
      style: null,
      blocks: ['quote'],
      defaultContent: [],
    },
    {
      id: 'section-4-cross-link',
      name: 'Partnership Cross-Link',
      selector: '.container:has(.cmp-teaser):not(:has(.storyCardInfo)):not(:has(.cardpagestory-list))',
      style: null,
      blocks: ['teaser', 'columns'],
      defaultContent: [],
    },
    {
      id: 'section-5-partner-features',
      name: 'Partner Features',
      selector: '.container.cmp-container-full-width:has(.grid-row__col-with-5)',
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'section-6-story-cards',
      name: 'Related Story Cards',
      selector: '.container.cmp-container-full-width:has(.story-cards, .cardpagestory-list)',
      style: null,
      blocks: ['story-cards'],
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
    console.warn(`[import-brand-partnership] parser "${name}" failed on`, element, e);
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
      { selector: '.container:has(.cmp-teaser):not(:has(.storyCardInfo))', childStyles: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-5)', childStyles: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
      { selector: '.container.cmp-container-full-width:has(.story-cards)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer("afterTransform", document.body, { document, url, html, params, template: PAGE_TEMPLATE });
    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'brand-partnership');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },
  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
