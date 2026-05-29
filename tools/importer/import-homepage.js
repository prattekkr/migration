/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import columnsParser from './parsers/columns.js';
import factCardParser from './parsers/fact-card.js';
import brightcoveVideoParser from './parsers/brightcove-video.js';
import stockTickerParser from './parsers/stock-ticker.js';
import pressReleasesParser from './parsers/press-releases.js';

// TRANSFORMER IMPORTS
import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { extractPageMetadata, createMetadataBlock } from './parsers/utils/metadata.js';

// PARSER REGISTRY
const parsers = {
  'hero': heroParser,
  'columns': columnsParser,
  'fact-card': factCardParser,
  'brightcove-video': brightcoveVideoParser,
  'stock-ticker': stockTickerParser,
  'press-releases': pressReleasesParser,
};

/**
 * AbbVie Homepage Import Script
 *
 * The homepage DOM is a flat .aem-Grid with 19 direct children:
 *  0: .homepage-hero-controller (hero)
 *  1: .container.homepage-overlap (press releases + featured)
 *  2: .teaser ("Patients are at the heart...")
 *  3: .video.cmp-video-xx-large (Brightcove video)
 *  4: .separator
 *  5: .teaser ("Science & Innovation")
 *  6: .grid (Science card + fact cards)
 *  7: .container.default-radius (Our Impact / Manufacturing)
 *  8: .separator
 *  9: .teaser.light-theme ("A culture of curiosity")
 * 10: .grid.cmp-grid-custom (3 cards: Science, Learning, Partnerships)
 * 11: .separator
 * 12: .container.medium-radius (Careers CTA)
 * 13: .separator
 * 14: .teaser ("Investor Resources")
 * 15: .grid (Earnings + investor links)
 * 16: .separator
 * 17: .teaser ("Environmental, Social and Governance")
 * 18: .container.large-radius.cmp-container-full-width (ESG panoramic)
 *
 * Sections are delimited by separators. We map to EDS sections:
 * S1: Hero + Press/Featured (navy-overlap)
 * S2: Patient intro + Video
 * S3: Science intro + Science card/stats
 * S4: Our Impact (highlight)
 * S5: Culture intro + 3 cards
 * S6: Careers CTA (highlight)
 * S7: Investor intro + Earnings
 * S8: ESG intro + panoramic (dark)
 */

// Section definitions based on actual DOM indices
const SECTIONS = [
  { name: 'Hero + Press/Featured', indices: [0, 1], style: 'navy-overlap' },
  { name: 'Patient Story + Video', indices: [2, 3], style: null },
  { name: 'Science & Innovation', indices: [5, 6], style: null },
  { name: 'Our Impact', indices: [7], style: 'highlight' },
  { name: 'Culture & Partnerships', indices: [9, 10], style: null },
  { name: 'Careers CTA', indices: [12], style: 'highlight' },
  { name: 'Investor Resources', indices: [14, 15], style: null },
  { name: 'ESG', indices: [17, 18], style: 'dark' },
];

function createSectionMetadata(document, style) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const th = document.createElement('th');
  th.colSpan = 2;
  th.textContent = 'Section Metadata';
  headerRow.appendChild(th);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const row = document.createElement('tr');
  const keyCell = document.createElement('td');
  keyCell.textContent = 'style';
  const valCell = document.createElement('td');
  valCell.textContent = style;
  row.appendChild(keyCell);
  row.appendChild(valCell);
  tbody.appendChild(row);
  table.appendChild(tbody);
  return table;
}

function extractTeaser(el, document) {
  const frag = document.createDocumentFragment();
  const pretitle = el.querySelector('.cmp-teaser__pretitle');
  const title = el.querySelector('.cmp-teaser__title');
  const desc = el.querySelector('.cmp-teaser__description');
  const cta = el.querySelector('.cmp-teaser__action-link, .cmp-button');

  if (pretitle) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = pretitle.textContent.trim();
    p.appendChild(strong);
    frag.appendChild(p);
  }
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title.textContent.trim();
    frag.appendChild(heading);
  }
  if (desc) {
    const p = document.createElement('p');
    p.textContent = desc.textContent.trim();
    frag.appendChild(p);
  }
  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = cta.href || cta.querySelector('a')?.href || '#';
    a.textContent = cta.textContent.trim().replace(/\s+/g, ' ');
    p.appendChild(a);
    frag.appendChild(p);
  }
  return frag;
}

