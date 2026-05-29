/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Section boundaries and section-metadata.
 * Supports landing-page, content-series, leaders-listing, leader-profile, clinical-trials templates, and science-hub templates.
 *
 * Uses template name to select the right section definitions.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const LANDING_PAGE_SECTIONS = [
  {
    // Hero section: after hero parser, .overlap-predecessor is replaced and its
    // prev sibling (bg image container) is removed. Insert navy-overlap break
    // BEFORE the featured video container so the hero gets its own section.
    selector: '.container.cmp-container-full-width.height-short:not(.no-bottom-margin):not(.medium-radius)',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    // Separate unstyled content (featured video, cards) from dark quote section
    selector: '.container.semi-transparent-layer',
    fallback: '.container.semi-transparent-layer.large-radius',
    position: 'before',
    style: null,
  },
  {
    // End dark section after quote
    selector: '.container.semi-transparent-layer',
    fallback: '.container.semi-transparent-layer.large-radius',
    style: 'dark',
  },
  {
    // Separate unstyled content (explore, embed, FAQ) from navy CTA
    selector: '.container.medium-radius.cmp-container-full-width.height-short.no-bottom-margin:last-of-type',
    position: 'before',
    style: null,
  },
  {
    // End navy section after CTA
    selector: '.container.medium-radius.cmp-container-full-width.height-short.no-bottom-margin:last-of-type',
    fallback: null,
    style: 'navy',
  },
];

const LEADERS_LISTING_SECTIONS = [
  {
    // Hero section: navy background bar + overlap predecessor with title/paragraph
    selector: '.overlap-predecessor',
    fallback: '.container.large-radius.cmp-container-full-width.height-short.no-bottom-margin',
    style: 'navy-overlap',
  },
];

const LEADER_PROFILE_SECTIONS = [
  {
    // Hero section: navy background bar + overlap predecessor with name/title
    selector: '.overlap-predecessor',
    fallback: '.container.medium-radius.cmp-container-full-width.height-short.no-bottom-margin',
    style: 'navy-overlap',
  },
];

const CORPORATE_LEADER_PROFILE_SECTIONS = [
  {
    // Hero section: navy background bar + overlap predecessor with breadcrumb/name/title
    selector: '.overlap-predecessor',
    fallback: '.container.large-radius.cmp-container-full-width.height-short.no-bottom-margin',
    style: 'navy-overlap',
  },
];

const PUBLICATIONS_SECTIONS = [
  {
    // Hero section: purple background bar + overlap predecessor with H1/subtitle
    // After overlap-predecessor, insert section break + metadata before the grid content
    selector: '.grid.cmp-grid-custom',
    position: 'before',
    style: 'purple-overlap',
  },
];

const CONTENT_SERIES_SECTIONS = [
  {
    // Hero section: .overlap-predecessor is replaced by hero parser,
    // so insert hero section break BEFORE the featured video container
    selector: '.container.cmp-container-full-width.height-short:not(.medium-radius)',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    // Featured video + video cards section (dark background)
    selector: '.container.cmp-container-full-width.height-short:not(.medium-radius)',
    style: 'dark',
  },
  {
    // Dive deeper navigation section (no style, just a section break)
    selector: '.container.no-bottom-margin:not(.cmp-container-full-width):not(.height-short):not(.overlap-predecessor)',
    style: null,
  },
  {
    // CTA banner
    selector: '.container.medium-radius.cmp-container-full-width.height-short.no-bottom-margin:last-of-type',
    style: 'navy',
  },
];

const CLINICAL_TRIALS_SECTIONS = [
  {
    // End hero section (navy-overlap): insert break before the about section grid.
    // After hero parser runs, the overlap-predecessor is replaced and its sibling removed.
    // First .grid.cmp-grid-custom is the "About clinical trials" two-column grid.
    selector: '.grid.cmp-grid-custom',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    // End about section (no style): insert break before the code-of-conduct container.
    // The full-width container with light-blue background holds image + text columns.
    selector: '.container.cmp-container-full-width.height-default:not(.large-radius):not(.no-bottom-margin)',
    position: 'before',
    style: null,
  },
  {
    // End code-of-conduct section (light-blue): insert Section Metadata + HR after container.
    selector: '.container.cmp-container-full-width.height-default:not(.large-radius):not(.no-bottom-margin)',
    style: 'light-blue',
  },
  {
    // End good-clinical-practice section (no style): insert HR after the .no-bottom-margin grid.
    // This separates the accordion from the final network + IIS columns section.
    selector: '.grid.cmp-grid-custom.no-bottom-margin',
    style: null,
  },
];

