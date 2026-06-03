/* eslint-disable */
/* global WebImporter */

/**
 * Import Script: lab-to-life (science-hub template)
 *
 * Page: https://www.abbvie.com/science/our-people/lab-to-life.html
 *
 * Structure:
 * Section 1: Hero (bg image + overlap with H1/description) → navy-overlap
 * Section 2: Video (Brightcove) → default
 * Section 3: Linklist navigation → default
 * Section 4: Footer CTA → navy
 * Section 5: Metadata
 *
 * Blocks used: Hero Container, Brightcove Video, Custom Title, Text Container,
 *              Linklist, Section Metadata, Metadata
 */

import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';

// ═══════════════════════════════════════════════════════════════
// BLOCK BUILDERS (field-group aligned per md2jcr rules)
// ═══════════════════════════════════════════════════════════════

function makeBlock(document, name, rows) {
  const table = document.createElement('table');
  const maxCols = Math.max(...rows.map(r => (Array.isArray(r) ? r : [r]).length));
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  const th = document.createElement('th');
  th.colSpan = maxCols;
  th.textContent = name;
  tr.appendChild(th);
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach((cells) => {
    const row = document.createElement('tr');
    const arr = Array.isArray(cells) ? cells : [cells];
    arr.forEach((cell, i) => {
      const td = document.createElement('td');
      if (cell instanceof Node) td.appendChild(cell.cloneNode ? cell.cloneNode(true) : cell);
      else td.textContent = cell != null ? String(cell) : '';
      if (arr.length < maxCols && i === arr.length - 1) {
        td.colSpan = maxCols - arr.length + 1;
      }
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
}

function makeSectionMetadata(document, styles, blockModelId) {
  const rows = [];
  if (blockModelId) {
    rows.push(['blockModelId', blockModelId]);
    rows.push(['style_container', blockModelId]);
    rows.push(['name', blockModelId === 'grid-container' ? 'Grid Container' : 'Grid Section']);
  }
  const dynamicStyles = [blockModelId, styles].filter(Boolean).join(',');
  if (dynamicStyles) {
    rows.push(['style_customDynamicClass', dynamicStyles]);
  }
  if (blockModelId) {
    rows.push(['language', 'none']);
  }
  return makeBlock(document, 'Section Metadata', rows);
}

// Hero Container — 4 parent rows + 1 item row
function makeHeroContainer(document, imgSrc, imgAlt) {
  const pic = document.createElement('picture');
  const img = document.createElement('img');
  img.src = imgSrc || '';
  img.alt = imgAlt || '';
  pic.appendChild(img);
  return makeBlock(document, 'Hero Container', [
    ['height-default,overlay-height-short'], // [0] classes group
    ['-'],              // [1] blockId
    ['none'],           // [2] language
    ['-'],              // [3] analytics_id
    [pic],              // [4] hero-container-item
  ]);
}

// Custom Title — 5 field groups
function makeCustomTitle(document, text, level, variants) {
  const h = document.createElement(`h${level}`);
  h.textContent = text;
  return makeBlock(document, 'Custom Title', [
    [h],             // [0] title (titleType collapsed)
    [variants || '-'], // [1] classes group
    ['-'],           // [2] blockId
    ['none'],        // [3] language
    ['-'],           // [4] analytics_id
  ]);
}

// Text Container — 4 parent rows + 1 item row
function makeTextContainer(document, contentNode, variants) {
  const wrapper = document.createElement('div');
  if (contentNode && contentNode.querySelectorAll) {
    const paragraphs = contentNode.querySelectorAll('p, ul, ol, h2, h3, h4, h5, h6, blockquote');
    if (paragraphs.length > 0) {
      paragraphs.forEach((el) => wrapper.appendChild(el.cloneNode(true)));
    } else {
      wrapper.innerHTML = contentNode.innerHTML || '';
    }
  } else if (contentNode) {
    wrapper.appendChild(contentNode.cloneNode ? contentNode.cloneNode(true) : contentNode);
  }
  return makeBlock(document, 'Text Container', [
    [variants || '-'], // [0] classes group
    ['-'],             // [1] blockId
    ['none'],          // [2] language
    ['-'],             // [3] analytics_id
    [wrapper],         // [4] text-container-text item
  ]);
}

// Brightcove Video — 33 rows matching story-article format (same as working import)
function makeBrightcoveVideo(document, opts) {
  const { videoId, accountId, overlayTitle, overlayDesc, posterSrc, watchLabel } = opts;
  let posterCell = '';
  if (posterSrc) {
    const pic = document.createElement('picture');
    const img = document.createElement('img');
    img.src = posterSrc;
    img.alt = overlayTitle || '';
    pic.appendChild(img);
    posterCell = pic;
  }
  // Rows aligned to md2jcr modelFields (after _fixFieldOrder drops orphan suffix fields):
  // [projectNumber, overlayHeading, overlayDescription, posterImage(+MimeType collapsed),
  //  colorOverlay, overlayBtnIconVariation, overlayButtonFontIcon, overlayButtonImageIcon,
  //  iconPosition, accountId, playerId, videoId, playlistId, defaultPlaylistVideoId,
  //  videoContentLayout, enablePlaylistThumbnailMetadata, captionDescription,
  //  playButtonAriaLabel, videoCaption, enableAutoplay, enableLoop, enableCaptions,
  //  enableVideoChapters, enableRecommendedVideo, enablePlayerControls, enableSocialShare,
  //  enableTranscript, showTranscriptLabel, hideTranscriptLabel, transcriptClickBehavior,
  //  modalHiddenPanelId, transcriptLink, transcriptShowFontIcon, transcriptShowImageIcon,
  //  transcriptHideFontIcon, transcriptHideImageIcon, transcriptLinkIconPosition,
  //  classes(customDynamic,commonCustom), blockId, language, analytics_id]
  // DROPPED: posterType, posterAlt, overlayButtonText, overlayButtonIconType,
  //   playerType, playlistType, captionTitle, transcriptType, transcriptButtonIconType
  return makeBlock(document, 'Brightcove Video', [
    [''],                          // [0] projectNumber
    [overlayTitle || ''],          // [1] overlayHeading
    [overlayDesc || ''],           // [2] overlayDescription (richtext)
    [posterCell],                  // [3] posterImage (+MimeType collapsed)
    ['none'],                      // [4] colorOverlay
    ['icon-font'],                 // [5] overlayBtnIconVariation
    ['play'],                      // [6] overlayButtonFontIcon
    [''],                          // [7] overlayButtonImageIcon
    ['left'],                      // [8] iconPosition
    [accountId || '2157889325001'], // [9] accountId
    [''],                          // [10] playerId
    [videoId || ''],               // [11] videoId
    [''],                          // [12] playlistId
    [''],                          // [13] defaultPlaylistVideoId
    ['none'],                      // [14] videoContentLayout
    ['false'],                     // [15] enablePlaylistThumbnailMetadata
    [''],                          // [16] captionDescription
    [''],                          // [17] playButtonAriaLabel
    [''],                          // [18] videoCaption
    ['false'],                     // [19] enableAutoplay
    ['false'],                     // [20] enableLoop
    ['false'],                     // [21] enableCaptions
    ['false'],                     // [22] enableVideoChapters
    ['false'],                     // [23] enableRecommendedVideo
    ['true'],                      // [24] enablePlayerControls
    ['false'],                     // [25] enableSocialShare
    ['false'],                     // [26] enableTranscript
    ['transcript'],                // [27] showTranscriptLabel
    ['transcript'],                // [28] hideTranscriptLabel
    ['new-tab'],                   // [29] transcriptClickBehavior
    [''],                          // [30] modalHiddenPanelId
    [''],                          // [31] transcriptLink
    ['play'],                      // [32] transcriptShowFontIcon
    [''],                          // [33] transcriptShowImageIcon
    ['play'],                      // [34] transcriptHideFontIcon
    [''],                          // [35] transcriptHideImageIcon
    ['after'],                     // [36] transcriptLinkIconPosition
    [''],                          // [37] classes group
    [''],                          // [38] blockId
    ['none'],                      // [39] language
    [''],                          // [40] analytics_id
  ]);
}

// Linklist — 18 parent rows (all raw fields) + item rows
// Same approach as story-article: provide all raw fields in model order with empty strings
function makeLinklist(document, items) {
  const parentRows = [
    [''],            // [0] id
    [''],            // [1] customClass
    ['dashboard'],   // [2] variant (shows arrow icons)
    ['custom'],      // [3] linkSource
    [''],            // [4] parentPage
    ['1'],           // [5] childDepth
    ['false'],       // [6] excludeCurrentPage
    ['false'],       // [7] enableDescription
    ['false'],       // [8] enableTags
    ['false'],       // [9] enableSubtitle
    ['false'],       // [10] enableDate
    ['content-tree'], // [11] orderBy
    ['asc'],         // [12] sortOrder
    ['25'],          // [13] maxItems
    ['single-column'], // [14] layout
    [''],            // [15] fontIcon
    ['none'],        // [16] language
    [''],            // [17] ariaLabel
  ];
  // Item rows: each link = one linklist-item
  // linklist-item fields: [0]id, [1]customClass, [2]cookieConsentLink, [3]link, [4]openInNewTab,
  //   [5]linkText, [6]subtitle, [7]description, ...
  // md2jcr processes cells sequentially against fields — link must be at position [3]
  // Use multi-cell rows to align the <a> to the link field position
  const itemRows = items.map(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.text;
    return ['', '', 'false', a]; // id, customClass, cookieConsentLink, link (+ collapsed linkText)
  });
  return makeBlock(document, 'Linklist', [...parentRows, ...itemRows]);
}

function normalizeImageUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('blob:')) return '';
  if (src.includes('?fmt=')) return src.replace(/\?.*$/, '');
  return src;
}

// ═══════════════════════════════════════════════════════════════
// MAIN TRANSFORM
// ═══════════════════════════════════════════════════════════════

export default {
  transformDOM({ document, url, html, params }) {
    abbvieCleanupTransformer("beforeTransform", document.body, { document, url, html, params });

    const output = document.createElement('div');

    // ══════════════════════════════════════════════════════════
    // SECTION 1: HERO
    // ══════════════════════════════════════════════════════════

    const overlapEl = document.querySelector('.overlap-predecessor');
    const heroBgContainer = overlapEl?.previousElementSibling;
    let heroImgSrc = '';
    let heroImgAlt = '';

    if (heroBgContainer) {
      const img = heroBgContainer.querySelector('img.cmp-container__bg-image, img[data-cmp-src], img');
      heroImgSrc = normalizeImageUrl(img?.getAttribute('src') || img?.getAttribute('data-cmp-src') || '');
      heroImgAlt = img?.getAttribute('alt') || '';
    }

    if (heroImgSrc) {
      output.appendChild(makeHeroContainer(document, heroImgSrc, heroImgAlt));
    }

    // H1 + description from overlap
    let h1Text = '';
    let descText = '';
    if (overlapEl) {
      const h1 = overlapEl.querySelector('h1');
      h1Text = h1?.textContent?.trim() || '';
      const desc = overlapEl.querySelector('.cmp-text p');
      descText = desc?.textContent?.trim() || '';
    }

    if (h1Text) {
      output.appendChild(makeCustomTitle(document, h1Text, 1, 'h1-size,medium-weight'));
    }

    if (descText) {
      const descDiv = document.createElement('div');
      descDiv.innerHTML = `<p>${descText}</p>`;
      output.appendChild(makeTextContainer(document, descDiv, 'body-unica-32-reg'));
    }

    output.appendChild(makeSectionMetadata(document, 'content-wide,medium-radius'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTION 2: GRID CONTAINER for featured video (7-1-4) with grey bg
    // ══════════════════════════════════════════════════════════

    output.appendChild(makeSectionMetadata(document, 'content-regular,light-grey', 'grid-container'));
    output.appendChild(document.createElement('hr'));

    // ══════════════════════════════════════════════════════════
    // SECTION 3: FEATURED VIDEO (grid-section col-7)
    // ══════════════════════════════════════════════════════════

    const fullWidthContainers = document.querySelectorAll('.container.cmp-container-full-width');
    const featuredColEl = document.querySelector('.grid-row__col-with-7 [data-video-id]');
    const featuredVideoContainer = featuredColEl ? featuredColEl.closest('.container.cmp-container-full-width') : null;

    if (featuredVideoContainer) {
      const featVideoCol = featuredVideoContainer.querySelector('.grid-row__col-with-7');
      const videoEl = featVideoCol ? featVideoCol.querySelector('[data-video-id]') : null;
      const videoId = videoEl ? videoEl.getAttribute('data-video-id') || '' : '';
      const accountId = videoEl ? videoEl.getAttribute('data-account') || '2157889325001' : '2157889325001';
      const cmpVideo = videoEl ? (videoEl.closest('.cmp-video') || featVideoCol) : featVideoCol;
      const posterImg = cmpVideo ? cmpVideo.querySelector('.cmp-video__image img, .cmp-video__panel img') : null;
      const watchBtn = cmpVideo ? cmpVideo.querySelector('button') : null;

      // Title + desc from col-4 (right side)
      const descCol = featuredVideoContainer.querySelector('.grid-row__col-with-4:not(:has([data-video-id]))');
      const h2 = descCol ? descCol.querySelector('.cmp-title__text, h2') : null;
      const featDesc = descCol ? descCol.querySelector('.cmp-text p') : null;

      output.appendChild(makeBrightcoveVideo(document, {
        videoId,
        accountId,
        overlayTitle: h2 ? h2.textContent.trim() : '',
        overlayDesc: featDesc ? featDesc.textContent.trim() : '',
        posterSrc: normalizeImageUrl(posterImg ? (posterImg.getAttribute('src') || posterImg.getAttribute('data-cmp-src') || '') : ''),
        watchLabel: watchBtn ? watchBtn.textContent.trim() : 'Watch Video',
      }));
      output.appendChild(makeSectionMetadata(document, 'grid-cols-7', 'grid-section'));
      output.appendChild(document.createElement('hr'));

      // Spacer col-1
      output.appendChild(makeSectionMetadata(document, 'grid-cols-1', 'grid-section'));
      output.appendChild(document.createElement('hr'));

      // Title + description (col-4)
      if (h2) {
        output.appendChild(makeCustomTitle(document, h2.textContent.trim(), 2, 'medium-weight,h3-size'));
      }
      if (featDesc) {
        const dd = document.createElement('div');
        dd.innerHTML = '<p>' + featDesc.textContent.trim() + '</p>';
        output.appendChild(makeTextContainer(document, dd, 'spacing-bottom'));
      }
      output.appendChild(makeSectionMetadata(document, 'grid-cols-4', 'grid-section'));
      output.appendChild(document.createElement('hr'));

      // ── VIDEO CARDS (3x col-4) — separate grid-container with grey bg ──
      output.appendChild(makeSectionMetadata(document, 'content-regular,light-grey', 'grid-container'));
      output.appendChild(document.createElement('hr'));

      const allCol4s = featuredVideoContainer.querySelectorAll('.grid-row__col-with-4');
      allCol4s.forEach(function(col) {
        const vid = col.querySelector('[data-video-id]');
        if (!vid) return;
        const vidId = vid.getAttribute('data-video-id') || '';
        if (vidId === videoId) return;
        const accId = vid.getAttribute('data-account') || '2157889325001';
        const cmpVid = vid.closest('.cmp-video') || col;
        const poster = cmpVid.querySelector('.cmp-video__image img, .cmp-video__panel img');
        const btn = cmpVid.querySelector('button');
        // Title and description from .cmp-video__caption — render BELOW video as separate blocks
        var caption = col.querySelector('.cmp-video__caption');
        var captionText = caption ? caption.textContent.trim() : '';
        var captionLines = captionText.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
        var cardTitle = captionLines[0] || '';
        var cardDesc = captionLines.slice(1).join(' ') || '';

        // Video block (no overlay text — caption goes below)
        output.appendChild(makeBrightcoveVideo(document, {
          videoId: vidId,
          accountId: accId,
          overlayTitle: '',
          overlayDesc: '',
          posterSrc: normalizeImageUrl(poster ? (poster.getAttribute('src') || poster.getAttribute('data-cmp-src') || '') : ''),
          watchLabel: btn ? btn.textContent.trim() : 'Watch Video',
        }));
        // Title below video
        if (cardTitle) {
          output.appendChild(makeCustomTitle(document, cardTitle, 3, 'body-unica-20-reg'));
        }
        // Description below video
        if (cardDesc) {
          var descDiv = document.createElement('div');
          descDiv.innerHTML = '<p>' + cardDesc + '</p>';
          output.appendChild(makeTextContainer(document, descDiv, 'spacing-bottom'));
        }
        output.appendChild(makeSectionMetadata(document, 'grid-cols-4', 'grid-section'));
        output.appendChild(document.createElement('hr'));
      });
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 5: DIVE DEEPER (grid: col-5 | col-1 | col-6)
    // ══════════════════════════════════════════════════════════

    const allContainers = document.querySelectorAll('.container.abbvie-container');
    let diveDeeperContainer = null;
    for (let i = 0; i < allContainers.length; i++) {
      const h = allContainers[i].querySelector('h2, .cmp-title__text');
      if (h && h.textContent.indexOf('Dive deeper') !== -1) {
        diveDeeperContainer = allContainers[i];
        break;
      }
    }

    if (diveDeeperContainer) {
      output.appendChild(makeSectionMetadata(document, 'content-regular', 'grid-container'));
      output.appendChild(document.createElement('hr'));

      const diveH2 = diveDeeperContainer.querySelector('h2, .cmp-title__text');
      const diveImg = diveDeeperContainer.querySelector('.cmp-image img, img[data-cmp-src]');

      // Left column (col-5): title + image
      if (diveH2) {
        output.appendChild(makeCustomTitle(document, diveH2.textContent.trim(), 2, 'h3-size'));
      }
      const diveImgSrc = normalizeImageUrl(diveImg ? (diveImg.getAttribute('data-cmp-src') || diveImg.getAttribute('src') || '') : '');
      if (diveImgSrc) {
        const pic = document.createElement('picture');
        const imgEl = document.createElement('img');
        imgEl.src = diveImgSrc;
        imgEl.alt = diveImg ? (diveImg.alt || '') : '';
        pic.appendChild(imgEl);
        output.appendChild(makeBlock(document, 'Custom Image', [
          [pic], ['false'], ['false'], [''], ['false'], ['false'], ['false'],
          [''], ['_self'], [''], ['false'], [''], [''], [''], [''], ['none'], [''],
        ]));
      }
      output.appendChild(makeSectionMetadata(document, 'grid-cols-5', 'grid-section'));
      output.appendChild(document.createElement('hr'));

      // Spacer (col-1)
      output.appendChild(makeSectionMetadata(document, 'grid-cols-1', 'grid-section'));
      output.appendChild(document.createElement('hr'));

      // Right column (col-6): description + linklist
      const diveDescCol = diveDeeperContainer.querySelector('.grid-row__col-with-6');
      const diveDesc = diveDescCol ? diveDescCol.querySelector('.cmp-text p') : diveDeeperContainer.querySelector('.cmp-text p');
      if (diveDesc) {
        const dd2 = document.createElement('div');
        dd2.innerHTML = '<p>' + diveDesc.textContent.trim() + '</p>';
        output.appendChild(makeTextContainer(document, dd2, 'spacing-bottom'));
      }

      const linklistEls = diveDeeperContainer.querySelectorAll('.cmp-list');
      const linkItems = [];
      linklistEls.forEach(function(listEl) {
        listEl.querySelectorAll('.cmp-list__item-link').forEach(function(a) {
          var text = '';
          var titleEl = a.querySelector('.cmp-list__item-title');
          if (titleEl) text = titleEl.textContent.trim();
          else text = a.textContent.trim();
          var href = a.getAttribute('href') || '';
          if (text && href && text.length > 2 && text !== 'en' && href !== 'https://www.abbvie.com/' && href !== '/') {
            linkItems.push({ text: text, href: href });
          }
        });
      });
      if (linkItems.length > 0) {
        output.appendChild(makeLinklist(document, linkItems));
      }
      output.appendChild(makeSectionMetadata(document, 'grid-cols-6', 'grid-section'));
      output.appendChild(document.createElement('hr'));
    }


    // ══════════════════════════════════════════════════════════
    // FOOTER CTA (purple section: "Join the team...")
    // ══════════════════════════════════════════════════════════

    const footerContainers = document.querySelectorAll('.container.abbvie-container');
    let footerCTA = null;
    for (let i = 0; i < footerContainers.length; i++) {
      const c = footerContainers[i];
      if (c.textContent.indexOf('Join the team') !== -1 || c.className.indexOf('footer-overlap') !== -1) {
        footerCTA = c;
        break;
      }
    }

    if (footerCTA) {
      const ctaH2 = footerCTA.querySelector('h2, .cmp-title__text');
      const ctaBtn = footerCTA.querySelector('.cmp-button__text, a.cmp-button');
      const ctaBtnHref = footerCTA.querySelector('a.cmp-button') ? footerCTA.querySelector('a.cmp-button').href : '';

      // Purple section with radius, grid 7-2-3 layout
      output.appendChild(makeSectionMetadata(document, 'content-regular,purple,medium-radius', 'grid-container'));
      output.appendChild(document.createElement('hr'));

      // Col-7: title text
      if (ctaH2) {
        output.appendChild(makeCustomTitle(document, ctaH2.textContent.trim(), 2, 'h2-size'));
      }
      output.appendChild(makeSectionMetadata(document, 'grid-cols-7', 'grid-section'));
      output.appendChild(document.createElement('hr'));

      // Col-2: spacer
      output.appendChild(makeSectionMetadata(document, 'grid-cols-2', 'grid-section'));
      output.appendChild(document.createElement('hr'));

      // Col-3: CTA button (dark theme)
      if (ctaBtn && ctaBtnHref) {
        const a = document.createElement('a');
        a.href = ctaBtnHref;
        a.textContent = ctaBtn.textContent.trim();
        output.appendChild(makeBlock(document, 'Cta', [
          [a],                      // [0] link
          [''],                     // [1] aria-label
          ['_self'],                // [2] ctaTarget
          ['none'],                 // [3] iconVariation
          [''],                     // [4] iconFont
          [''],                     // [5] iconImage
          ['after'],                // [6] iconPosition
          ['false'],                // [7] ariaHidden
          [''],                     // [8] warnOnDeparturePopupFragmentPath
          ['dark-theme'],           // [9] classes group
          [''],                     // [10] blockId
          ['none'],                 // [11] language
          [''],                     // [12] analytics_id
        ]));
      }
      output.appendChild(makeSectionMetadata(document, 'grid-cols-3', 'grid-section'));
      output.appendChild(document.createElement('hr'));
    }

    // ══════════════════════════════════════════════════════════
    // PAGE METADATA
    // ══════════════════════════════════════════════════════════

    const metaTitle = document.querySelector('meta[property="og:title"]')?.content
      || document.querySelector('title')?.textContent?.replace(' | AbbVie', '') || '';
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    const metaImage = document.querySelector('meta[property="og:image"]')?.content || '';

    const metaRows = [];
    if (metaTitle) metaRows.push(['jcr:title', metaTitle]);
    if (metaDesc) metaRows.push(['jcr:description', metaDesc]);
    if (metaImage) {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.src = metaImage;
      pic.appendChild(img);
      metaRows.push(['image', pic]);
    }
    metaRows.push(['template', 'science-hub']);
    metaRows.push(['brand', 'abbvie']);

    output.appendChild(makeBlock(document, 'Metadata', metaRows));

    abbvieCleanupTransformer("afterTransform", output, { document, url, html, params });
    return output;
  },

  generateDocumentPath({ document, url }) {
    return WebImporter.FileUtils.sanitizePath(new URL(url).pathname.replace(/\.html$/, ''));
  }
};
