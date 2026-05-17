/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroContainerParser from './parsers/hero-container.js';
import ctaParser from './parsers/cta.js';
import storyCardParser from './parsers/story-card.js';
import customTitleParser from './parsers/custom-title.js';
import textContainerParser from './parsers/text-container.js';
import separatorParser from './parsers/separator.js';
import carouselParser from './parsers/carousel.js';
import customImageParser from './parsers/custom-image.js';

// TRANSFORMER IMPORTS
import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import abbvieSectionsTransformer from './transformers/abbvie-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-container': heroContainerParser,
  'cta': ctaParser,
  'story-card': storyCardParser,
  'custom-title': customTitleParser,
  'text-container': textContainerParser,
  'separator': separatorParser,
  'carousel': carouselParser,
  'custom-image': customImageParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  abbvieCleanupTransformer,
  abbvieSectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'story-article',
  description: 'Story/feature article page with hero, content body sections, image carousels, and related content card. Part of T04 template group covering 116 pages on abbvie.com.',
  urls: [
    'https://www.abbvie.com/who-we-are/our-stories/can-unlocking-one-million-genomes.html',
  ],
  blocks: [
    {
      name: 'hero-container',
      instances: ['.container.cmp-container-full-width.height-default.no-bottom-margin'],
    },
    {
      name: 'cta',
      instances: ['.button.back-cta.light-theme'],
    },
    {
      name: 'story-card',
      instances: ['.storyinfo', '.cardpagestory.card-dashboard'],
    },
    {
      name: 'custom-title',
      instances: ['.title.cmp-title-xx-large.light-theme', '.title.cmp-title-xx-large.h5-size'],
    },
    {
      name: 'text-container',
      instances: ['.text.cmp-text-xx-large.light-theme', '.text.cmp-text-xx-large', '.text.cmp-text-x-large.light-theme.single-column.standard'],
    },
    {
      name: 'separator',
      instances: ['.separator.separator-height-24'],
    },
    {
      name: 'carousel',
      instances: ['.carousel.panelcontainer.carousel-minimal'],
    },
    {
      name: 'custom-image',
      instances: ['.cmp-image'],
    },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero Section',
      selector: '.container.cmp-container-full-width.height-default.no-bottom-margin',
      style: null,
      blocks: ['hero-container', 'cta', 'story-card', 'custom-title', 'text-container'],
      defaultContent: [],
    },
    {
      id: 'section-2-grid-container',
      name: 'Grid Container (article body wrapper)',
      selector: '.container.overlap-predecessor.cmp-container-xx-large',
      style: null,
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-3-left-spacer',
      name: 'Left Spacer Column',
      selector: '.grid-row__col-with-2.grid-cell:first-child',
      style: null,
      blocks: [],
      defaultContent: [],
    },
    {
      id: 'section-4-main-content',
      name: 'Article Body - Main Content Column',
      selector: '.grid-row__col-with-8.grid-cell',
      style: null,
      blocks: ['custom-title', 'text-container', 'separator', 'carousel'],
      defaultContent: [],
    },
    {
      id: 'section-5-sidebar',
      name: 'Right Sidebar Column (Related Content)',
      selector: '.grid-row__col-with-2.grid-cell:last-child',
      style: null,
      blocks: ['story-card'],
      defaultContent: [],
    },
  ],
};

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