const SCIENCE_HUB_SECTIONS = [
  // Hero section: .overlap-predecessor replaced by hero parser, prev sibling removed.
  // Insert navy-overlap break BEFORE the teaser (next element after hero block).
  {
    selector: '.teaser.light-theme',
    position: 'before',
    style: 'navy-overlap',
  },
  // Separate teaser (default content) from dark dashboard section
  {
    selector: '.container.large-radius.cmp-container-full-width.height-default.no-bottom-margin',
    position: 'before',
    style: null,
  },
  // End dark dashboard + focus areas section
  {
    selector: '.container.large-radius.cmp-container-full-width.height-default.no-bottom-margin',
    style: 'dark',
  },
  // Separate video embed from explore section
  {
    selector: '.container.cmp-container-full-width.height-default.no-bottom-margin.no-padding',
    position: 'before',
    style: null,
  },
  // Separate explore from tenacity section
  {
    selector: '.container.default-radius.cmp-container-xxx-large',
    position: 'before',
    style: null,
  },
  // Separate tenacity from stories+FAQ section
  {
    selector: '.container.abbvie-container.no-bottom-margin.no-padding:not(.cmp-container-full-width)',
    position: 'before',
    style: null,
  },
  // Separate stories+FAQ from CTA section
  {
    selector: '.container.cmp-container-full-width.height-default.no-bottom-margin:last-of-type',
    position: 'before',
    style: null,
  },
];

// ─── T01 Homepage ──────────────────────────────────────────────────────────
const HOMEPAGE_SECTIONS = [
  {
    // End hero + press-releases section before the patient story carousel
    selector: '.container.cmp-container-full-width:has(.carousel)',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    // Navy key-stats band
    selector: '.container.cmp-container-full-width:has(.dashboardcards)',
    position: 'before',
    style: null,
  },
  {
    selector: '.container.cmp-container-full-width:has(.dashboardcards)',
    style: 'navy, grid container',
  },
  {
    // ESG feature dark section
    selector: '.container.cmp-container-full-width:last-of-type:has(.cmp-text):not(:has(.carousel)):not(:has(.cmp-list))',
    position: 'before',
    style: null,
  },
  {
    selector: '.container.cmp-container-full-width:last-of-type:has(.cmp-text):not(:has(.carousel)):not(:has(.cmp-list))',
    style: 'dark',
  },
];

// ─── T02 Section Landing ───────────────────────────────────────────────────
const SECTION_LANDING_SECTIONS = [
  {
    selector: '.container.cmp-container-full-width:has(.cmp-video)',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    selector: '.container.cmp-container-full-width:has(.dashboardcards)',
    position: 'before',
    style: null,
  },
  {
    selector: '.container.cmp-container-full-width:has(.dashboardcards)',
    style: 'navy, grid container',
  },
  {
    selector: '.container.cmp-container-full-width.medium-radius:last-of-type',
    position: 'before',
    style: null,
  },
  {
    selector: '.container.cmp-container-full-width.medium-radius:last-of-type',
    style: 'highlight',
  },
];

// ─── T03 Therapeutic Area ──────────────────────────────────────────────────
const THERAPEUTIC_AREA_SECTIONS = [
  {
    selector: '.container.cmp-container-full-width:has(.cmp-video)',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    selector: '.container.cmp-container-full-width.medium-radius:last-of-type',
    position: 'before',
    style: null,
  },
  {
    selector: '.container.cmp-container-full-width.medium-radius:last-of-type',
    style: 'highlight',
  },
];

// ─── T04 Innovation Area ───────────────────────────────────────────────────
const INNOVATION_AREA_SECTIONS = [
  {
    // First non-hero text container = intro text section (centered 75%)
    selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text)',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    selector: '.container.cmp-container-full-width.medium-radius:last-of-type',
    position: 'before',
    style: null,
  },
  {
    selector: '.container.cmp-container-full-width.medium-radius:last-of-type',
    style: 'highlight',
  },
];

