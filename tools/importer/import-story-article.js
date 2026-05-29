/* eslint-disable */
/* global WebImporter */

/**
 * Import Script: story-article (v4 — with edge case handling)
 *
 * Handles 133 story article pages with conditional logic for:
 * - Pages WITH or WITHOUT hero image
 * - Pages WITH or WITHOUT carousel
 * - Pages WITH or WITHOUT accordion/references
 * - Pages WITH or WITHOUT quote blocks
 * - Pages WITH or WITHOUT inline images
 * - Pages WITH or WITHOUT video embeds
 * - Pages WITH or WITHOUT media inquiries
 * - Pages with different heading levels (h2 vs h5)
 * - Pages with links in body text (preserved inline)
 * - Pages with image captions (italic text after images)
 *
 * Grid structure: 2-8-2 (centered narrow article)
 * Section 1: hero + intro (content-wide, medium-radius)
 * Section 2: grid-container (content-regular)
 * Section 3: grid-cols-2 (left spacer)
 * Section 4: body content (grid-section, grid-cols-8)
 * Section 5: grid-cols-2 (right spacer)
 */

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import { appendMetadataBlock } from './parsers/utils/metadata.js';

// ═══════════════════════════════════════════════════════════════
// BLOCK BUILDERS (exact row counts per MIGRATION-SKILL.md)
// ═══════════════════════════════════════════════════════════════

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

// Section Metadata — xwalk format: classes go in block name
// grid-container/grid-section use language/none row; grid-cols-2 spacers use empty row
function makeSectionMetadata(document, style) {
  if (style.includes('grid-cols-2') && !style.includes('grid-section')) {
    return makeBlock(document, `Section Metadata (${style})`, [['']]);
  }
  return makeBlock(document, `Section Metadata (${style})`, [['language', 'none']]);
}

// Hero Container — 6 rows per item
function makeHeroContainer(document, imgSrc, imgAlt, heightVariant) {
  const picP = document.createElement('p');
  const pic = document.createElement('picture');
  const img = document.createElement('img');
  img.src = imgSrc || '';
  img.alt = imgAlt || '';
  pic.appendChild(img);
  picP.appendChild(pic);
  const variant = heightVariant || 'height-default';
  // ONE row with 6 cells = one hero item matching reference xwalk:
  // [image, empty, empty, empty, empty, empty]
  // Video is handled by separate brightcove-video block, NOT in hero-container
  return makeBlock(document, `Hero Container (${variant}, overlay-height-short)`, [
    [picP, '', '', '', '', ''],
  ]);
}

// CTA — 11 rows
function makeCTA(document, text, url) {
  const a = document.createElement('a');
  a.href = url;
  a.textContent = text;
  return makeBlock(document, 'CTA (default-cta, back-cta)', [
    [a], [''], ['_self'], ['none'], ['chevron'], [''], ['before'], ['false'], [''], ['none'], [''],
  ]);
}

// Story Card — 12 rows (storyCardInfo for page metadata)
// categoryPath uses <a> element with JCR path as text (xwalk format)
function makeStoryCard(document, categoryHref, categoryJcrPath) {
  let categoryCell = '';
  if (categoryHref) {
    const a = document.createElement('a');
    a.href = categoryHref;
    a.textContent = categoryJcrPath || categoryHref;
    categoryCell = a;
  }
  return makeBlock(document, 'Story Card', [
    ['storyCardInfo'], ['false'], ['false'], ['true'], ['true'], ['true'],
    [''], [''], [categoryCell], ['false'], [''], [''],
  ]);
}

// Story Card (relatedContent variant) — 12 rows
// Converts page href to JCR path format
function makeRelatedContentCard(document, href) {
  // Transform href to JCR path: remove .html, prepend /content/abbvie-nextgen-eds/abbvie-com/us/en
  let storyPath = href || '';
  storyPath = storyPath.replace(/^https?:\/\/www\.abbvie\.com/, '');
  storyPath = storyPath.replace(/\.html$/, '');
  if (storyPath && !storyPath.startsWith('/content/')) {
    storyPath = `/content/abbvie-nextgen-eds/abbvie-com/us/en${storyPath}`;
  }
  return makeBlock(document, 'Story Card', [
    ['relatedContent'], ['true'], ['false'], ['true'], ['false'], ['false'],
    [storyPath], [''], [''], ['false'], [''], [''],
  ]);
}

// Custom Title — 4 rows: [heading, blockId, language, analyticsId]
// xwalk uses empty string for blockId, "none" for language
function makeCustomTitle(document, text, level, variants) {
  const h = document.createElement(`h${level}`);
  h.textContent = text;
  return makeBlock(document, `Custom Title (${variants})`, [[h], [''], ['none'], ['']]);
}

