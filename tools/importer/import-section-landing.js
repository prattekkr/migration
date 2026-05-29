/* eslint-disable */
/* global WebImporter */

/**
 * Import Script: section-landing (4 pages)
 *
 * Pages: patients/patient-support.html, who-we-are.html, science.html, patients.html
 *
 * DOM structure (from patient-support.html):
 *   [0] .container.large-radius.cmp-container-full-width — Hero bg image
 *   [1] .separator — spacing
 *   [2] .container.overlap-predecessor — H1 + lede text (breadcrumb)
 *   [3] .separator — spacing
 *   [4] .teaser — intro section heading + text
 *   [5] .grid.cmp-grid-custom — columns (image + text with links)
 *   [6] .teaser — second intro heading + text
 *   [7] .grid.cmp-grid-custom — columns (image + text with links)
 *   [8] .separator — spacing
 *   [9] .carousel.panelcontainer — story card carousel
 *   [10] .grid.cmp-grid-custom — ESG card + fact-card stats
 *   [11] .container.cmp-container-medium — Partnerships text
 *   [12] .container.cmp-container-full-width — Related content cards
 *
 * EDS output:
 *   Section 1 (content-wide, medium-radius): hero-container + custom-title(h1) + text-container(lede)
 *   Section 2 (grid-container, content-regular) + grid-cols sections: teaser + columns content
 *   Section 3: carousel / story cards
 *   Section 4 (navy): fact cards / stats
 *   Section 5: partnerships text
 *   Section 6: related content cards
 *   Metadata section
 */

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { appendMetadataBlock } from './parsers/utils/metadata.js';

