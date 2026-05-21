/* eslint-disable */
/* global WebImporter */

/**
 * Parser: brightcove-video — 40 rows
 * Collapsed fields (ending with Alt, Type, Title, Text, MimeType) get NO rows.
 * They collapse into the parent field's HTML attributes.
 */
export default function parse(element, { document }) {
  const variantClasses = [];
  if (element.classList.contains('cmp-video-xx-large')) variantClasses.push('cmp-video-xx-large');
  const blockName = variantClasses.length > 0 ? `brightcove-video (${variantClasses.join(', ')})` : 'brightcove-video';

  // Extract video data
  const videoEl = element.querySelector('[data-video-id]') || element.querySelector('video-js');
  const videoId = videoEl?.getAttribute('data-video-id') || '';
  const accountId = videoEl?.getAttribute('data-account') || '2157889328001';
  const playerId = videoEl?.getAttribute('data-player') || 'default';

  // Extract overlay title (collapses into projectNumber as heading)
  const overlayHeading = element.querySelector('.cmp-video__text-content [role="heading"]')
    || element.querySelector('.cmp-video__title');
  const overlayTitle = overlayHeading?.textContent?.trim() || '';

  // Extract overlay button text (collapses into colorOverlay as link/text)
  const overlayBtn = element.querySelector('.cmp-video__text-content button span')
    || element.querySelector('.cmp-video__text-content button');
  const overlayButtonText = overlayBtn?.textContent?.trim() || 'Watch Video';

  // Extract poster image + alt (posterAlt collapses into posterImage as img alt)
  const posterImg = element.querySelector('.cmp-video__image img, .video-poster img');
  const posterCell = document.createElement('div');
  if (posterImg) {
    const src = posterImg.getAttribute('data-cmp-src') || posterImg.getAttribute('src') || '';
    const alt = posterImg.getAttribute('alt') || '';
    if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', alt); // posterAlt collapses here
      img.setAttribute('loading', 'lazy');
      pic.appendChild(img);
      posterCell.appendChild(pic);
    }
  }

  // Row 0: projectNumber — overlayTitle collapses here as <h2>
  const row0 = document.createElement('div');
  if (overlayTitle) {
    const h = document.createElement('h2');
    h.textContent = overlayTitle;
    row0.appendChild(h);
  }

  // Row 3: colorOverlay — overlayButtonText collapses here as <p>
  const row3 = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = overlayButtonText;
  row3.appendChild(p);

  // 40 rows (collapsed fields removed, values in parent HTML attributes)
  const cells = [
    [row0],                  // Row 0: projectNumber + overlayTitle(collapsed as h2)
    [''],                    // Row 1: overlayDescription
    [posterCell],            // Row 2: posterImage + posterAlt(collapsed as img alt)
    [row3],                  // Row 3: colorOverlay + overlayButtonText(collapsed as p)
    ['play'],                // Row 4: overlayButtonFontIcon
    [''],                    // Row 5: overlayButtonImageIcon
    ['left'],                // Row 6: iconPosition
    [accountId],             // Row 7: accountId
    [playerId],              // Row 8: playerId
    [videoId],               // Row 9: videoId
    [''],                    // Row 10: playlistId
    [''],                    // Row 11: defaultPlaylistVideoId
    ['none'],                // Row 12: videoContentLayout
    ['false'],               // Row 13: enablePlaylistThumbnailMetadata
    [''],                    // Row 14: captionDescription
    [''],                    // Row 15: playButtonAriaLabel
    [''],                    // Row 16: videoCaption
    ['false'],               // Row 17: enableAutoplay
    ['false'],               // Row 18: enableLoop
    ['false'],               // Row 19: enableCaptions
    ['false'],               // Row 20: enableVideoChapters
    ['false'],               // Row 21: enableRecommendedVideo
    ['true'],                // Row 22: enablePlayerControls
    ['false'],               // Row 23: enableSocialShare
    ['false'],               // Row 24: enableTranscript
    ['transcript'],          // Row 25: showTranscriptLabel
    ['transcript'],          // Row 26: hideTranscriptLabel
    ['new-tab'],             // Row 27: transcriptClickBehavior
    [''],                    // Row 28: modalHiddenPanelId
    [''],                    // Row 29: transcriptLink
    ['play'],                // Row 30: transcriptShowFontIcon
    [''],                    // Row 31: transcriptShowImageIcon
    ['play'],                // Row 32: transcriptHideFontIcon
    [''],                    // Row 33: transcriptHideImageIcon
    ['after'],               // Row 34: transcriptLinkIconPosition
    [''],                    // Row 35: classes_customDynamicClass
    [''],                    // Row 36: blockId
    [''],                    // Row 37: classes_commonCustomClass
    ['none'],                // Row 38: language
    [''],                    // Row 39: analytics_id
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