// ─── T09 Story Article ─────────────────────────────────────────────────────
const STORY_ARTICLE_SECTIONS = [
  {
    // Hero image section ends before the article body
    selector: '.container.cmp-container-full-width:has(.cmp-text)',
    position: 'before',
    style: null,
  },
  {
    // Article body (centered narrow 67%) ends before related articles
    selector: '.container.cmp-container-full-width:has(.story-cards, .cardpagestory-list)',
    position: 'before',
    style: 'container medium',
  },
];

// ─── T10 Stories Listing ───────────────────────────────────────────────────
const STORIES_LISTING_SECTIONS = [
  {
    // Featured hero story (dark) ends before secondary teaser or filter
    selector: '.container.cmp-container-full-width:has(.teaser, .tag-utility-nav)',
    position: 'before',
    style: 'dark',
  },
];

// ─── T12 Key Facts ─────────────────────────────────────────────────────────
const KEY_FACTS_SECTIONS = [
  {
    selector: '.container:not(.cmp-container-full-width):has(.cmp-text)',
    position: 'before',
    style: 'navy-overlap',
  },
];

// ─── T13 R&D Sites ─────────────────────────────────────────────────────────
const RD_SITES_SECTIONS = [
  {
    selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text)',
    position: 'before',
    style: 'navy-overlap',
  },
];

// ─── T14 Patient Assistance ────────────────────────────────────────────────
const PATIENT_ASSISTANCE_SECTIONS = [
  {
    selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):not(:has(.accordion))',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    selector: '.container.cmp-container-full-width:has(.cmp-quote)',
    position: 'before',
    style: null,
  },
  {
    selector: '.container.cmp-container-full-width:has(.cmp-quote)',
    style: 'highlight',
  },
];

// ─── T16 Brand Partnership ─────────────────────────────────────────────────
const BRAND_PARTNERSHIP_SECTIONS = [
  {
    selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text):not(:has(.cmp-quote))',
    position: 'before',
    style: 'navy-overlap',
  },
];

// ─── T17 Rich Content ──────────────────────────────────────────────────────
const RICH_CONTENT_SECTIONS = [
  {
    // T17 has a hero (overlap-predecessor). T17b has no hero — selector won't match.
    selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text)',
    position: 'before',
    style: 'navy-overlap',
  },
];

// ─── T18 Sub-Section Hub ───────────────────────────────────────────────────
const SUB_SECTION_HUB_SECTIONS = [
  {
    selector: '.container.cmp-container-full-width:has(.cmp-video)',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    selector: '.container.cmp-container-full-width.medium-radius:last-of-type',
    position: 'before',
    style: null,
  },
  {
    selector: '.container.cmp-container-full-width.medium-radius:last-of-type',
    style: 'highlight',
  },
];

// ─── T08 Pipeline ──────────────────────────────────────────────────────────
const PIPELINE_SECTIONS = [
  {
    // Hero ends before intro text
    selector: '.container:not(.overlap-predecessor):not(.cmp-container-full-width):has(.cmp-text)',
    position: 'before',
    style: 'navy-overlap',
  },
  {
    // Pipeline table section gets x-large container
    selector: '.container.cmp-container-full-width:has(table, .cmp-table, [class*="pipeline"])',
    style: 'container x-large',
  },
];