export default {
  transformDOM({ document, url, html, params }) {
    // 1. Run pre-import cleanup
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    // 2. Find the main grid container (parent of all 19 section elements)
    const h1 = document.querySelector('h1');
    let gridContainer = h1;
    while (gridContainer && gridContainer.parentElement) {
      if (gridContainer.parentElement.children.length >= 15) {
        gridContainer = gridContainer.parentElement;
        break;
      }
      gridContainer = gridContainer.parentElement;
    }

    if (!gridContainer || gridContainer.children.length < 15) {
      // Fallback: try .aem-Grid
      gridContainer = document.querySelector('.aem-Grid.aem-Grid--12') || document.body;
    }

    const allChildren = Array.from(gridContainer.children);

    // 3. Build output with proper section breaks
    const output = document.createElement('div');

    SECTIONS.forEach((section, sIdx) => {
      // Insert section break (except before first section)
      if (sIdx > 0) {
        output.appendChild(document.createElement('hr'));
      }

      // Process each element in this section
      section.indices.forEach((idx) => {
        const el = allChildren[idx];
        if (!el) return;

        const cls = el.className || '';

        // Hero controller
        if (cls.includes('homepage-hero-controller')) {
          const bgImg = el.querySelector('img');
          const heading = el.querySelector('h1');
          const link = el.querySelector('a');

          const heroTable = document.createElement('table');
          const thead = document.createElement('thead');
          const hr = document.createElement('tr');
          const hth = document.createElement('th');
          hth.textContent = 'Hero';
          hr.appendChild(hth);
          thead.appendChild(hr);
          heroTable.appendChild(thead);

          const tbody = document.createElement('tbody');
          // Image row
          if (bgImg) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            const pic = document.createElement('picture');
            const img = document.createElement('img');
            img.src = bgImg.src || bgImg.getAttribute('data-cmp-src') || '';
            img.alt = bgImg.alt || '';
            pic.appendChild(img);
            cell.appendChild(pic);
            row.appendChild(cell);
            tbody.appendChild(row);
          }
          // Text row
          const textRow = document.createElement('tr');
          const textCell = document.createElement('td');
          if (heading) {
            const h = document.createElement('h1');
            h.textContent = heading.textContent.trim();
            textCell.appendChild(h);
          }
          if (link) {
            const p = document.createElement('p');
            const a = document.createElement('a');
            a.href = link.href || '';
            a.textContent = link.textContent.trim();
            p.appendChild(a);
            textCell.appendChild(p);
          }
          textRow.appendChild(textCell);
          tbody.appendChild(textRow);
          heroTable.appendChild(tbody);
          output.appendChild(heroTable);
        }
        // Press releases + Featured container
        else if (cls.includes('homepage-overlap')) {
          // Press releases
          const pressEl = el.querySelector('.press-releases, [class*="press-release"], .carousel');
          if (pressEl) {
            try { pressReleasesParser(pressEl, { document, url }); output.appendChild(pressEl); } catch {}
          }
          // Featured teaser
          const featured = el.querySelector('.cardpagestory, .storyCardInfo, .cmp-teaser');
          if (featured) {
            const wrapper = document.createElement('div');
            const img = featured.querySelector('img');
            const heading = featured.querySelector('h4, h5, h3');
            const link = featured.querySelector('a');
            if (img) {
              const pic = document.createElement('picture');
              const i = document.createElement('img');
              i.src = img.src || img.getAttribute('data-cmp-src') || '';
              i.alt = img.alt || '';
              pic.appendChild(i);
              wrapper.appendChild(pic);
            }
            if (heading) {
              const h = document.createElement('h5');
              h.textContent = heading.textContent.trim();
              wrapper.appendChild(h);
            }
            if (link) {
              const p = document.createElement('p');
              const a = document.createElement('a');
              a.href = link.href || '';
              a.textContent = link.textContent.trim().replace(/\s+/g, ' ').substring(0, 50) || 'learn more';
              p.appendChild(a);
              wrapper.appendChild(p);
            }
            output.appendChild(wrapper);
          }
        }
        // Teaser (intro text sections)
        else if (cls.includes('teaser')) {
          output.appendChild(extractTeaser(el, document));
        }
        // Video
        else if (cls.includes('video')) {
          try { brightcoveVideoParser(el, { document, url }); output.appendChild(el); } catch {}
        }
        // Grid (cards/columns)
        else if (cls.includes('grid')) {
          // Find the grid-row container and get its direct column children
          const gridRow = el.querySelector('.grid-row') || el.querySelector('.cmp-grid') || el.firstElementChild;
          const cols = gridRow
            ? Array.from(gridRow.children).filter(c => (c.className || '').includes('col-with'))
            : [];
          // Deduplicate: only process top-level columns (not nested ones)
          const processed = new Set();
          const wrapper = document.createElement('div');
          cols.forEach((card) => {
            const key = card.textContent.trim().substring(0, 50);
            if (processed.has(key)) return;
            processed.add(key);

            const cardDiv = document.createElement('div');
            const img = card.querySelector('img');
            const heading = card.querySelector('h2, h3, h4, h5');
            const text = card.querySelector('p:not(:has(a)):not(:has(img)), .cmp-teaser__description');
            const link = card.querySelector('a');
            // Stat/fact card pattern: look for number displays
            const stat = card.querySelector('[class*="dashboardcards"], [class*="fact-card"]');
            const statNum = card.querySelector('[class*="number"], [class*="value"]');

            if (img) {
              const pic = document.createElement('picture');
              const i = document.createElement('img');
              i.src = img.src || img.getAttribute('data-cmp-src') || '';
              i.alt = img.alt || '';
              pic.appendChild(i);
              const p = document.createElement('p');
              p.appendChild(pic);
              cardDiv.appendChild(p);
            }
            if (heading) {
              const h = document.createElement('h4');
              h.textContent = heading.textContent.trim();
              cardDiv.appendChild(h);
            }
            if (text) {
              const p = document.createElement('p');
              p.textContent = text.textContent.trim().substring(0, 200);
              cardDiv.appendChild(p);
            }
            if (link) {
              const p = document.createElement('p');
              const a = document.createElement('a');
              a.href = link.href || '';
              a.textContent = link.textContent.trim().replace(/\s+/g, ' ').substring(0, 60) || 'Learn More';
              p.appendChild(a);
              cardDiv.appendChild(p);
            }
            if (cardDiv.children.length > 0) {
              wrapper.appendChild(cardDiv);
            }
          });
          if (wrapper.children.length > 0) {
            output.appendChild(wrapper);
          }
        }
        // Container (Our Impact, Careers CTA, ESG)
        else if (cls.includes('container')) {
          const heading = el.querySelector('h2, h3, h4');
          const text = el.querySelector('p');
          const link = el.querySelector('a');
          const img = el.querySelector('img:not(.cmp-container__bg-image)') || el.querySelector('img');
          const bgImg = el.querySelector('img.cmp-container__bg-image');

          const wrapper = document.createElement('div');
          if (bgImg || img) {
            const pic = document.createElement('picture');
            const i = document.createElement('img');
            const srcImg = bgImg || img;
            i.src = srcImg.src || srcImg.getAttribute('data-cmp-src') || '';
            i.alt = srcImg.alt || '';
            pic.appendChild(i);
            wrapper.appendChild(pic);
          }
          if (heading) {
            const h = document.createElement('h3');
            h.textContent = heading.textContent.trim();
            wrapper.appendChild(h);
          }
          if (text) {
            const p = document.createElement('p');
            p.textContent = text.textContent.trim().substring(0, 200);
            wrapper.appendChild(p);
          }
          if (link) {
            const p = document.createElement('p');
            const a = document.createElement('a');
            a.href = link.href || '';
            a.textContent = link.textContent.trim().replace(/\s+/g, ' ').substring(0, 40) || 'Learn more';
            p.appendChild(a);
            wrapper.appendChild(p);
          }
          output.appendChild(wrapper);
        }
      });

      // Add section metadata if section has a style
      if (section.style) {
        output.appendChild(createSectionMetadata(document, section.style));
      }
    });

    // 4. Page metadata
    const meta = extractPageMetadata(document);
    output.appendChild(document.createElement('hr'));
    output.appendChild(createMetadataBlock(document, meta, 'homepage'));

    // 5. Run afterTransform cleanup
    abbvieCleanupTransformer("afterTransform", output, { document, url, html, params });

    return output;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