function makeBlock(document, name, rows) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.colSpan = 2;
  th.textContent = name;
  tr.appendChild(th);
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach((cells) => {
    const row = document.createElement('tr');
    (Array.isArray(cells) ? cells : [cells]).forEach((cell) => {
      const td = document.createElement('td');
      if (cell instanceof Node) td.appendChild(cell.cloneNode ? cell.cloneNode(true) : cell);
      else td.textContent = cell != null ? String(cell) : '';
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
}

function makeSectionMetadata(document, style) {
  return makeBlock(document, 'Section Metadata', [['style', style]]);
}

function normalizeImageUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:')) return '';
  // Strip query params from Scene7
  if (src.includes('scene7.com')) {
    try { return new URL(src).origin + new URL(src).pathname; } catch {}
  }
  if (src.includes('/content/dam/')) {
    const fn = src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[?#].*/, '');
    return `https://abbvie.scene7.com/is/image/abbviecorp/${fn}`;
  }
  return src;
}

function findContentRoot(document) {
  const overlapEl = document.querySelector('.overlap-predecessor');
  if (overlapEl) return overlapEl.parentElement;
  const h1 = document.querySelector('h1');
  if (h1) {
    let el = h1;
    while (el.parentElement) {
      if ((el.parentElement.className || '').includes('aem-Grid')) return el.parentElement;
      el = el.parentElement;
    }
  }
  return document.querySelector('.aem-Grid.aem-Grid--12') || document.body;
}

export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    const contentRoot = findContentRoot(document);
    const allChildren = Array.from(contentRoot.children);
    const overlapIdx = allChildren.findIndex((el) => (el.className || '').includes('overlap-predecessor'));

    const heroContainer = overlapIdx > 0 ? allChildren[overlapIdx - 1] : null;
    const introContainer = overlapIdx >= 0 ? allChildren[overlapIdx] : null;

    const output = document.createElement('div');

    // ══════════════════════════════════════════════════════════
    // SECTION 1: HERO + INTRO (content-wide, medium-radius)
    // ══════════════════════════════════════════════════════════

    // Hero image
    let heroImgSrc = '';
    let heroImgAlt = '';
    if (heroContainer) {
      const img = heroContainer.querySelector('img');
      if (img) {
        heroImgSrc = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
        heroImgAlt = img.getAttribute('alt') || '';
      }
    }
    if (heroImgSrc) {
      const picP = document.createElement('p');
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.src = heroImgSrc;
      img.alt = heroImgAlt;
      pic.appendChild(img);
      picP.appendChild(pic);
      output.appendChild(makeBlock(document, 'Hero Container (height-default, overlay-height-short)', [
        [picP, '', '', '', '', ''],
      ]));
    }

    // Title (H1)
    let titleText = '';
    if (introContainer) {
      const h1 = introContainer.querySelector('h1');
      if (h1) titleText = h1.textContent.trim();
    }
    if (titleText) {
      const h1 = document.createElement('h1');
      h1.textContent = titleText;
      output.appendChild(makeBlock(document, 'Custom Title (h1-size)', [[h1], [''], ['none'], ['']]));
    }

    // Lede text
    let ledeText = '';
    if (introContainer) {
      const textEl = introContainer.querySelector('.cmp-text p, .cmp-text');
      if (textEl) ledeText = textEl.textContent.trim();
    }
    if (ledeText) {
      const div = document.createElement('div');
      div.textContent = ledeText;
      output.appendChild(makeBlock(document, 'Text Container (body-unica-32-reg)', [[''], ['none'], [''], [div]]));
    }

    output.appendChild(makeSectionMetadata(document, 'content-wide, medium-radius'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // BODY SECTIONS: Process all children after overlap
    // ══════════════════════════════════════════════════════════

    const bodyStart = overlapIdx >= 0 ? overlapIdx + 1 : 2;
    for (let i = bodyStart; i < allChildren.length; i++) {
      const child = allChildren[i];
      const cls = child.className || '';

      // Skip separators, scripts, experience fragments
      if (cls.includes('separator') || cls.includes('experiencefragment')) continue;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(child.tagName)) continue;

      const text = child.textContent.trim();
      if (!text && !child.querySelector('img')) continue;

      // ── TEASER (intro text sections) ──
      if (cls.includes('teaser')) {
        const pretitle = child.querySelector('.cmp-teaser__pretitle');
        const title = child.querySelector('.cmp-teaser__title');
        const desc = child.querySelector('.cmp-teaser__description');

        if (title || pretitle) {
          const titleText = (title?.textContent || pretitle?.textContent || '').trim();
          if (titleText) {
            const h = document.createElement('h3');
            h.textContent = titleText;
            output.appendChild(makeBlock(document, 'Custom Title (h3-size, width-large)', [[h], [''], ['none'], ['']]));
          }
        }
        if (desc) {
          const div = document.createElement('div');
          div.innerHTML = desc.innerHTML;
          output.appendChild(makeBlock(document, 'Text Container (spacing-bottom, width-large)', [[''], ['none'], [''], [div]]));
        }
        if (pretitle && title) {
          const preDiv = document.createElement('div');
          const strong = document.createElement('strong');
          strong.textContent = pretitle.textContent.trim();
          preDiv.appendChild(strong);
          // Insert pretitle as eyebrow before the title already added
        }
        continue;
      }

      // ── GRID (columns: image + text with CTAs) ──
      if (cls.includes('grid') && cls.includes('cmp-grid-custom')) {
        const gridRow = child.querySelector('.grid-row');
        if (!gridRow) continue;

        const cols = Array.from(gridRow.children).filter(c =>
          (c.className || '').includes('grid-row__col-with') && c.textContent.trim().length > 0
        );

        // Check if this is a fact-card/stats grid
        // Fact Card model uses contentFragment reference (9 block-level fields, no inline data)
        // Output as fact-card block with 9 empty rows — content requires CF authoring
        const hasDashboard = child.querySelector('.dashboardcards, .cmp-dashboardcards');
        if (hasDashboard) {
          const statEls = child.querySelectorAll('.dashboardcards, [class*="dashboardcards"]');
          statEls.forEach((stat) => {
            // Fact Card — 9 block-level fields:
            // contentFragment, hideImage, imagePreset, imageModifiers,
            // classes_customDynamicClass, blockId, classes_commonCustomClass, language, analytics_id
            output.appendChild(makeBlock(document, 'Fact Card', [
              [''],       // [0] contentFragment (empty — needs CF authoring)
              ['false'],  // [1] hideImage
              [''],       // [2] imagePreset
              [''],       // [3] imageModifiers
              [''],       // [4] classes_customDynamicClass
              [''],       // [5] blockId
              [''],       // [6] classes_commonCustomClass
              ['none'],   // [7] language
              [''],       // [8] analytics_id
            ]));
          });
          continue;
        }

        // Check if this is a card/teaser link grid (ESG, related content style)
        const cardLinks = child.querySelectorAll('a.cardpagestory, a.cmp-teaser__link, .cardpagestory a, a[href]');
        const isCardGrid = cols.length >= 1 && cardLinks.length > 0 && cols[0].querySelector('.cardpagestory, .cmp-teaser');

        if (isCardGrid) {
          // Story/teaser cards
          const cards = child.querySelectorAll('.cardpagestory, .cmp-teaser');
          const rows = [];
          cards.forEach((card) => {
            const img = card.querySelector('img');
            const heading = card.querySelector('h4, h3, h5');
            const desc = card.querySelector('p:not(:has(img))');
            const link = card.closest('a') || card.querySelector('a');

            const imgFrag = document.createElement('p');
            if (img) {
              const imgEl = document.createElement('img');
              imgEl.src = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
              imgEl.alt = img.getAttribute('alt') || '';
              imgFrag.appendChild(imgEl);
            }

            const textFrag = document.createElement('div');
            if (heading) {
              const h = document.createElement('h4');
              h.textContent = heading.textContent.trim();
              textFrag.appendChild(h);
            }
            if (desc) {
              const p = document.createElement('p');
              p.textContent = desc.textContent.trim();
              textFrag.appendChild(p);
            }
            if (link) {
              const p = document.createElement('p');
              const a = document.createElement('a');
              a.href = link.getAttribute('href') || '';
              a.textContent = link.querySelector('.cmp-button__text, .card-cta, span')?.textContent?.trim() || 'Learn More';
              p.appendChild(a);
              textFrag.appendChild(p);
            }
            if (imgFrag.children.length > 0 || textFrag.children.length > 0) {
              rows.push([imgFrag, textFrag]);
            }
          });
          if (rows.length > 0) {
            output.appendChild(makeBlock(document, 'Cards', rows));
          }
          continue;
        }

        // Standard columns: image(col-5) + text(col-6) layout
        if (cols.length >= 2) {
          const rowCells = cols.map((col) => {
            const frag = document.createElement('div');
            // Images
            const img = col.querySelector('img');
            if (img) {
              const p = document.createElement('p');
              const pic = document.createElement('picture');
              const imgEl = document.createElement('img');
              imgEl.src = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
              imgEl.alt = img.getAttribute('alt') || '';
              pic.appendChild(imgEl);
              p.appendChild(pic);
              frag.appendChild(p);
            }
            // Headings
            col.querySelectorAll('h2, h3, h4, h5').forEach((h) => {
              const heading = document.createElement(h.tagName.toLowerCase());
              heading.textContent = h.textContent.trim();
              frag.appendChild(heading);
            });
            // Paragraphs
            col.querySelectorAll('.cmp-text p, p').forEach((p) => {
              const text = p.textContent.trim();
              if (text && text.length > 3) {
                const newP = document.createElement('p');
                newP.innerHTML = p.innerHTML;
                frag.appendChild(newP);
              }
            });
            // Links/CTAs
            col.querySelectorAll('a.cmp-button, .button a').forEach((a) => {
              const p = document.createElement('p');
              const link = document.createElement('a');
              link.href = a.getAttribute('href') || '';
              link.textContent = a.textContent.trim().replace(/\s+/g, ' ');
              p.appendChild(link);
              frag.appendChild(p);
            });
            return frag;
          });
          output.appendChild(makeBlock(document, 'Columns', [rowCells]));
        }
        continue;
      }

      // ── CAROUSEL (story cards) ──
      if (cls.includes('carousel')) {
        const slides = child.querySelectorAll('.cmp-carousel__item, [role="tabpanel"], .splide__slide');
        const rows = [];
        slides.forEach((slide) => {
          const link = slide.querySelector('a[href]');
          const img = slide.querySelector('img');
          const heading = slide.querySelector('h4, h3, h5');
          const desc = slide.querySelector('p');
          const date = slide.textContent.match(/(\w+ \d{1,2}, \d{4})/);

          const imgFrag = document.createElement('p');
          if (img) {
            const imgEl = document.createElement('img');
            imgEl.src = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
            imgEl.alt = img.getAttribute('alt') || '';
            imgFrag.appendChild(imgEl);
          }

          const textFrag = document.createElement('div');
          if (heading) {
            const h = document.createElement('h4');
            h.textContent = heading.textContent.trim();
            textFrag.appendChild(h);
          }
          if (desc) {
            const p = document.createElement('p');
            p.textContent = desc.textContent.trim();
            textFrag.appendChild(p);
          }
          if (link) {
            const p = document.createElement('p');
            const a = document.createElement('a');
            a.href = link.getAttribute('href') || '';
            a.textContent = date ? date[1] : 'Read Article';
            p.appendChild(a);
            textFrag.appendChild(p);
          }
          if (imgFrag.children.length > 0 || textFrag.children.length > 0) {
            rows.push([imgFrag, textFrag]);
          }
        });
        if (rows.length > 0) {
          output.appendChild(makeBlock(document, 'Cards (story-carousel)', rows));
        }
        continue;
      }

      // ── CONTAINER (partnerships, related content, etc.) ──
      if (cls.includes('container')) {
        // Related content with card links
        const cardLinks = child.querySelectorAll('.cardpagestory a, a.cmp-teaser__link');
        if (cardLinks.length > 0) {
          const heading = child.querySelector('h2, h3, h4, h5');
          if (heading) {
            const h = document.createElement('h5');
            h.textContent = heading.textContent.trim();
            output.appendChild(makeBlock(document, 'Custom Title (h5-size, width-large)', [[h], [''], ['none'], ['']]));
          }
          const rows = [];
          child.querySelectorAll('.cardpagestory, .cmp-teaser').forEach((card) => {
            const img = card.querySelector('img');
            const h = card.querySelector('h4, h3');
            const link = card.closest('a') || card.querySelector('a');

            const imgFrag = document.createElement('p');
            if (img) {
              const imgEl = document.createElement('img');
              imgEl.src = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
              imgEl.alt = img.getAttribute('alt') || '';
              imgFrag.appendChild(imgEl);
            }
            const textFrag = document.createElement('div');
            if (h) {
              const heading = document.createElement('h4');
              heading.textContent = h.textContent.trim();
              textFrag.appendChild(heading);
            }
            if (link) {
              const p = document.createElement('p');
              const a = document.createElement('a');
              a.href = link.getAttribute('href') || '';
              a.textContent = 'Learn More';
              p.appendChild(a);
              textFrag.appendChild(p);
            }
            if (imgFrag.children.length > 0 || textFrag.children.length > 0) {
              rows.push([imgFrag, textFrag]);
            }
          });
          if (rows.length > 0) {
            output.appendChild(makeBlock(document, 'Cards', rows));
          }
          continue;
        }

        // Text container (partnerships, etc.)
        const heading = child.querySelector('h2, h3, h4, h5');
        const paragraphs = child.querySelectorAll('.cmp-text p, p');
        if (heading) {
          const h = document.createElement('h3');
          h.textContent = heading.textContent.trim();
          output.appendChild(makeBlock(document, 'Custom Title (h3-size, width-large)', [[h], [''], ['none'], ['']]));
        }
        if (paragraphs.length > 0) {
          const div = document.createElement('div');
          paragraphs.forEach((p) => {
            const text = p.textContent.trim();
            if (text.length > 3) {
              const newP = document.createElement('p');
              newP.innerHTML = p.innerHTML;
              div.appendChild(newP);
            }
          });
          if (div.children.length > 0) {
            output.appendChild(makeBlock(document, 'Text Container (spacing-bottom, width-large)', [[''], ['none'], [''], [div]]));
          }
        }
        continue;
      }
    }

    // ══════════════════════════════════════════════════════════
    // PAGE METADATA
    // ══════════════════════════════════════════════════════════
    appendMetadataBlock(document, output, 'section-landing');

    abbvieCleanupTransformer("afterTransform", output, { document, url, html, params });
    return output;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
