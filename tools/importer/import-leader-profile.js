/* eslint-disable */
/* global WebImporter */

/**
 * Import Script: leader-profile (13 R&D leader pages)
 *
 * AEM DOM structure:
 *   [0] .container.large-radius.height-short — Navy bg bar
 *   [1] .container.overlap-predecessor — Breadcrumb + H1 name + subtitle
 *   [2] .grid — Photo (col-4) + Bio text (col-8) + LinkedIn link
 *   [3] .separator — Bottom spacing
 *
 * EDS output (2-8-2 grid):
 *   Section 1 (content-wide, medium-radius): hero-container + custom-title(h1) + text-container(subtitle)
 *   Section 2 (grid-container, content-regular): empty
 *   Section 3 (grid-cols-2): left spacer
 *   Section 4 (grid-section, grid-cols-8): custom-image(photo) + text-container(bio) + cta(LinkedIn)
 *   Section 5 (grid-cols-2): right spacer
 *
 * Edge cases handled:
 *   - Leaders with no photo
 *   - Leaders with no LinkedIn profile
 *   - Short bios (1-2 paragraphs)
 *   - Missing subtitle/job title
 *   - Multiple paragraphs with inline formatting
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
  if (src.includes('/content/dam/')) {
    const fn = src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[?#].*/, '');
    return `https://abbvie.scene7.com/is/image/abbviecorp/${fn}`;
  }
  return src;
}

export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    // Find content root via overlap-predecessor
    const overlapEl = document.querySelector('.overlap-predecessor');
    let contentRoot = overlapEl?.parentElement;
    if (!contentRoot) {
      const h1 = document.querySelector('h1');
      let el = h1;
      while (el?.parentElement) {
        if ((el.parentElement.className || '').includes('aem-Grid')) { contentRoot = el.parentElement; break; }
        el = el.parentElement;
      }
    }
    if (!contentRoot) contentRoot = document.body;

    const allChildren = Array.from(contentRoot.children);
    const overlapIdx = allChildren.findIndex((el) => (el.className || '').includes('overlap-predecessor'));
    const introContainer = overlapIdx >= 0 ? allChildren[overlapIdx] : null;
    const bodyGrid = overlapIdx >= 0 && overlapIdx + 1 < allChildren.length ? allChildren[overlapIdx + 1] : null;

    const output = document.createElement('div');

    // ── SECTION 1: Name + Title ──

    // H1 (leader name — always present)
    let leaderName = '';
    if (introContainer) {
      const h1 = introContainer.querySelector('h1');
      if (h1) leaderName = h1.textContent.trim();
    }
    if (!leaderName) {
      const h1 = document.querySelector('h1');
      if (h1) leaderName = h1.textContent.trim();
    }
    if (leaderName) {
      const h1El = document.createElement('h1');
      h1El.textContent = leaderName;
      output.appendChild(makeBlock(document, 'Custom Title (h1-size)', [[h1El], [''], ['none'], ['']]));
    }

    // Subtitle (job title — edge case: may be missing)
    let subtitle = '';
    if (introContainer) {
      const allP = introContainer.querySelectorAll('p');
      for (const p of allP) {
        const text = p.textContent.trim();
        if (text.length > 5 && text !== leaderName) { subtitle = text; break; }
      }
    }
    if (subtitle) {
      const subDiv = document.createElement('div');
      subDiv.textContent = subtitle;
      output.appendChild(makeBlock(document, 'Text Container (body-unica-32-reg)', [[''], ['none'], [''], [subDiv]]));
    }

    output.appendChild(makeSectionMetadata(document, 'content-wide, medium-radius'));
    output.appendChild(document.createElement('hr'));

    // ── SECTIONS 2-3: Grid + left spacer ──
    output.appendChild(makeSectionMetadata(document, 'grid-container, content-regular'));
    output.appendChild(document.createElement('hr'));
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2'));
    output.appendChild(document.createElement('hr'));

    // ── SECTION 4: Photo + Bio + LinkedIn ──

    if (bodyGrid) {
      // Photo (edge case: some leaders have no photo)
      const photoImg = bodyGrid.querySelector('img:not([src*="logo"]):not([src*="icon"]):not([alt*="Logo"])');
      if (photoImg) {
        const src = normalizeImageUrl(photoImg.getAttribute('src') || photoImg.getAttribute('data-cmp-src') || '');
        if (src) {
          const picP = document.createElement('p');
          const pic = document.createElement('picture');
          const img = document.createElement('img');
          img.src = src; img.alt = leaderName || '';
          pic.appendChild(img); picP.appendChild(pic);
          output.appendChild(makeBlock(document, 'Custom Image', [
            [picP], ['false'], ['false'], [''], ['false'], ['false'], ['false'],
            [''], ['_self'], [''], ['false'], [''], [''], [''], ['none'], [''],
          ]));
        }
      }

      // Bio text (preserve ALL paragraphs — no data loss)
      const paragraphs = bodyGrid.querySelectorAll('.cmp-text p, p');
      if (paragraphs.length > 0) {
        const bioDiv = document.createElement('div');
        let hasContent = false;
        paragraphs.forEach((p) => {
          const text = p.textContent.trim();
          // Skip empty paragraphs and subtitle duplicates
          if (text.length > 5 && text !== subtitle) {
            const newP = document.createElement('p');
            newP.innerHTML = p.innerHTML; // Preserve inline links/formatting
            bioDiv.appendChild(newP);
            hasContent = true;
          }
        });
        if (hasContent) {
          output.appendChild(makeBlock(document, 'Text Container (spacing-bottom, width-large)', [
            [''], ['none'], [''], [bioDiv],
          ]));
        }
      }

      // LinkedIn link (edge case: not all leaders have one)
      const linkedinLink = bodyGrid.querySelector('a[href*="linkedin"]');
      if (linkedinLink) {
        const a = document.createElement('a');
        a.href = linkedinLink.getAttribute('href') || '';
        a.textContent = 'LinkedIn Profile';
        output.appendChild(makeBlock(document, 'CTA (external-cta)', [
          [a], [''], ['_blank'], ['none'], [''], [''], ['after'], ['false'], [''], ['none'], [''],
        ]));
      }
    }

    output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-8'));
    output.appendChild(document.createElement('hr'));

    // ── SECTION 5: Right spacer ──
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2'));

    // Page metadata
    appendMetadataBlock(document, output, 'leader-profile');

    abbvieCleanupTransformer("afterTransform", output, { document, url, html, params });
    return output;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
