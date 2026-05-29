/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import ctaParser from './parsers/cta.js';
import storyCardParser from './parsers/story-card.js';
import customTitleParser from './parsers/custom-title.js';
import textContainerParser from './parsers/text-container.js';
import brightcoveVideoParser from './parsers/brightcove-video.js';
import customImageParser from './parsers/custom-image.js';
import quoteParser from './parsers/quote.js';
import separatorParser from './parsers/separator.js';
import carouselParser from './parsers/carousel.js';
import eyebrowTextParser from './parsers/eyebrow-text.js';
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer from './transformers/sections.js';

// PARSER REGISTRY
const parsers = {
  'hero': heroParser,
  'cta': ctaParser,
  'story-card': storyCardParser,
  'custom-title': customTitleParser,
  'text-container': textContainerParser,
  'brightcove-video': brightcoveVideoParser,
  'custom-image': customImageParser,
  'quote': quoteParser,
  'separator': separatorParser,
  'carousel': carouselParser,
  'eyebrow-text': eyebrowTextParser,
  'accordion': accordionParser,
};

// PAGE TEMPLATE CONFIGURATION - Story Detail template
// (Mirrors the "story-detail" entry in page-templates.json)
const PAGE_TEMPLATE = {
  name: 'story-detail',
  description: 'AbbVie "Our Stories" article pages: intro section, optional Brightcove video, two-column narrative body (with optional carousel + accordion + eyebrow), and related-content rail',
  urls: [
    'https://www.abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html',
    'https://www.abbvie.com/who-we-are/our-stories/the-math-of-migraine.html',
    'https://www.abbvie.com/who-we-are/our-stories/five-technologies-supporting-progress-in-challenging-diseases.html',
    'https://www.abbvie.com/who-we-are/our-stories/little-patients-big-impact.html',
  ],
  blocks: [
    {
      name: 'hero',
      instances: [
        '.container.overlap-predecessor',
      ],
    },
    {
      name: 'cta',
      instances: [
        '.cmp-button.back-button',
        '.cmp-breadcrumb a.cmp-breadcrumb__link',
      ],
    },
    {
      name: 'story-card',
      instances: [
        '.cardpagestory.story-card-info',
        '.container.related-content .cardpagestory',
        '.container.related-content .cmp-teaser',
      ],
    },
    {
      name: 'custom-title',
      instances: [
        '.cmp-title.cmp-title-xx-large h1',
        '.cmp-title.cmp-title-h5 h5',
        '.cmp-title.cmp-title-h3 h3',
        '.container .cmp-title h5',
      ],
    },
    {
      name: 'text-container',
      instances: [
        '.container.overlap-predecessor .cmp-text',
        '.container.cmp-container-xx-large .grid .cmp-text',
        '.container.cmp-container-x-large .grid .cmp-text',
        '.container.related-content .cmp-text',
      ],
    },
    {
      name: 'eyebrow-text',
      instances: [
        '.cmp-text.cmp-text-eyebrow',
        '.text.cmp-text-eyebrow',
        '.cmp-text--pretitle',
      ],
    },
    {
      name: 'brightcove-video',
      instances: [
        '.cmp-video video-js',
        '.cmp-video[data-account-id]',
        '.video.cmp-video-full-width',
      ],
    },
    {
      name: 'carousel',
      instances: [
        '.carousel .cmp-carousel',
        '.carousel.cmp-carousel-minimal',
        '.carousel.cmp-carousel-show-btn-margin',
      ],
    },
    {
      name: 'custom-image',
      instances: [
        '.container.cmp-container-xx-large .grid .cmp-image',
        '.container.cmp-container-x-large .grid .cmp-image',
      ],
    },
    {
      name: 'quote',
      instances: [
        '.container.cmp-container-xx-large .cmp-quote',
        '.container.cmp-container-x-large .cmp-quote',
      ],
    },
    {
      name: 'separator',
      instances: [
        '.container.cmp-container-xx-large .cmp-separator',
        '.container.cmp-container-x-large .cmp-separator',
        '.container.cmp-container-xx-large hr.cmp-separator__line',
      ],
    },
    {
      name: 'accordion',
      instances: [
        '.accordion.panelcontainer .cmp-accordion',
        '.accordion .cmp-accordion-references',
        '.accordion.cmp-accordion-h5',
      ],
    },
  ],
  sections: [
    {
      id: 'section-1-intro',
      name: 'Intro (Hero + Breadcrumb + Title + Subtitle)',
      selector: [
        '.container.large-radius.cmp-container-full-width.height-default',
        '.container.overlap-predecessor.large-radius',
      ],
      style: 'content wide, large radius',
      blocks: ['hero', 'cta', 'story-card', 'custom-title', 'text-container'],
      defaultContent: [],
    },
    {
      id: 'section-2-featured-video',
      name: 'Featured Brightcove Video',
      selector: '.container.cmp-container-x-large:has(.cmp-video), .video.cmp-video-full-width',
      style: 'content regular, align center, section padding, container x large',
      blocks: ['brightcove-video', 'text-container'],
      defaultContent: [],
    },
    {
      id: 'section-3-story-body',
      name: 'Story Body (Two-Column Narrative)',
      selector: '.container.cmp-container-xx-large .grid.grid-cols-2, .container.cmp-container-x-large .grid.grid-cols-2',
      style: 'grid container, content regular, padding bottom, grid cols 2',
      blocks: ['custom-title', 'text-container', 'eyebrow-text', 'custom-image', 'carousel', 'quote', 'separator'],
      defaultContent: [],
    },
    {
      id: 'section-3b-references',
      name: 'References + Media Inquiries (Accordion)',
      selector: '.container.cmp-container-xx-large:has(.cmp-accordion), .container.cmp-container-x-large:has(.cmp-accordion)',
      style: 'grid section, grid cols 8',
      blocks: ['accordion', 'text-container'],
      defaultContent: [],
    },
    {
      id: 'section-4-related-content',
      name: 'Related Content Rail',
      selector: '.container.related-content, .container.cmp-container-full-width:has(.cardpagestory):last-of-type',
      style: 'grid cols 2',
      blocks: ['custom-title', 'text-container', 'story-card', 'separator'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  abbvieCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
        return;
      }
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

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. beforeTransform — site cleanup (incl. Brightcove overlay-text stash)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find block instances
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block. De-duplicate elements that were already replaced
    //    by a previous parser pass to avoid double-processing.
    const seenElements = new WeakSet();
    pageBlocks.forEach((block) => {
      if (!block.element?.isConnected) return;
      if (seenElements.has(block.element)) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
          seenElements.add(block.element);
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform — section breaks + metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized output path (matches the source URL hierarchy)
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
