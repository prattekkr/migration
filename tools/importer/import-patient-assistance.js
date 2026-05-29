/* eslint-disable */
/* global WebImporter */

import heroParser from './parsers/hero.js';
import accordionParser from './parsers/accordion.js';
import linklistParser from './parsers/linklist.js';
import columnsParser from './parsers/columns.js';
import tableParser from './parsers/table.js';
import storyCardsParser from './parsers/story-cards.js';
import cardsParser from './parsers/cards.js';
import quoteParser from './parsers/quote.js';

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';
import sectionsTransformer, { insertGridSections } from './transformers/sections.js';

const parsers = {
  'hero': heroParser,
  'accordion': accordionParser,
  'linklist': linklistParser,
  'columns': columnsParser,
  'table': tableParser,
  'story-cards': storyCardsParser,
  'cards': cardsParser,
  'quote': quoteParser,
};

// T14 — Patient Assistance (7 pages)
const PAGE_TEMPLATE = {
  name: 'patient-assistance',
  description: 'AbbVie patient assistance pages: hero, program intro text, eligibility FAQ accordion, portal CTA linklist/columns, income criteria table (income-criteria.html only), related content cards, optional patient testimonial quote',
  urls: [
    'https://www.abbvie.com/patients.html',
    'https://www.abbvie.com/patients/patient-support.html',
    'https://www.abbvie.com/patients/patient-support/patient-assistance.html',
    'https://www.abbvie.com/patients/patient-support/patient-assistance/income-criteria.html',
    'https://www.abbvie.com/patients/patient-support/patient-assistance/online-application-overview.html',
    'https://www.abbvie.com/patients/patient-support/patient-assistance/online-application-frequently-asked-questions.html',
    'https://www.abbvie.com/patients/patient-support/patient-assistance/patient-assistance-frequently-asked-questions.html',
  ],
  blocks: [
    { name: 'hero', instances: ['.container.overlap-predecessor'] },
    { name: 'accordion', instances: ['.accordion.cmp-accordion, .accordion.panelcontainer:not(.show-tabs-desktop)'] },
    { name: 'linklist', instances: ['.list.cmp-list, nav.linklist, .cmp-linklist'] },
    {
      name: 'columns',
      instances: ['.container > .cmp-container > .grid.grid-row:has(.grid-row__col-with-6)'],
    },
    { name: 'table', instances: ['table, .cmp-table, [class*="income-table"]'] },
    { name: 'story-cards', instances: ['.story-cards, .cmp-story-cards, .cardpagestory-list, .cardpagestory'] },
    { name: 'cards', instances: ['.cards.cmp-cards'] },
    { name: 'quote', instances: ['.quote.cmp-quote, blockquote.cmp-quote'] },
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
      name: 'Program Intro Text',
      selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):not(:has(.accordion))',
      style: null,
      blocks: [],
      defaultContent: ['text'],
    },
    {
      id: 'section-3-faq',
      name: 'Eligibility FAQ Accordion',
      selector: '.container.cmp-container-full-width:has(.accordion)',
      style: null,
      blocks: ['accordion'],
      defaultContent: [],
    },
    {
      id: 'section-4-portal-cta',
      name: 'Portal CTA Links',
      selector: '.container:has(.cmp-list, .grid-row__col-with-6):not(:has(.accordion)):not(:has(.story-cards))',
      style: null,
      blocks: ['linklist', 'columns'],
      defaultContent: [],
    },
    {
      id: 'section-5-table',
      name: 'Income Criteria Table',
      selector: '.container:has(table, .cmp-table)',
      style: null,
      blocks: ['table'],
      defaultContent: [],
    },
    {
      id: 'section-6-related',
      name: 'Related Content Cards',
      selector: '.container.cmp-container-full-width:has(.story-cards, .cards)',
      style: null,
      blocks: ['story-cards', 'cards'],
      defaultContent: [],
    },
    {
      id: 'section-7-quote',
      name: 'Patient Testimonial Quote',
      selector: '.container.cmp-container-full-width:has(.cmp-quote)',
      style: 'highlight',
      blocks: ['quote'],
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
    console.warn(`[import-patient-assistance] parser "${name}" failed on`, element, e);
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
      { selector: '.container:has(.cmp-list, .grid-row__col-with-6):not(:has(.accordion))', childStyles: [{ style: 'grid section, grid cols 6' }, { style: 'grid section, grid cols 6' }] },
      { selector: '.container.cmp-container-full-width:has(.story-cards, .cards)', childStyles: [{ style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }, { style: 'grid section, grid cols 4' }] },
    ].forEach(({ selector, childStyles }) => {
      try { document.querySelectorAll(selector).forEach((el) => insertGridSections(document, el, childStyles)); } catch {}
    });

    abbvieCleanupTransformer("afterTransform", document.body, { document, url, html, params });
    sectionsTransformer("afterTransform", document.body, { document, url, html, params, template: PAGE_TEMPLATE });
    // Page metadata
    const meta = extractPageMetadata(document);
    const metaBlock = createMetadataBlock(document, meta, 'patient-assistance');
    document.body.appendChild(document.createElement('hr'));
    document.body.appendChild(metaBlock);

    return document.body;
  },
  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