// Text Container — 4+ rows: [0] blockId, [1] language, [2] analyticsId, [3+] content
// Each <p> gets its own row for md2jcr compatibility
function makeTextContainer(document, contentNode, variants) {
  const contentRows = [];
  if (contentNode && contentNode.querySelectorAll) {
    const paragraphs = contentNode.querySelectorAll('p');
    if (paragraphs.length > 1) {
      paragraphs.forEach((p) => {
        const div = document.createElement('div');
        div.appendChild(p.cloneNode(true));
        contentRows.push([div]);
      });
    }
  }
  if (contentRows.length === 0) {
    contentRows.push([contentNode]);
  }
  return makeBlock(document, `Text Container (${variants})`, [[''], ['none'], [''], ...contentRows]);
}

// Separator — 4 rows
function makeSeparator(document, height) {
  return makeBlock(document, `Separator (separator-height-${height || 24})`, [
    ['false'], [''], ['none'], [''],
  ]);
}

// Custom Image — 16 rows
function makeCustomImage(document, src, alt, caption) {
  const picP = document.createElement('p');
  const pic = document.createElement('picture');
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || '';
  pic.appendChild(img);
  picP.appendChild(pic);
  return makeBlock(document, 'Custom Image', [
    [picP], ['false'], ['false'], [caption || ''], ['false'], ['false'], ['false'],
    [''], ['_self'], [''], ['false'], [''], [''], [''], ['none'], [''],
  ]);
}

// Carousel — 25 rows
function makeCarousel(document, slideCount) {
  return makeBlock(document, 'Carousel (carousel-show-btn-margin, carousel-minimal)', [
    [String(slideCount || 2)], ['static'], ['false'], ['3000'], ['false'],
    [String(slideCount || 2)], ['false'], ['1'], ['false'], ['false'],
    ['true'], ['true'], ['false'], [''], [''], [''], [''], [''], [''],
    ['false'], [''], ['none'], [''], [''], [''],
  ]);
}

// Accordion — 21 block-level rows (matching accordion model) + 5-col child rows (accordion-item)
// Block model fields: blockHeading, classes_allowMultipleOpen, classes_showExpandCollapseAll,
//   expandAllLabel, collapseAllLabel, classes_iconType, expandAllIcon, collapseAllIcon,
//   expandIcon, collapseIcon, expandAllIconImage, collapseAllIconImage, expandIconImage,
//   collapseIconImage, ariaExpandAllLabel, ariaCollapseAllLabel, classes_customDynamicClass,
//   blockId, classes_commonCustomClass, language, analytics_id
// Child item (accordion-item): summary, text, classes_defaultOpen, ariaExpandLabel, ariaCollapseLabel
function makeAccordion(document, title, items) {
  const rows = [
    [title || 'References'],  // [0] blockHeading
    ['false'],                // [1] classes_allowMultipleOpen
    ['true'],                 // [2] classes_showExpandCollapseAll
    ['Expand All'],           // [3] expandAllLabel
    ['Collapse All'],         // [4] collapseAllLabel
    ['accordion-icon-font'],  // [5] classes_iconType
    ['plus'],                 // [6] expandAllIcon
    ['minus'],                // [7] collapseAllIcon
    ['plus'],                 // [8] expandIcon
    ['minus'],                // [9] collapseIcon
    [''],                     // [10] expandAllIconImage
    [''],                     // [11] collapseAllIconImage
    [''],                     // [12] expandIconImage
    [''],                     // [13] collapseIconImage
    [''],                     // [14] ariaExpandAllLabel
    [''],                     // [15] ariaCollapseAllLabel
    [''],                     // [16] classes_customDynamicClass
    [''],                     // [17] blockId
    [''],                     // [18] classes_commonCustomClass
    ['none'],                 // [19] language
    [''],                     // [20] analytics_id
  ];
  // Child items: 5 columns each [summary, text, classes_defaultOpen, ariaExpandLabel, ariaCollapseLabel]
  (items || []).forEach((item) => {
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = item.content || '';
    rows.push([item.summary || '', contentDiv, 'false', '', '']);
  });
  return makeBlock(document, 'Accordion (accordion-icon-font, h5-size, width-large)', rows);
}

// Quote — 11 rows per migration-skill:
// [0] quoteType, [1] quotation, [2] attributionName, [3] attributionTitle,
// [4] attributionImage, [5] quoteFragment, [6] bgImage, [7] bgImageAlt, [8-10] commonProps
function makeQuote(document, text, authorName, authorTitle, authorImgSrc) {
  const imgCell = '';
  if (authorImgSrc) {
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.src = authorImgSrc;
    img.alt = authorName || '';
    pic.appendChild(img);
    return makeBlock(document, 'Quote (quote-standard, quote-h4)', [
      ['quote-standard'], [text || ''], [authorName || ''], [authorTitle || ''], [pic], [''], [''], [''],
      [''], ['none'], [''],
    ]);
  }
  return makeBlock(document, 'Quote (quote-standard, quote-h4)', [
    ['quote-standard'], [text || ''], [authorName || ''], [authorTitle || ''], [''], [''], [''], [''],
    [''], ['none'], [''],
  ]);
}

