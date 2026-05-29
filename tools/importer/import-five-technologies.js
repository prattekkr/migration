/* eslint-disable */
/* global WebImporter */

/**
 * Import Script: five-technologies (dedicated)
 *
 * This page has a unique multi-grid layout with 46 sections:
 * - Hero overlay section (content-wide, medium-radius)
 * - Intro text in 2-8-2 grid
 * - Section header in 1-9 grid
 * - 5 technology modules each in 1-4-1-5-1 grid (image + text)
 * - Quote section (container-xx-large)
 * - References in 2-8-2 grid
 * - Related content in bg-f4f4f4 6-6 grid
 *
 * URL: https://www.abbvie.com/who-we-are/our-stories/five-technologies-supporting-progress-in-challenging-diseases.html
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

function makeHeroContainer(document, imgSrc, imgAlt) {
  const picP = document.createElement('p');
  const pic = document.createElement('picture');
  const img = document.createElement('img');
  img.src = imgSrc || '';
  img.alt = imgAlt || '';
  pic.appendChild(img);
  picP.appendChild(pic);
  return makeBlock(document, 'Hero Container (height-tall, overlay-height-short)', [
    [picP, '', '', '', '', ''],
  ]);
}

function makeCustomTitle(document, text, variants) {
  const h = document.createElement('h5');
  h.textContent = text;
  return makeBlock(document, `Custom Title (${variants})`, [[h], [''], ['none'], ['']]);
}

function makeTextContainer(document, contentNode, variants) {
  return makeBlock(document, `Text Container (${variants})`, [[''], ['none'], [''], [contentNode]]);
}

function makeCustomImage(document, src, alt) {
  const picP = document.createElement('p');
  const pic = document.createElement('picture');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || '';
  pic.appendChild(img);
  picP.appendChild(pic);
  return makeBlock(document, 'Custom Image', [
    [picP], ['false'], ['false'], [''], ['false'], ['false'], ['false'],
    [''], ['_self'], [''], ['false'], [''], [''], [''], ['none'], [''],
  ]);
}

function makeSeparator(document, height) {
  return makeBlock(document, `Separator (separator-height-${height || 64})`, [
    ['false'], [''], ['none'], [''],
  ]);
}

export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    // Find content root
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
    const heroContainer = overlapIdx > 0 ? allChildren[overlapIdx - 1] : allChildren[0];
    const introContainer = overlapIdx >= 0 ? allChildren[overlapIdx] : null;

    const output = document.createElement('div');

    // ══════════════════════════════════════════════════════════
    // SECTION 1: Hero + Intro (content-wide, medium-radius)
    // ══════════════════════════════════════════════════════════

    if (heroContainer) {
      const img = heroContainer.querySelector('img:not([src*="logo"])');
      if (img) {
        const src = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
        if (src) output.appendChild(makeHeroContainer(document, src, img.getAttribute('alt') || ''));
      }
    }

    // CTA
    if (introContainer) {
      const backLink = introContainer.querySelector('a[href*="/our-stories"]');
      if (backLink) {
        const a = document.createElement('a');
        a.href = backLink.getAttribute('href') || '/who-we-are/our-stories.html';
        a.textContent = 'All Stories';
        output.appendChild(makeBlock(document, 'CTA (default-cta, back-cta)', [
          [a], [''], ['_self'], ['none'], ['chevron'], [''], ['before'], ['false'], [''], ['none'], [''],
        ]));
      }

      // Story card
      output.appendChild(makeBlock(document, 'Story Card', [
        ['storyCardInfo'], ['false'], ['false'], ['true'], ['true'], ['true'],
        [''], [''], [''], ['false'], [''], [''],
      ]));

      // H1 title
      const h1 = introContainer.querySelector('h1');
      if (h1) {
        const h1El = document.createElement('h1');
        h1El.textContent = h1.textContent.trim();
        output.appendChild(makeBlock(document, 'Custom Title (h1-size)', [[h1El], [''], ['none'], ['']]));
      }

      // Lede
      const allP = introContainer.querySelectorAll('p');
      for (const p of allP) {
        if (p.textContent.trim().length > 40) {
          const div = document.createElement('div');
          div.textContent = p.textContent.trim();
          output.appendChild(makeTextContainer(document, div, 'body-unica-32-reg'));
          break;
        }
      }
    }

    output.appendChild(makeSectionMetadata(document, 'content-wide, medium-radius'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // S03: grid-container (parent)
    // S04: grid-cols-2 (left spacer)
    // S05: grid-section grid-cols-8 (intro text)
    // S06: grid-cols-2 (Topics sidebar — RIGHT column)
    // ══════════════════════════════════════════════════════════

    output.appendChild(makeSectionMetadata(document, 'grid-container, content-regular'));
    output.appendChild(document.createElement('hr'));

    // S04: Left spacer
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2'));
    output.appendChild(document.createElement('hr'));

    // S05: Intro body text (grid-cols-8) — first section AFTER overlap (overlapIdx + 1)
    const bodySection1 = overlapIdx >= 0 && overlapIdx + 1 < allChildren.length ? allChildren[overlapIdx + 1] : null;
    if (bodySection1) {
      const firstTextBlock = bodySection1.querySelector('.cmp-text, .text');
      if (firstTextBlock) {
        const paragraphs = firstTextBlock.querySelectorAll('p');
        const div = document.createElement('div');
        for (const p of paragraphs) {
          const text = p.textContent.trim();
          if (text.startsWith('In vivo CAR-T is') || text.startsWith('Blood-brain barrier') ||
              text.startsWith('Multispecific antibodies') || text.startsWith('Peptide-based') ||
              text.startsWith('Small interfering RNAs') || text.startsWith('Oral peptides are')) break;
          if (text.length > 10) {
            const newP = document.createElement('p');
            newP.innerHTML = p.innerHTML;
            div.appendChild(newP);
          }
        }
        if (div.children.length > 0) {
          output.appendChild(makeTextContainer(document, div, 'width-large'));
        }
      }
    }
    output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-8'));
    output.appendChild(document.createElement('hr'));

    // S06: Topics sidebar (grid-cols-2 — RIGHT column, separate section)
    if (bodySection1) {
      const topicLinks = bodySection1.querySelectorAll('a[href^="#section"], a[href^="#"]');
      if (topicLinks.length > 0) {
        output.appendChild(makeSeparator(document, 24));
        const eyebrowDiv = document.createElement('div');
        eyebrowDiv.textContent = 'Topics';
        output.appendChild(makeBlock(document, 'Eyebrow Text (regular-font)', [[eyebrowDiv]]));

        const linksDiv = document.createElement('div');
        topicLinks.forEach((a) => {
          const p = document.createElement('p');
          const link = document.createElement('a');
          link.href = a.getAttribute('href') || '';
          link.textContent = a.textContent.trim();
          p.appendChild(link);
          linksDiv.appendChild(p);
        });
        output.appendChild(makeTextContainer(document, linksDiv, ''));
      }
    }
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTION 6-8: Header "5 technologies..." in 1-9 grid
    // ══════════════════════════════════════════════════════════

    output.appendChild(makeSectionMetadata(document, 'grid-container, content-regular, regular-padding, no-bottom-margin'));
    output.appendChild(document.createElement('hr'));
    output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-1'));
    output.appendChild(document.createElement('hr'));

    // Find the "5 technologies" heading in body
    const allH2s = contentRoot.querySelectorAll('h2');
    const techHeader = [...allH2s].find((h) => h.textContent.includes('5 technologies'));
    if (techHeader) {
      output.appendChild(makeCustomTitle(document, techHeader.textContent.trim(), 'h3-size, book-weight, spacing-bottom, section-padding'));
    }

    output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-9'));
    output.appendChild(document.createElement('hr'));

    // Spacer
    output.appendChild(makeSeparator(document, 32));
    output.appendChild(makeSectionMetadata(document, 'no-bottom-margin'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTIONS 10-36: 5 Technology modules (each 1-4-1-5-1)
    // ══════════════════════════════════════════════════════════

    const techH2s = [...allH2s].filter((h) => {
      const text = h.textContent.trim();
      return text === 'In Vivo CAR-T' || text === 'Blood-Brain Barrier Shuttle' ||
        text === 'Multispecific Antibodies' || text === 'Oral Peptides' || text === 'siRNA';
    });

    techH2s.forEach((h2) => {
      // Navigate: h2 → .cmp-title → .title → .grid-row__col-with-5 → .grid-row
      const col5 = h2.closest('[class*="col-with-5"], .grid-row__col-with-5');
      const gridRow = col5?.parentElement;

      // Get image from col-with-4 sibling
      const col4 = gridRow?.querySelector('[class*="col-with-4"], .grid-row__col-with-4');
      let imgEl = col4?.querySelector('img');
      // Handle lazy-loaded images — get src from data-cmp-src on parent .cmp-image
      let imgSrc = '';
      if (imgEl) {
        imgSrc = imgEl.getAttribute('data-cmp-src') || '';
        if (!imgSrc || imgSrc.startsWith('data:')) {
          const cmpImage = col4?.querySelector('.cmp-image, [data-cmp-src]');
          imgSrc = cmpImage?.getAttribute('data-cmp-src') || imgEl.src || '';
        }
      }

      // Get text from .cmp-text or .text sibling within col-with-5
      const textEl = col5?.querySelector('.cmp-text, .text, [class*="cmp-text"]');
      const paragraphs = textEl ? textEl.querySelectorAll('p') : [];

      // Normalize image URL
      const normalizedImgSrc = normalizeImageUrl(imgSrc);
      const imgAlt = imgEl?.getAttribute('alt') || '';

      // Generate 1-4-1-5-1 grid
      output.appendChild(makeSectionMetadata(document, 'grid-container, content-regular, regular-padding, no-top-padding, no-bottom-margin'));
      output.appendChild(document.createElement('hr'));

      // Col 1: spacer
      output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-1'));
      output.appendChild(document.createElement('hr'));

      // Col 2: image (4 cols)
      if (normalizedImgSrc) {
        output.appendChild(makeCustomImage(document, normalizedImgSrc, imgAlt));
      }
      output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-4'));
      output.appendChild(document.createElement('hr'));

      // Col 3: spacer
      output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-1'));
      output.appendChild(document.createElement('hr'));

      // Col 4: text content (5 cols) — small separator for alignment with image top
      output.appendChild(makeSeparator(document, 8));
      output.appendChild(makeCustomTitle(document, h2.textContent.trim(), 'h5-size'));

      if (paragraphs.length > 0) {
        const div = document.createElement('div');
        paragraphs.forEach((p) => {
          if (p.textContent.trim().length > 5) {
            const newP = document.createElement('p');
            newP.innerHTML = p.innerHTML;
            div.appendChild(newP);
          }
        });
        if (div.children.length > 0) {
          output.appendChild(makeTextContainer(document, div, ''));
        }
      }
      output.appendChild(makeSeparator(document, 64));

      output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-5'));
      output.appendChild(document.createElement('hr'));
    });

    // ══════════════════════════════════════════════════════════
    // SECTION 37: Quote (container-xx-large, section-padding)
    // ══════════════════════════════════════════════════════════

    const quoteEl = contentRoot.querySelector('.cmp-quote, blockquote');
    if (quoteEl) {
      const quoteText = quoteEl.querySelector('p')?.textContent?.trim() || quoteEl.textContent.trim();
      output.appendChild(makeBlock(document, 'Quote (quote-standard, quote-h4)', [
        ['quote-standard'], [quoteText], [''], [''], [''], [''], [''], [''], [''], ['none'], [''],
      ]));
    } else {
      // Check for quote-like paragraphs (starting with ")
      const allParas = contentRoot.querySelectorAll('p');
      for (const p of allParas) {
        const text = p.textContent.trim();
        if (text.startsWith('"') && text.length > 50 && text.length < 500) {
          output.appendChild(makeBlock(document, 'Quote (quote-standard, quote-h4)', [
            ['quote-standard'], [text], [''], [''], [''], [''], [''], [''], [''], ['none'], [''],
          ]));
          break;
        }
      }
    }

    output.appendChild(makeSectionMetadata(document, 'container-xx-large, section-padding'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTIONS 38-41: References in 2-8-2 grid
    // ══════════════════════════════════════════════════════════

    output.appendChild(makeSectionMetadata(document, 'grid-container, content-regular'));
    output.appendChild(document.createElement('hr'));
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2'));
    output.appendChild(document.createElement('hr'));

    // Closing text + references + media inquiries
    const mediaInqEl = [...contentRoot.querySelectorAll('p')].find((p) =>
      /media\s*inquir/i.test(p.textContent)
    );
    if (mediaInqEl) {
      const div = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = 'Media inquiries:';
      div.appendChild(strong);
      const link = mediaInqEl.querySelector('a[href*="mailto:"]');
      if (link) {
        div.appendChild(document.createTextNode(' '));
        const a = document.createElement('a');
        a.href = link.getAttribute('href') || '';
        a.textContent = link.textContent.trim();
        div.appendChild(a);
      }
      output.appendChild(makeTextContainer(document, div, 'spacing-bottom, width-large, body-unica-20-reg'));
    }

    // Accordion (references) — extract from the References button's sibling content
    // The live page hides references behind a JS toggle button. Try to find and extract.
    const refButton = [...(contentRoot.querySelectorAll('button') || [])].find(b => b.textContent.trim().startsWith('References'));
    let refContent = '';
    if (refButton) {
      // Look for sibling or next element with the reference list
      const refPanel = refButton.nextElementSibling || refButton.parentElement?.nextElementSibling;
      if (refPanel) {
        const ol = refPanel.querySelector('ol, ul');
        if (ol) refContent = ol.outerHTML;
      }
    }
    // Also check for any <ol> near the end of the page that contains doi.org links (references)
    if (!refContent) {
      const allOLs = contentRoot.querySelectorAll('ol');
      for (const ol of allOLs) {
        if (ol.querySelector('a[href*="doi.org"]') && ol.children.length >= 5) {
          refContent = ol.outerHTML;
          break;
        }
      }
    }

    // Extract references from the page — look for <ol> with doi.org links
    // or accordion-item-body content or any list near "References" button
    const refDiv = document.createElement('div');
    if (refContent) {
      refDiv.innerHTML = refContent;
    } else {
      // Search broader: find any ol/ul with doi.org or citation-like content
      const allLists = contentRoot.querySelectorAll('ol, ul');
      for (const list of allLists) {
        if (list.querySelectorAll('a[href*="doi.org"]').length >= 3 ||
            (list.children.length >= 5 && list.textContent.includes('(20'))) {
          refDiv.appendChild(list.cloneNode(true));
          break;
        }
      }
      // Also check inside accordion-item-body elements
      if (!refDiv.children.length) {
        const accBodies = contentRoot.querySelectorAll('.accordion-item-body, [class*="accordion"] [class*="body"], [class*="accordion"] [class*="panel"]');
        for (const body of accBodies) {
          const ol = body.querySelector('ol, ul');
          if (ol && ol.children.length >= 3) {
            refDiv.appendChild(ol.cloneNode(true));
            break;
          }
        }
      }
      // Check hidden panels (display:none) that contain reference lists
      if (!refDiv.children.length) {
        const hiddenPanels = document.querySelectorAll('[style*="display: none"], [hidden], [aria-hidden="true"]');
        for (const panel of hiddenPanels) {
          const ol = panel.querySelector('ol');
          if (ol && ol.querySelectorAll('a[href*="doi.org"]').length >= 3) {
            refDiv.appendChild(ol.cloneNode(true));
            break;
          }
        }
      }
    }
    output.appendChild(makeBlock(document, 'Accordion (accordion-icon-font, h5-size, width-large)', [
      ['References'], ['Expand All'], ['Collapse All'],
      ['plus'], ['minus'], ['plus'], ['minus'],
      [''], [''], [''], [''], [''], [''],
      [''], ['none'], [''],
      ['', refDiv, 'accordion-item', '', ''],
    ]));

    output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-8'));
    output.appendChild(document.createElement('hr'));
    output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-2'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTIONS 42-46: Related Content (bg-f4f4f4, 6-6 grid)
    // ══════════════════════════════════════════════════════════

    // Find related content heading
    const relatedH = [...contentRoot.querySelectorAll('h5, h4')].find((h) =>
      h.textContent.includes('Related Content') || h.textContent.includes('Related')
    );
    if (relatedH) {
      output.appendChild(makeCustomTitle(document, 'Related Content', 'h5-size'));
    }

    // Related story cards
    const storyLinks = contentRoot.querySelectorAll('a[href*="/our-stories/"]');
    const relatedCards = [...storyLinks].filter((a) => {
      return a.querySelector('img') && a.getAttribute('href') !== '/who-we-are/our-stories.html';
    });

    if (relatedCards.length > 0) {
      output.appendChild(makeSectionMetadata(document, 'bg-f4f4f4, no-bottom-margin, section-padding, content-wide'));
      output.appendChild(document.createElement('hr'));

      output.appendChild(makeSectionMetadata(document, 'grid-container, bg-f4f4f4, regular-padding, no-top-padding, no-bottom-margin'));
      output.appendChild(document.createElement('hr'));

      relatedCards.slice(0, 2).forEach((card) => {
        const cardPath = card.getAttribute('href') || '';
        output.appendChild(makeBlock(document, 'Story Card', [
          ['cardInfo'], ['false'], ['false'], ['true'], ['true'], ['true'],
          [cardPath], [''], [''], ['false'], [''], [''],
        ]));
        output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-6'));
        output.appendChild(document.createElement('hr'));
      });

      output.appendChild(makeSectionMetadata(document, 'bg-f4f4f4, no-bottom-margin, section-padding, content-wide'));
    }

    // Page metadata
    appendMetadataBlock(document, output, 'story-article');

    // Cleanup
    abbvieCleanupTransformer("afterTransform", output, { document, url, html, params });

    return output;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
