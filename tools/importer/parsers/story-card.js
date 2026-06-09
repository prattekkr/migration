/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: story-card
 * Base block: story-card
 * Source: https://www.abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html
 * Generated: 2026-05-26
 *
 * The story-card block is reused at two positions on a story page:
 *   1. "storyCardInfo" variant — top of page, shows publication date + category
 *      + read time strip pulled from the page metadata of the linked target.
 *   2. "sidePanel" / "relatedContent" variant — bottom of page, related article tile.
 *
 * Source DOM patterns:
 *   - .cmp-teaser, .cardpagestory, .cmp-card — wraps a clickable card with an <a>
 *   - .cmp-breadcrumb__list — for the date/category strip on AEM articles
 *   - Headline link or image link is the target page path
 *
 * Library structure: 1 column, N rows (each field = own row, field-comment driven).
 * UE Model fields:
 *   storyCardVariant (select) — cardInfo | storyCardInfo | leaderInfo | sidePanel | relatedContent
 *   page (aem-content)         — target page reference (required)
 *   openInNewTab (boolean)
 *   hidePublicationDate (boolean)
 *   hideReadTime (boolean)
 *   hideRole (boolean)         — "title" toggle in UE
 *   hideDescription (boolean)
 *   hideImage (boolean)
 *   ctaLabel (text)            — custom CTA override
 *
 * Variant selection (heuristic based on source position):
 *   - First card on page, near hero/breadcrumb → storyCardInfo, hides image/role/desc
 *   - Later cards (within Related Content section) → sidePanel
 *
 * Analytics: data-track / data-cmp-data-layer preserved
 * Accessibility: anchor text preserved as ctaLabel fallback
 */

// Path prefix used by the EDS site to address content pages in the AEM tree.
const AEM_PAGE_PREFIX = '/content/abbvie-nextgen-eds/corporate/abbvie-com/us/en';

function toAemPagePath(href) {
  if (!href) return '';
  // Already an AEM path? Strip .html if present.
  if (href.startsWith('/content/')) return href.replace(/\.html$/i, '');
  try {
    const u = new URL(href, 'https://www.abbvie.com');
    const pathname = u.pathname.replace(/\.html$/i, '').replace(/^\//, '');
    return `${AEM_PAGE_PREFIX}/${pathname}`.replace(/\/+/g, '/');
  } catch (e) {
    return href.replace(/\.html$/i, '');
  }
}

function detectVariant(element) {
  const cls = (element.className || '').toLowerCase();
  const containerCls = (element.closest('.container, section')?.className || '').toLowerCase();

  if (/breadcrumb|story-info|article-meta/.test(cls + ' ' + containerCls)) return 'storyCardInfo';
  if (/related|side-panel|sidepanel/.test(cls + ' ' + containerCls)) return 'sidePanel';
  if (/leader/.test(cls + ' ' + containerCls)) return 'leaderInfo';
  return 'cardInfo';
}

export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // Resolve the most useful anchor on the card
  const anchor = element.querySelector('a[href]');
  const href = anchor?.getAttribute('href') || '';
  const aemPagePath = toAemPagePath(href);

  // Variant
  const variant = detectVariant(element);

  // CTA label override — read from explicit CTA span / anchor text
  const ctaEl = element.querySelector('.cmp-button__text, .card-cta, .cmp-teaser__action a');
  const ctaLabel = (ctaEl?.textContent || '').trim();

  // Default toggles based on observed authoring of the story page reference:
  //   storyCardInfo → hide image, hide role/title, hide description; show date+read time
  //   sidePanel     → show image, all fields visible (defaults)
  const defaults = {
    storyCardInfo: {
      hidePublicationDate: false,
      hideReadTime: false,
      hideRole: true,
      hideDescription: true,
      hideImage: true,
    },
    sidePanel: {
      hidePublicationDate: false,
      hideReadTime: false,
      hideRole: false,
      hideDescription: false,
      hideImage: false,
    },
    cardInfo: {
      hidePublicationDate: false,
      hideReadTime: false,
      hideRole: false,
      hideDescription: false,
      hideImage: false,
    },
    leaderInfo: {
      hidePublicationDate: true,
      hideReadTime: true,
      hideRole: false,
      hideDescription: false,
      hideImage: false,
    },
    relatedContent: {
      hidePublicationDate: false,
      hideReadTime: false,
      hideRole: false,
      hideDescription: false,
      hideImage: false,
    },
  }[variant] || {};

  const openInNewTab = (anchor?.getAttribute('target') === '_blank');

  const row = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (value !== undefined && value !== null && value !== '') {
      const p = document.createElement('p');
      p.textContent = typeof value === 'boolean' ? String(value) : String(value);
      frag.appendChild(p);
    }
    return [frag];
  };

  const cells = [
    row('storyCardVariant', variant),
    row('page', aemPagePath),
    row('openInNewTab', openInNewTab),
    row('hidePublicationDate', defaults.hidePublicationDate ?? false),
    row('hideReadTime', defaults.hideReadTime ?? false),
    row('hideRole', defaults.hideRole ?? false),
    row('hideDescription', defaults.hideDescription ?? false),
    row('hideImage', defaults.hideImage ?? false),
    row('ctaLabel', ctaLabel),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'story-card', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
