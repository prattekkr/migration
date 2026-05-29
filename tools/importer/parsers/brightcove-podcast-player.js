/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: brightcove-podcast-player
 * Base block: brightcove-podcast-player
 * Templates: T01 (section 7 — Podcast Promo)
 * Source: https://www.abbvie.com/ (Podcast Promo section)
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM — podcast player embed):
 *   <div class="brightcove-podcast-player cmp-podcast ...">
 *     <video-js data-account="2157889325001"
 *               data-player="..."
 *               data-video-id="..."
 *               ...>
 *     </video-js>
 *     <div class="cmp-podcast__title">Podcast Title</div>
 *     <img class="cmp-podcast__thumbnail" src="..." alt="..." />
 *   </div>
 *
 * UE Model fields (brightcove-podcast-player):
 *   videoId (text)               — Brightcove video ID
 *   accountId (text)             — Brightcove account ID
 *   playerId (text)              — Brightcove player ID
 *   podcastTitle (text)          — visible podcast title
 *   podcastThumbnail (reference) — thumbnail image reference
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 * Accessibility: thumbnail alt text preserved; title text preserved.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // Locate the Brightcove player element
  const player = element.querySelector('video-js, [data-account], [data-account-id], [data-video-id]')
    || element;

  const videoId = player.getAttribute('data-video-id')
    || player.getAttribute('data-videoId')
    || element.getAttribute('data-video-id')
    || '';

  const accountId = player.getAttribute('data-account')
    || player.getAttribute('data-account-id')
    || element.getAttribute('data-account')
    || '2157889325001';

  const playerId = player.getAttribute('data-player')
    || player.getAttribute('data-player-id')
    || element.getAttribute('data-player')
    || '';

  const podcastTitleEl = element.querySelector(
    '.cmp-podcast__title, .cmp-video__title, .cmp-brightcove__title, h2, h3',
  );
  const podcastTitle = (podcastTitleEl?.textContent || '').trim();

  const thumbnailImg = element.querySelector(
    '.cmp-podcast__thumbnail, .cmp-video__thumbnail, img[class*="thumbnail"], img[class*="poster"]',
  );

  const row = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (value !== undefined && value !== null && value !== '') {
      const p = document.createElement('p');
      p.textContent = String(value);
      frag.appendChild(p);
    }
    return [frag];
  };

  const rowImg = (field, imgEl) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (imgEl) {
      frag.appendChild(imgEl.cloneNode(true));
    }
    return [frag];
  };

  const cells = [
    row('videoId', videoId),
    row('accountId', accountId),
    row('playerId', playerId),
    row('podcastTitle', podcastTitle),
    rowImg('podcastThumbnail', thumbnailImg),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'brightcove-podcast-player', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
