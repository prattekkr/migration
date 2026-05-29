/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: video
 * Base block: video
 * Templates: T04 (Innovation Area section 4 — Embed/video embeds), T05 (Science Content Series)
 * Source: https://www.abbvie.com/science/areas-of-innovation/ai-and-data-convergence.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM — YouTube/generic video embed):
 *   <div class="embed cmp-embed ...">
 *     <iframe src="https://www.youtube.com/embed/..." title="Video title"></iframe>
 *   </div>
 *   OR embedded video with poster:
 *   <div class="video cmp-video-embed ...">
 *     <video src="..." poster="..." controls></video>
 *   </div>
 *
 * NOTE: Brightcove videos use the brightcove-video block (separate parser).
 * This parser handles non-Brightcove video embeds (YouTube, Vimeo, HTML5 video).
 *
 * UE Model fields (video):
 *   uri (aem-content)            — video URL (YouTube embed URL, video src)
 *   placeholderImage (reference) — poster image
 *   placeholderAlt (text)        — poster alt text
 *   overlayTitle (text)          — title shown before play
 *   overlayDescription (text)    — description shown before play
 *   overlayBtnText (text)        — CTA button label (default "Watch")
 *   videoContentLayout (select)  — "none" | "bottom" | "left" | "right"
 *   classes_overlayColor (select)— "video-overlay-navy" | "video-overlay-gray" | "video-overlay-purple"
 *   classes_overlayBtnStyle (select)— "video-btn-outline" | "video-btn-solid"
 *   overlayButtonIconType (select)— "icon-font" | "image"
 *   overlayButtonFontIcon (text) — icon name (default "play")
 *   enableAutoplay (boolean)     — default false
 *   enableCaptions (boolean)     — default false
 *   enablePlayerControls (boolean)— default true
 *   enableFullscreen (boolean)   — default true
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer to block.
 * Accessibility (Rule 5): iframe title / video track labels preserved as overlayTitle.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  // Skip Brightcove embeds — handled by brightcove-video parser
  if (
    element.querySelector('video-js, [data-account], [data-video-id]')
    || element.matches('[data-account], video-js')
  ) {
    return;
  }

  // Locate the video source
  const iframeEl = element.querySelector('iframe[src]');
  const videoEl = element.querySelector('video[src], video source[src]');
  const uri = (iframeEl?.getAttribute('src')
    || videoEl?.getAttribute('src')
    || videoEl?.querySelector('source')?.getAttribute('src')
    || '').trim();

  if (!uri) {
    element.replaceWith(document.createTextNode(''));
    return;
  }

  // Poster / placeholder image
  const posterImg = element.querySelector('img[class*="poster"], img[class*="placeholder"], img[class*="thumbnail"]');
  const posterSrc = posterImg?.getAttribute('src') || videoEl?.getAttribute('poster') || '';
  const posterAlt = (posterImg?.getAttribute('alt') || '').trim();

  // Overlay text from siblings or wrapper
  const titleEl = element.querySelector('h2, h3, [class*="title"]');
  const descEl = element.querySelector('[class*="description"], p');
  const ctaEl = element.querySelector('[class*="cta"], button, a[class*="play"]');

  const overlayTitle = (iframeEl?.getAttribute('title') || titleEl?.textContent || '').trim();
  const overlayDescription = (descEl?.textContent || '').trim();
  const overlayBtnText = (ctaEl?.textContent || 'Watch').trim();

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

  const rowImg = (field, src, alt) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      if (alt) img.alt = alt;
      frag.appendChild(img);
    }
    return [frag];
  };

  const cells = [
    row('uri', uri),
    rowImg('placeholderImage', posterSrc, posterAlt),
    row('placeholderAlt', posterAlt),
    row('overlayTitle', overlayTitle),
    row('overlayDescription', overlayDescription),
    row('overlayBtnText', overlayBtnText),
    row('videoContentLayout', 'none'),
    row('classes_overlayColor', 'video-overlay-navy'),
    row('classes_overlayBtnStyle', 'video-btn-outline'),
    row('overlayButtonIconType', 'icon-font'),
    row('overlayButtonFontIcon', 'play'),
    row('enableAutoplay', false),
    row('enableCaptions', false),
    row('enablePlayerControls', true),
    row('enableFullscreen', true),
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'video', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
