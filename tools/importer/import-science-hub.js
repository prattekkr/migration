/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import carouselParser from './parsers/carousel.js';
import storyCardParser from './parsers/story-card.js';
import brightcoveVideoParser from './parsers/brightcove-video.js';
import brightcovePodcastPlayerParser from './parsers/brightcove-podcast-player.js';
import linklistParser from './parsers/linklist.js';
import tabsParser from './parsers/tabs.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'columns': columnsParser,
  'carousel': carouselParser,
  'story-card': storyCardParser,
  'brightcove-video': brightcoveVideoParser,
  'brightcove-podcast-player': brightcovePodcastPlayerParser,
  'linklist': linklistParser,
  'tabs': tabsParser,
};

// T07 — Science Our-People Hub Pages
// science/our-people and sub-pages: community-of-science, science-in-60-seconds,
// discovery-files, lab-of-the-future, lab-to-life, behind-the-science
const PAGE_TEMPLATE = {
  name: 'science-hub',
  description: 'AbbVie science our-people hub pages: hero, intro text (centered), optional linklist nav, optional video/podcast player, optional tabs, optional story card carousel, optional 3-col columns',
  urls: [
    'https://www.abbvie.com/science/our-people.html',
    'https://www.abbvie.com/science/our-people/community-of-science.html',
    'https://www.abbvie.com/science/our-people/science-in-60-seconds.html',
    'https://www.abbvie.com/science/our-people/discovery-files.html',
    'https://www.abbvie.com/science/our-people/lab-of-the-future.html',
    'https://www.abbvie.com/science/our-people/lab-to-life.html',
    'https://www.abbvie.com/science/our-people/behind-the-science.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'linklist', instances: ['.list.cmp-list, nav.linklist, .cmp-linklist'] },
    { name: 'brightcove-video', instances: ['.cmp-video.cmp-video-full-width, .video.cmp-video-full-width, video-js[data-account], [data-video-id]'] },
    { name: 'brightcove-podcast-player', instances: ['.cmp-podcast, .brightcove-podcast-player, [class*="podcast"]'] },
    { name: 'tabs', instances: ['.tabs.cmp-tabs'] },
    { name: 'carousel', instances: ['.carousel.cmp-carousel'] },
    { name: 'story-card', instances: ['.storyCardInfo, .cardpagestory.cmp-teaser--storyCardInfo'] },
    { name: 'columns', instances: ['.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-4, .grid-row__col-with-6)'] },
  ],
  sections: [
    { id: 'section-1-hero', name: 'Hero', selector: '.container.overlap-predecessor', style: 'navy-overlap', blocks: ['hero'], defaultContent: [] },
    { id: 'section-2-intro', name: 'Intro Text', selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):not(:has(.cmp-video)):first-of-type', style: 'container large', blocks: [], defaultContent: ['text'] },
    { id: 'section-3-linklist', name: 'Topic Nav', selector: '.container.cmp-container-full-width:has(.cmp-list)', style: null, blocks: ['linklist'], defaultContent: [] },
    { id: 'section-4-video', name: 'Video / Podcast', selector: '.container.cmp-container-full-width:has(.cmp-video, [class*="podcast"])', style: null, blocks: ['brightcove-video', 'brightcove-podcast-player'], defaultContent: [] },
    { id: 'section-5-tabs', name: 'Tabs', selector: '.container.cmp-container-full-width:has(.cmp-tabs)', style: null, blocks: ['tabs'], defaultContent: [] },
    { id: 'section-6-carousel', name: 'Story Carousel', selector: '.container.cmp-container-full-width:has(.carousel)', style: null, blocks: ['carousel', 'story-card'], defaultContent: [] },
    { id: 'section-7-columns', name: 'Content Columns', selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4)', style: 'grid container', blocks: ['columns'], defaultContent: [], childSections: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
  ],
};

function runParser(name, element, helpers) {
  const parser = parsers[name];
  if (!parser) return;
  try {
    parser(element, helpers);
  } catch (e) {
    console.warn(`[import-science-hub] parser "${name}" failed on`, element, e);
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
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-6)', childStyles: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer('afterTransform', document.body, { document, url, html, params, template: PAGE_TEMPLATE });

    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'science-hub');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