// ═══════════════════════════════════════════════════════════════
// IMAGE URL NORMALIZER
// ═══════════════════════════════════════════════════════════════

function normalizeImageUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:')) return '';
  if (src.includes('/content/dam/')) {
    const fn = src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[?#].*/, '');
    return `https://abbvie.scene7.com/is/image/abbviecorp/${fn}`;
  }
  return src;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT ROOT DETECTION
// ═══════════════════════════════════════════════════════════════

function findContentRoot(document) {
  // Strategy 1: .overlap-predecessor landmark
  const overlapEl = document.querySelector('.overlap-predecessor');
  if (overlapEl) return overlapEl.parentElement;

  // Strategy 2: Walk up from h1 to .aem-Grid
  const h1 = document.querySelector('h1');
  if (h1) {
    let el = h1;
    while (el.parentElement) {
      if ((el.parentElement.className || '').includes('aem-Grid')) return el.parentElement;
      el = el.parentElement;
    }
  }

  // Strategy 3: Fallback
  return document.querySelector('.aem-Grid.aem-Grid--12') || document.body;
}

// ═══════════════════════════════════════════════════════════════
// MAIN TRANSFORM
// ═══════════════════════════════════════════════════════════════

export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    const contentRoot = findContentRoot(document);
    const allChildren = Array.from(contentRoot.children);
    const overlapIdx = allChildren.findIndex((el) => (el.className || '').includes('overlap-predecessor'));

    const heroContainer = overlapIdx > 0 ? allChildren[overlapIdx - 1] : allChildren[0];
    const introContainer = overlapIdx >= 0 ? allChildren[overlapIdx] : null;
    // Collect body sections after overlap-predecessor
    // Detect sidebar layout: grid-row with col-with-8 (main) + col-with-2 (sidebar card)
    let bodyContainer = null;
    let sidebarCard = null; // Related content card in right gutter
    if (overlapIdx >= 0 && overlapIdx + 1 < allChildren.length) {
      bodyContainer = document.createElement('div');
      for (let i = overlapIdx + 1; i < allChildren.length; i++) {
        const child = allChildren[i];
        const cls = child.className || '';
        if (cls.includes('experiencefragment')) break;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(child.tagName)) continue;

        // Detect 2-8-2 grid layout with sidebar
        const gridRow = child.querySelector('.grid-row');
        if (gridRow && !cls.includes('cmp-container-full-width')) {
          const cols = Array.from(gridRow.children).filter(c => (c.className || '').includes('col-with'));
          const col8 = cols.find(c => (c.className || '').includes('col-with-8'));
          const sidebarCol = cols.find(c => {
            const colCls = c.className || '';
            return (colCls.includes('col-with-2') || colCls.includes('col-with-3')) && c.querySelector('.cardpagestory');
          });

          if (col8 && sidebarCol) {
            // Use only col-8 for body content (sidebar card goes in right gutter)
            bodyContainer.appendChild(col8.cloneNode(true));

            // Extract sidebar card content for right gutter
            const sidebarCardEl = sidebarCol.querySelector('.cardpagestory');
            if (sidebarCardEl) {
              const link = sidebarCardEl.closest('a') || sidebarCardEl.querySelector('a[href]');
              const img = sidebarCardEl.querySelector('img');
              const heading = sidebarCardEl.querySelector('h4, h3, h5');
              const desc = sidebarCardEl.querySelector('p');
              sidebarCard = {
                href: link?.getAttribute('href') || '',
                imgSrc: normalizeImageUrl(img?.getAttribute('src') || img?.getAttribute('data-cmp-src') || ''),
                imgAlt: img?.getAttribute('alt') || '',
                heading: heading?.textContent?.trim() || '',
                description: desc?.textContent?.trim() || '',
              };
            }
            continue;
          }
        }

        bodyContainer.appendChild(child.cloneNode(true));
      }
    }

    const output = document.createElement('div');

    // ══════════════════════════════════════════════════════════
    // SECTION 1: HERO + INTRO
    // Edge cases: no hero image, no overlap, no back link
    // ══════════════════════════════════════════════════════════

    // HERO IMAGE OR VIDEO (conditional — some pages have no hero)
    let heroImgSrc = '';
    let heroImgAlt = '';
    let heroVideoUrl = '';
    let heightVariant = 'height-default';

    if (heroContainer) {
      // Check for Brightcove video in hero
      const videoEl = heroContainer.querySelector('[data-video-id], video-js, .video-js');
      if (videoEl) {
        const accountId = videoEl.getAttribute('data-account') || videoEl.getAttribute('data-account-id') || '2157889325001';
        const videoId = videoEl.getAttribute('data-video-id') || '';
        if (videoId) {
          heroVideoUrl = `https://players.brightcove.net/${accountId}/default_default/index.html?videoId=${videoId}`;
        }
      }

      // Get poster image (used as fallback or alongside video)
      const img = heroContainer.querySelector('img:not([src*="logo"]):not([src*="icon"])');
      if (img) {
        heroImgSrc = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
        heroImgAlt = img.getAttribute('alt') || '';
      }

      // Detect height from container classes
      const cls = heroContainer.className || '';
      if (cls.includes('height-tall')) heightVariant = 'height-tall';
      else if (cls.includes('height-short')) heightVariant = 'height-short';
    }

    // Generate hero block if we have an image
    // Note: Video is NOT placed in hero-container — it's handled by separate brightcove-video block
    if (heroImgSrc) {
      output.appendChild(makeHeroContainer(document, heroImgSrc, heroImgAlt, heightVariant));
    }

    // BACK CTA (conditional — not all pages have this)
    let backLinkUrl = '';
    let backLinkText = 'All Stories';
    if (introContainer) {
      const backLink = introContainer.querySelector('a[href*="/our-stories"]')
        || introContainer.querySelector('a[href*="/our-leaders"]')
        || introContainer.querySelector('.back-button a, a.back-button');
      if (backLink) {
        backLinkUrl = backLink.getAttribute('href') || '';
        backLinkText = backLink.textContent.trim().replace(/\s+/g, ' ') || 'Back';
      }
    }
    if (backLinkUrl) {
      output.appendChild(makeCTA(document, backLinkText, backLinkUrl));
    }

    // STORY CARD METADATA (conditional — detect date/category)
    let categoryPath = '';
    let hasMetadata = false;
    if (introContainer) {
      const fullText = introContainer.textContent || '';
      const dateMatch = fullText.match(/(\w+ \d{1,2}, \d{4})/);
      const readMatch = fullText.match(/(\d+)\s*Minute\s*Read/i);
      if (dateMatch || readMatch) {
        hasMetadata = true;
        // Find category link (not the back link)
        introContainer.querySelectorAll('a').forEach((a) => {
          const href = a.getAttribute('href') || '';
          if (href.includes('-stories') && !href.endsWith('/our-stories.html')) categoryPath = href;
          if (href.includes('-leaders') && !href.endsWith('/our-leaders.html')) categoryPath = href;
        });
      }
    }
    if (hasMetadata) {
      // Transform categoryPath to JCR format for the <a> text content
      let categoryJcrPath = categoryPath;
      if (categoryJcrPath) {
        categoryJcrPath = categoryJcrPath.replace(/^https?:\/\/www\.abbvie\.com/, '');
        categoryJcrPath = categoryJcrPath.replace(/\.html$/, '');
        if (!categoryJcrPath.startsWith('/content/')) {
          categoryJcrPath = `/content/abbvie-nextgen-eds/abbvie-com/us/en${categoryJcrPath}`;
        }
      }
      output.appendChild(makeStoryCard(document, categoryPath, categoryJcrPath));
    }

    // TITLE (always present — h1)
    let titleText = '';
    if (introContainer) {
      const h1 = introContainer.querySelector('h1');
      if (h1) titleText = h1.textContent.trim();
    }
    if (!titleText) {
      const h1 = document.querySelector('h1');
      if (h1) titleText = h1.textContent.trim();
    }
    if (titleText) {
      output.appendChild(makeCustomTitle(document, titleText, 1, 'h1-size'));
    }

    // LEDE TEXT (conditional — first long paragraph after title)
    let ledeText = '';
    if (introContainer) {
      const allP = introContainer.querySelectorAll('p');
      for (const p of allP) {
        const text = p.textContent.trim();
        if (text.length > 40 && !text.match(/^\w+ \d{1,2}, \d{4}/) && !text.includes('Minute Read')) {
          ledeText = text;
          break;
        }
      }
    }
    if (ledeText) {
      const ledeDiv = document.createElement('div');
      ledeDiv.innerHTML = `<p>${ledeText}</p>`;
      output.appendChild(makeTextContainer(document, ledeDiv, 'body-unica-32-reg'));
    }

    // Close section 1
    output.appendChild(makeSectionMetadata(document, 'content-wide, medium-radius'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTIONS 2-3: GRID CONTAINER + LEFT SPACER
    // ══════════════════════════════════════════════════════════

    output.appendChild(makeSectionMetadata(document, 'grid-container, content-regular'));
    output.appendChild(document.createElement('hr'));
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTION 4: BODY CONTENT (grid-section, grid-cols-8)
    // Edge cases handled per element type
    // ══════════════════════════════════════════════════════════

    if (bodyContainer) {
      // Collect ALL content-bearing elements in VISUAL POSITION ORDER
      // This fixes the carousel/content ordering issue caused by nested DOM depths
      const contentElements = bodyContainer.querySelectorAll(
        'h2, h3, h4, h5, .cmp-text, [role="region"]:has([role="tabpanel"]), .splide, ' +
        '.separator, [class*="separator"], .cmp-accordion, [aria-expanded], ' +
        '.cmp-image:not(.cmp-container__bg-image), .cmp-quote, blockquote, ' +
        '.cmp-video, .video.cmp-video-full-width, video-js[data-account], [data-video-id], ' +
        '.cardpagestory, .container:has(.cardpagestory)'
      );

      // Sort by vertical position (document order may differ from visual order in nested grids)
      const sortedElements = [...contentElements].sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return aRect.top - bRect.top;
      });

      const processedElements = new WeakSet();

      for (const child of sortedElements) {
        if (processedElements.has(child)) continue;
        // Skip if ancestor already processed
        let ancestorProcessed = false;
        let parent = child.parentElement;
        const childCls = child.className || '';
        // Don't skip accordion/carousel elements themselves — only their inner children
        const isAccordionOrCarousel = childCls.includes('cmp-accordion') ||
          (childCls.includes('splide') || child.getAttribute('role') === 'region');
        while (parent && parent !== bodyContainer) {
          if (processedElements.has(parent)) { ancestorProcessed = true; break; }
          // Skip text/heading elements that are INSIDE an accordion panel or carousel slide
          if (!isAccordionOrCarousel) {
            const parentCls = parent.className || '';
            if (parentCls.includes('cmp-accordion') || parentCls.includes('cmp-accordion__panel') ||
                parentCls.includes('splide__slide') || parentCls.includes('splide__list')) {
              ancestorProcessed = true; break;
            }
          }
          parent = parent.parentElement;
        }
        if (ancestorProcessed) continue;
        processedElements.add(child);

        const cls = child.className || '';
        const text = (child.textContent || '').trim();

        // Skip irrelevant elements
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK'].includes(child.tagName)) continue;
        if (cls.includes('experiencefragment')) continue;
        if (text.length < 3 && !child.querySelector('img, hr, video-js')) continue;

        // ── EDGE CASE: CAROUSEL (splide or region with tabpanels) ──
        if (cls.includes('carousel') || cls.includes('splide') ||
            child.getAttribute('role') === 'region' && child.querySelector('[role="tabpanel"]')) {
          const slides = child.querySelectorAll('[role="tabpanel"], .cmp-carousel__item, .splide__slide');
          // consumeSiblings=false — include images as rows IN the carousel
          const carouselBlock = makeCarousel(document, slides.length || 5);
          output.appendChild(carouselBlock);

          // Add slide images as custom-image blocks AFTER carousel (consumed as slides with consumeSiblings=true)
          slides.forEach((slide) => {
            const img = slide.querySelector('img');
            if (img) {
              const src = normalizeImageUrl(img.getAttribute('src') || img.getAttribute('data-cmp-src') || '');
              if (src) output.appendChild(makeCustomImage(document, src, img.getAttribute('alt') || '', ''));
            }
          });
          continue;
        }

        // ── EDGE CASE: ACCORDION/REFERENCES ──
        if (cls.includes('accordion') || child.querySelector('.cmp-accordion, [aria-expanded]')) {
          const items = [];
          const accItems = child.querySelectorAll('.cmp-accordion__item, button[aria-expanded], details');
          accItems.forEach((item) => {
            const summary = (item.querySelector('.cmp-accordion__button, summary') || item).textContent?.trim().substring(0, 200) || '';
            const panel = item.querySelector('.cmp-accordion__panel, [role="region"]') || item.nextElementSibling;
            if (summary && summary.length > 5) {
              items.push({ summary, content: panel?.innerHTML || '' });
            }
          });
          if (items.length > 0) {
            output.appendChild(makeAccordion(document, 'References', items));
          }
          continue;
        }

        // ── EDGE CASE: MEDIA INQUIRIES (always last before footer) ──
        if (/media\s*inquir|press\s*contact/i.test(text) && text.length < 500) {
          const link = child.querySelector('a[href*="mailto:"]');
          const div = document.createElement('div');
          const strong = document.createElement('strong');
          strong.textContent = 'Media inquiries:';
          div.appendChild(strong);
          div.appendChild(document.createTextNode(' '));
          if (link) {
            const a = document.createElement('a');
            a.href = link.getAttribute('href') || '';
            a.textContent = link.textContent.trim() || link.getAttribute('href').replace('mailto:', '');
            div.appendChild(a);
          }
          output.appendChild(makeTextContainer(document, div, 'spacing-bottom, width-x-large, body-unica-20-reg'));
          continue;
        }

        // ── EDGE CASE: QUOTE/BLOCKQUOTE ──
        const quoteEl = child.querySelector('.cmp-quote, blockquote, [class*="cmp-quote"]')
          || (cls.includes('cmp-quote') ? child : null);
        if (quoteEl || child.tagName === 'BLOCKQUOTE') {
          const qEl = quoteEl || child;
          // Extract quote text from .cmp-quote__text or first p element
          const qTextEl = qEl.querySelector('.cmp-quote__text, .cmp-quote__text-author-wrapper .cmp-quote__text');
          const qText = qTextEl?.textContent?.trim()
            || qEl.querySelector('p')?.textContent?.trim()
            || qEl.textContent.trim();
          // Extract author name and title separately
          const authorName = qEl.querySelector('.cmp-quote__author-name, [class*="author-name"]')?.textContent?.trim() || '';
          const authorTitle = qEl.querySelector('.cmp-quote__author-title, [class*="author-title"]')?.textContent?.trim() || '';
          // Extract author image if present (in .cmp-quote__author-block or .cmp-quote__author-image)
          const authorImg = qEl.querySelector('.cmp-quote__author-block img, .cmp-quote__author-image img, [class*="author-block"] img, [class*="author"] img.author-img');
          const authorImgSrc = authorImg ? normalizeImageUrl(authorImg.getAttribute('src') || authorImg.getAttribute('data-cmp-src') || '') : '';
          if (qText.length > 10) {
            output.appendChild(makeQuote(document, qText, authorName, authorTitle, authorImgSrc));
          }
          continue;
        }

        // ── EDGE CASE: VIDEO EMBED (Brightcove) ──
        const videoEl = child.querySelector('video-js, [data-video-id], [data-account], iframe[src*="youtube"]');
        if (videoEl) {
          const videoId = videoEl.getAttribute('data-video-id') || '';
          const accountId = videoEl.getAttribute('data-account') || videoEl.getAttribute('data-account-id') || '2157889325001';
          const playerId = videoEl.getAttribute('data-player') || 'default';
          // Find overlay title/description from sibling elements or data attributes
          const videoParent = videoEl.closest('.cmp-video, .video, [class*="video"]:not(.video-js)') || videoEl.parentElement;
          const overlayTitle = videoParent?.getAttribute('data-overlay-title')
            || videoParent?.previousElementSibling?.querySelector('h2, h3, h4')?.textContent?.trim()
            || child.querySelector('.cmp-title h2, h2, h3')?.textContent?.trim() || '';
          const watchLabel = videoParent?.getAttribute('data-watch-label')
            || child.querySelector('button[class*="watch"], .cmp-video__cta-text')?.textContent?.trim() || 'Watch Video';
          // Brightcove Video block — ROW indices per blocks/brightcove-video.js:
          // 0=projectNumber, 1=overlayTitle, 2=overlayDescription, 3=posterType,
          // 4=posterImage, 5=posterAlt, 6=colorOverlay, 7=overlayButtonText,
          // 8=overlayButtonIconType, 9=overlayButtonFontIcon, 10=overlayButtonImageIcon,
          // 11=iconPosition, 12=playerType, 13=accountId, 14=playerId, 15=videoId,
          // 16=playlistId, 17=defaultPlaylistVideoId, 18=playlistType,
          // 19=videoContentLayout, 20=enablePlaylistThumbnailMetadata,
          // 21=captionTitle, 22=captionDescription, 23=playButtonAriaLabel,
          // 24=videoCaption, 25=enableAutoplay, 26=enableLoop, 27=enableCaptions,
          // 28=enableVideoChapters, 29=enableRecommendedVideo, 30=enablePlayerControls,
          // 31=enableSocialShare, 32=enableTranscript
          output.appendChild(makeBlock(document, 'Brightcove Video', [
            [''],              // [0] projectNumber
            [overlayTitle],    // [1] overlayTitle
            [''],              // [2] overlayDescription
            ['brightcove'],    // [3] posterType
            [''],              // [4] posterImage
            [''],              // [5] posterAlt
            ['none'],          // [6] colorOverlay
            [watchLabel],      // [7] overlayButtonText
            ['icon-font'],     // [8] overlayButtonIconType
            ['play'],          // [9] overlayButtonFontIcon
            [''],              // [10] overlayButtonImageIcon
            ['left'],          // [11] iconPosition
            ['single'],        // [12] playerType
            [accountId],       // [13] accountId ← block reads ROW.ACCOUNT_ID=13
            [playerId],        // [14] playerId ← block reads ROW.PLAYER_ID=14
            [videoId],         // [15] videoId ← block reads ROW.VIDEO_ID=15
            [''],              // [16] playlistId
            [''],              // [17] defaultPlaylistVideoId
            ['carousel'],      // [18] playlistType
            ['none'],          // [19] videoContentLayout
            ['false'],         // [20] enablePlaylistThumbnailMetadata
            [''],              // [21] captionTitle
            [''],              // [22] captionDescription
            [''],              // [23] playButtonAriaLabel
            [''],              // [24] videoCaption
            ['false'],         // [25] enableAutoplay
            ['false'],         // [26] enableLoop
            ['false'],         // [27] enableCaptions
            ['false'],         // [28] enableVideoChapters
            ['false'],         // [29] enableRecommendedVideo
            ['true'],          // [30] enablePlayerControls
            ['false'],         // [31] enableSocialShare
            ['false'],         // [32] enableTranscript
          ]));
          continue;
        }

        // ── EDGE CASE: STANDALONE IMAGE (not with text) ──
        const imgEl = child.querySelector('img.cmp-image__image, .cmp-image img, img[data-cmp-src]');
        if (imgEl && !child.querySelector('h2, h3, h4, h5') && !child.querySelector('p:not(:has(img))')) {
          const src = normalizeImageUrl(imgEl.getAttribute('src') || imgEl.getAttribute('data-cmp-src') || '');
          if (src) {
            const alt = imgEl.getAttribute('alt') || '';
            const caption = child.querySelector('figcaption, .cmp-image__title, em')?.textContent?.trim() || '';
            output.appendChild(makeCustomImage(document, src, alt, caption));

            // EDGE CASE: Image followed by italic caption text
            if (caption) {
              const capDiv = document.createElement('div');
              const em = document.createElement('em');
              em.textContent = caption;
              capDiv.appendChild(em);
              output.appendChild(makeTextContainer(document, capDiv, 'standard, custom-class'));
            }
          }
          continue;
        }

        // ── EDGE CASE: SEPARATOR ──
        if (child.tagName === 'HR' || cls.includes('separator') || child.querySelector('hr, .cmp-separator')) {
          output.appendChild(makeSeparator(document, 24));
          continue;
        }

        // ── EDGE CASE: RELATED CONTENT CARDS (cardpagestory elements) ──
        const cardPageStories = child.querySelectorAll('.cardpagestory');
        if (cardPageStories.length > 0 && !cls.includes('carousel') && !cls.includes('splide')) {
          const relHeading = child.querySelector('h2, h3, h4, h5');
          if (relHeading) {
            output.appendChild(makeCustomTitle(document, relHeading.textContent.trim(), 5, 'h5-size, width-large'));
          }
          cardPageStories.forEach((card) => {
            const cardLink = card.closest('a') || card.querySelector('a[href]');
            const href = cardLink?.getAttribute('href') || '';
            if (href) {
              output.appendChild(makeRelatedContentCard(document, href));
            }
          });
          continue;
        }

        // ── HEADING ELEMENTS (direct h2-h5 nodes from sorted list) ──
        if (['H2', 'H3', 'H4', 'H5'].includes(child.tagName)) {
          output.appendChild(makeCustomTitle(document, child.textContent.trim(), 5, 'h5-size, width-large'));
          continue;
        }

        // ── TEXT CONTENT (.cmp-text or elements with paragraphs) ──
        const heading = child.querySelector('h2, h3, h4, h5');
        const textEls = child.querySelectorAll('p');

        // If this element has a heading, output it first
        if (heading) {
          output.appendChild(makeCustomTitle(document, heading.textContent.trim(), 5, 'h5-size, width-large'));
        }

        // Process paragraphs
        if (textEls.length > 0) {
          const div = document.createElement('div');
          let hasContent = false;
          let isCaption = false;

          textEls.forEach((p) => {
            const trimmed = p.textContent.trim();
            if (trimmed.length > 0) {
              const newP = document.createElement('p');
              newP.innerHTML = p.innerHTML;
              div.appendChild(newP);
              hasContent = true;
              // Detect italic caption: paragraph entirely in <em>/<i>
              const emEl = p.querySelector('em, i');
              if (emEl && emEl.textContent.trim().length > trimmed.length * 0.7 && trimmed.length < 300) {
                isCaption = true;
              }
            }
          });

          if (hasContent) {
            if (isCaption) {
              // Caption text — wider, italic style
              output.appendChild(makeTextContainer(document, div, 'standard, custom-class'));
            } else {
              output.appendChild(makeTextContainer(document, div, 'spacing-bottom, width-large'));
            }
          }
        }
      }
    }

    // ── RELATED CONTENT SECTION (after body — separate container with cards) ──
    // Some pages have a final .container.cmp-container-full-width with cardpagestory links
    if (overlapIdx >= 0) {
      for (let i = overlapIdx + 1; i < allChildren.length; i++) {
        const section = allChildren[i];
        const sCls = section.className || '';
        if (sCls.includes('experiencefragment')) break;
        if (sCls.includes('container') && sCls.includes('cmp-container-full-width')) {
          const sectionCards = section.querySelectorAll('.cardpagestory');
          if (sectionCards.length > 0) {
            const relHeading = section.querySelector('h2, h3, h4, h5');
            if (relHeading) {
              output.appendChild(makeCustomTitle(document, relHeading.textContent.trim(), 5, 'h5-size, width-large'));
            }
            sectionCards.forEach((card) => {
              const cardLink = card.closest('a') || card.querySelector('a[href]');
              const href = cardLink?.getAttribute('href') || '';
              if (href) {
                output.appendChild(makeRelatedContentCard(document, href));
              }
            });
          }
        }
      }
    }

    // Close section 4
    output.appendChild(makeSectionMetadata(document, 'grid-section, grid-cols-8'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTION 5: RIGHT SPACER (with sidebar card if present)
    // ══════════════════════════════════════════════════════════

    if (sidebarCard && sidebarCard.href) {
      // Story Card with sidePanel variant (matches xwalk reference)
      // Transform href to JCR path for categoryPath
      let categoryJcrPath = sidebarCard.href;
      categoryJcrPath = categoryJcrPath.replace(/^https?:\/\/www\.abbvie\.com/, '');
      categoryJcrPath = categoryJcrPath.replace(/\.html$/, '');
      if (!categoryJcrPath.startsWith('/content/')) {
        categoryJcrPath = `/content/abbvie-nextgen-eds/abbvie-com/us/en${categoryJcrPath}`;
      }
      const categoryLink = document.createElement('a');
      categoryLink.href = sidebarCard.href;
      categoryLink.textContent = categoryJcrPath;

      output.appendChild(makeBlock(document, 'Story Card', [
        ['sidePanel'],     // [0] variant
        ['false'],         // [1] showImage
        ['false'],         // [2] showIcon
        ['false'],         // [3] showCategory
        ['false'],         // [4] showDate
        ['false'],         // [5] showReadTime
        [''],              // [6] storyPath
        [''],              // [7] showShareIcon
        [categoryLink],    // [8] categoryPath (link with JCR path)
        ['true'],          // [9] showExternalLink
        [''],              // [10] blockId
        [''],              // [11] analyticsId
      ]));
    }
    output.appendChild(makeSectionMetadata(document, 'grid-cols-2'));

    // ══════════════════════════════════════════════════════════
    // PAGE METADATA (maps to JCR page properties via md2jcr)
    // ══════════════════════════════════════════════════════════

    // Extract metadata from source page <head>
    const pageTitle = (document.title || '').replace(/\s*\|\s*AbbVie\s*$/, '').trim();
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const ogImage = document.querySelector('meta[property="og:image:url"]')?.getAttribute('content') || '';
    const metaLang = document.querySelector('meta[name="language"]')?.getAttribute('content') || 'en';
    const metaCountry = document.querySelector('meta[name="country"]')?.getAttribute('content') || 'us';

    // Extract story-specific metadata from intro section
    let pubDate = '';
    let readTimeVal = '';
    let categoryText = '';
    if (introContainer) {
      const fullText = introContainer.textContent || '';
      const dateMatch = fullText.match(/(\w+ \d{1,2}, \d{4})/);
      if (dateMatch) pubDate = dateMatch[1];
      const readMatch = fullText.match(/(\d+)\s*Minute\s*Read/i);
      if (readMatch) readTimeVal = readMatch[1];
      introContainer.querySelectorAll('a').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const text = a.textContent.trim();
        if (href.includes('-stories') && text !== 'All Stories' && !href.endsWith('/our-stories.html')) {
          categoryText = text;
        }
      });
    }

    // Build metadata block with JCR property names from page-metadata model
    const metaRows = [];
    if (pageTitle) metaRows.push(['jcr:title', pageTitle]);
    if (metaDesc) metaRows.push(['jcr:description', metaDesc]);
    if (ogImage) {
      const imgEl = document.createElement('img');
      imgEl.src = ogImage;
      metaRows.push(['image', imgEl]);
    }
    if (pubDate) metaRows.push(['publicationDate', pubDate]);
    if (readTimeVal) metaRows.push(['storyReadTime', readTimeVal]);
    if (categoryText) metaRows.push(['eyebrowText', categoryText]);
    if (pageTitle) metaRows.push(['cardTitle', pageTitle]);
    if (metaDesc) metaRows.push(['cardDescription', metaDesc]);
    metaRows.push(['template', 'story-article']);

    if (metaRows.length > 0) {
      output.appendChild(document.createElement('hr'));
      output.appendChild(makeBlock(document, 'Metadata', metaRows));
    }

    // Final cleanup
    abbvieCleanupTransformer("afterTransform", output, { document, url, html, params });

    return output;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  },
};