function getSectionsForTemplate(templateName) {
  if (templateName === 'publications') return PUBLICATIONS_SECTIONS;
  if (templateName === 'science-hub') return SCIENCE_HUB_SECTIONS;
  if (templateName === 'content-series') return CONTENT_SERIES_SECTIONS;
  if (templateName === 'leaders-listing') return LEADERS_LISTING_SECTIONS;
  if (templateName === 'leader-profile') return LEADER_PROFILE_SECTIONS;
  if (templateName === 'corporate-leader-profile') return CORPORATE_LEADER_PROFILE_SECTIONS;
  if (templateName === 'clinical-trials') return CLINICAL_TRIALS_SECTIONS;
  // New T01-T18 templates
  if (templateName === 'homepage') return HOMEPAGE_SECTIONS;
  if (templateName === 'section-landing') return SECTION_LANDING_SECTIONS;
  if (templateName === 'therapeutic-area') return THERAPEUTIC_AREA_SECTIONS;
  if (templateName === 'innovation-area') return INNOVATION_AREA_SECTIONS;
  if (templateName === 'story-article') return STORY_ARTICLE_SECTIONS;
  if (templateName === 'stories-listing') return STORIES_LISTING_SECTIONS;
  if (templateName === 'key-facts') return KEY_FACTS_SECTIONS;
  if (templateName === 'rd-sites') return RD_SITES_SECTIONS;
  if (templateName === 'patient-assistance') return PATIENT_ASSISTANCE_SECTIONS;
  if (templateName === 'brand-partnership') return BRAND_PARTNERSHIP_SECTIONS;
  if (templateName === 'rich-content') return RICH_CONTENT_SECTIONS;
  if (templateName === 'sub-section-hub') return SUB_SECTION_HUB_SECTIONS;
  if (templateName === 'pipeline') return PIPELINE_SECTIONS;
  return LANDING_PAGE_SECTIONS;
}

/**
 * Insert a Section Metadata block + HR separator into the document.
 *
 * @param {Document} document
 * @param {Element}  anchorEl  - DOM element to insert relative to
 * @param {string|null} style  - comma-separated Section Metadata style value
 * @param {'before'|'after'} position
 */
function insertSectionBreak(document, anchorEl, style, position = 'after') {
  const hr = document.createElement('hr');

  if (position === 'before') {
    if (style) {
      const metaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: [['style', style]],
      });
      anchorEl.before(metaBlock);
      anchorEl.before(hr);
    } else {
      anchorEl.before(hr);
    }
  } else {
    let insertAfter = anchorEl;
    if (style) {
      const metaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: [['style', style]],
      });
      insertAfter.after(metaBlock);
      insertAfter = metaBlock;
    }
    insertAfter.after(hr);
  }
}

/**
 * Insert grid child section separators between top-level block children of a
 * grid-container section.
 *
 * For a 3-col section the authored document looks like:
 *
 *   [Section Metadata: style = "grid container"]
 *   ---
 *   [Section Metadata: style = "grid section, grid cols 4"]
 *   [block A]
 *   ---
 *   [Section Metadata: style = "grid section, grid cols 4"]
 *   [block B]
 *   ---
 *   [Section Metadata: style = "grid section, grid cols 4"]
 *   [block C]
 *   ---
 *
 * @param {Document} document
 * @param {Element}  containerEl  - the AEM container element holding the blocks
 * @param {Array<{style:string}>} childStyles  - one entry per child section
 */
function insertGridChildSections(document, containerEl, childStyles) {
  // Find all direct block-table children (already converted by parsers)
  const blockEls = Array.from(containerEl.children).filter(
    (el) => el.tagName === 'TABLE' || el.classList.contains('block') || el.tagName === 'DIV',
  );

  if (blockEls.length === 0) return;

  blockEls.forEach((blockEl, i) => {
    const colStyle = (childStyles[i] || childStyles[childStyles.length - 1]).style;
    const metaBlock = WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: [['style', colStyle]],
    });
    blockEl.before(metaBlock);
    blockEl.before(document.createElement('hr'));
  });
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const { document } = payload;
  const templateName = payload.template ? payload.template.name : 'landing-page';
  const sections = getSectionsForTemplate(templateName);

  sections.forEach(({ selector, fallback, style, position }) => {
    const sectionEl = element.querySelector(selector) || (fallback && element.querySelector(fallback));
    if (!sectionEl) return;
    insertSectionBreak(document, sectionEl, style, position || 'after');
  });
}

/**
 * Utility exported for orchestrators — inserts grid child section metadata
 * around each block inside a grid-container parent element.
 *
 * Usage in orchestrator:
 *   import sectionsTransformer, { insertGridSections } from './transformers/sections.js';
 *   insertGridSections(document, containerEl, [
 *     { style: 'grid section, grid cols 8' },
 *     { style: 'grid section, grid cols 4' },
 *   ]);
 */
export function insertGridSections(document, containerEl, childStyles) {
  insertGridChildSections(document, containerEl, childStyles);
}
