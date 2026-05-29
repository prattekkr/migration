/* eslint-disable */
/* global WebImporter */

import storyCardParser from './parsers/story-card.js';
import teaserParser from './parsers/teaser.js';
import tagUtilityNavParser from './parsers/tag-utility-nav.js';
import storyCardsParser from './parsers/story-cards.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'story-card': storyCardParser,
  'teaser': teaserParser,
  'tag-utility-nav': tagUtilityNavParser,
  'story-cards': storyCardsParser,
};

// T10 — Stories Listing / Category Filter (17 pages)
const PAGE_TEMPLATE = {
  name: 'stories-listing',
  description: 'AbbVie stories listing pages: featured hero story card (dark bg), optional teaser, category filter + search tag-utility-nav, story card grid, show-more JS',
  urls: [
    'https://www.abbvie.com/who-we-are/our-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/eye-care-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/eedi-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/neuroscience-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/aesthetics-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/patient-support-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/oncology-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/immunology-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/partnerships-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/virology-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/working-at-abbvie-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/serving-communities-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/philanthropy-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/science-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/sustainability-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/company-stories.html',
    'https://www.abbvie.com/who-we-are/our-stories/profile-stories.html',
  ],
  blocks: [
    {
      name: 'story-card',
      instances: ['.storyCardInfo, .cardpagestory.cmp-teaser--storyCardInfo'],
    },
    {
      name: 'teaser',
      instances: ['.teaser.cmp-teaser:not(.storyCardInfo):not(.cardpagestory):not(.sidePanel)'],
    },
    {
      name: 'tag-utility-nav',
      instances: ['.tag-utility-nav, .cmp-tag-utility-nav, [class*="category-filter"]'],
    },
    {
      name: 'story-cards',
      instances: ['.story-cards, .cmp-story-cards, .cardpagestory-list, .cardpagestory'],
    },
  ],
  sections: [
    {
      id: 'section-1-featured',
      name: 'Featured Hero Story',
      selector: '.container.cmp-container-full-width:has(.storyCardInfo):first-of-type',
      style: 'dark',
      blocks: ['story-card'],
      defaultContent: [],
    },
    {
      id: 'section-2-secondary-teaser',
      name: 'Secondary Featured Article',
      selector: '.container.cmp-container-full-width:has(.teaser):not(:has(.storyCardInfo)):not(:has(.story-cards))',
      style: null,
      blocks: ['teaser'],
      defaultContent: [],
    },
    {
      id: 'section-3-filter',
      name: 'Category Filter + Search',
      selector: '.container:has(.tag-utility-nav, .cmp-tag-utility-nav)',
      style: null,
      blocks: ['tag-utility-nav'],
      defaultContent: [],
    },
    {
      id: 'section-4-story-grid',
      name: 'Story Card Grid',
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
    console.warn(`[import-stories-listing] parser "${name}" failed on`, element, e);
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
      { selector: '.container.cmp-container-full-width:has(.story-cards)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer("afterTransform", document.body, { document, url, html, params, template: PAGE_TEMPLATE });
    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'stories-listing');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },
  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
