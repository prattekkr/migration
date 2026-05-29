/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import linklistParser from './parsers/linklist.js';
import columnsParser from './parsers/columns.js';
import cardsParser from './parsers/cards.js';
import quoteParser from './parsers/quote.js';
import accordionParser from './parsers/accordion.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'linklist': linklistParser,
  'columns': columnsParser,
  'cards': cardsParser,
  'quote': quoteParser,
  'accordion': accordionParser,
};

// T17 — Rich Content / Policy Page (15 pages) + T17b — Disclosure/Data Table Page (3 pages)
const PAGE_TEMPLATE = {
  name: 'rich-content',
  description: 'AbbVie policy/principles/rich-content pages: hero (optional — T17b has no hero), intro/mission text, optional linklist nav, optional columns image+text, optional cards, optional quote (EEDI), optional 3-col columns, optional accordion, awards/recognitions default content. Also handles disclosure pages (accordion only, no hero).',
  urls: [
    'https://www.abbvie.com/who-we-are/our-principles.html',
    'https://www.abbvie.com/who-we-are/our-principles/positions-views.html',
    'https://www.abbvie.com/who-we-are/our-principles/positions-views/our-commitment-to-ethical-and-responsible-use-of-animals-in-research.html',
    'https://www.abbvie.com/who-we-are/our-principles/equity-equality-inclusion-diversity.html',
    'https://www.abbvie.com/who-we-are/our-principles/equity-equality-inclusion-diversity/impact-through-inclusion.html',
    'https://www.abbvie.com/who-we-are/operating-with-integrity.html',
    'https://www.abbvie.com/who-we-are/operating-with-integrity/protecting-human-rights-and-workplace-safety.html',
    'https://www.abbvie.com/who-we-are/operating-with-integrity/transparency-in-payment.html',
    'https://www.abbvie.com/who-we-are/operating-with-integrity/responsible-supply-chain.html',
    'https://www.abbvie.com/who-we-are/operating-with-integrity/responsible-supply-chain/supplier-resources.html',
    'https://www.abbvie.com/who-we-are/operating-with-integrity/abbvies-code-of-conduct.html',
    'https://www.abbvie.com/who-we-are/policies-disclosures.html',
    'https://www.abbvie.com/who-we-are/policies-disclosures/protecting-data.html',
    'https://www.abbvie.com/who-we-are/access-to-investigational-drugs-policy.html',
    'https://www.abbvie.com/science/partner-with-us/partnering-days.html',
    // T17b — Disclosure pages
    'https://www.abbvie.com/who-we-are/operating-with-integrity/transparency-in-payment/allergan-ous-disclosures.html',
    'https://www.abbvie.com/who-we-are/operating-with-integrity/transparency-in-payment/abbvie-inquiry.html',
    'https://www.abbvie.com/who-we-are/operating-with-integrity/transparency-in-payment/frequently-asked-questions-physician-and-other-payments.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'linklist', instances: ['.list.cmp-list, nav.linklist, .cmp-linklist'] },
    {
      name: 'columns',
      instances: [
        '.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-6)',
        '.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-4)',
      ],
    },
    { name: 'cards', instances: ['.cards.cmp-cards, .cmp-card-list'] },
    { name: 'quote', instances: ['.quote.cmp-quote, blockquote.cmp-quote'] },
    { name: 'accordion', instances: ['.accordion.cmp-accordion, .accordion.panelcontainer:not(.show-tabs-desktop)'] },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero (T17 only — T17b skips this)',
      selector: ['.container.overlap-predecessor', '.container.large-radius.cmp-container-full-width.height-default'],
      style: 'navy-overlap',
      blocks: ['hero'],
      defaultContent: [],
    },
    {
      id: 'section-2-intro',
      name: 'Intro / Mission Text',
      selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):not(:has(.accordion)):not(:has(.cmp-list)):first-of-type',
      style: null,
      blocks: [],
      defaultContent: ['text'],
    },
    {
      id: 'section-3-linklist',
      name: 'Related Topics Nav (optional)',
      selector: '.container.cmp-container-full-width:has(.cmp-list)',
      style: null,
      blocks: ['linklist'],
      defaultContent: [],
    },
    {
      id: 'section-4-columns',
      name: 'Content Columns image+text (optional)',
      selector: '.container.cmp-container-full-width:has(.grid-row__col-with-6):not(:has(.accordion)):not(:has(.cmp-quote))',
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'section-5-cards',
      name: 'Text Action Cards (optional)',
      selector: '.container.cmp-container-full-width:has(.cards, .cmp-card-list)',
      style: null,
      blocks: ['cards'],
      defaultContent: [],
    },
    {
      id: 'section-6-quote',
      name: 'Quote with Attribution (EEDI only)',
      selector: '.container.cmp-container-full-width:has(.cmp-quote)',
      style: null,
      blocks: ['quote'],
      defaultContent: [],
    },
    {
      id: 'section-7-3col',
      name: '3-Col Text Blocks (EEDI only)',
      selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4)',
      style: null,
      blocks: ['columns'],
      defaultContent: [],
    },
    {
      id: 'section-8-accordion',
      name: 'Topic / Disclosure Accordion (optional)',
      selector: '.container.cmp-container-full-width:has(.accordion)',
      style: null,
      blocks: ['accordion'],
      defaultContent: [],
    },
    {
      id: 'section-9-awards',
      name: 'Awards / Recognitions (default content)',
      selector: '.container.cmp-container-full-width:last-of-type:has(.cmp-text):not(:has(.accordion))',
      style: null,
      blocks: [],
      defaultContent: ['text'],
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
    console.warn(`[import-rich-content] parser "${name}" failed on`, element, e);
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
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-6):not(:has(.accordion)):not(:has(.cmp-quote))', childStyles: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
      { selector: '.container.cmp-container-full-width:has(.cards, .cmp-card-list)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
      { selector: '.container.cmp-container-full-width:has(.grid-row__col-with-4)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer("afterTransform", document.body, { document, url, html, params, template: PAGE_TEMPLATE });
    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'rich-content');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },
  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
