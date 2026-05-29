/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: brightcove-video
 * Base block: brightcove-video
 * Source: https://www.abbvie.com/who-we-are/our-stories/two-lives-converging-in-the-fight-against-parkinsons.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns for Brightcove on AbbVie AEM:
 *   <video-js
 *     data-account="2157889325001"
 *     data-player="default"
 *     data-video-id="6386519121112"
 *     class="vjs-fluid"
 *     ...>
 *   </video-js>
 *
 * Or the legacy wrapper:
 *   <div class="cmp-video">
 *     <div class="cmp-video__player" data-account-id="..." data-video-id="..." ...>
 *
 * Overlay title / subtitle / "Watch X:XX" CTA come from sibling cmp-text /
 * cmp-title elements above the player wrapper, or from data-* attributes
 * stashed by the cleanup transformer.
 *
 * Library structure: 1 column, N rows — field-comment driven.
 * UE Model fields emitted (matches blocks/brightcove-video/_brightcove-video.json):
 *   overlayTitle (text)
 *   overlayDescription (richtext)
 *   overlayButtonText (text)            default: "Watch Video"
 *   overlayButtonIconType (select)      icon-font | image
 *   overlayButtonFontIcon (text)        default: "play"
 *   iconPosition (select)               left | right
 *   playerType (select)                 single | playlist | 3d-video
 *   accountId (select)                  2157889325001 | public | commercial
 *   playerId (text)
 *   videoId (text)
 *   posterType (select)                 brightcove | color | custom
 *   colorOverlay (select)               #071D49 (navy) | none
 *   videoContentLayout (select)         none | bottom | left | right
 *   enableAutoplay (boolean)
 *   enableLoop (boolean)
 *   enableCaptions (boolean)
 *   enableVideoChapters (boolean)
 *   enableRecommendedVideo (boolean)
 *   enablePlayerControls (boolean)      default: true
 *   enableSocialShare (boolean)
 *   enableTranscript (boolean)
 *   captionTitle (text)
 *   captionDescription (text)
 *   playButtonAriaLabel (text)
 *   videoCaption (text)
 *
 * Analytics: data-cmp-data-layer preserved
 * Accessibility: aria-label / play button label extracted into playButtonAriaLabel
 */

function extractBrightcoveIds(player) {
  if (!player) return { accountId: '', videoId: '', playerId: '' };
  // <video-js> uses data-account and data-video-id; legacy uses data-account-id
  return {
    accountId: player.getAttribute('data-account')
      || player.getAttribute('data-account-id')
      || '',
    videoId: player.getAttribute('data-video-id')
      || player.getAttribute('data-videoid')
      || '',
    playerId: player.getAttribute('data-player')
      || player.getAttribute('data-player-id')
      || '',
  };
}

function findOverlayText(element) {
  // Look for an overlay title/desc sibling structure. Several AEM templates put
  // the title above the player and a description below; some inline both inside
  // the video wrapper with class .cmp-video__overlay-title / __overlay-description.
  const overlayTitle = element.querySelector(
    '.cmp-video__overlay-title, .cmp-video__title, .video-overlay-title, [data-overlay-title]',
  );
  const overlayDesc = element.querySelector(
    '.cmp-video__overlay-description, .cmp-video__subtitle, .video-overlay-description, [data-overlay-desc]',
  );

  let title = '';
  let desc = '';

  if (overlayTitle) {
    title = (overlayTitle.getAttribute('data-overlay-title')
      || overlayTitle.textContent || '').trim();
  }
  if (overlayDesc) {
    desc = (overlayDesc.getAttribute('data-overlay-desc')
      || overlayDesc.textContent || '').trim();
  }

  // Fallback: previous sibling heading / paragraph adjacent to the player
  if (!title) {
    const prev = element.previousElementSibling
      || element.parentElement?.previousElementSibling;
    title = prev?.querySelector?.('h1, h2, h3, h4, h5, h6')?.textContent?.trim() || title;
  }
  return { title, desc };
}

function findWatchButtonText(element) {
  // The "Watch 3:49" label commonly appears as a sibling .cmp-video__cta-text
  // or inside the player as the data-watch-label attribute.
  const cta = element.querySelector(
    '.cmp-video__cta-text, .cmp-video__watch-label, [data-watch-label]',
  );
  if (!cta) return '';
  return (cta.getAttribute('data-watch-label') || cta.textContent || '').trim();
}

export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  const player = element.matches?.('video-js, [data-account], [data-account-id]')
    ? element
    : element.querySelector('video-js, [data-account], [data-account-id], [data-video-id]');

  const { accountId, videoId, playerId } = extractBrightcoveIds(player);
  const { title: overlayTitle, desc: overlayDescription } = findOverlayText(element);
  const overlayButtonText = findWatchButtonText(element) || 'Watch Video';

  // Reasonable defaults aligned with the manually-authored reference page
  const fields = {
    overlayTitle,
    overlayDescription,
    overlayButtonText,
    overlayButtonIconType: 'icon-font',
    overlayButtonFontIcon: 'play',
    iconPosition: 'left',
    playerType: 'single',
    accountId: accountId || '2157889325001',
    playerId,
    videoId,
    posterType: 'brightcove',
    colorOverlay: 'none',
    videoContentLayout: 'none',
    enableAutoplay: false,
    enableLoop: false,
    enableCaptions: false,
    enableVideoChapters: false,
    enableRecommendedVideo: false,
    enablePlayerControls: true,
    enableSocialShare: false,
    enableTranscript: false,
    captionTitle: '',
    captionDescription: '',
    playButtonAriaLabel: (player?.getAttribute?.('aria-label') || '').trim(),
    videoCaption: '',
  };

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

  const cells = Object.entries(fields).map(([field, value]) => row(field, value));
  const block = WebImporter.Blocks.createBlock(document, { name: 'brightcove-video', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
