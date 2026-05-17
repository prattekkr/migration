/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AbbVie site-wide cleanup.
 * Removes non-authorable content (header, footer, nav, cookie consent, tracking pixels)
 * and cleans up AEM-specific layout artifacts.
 *
 * All selectors verified against migration-work/cleaned.html from:
 * https://www.abbvie.com/who-we-are/our-stories/can-unlocking-one-million-genomes.html
 *
 * DOM sources:
 * - Header experience fragment: .cmp-experiencefragment--header (line 9)
 * - Footer experience fragment: .cmp-experiencefragment--footer (line 4111)
 * - Cookie consent: #onetrust-consent-sdk (line 4607)
 * - Search overlay: .search-input (line 3646)
 * - Skip link: a.skip-link (line 17)
 * - Back to top button: .button.back-to-top (line 4118)
 * - Tracking pixels: img[src*="t.co"], img[src*="analytics.twitter.com"] (lines 4868-4873)
 * - TTD pixel: iframe#universal_pixel_qeyyfbt (line 4866)
 * - YT player: #yt-player-initiated (line 4599)
 * - Duplicate content container: #container-64b2d703f1 (line 3875 - responsive layout duplicate)
 * - Duplicate carousel: #splide02 (line 3913 - responsive layout duplicate of #splide01)
 * - Carousel UI chrome: .splide__pagination, .splide__arrows, .carousel-nav
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove cookie consent banner (blocks parsing due to overlay)
    // Source: #onetrust-consent-sdk (line 4607 in cleaned.html)
    WebImporter.DOMUtils.remove(element, ['#onetrust-consent-sdk']);

    // Remove duplicate content container (responsive layout artifact)
    // Source: #container-64b2d703f1 (line 3875) duplicates content from lines 3746-3773
    const dupContainer = element.querySelector('#container-64b2d703f1');
    if (dupContainer) {
      const parentContainer = dupContainer.closest('.container.abbvie-container.cmp-container-large');
      if (parentContainer) {
        parentContainer.remove();
      } else {
        dupContainer.remove();
      }
    }

    // Remove duplicate carousel (responsive layout artifact)
    // Source: #splide02 (line 3913) is a duplicate of #splide01 (line 3778)
    const dupCarousel = element.querySelector('#splide02');
    if (dupCarousel) {
      const carouselWrapper = dupCarousel.closest('.carousel.panelcontainer.carousel-minimal');
      if (carouselWrapper && carouselWrapper !== element.querySelector('.carousel.panelcontainer.carousel-minimal')) {
        carouselWrapper.remove();
      } else if (dupCarousel) {
        dupCarousel.remove();
      }
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove header experience fragment (non-authorable site chrome)
    // Source: .cmp-experiencefragment--header (line 9 in cleaned.html)
    WebImporter.DOMUtils.remove(element, ['.cmp-experiencefragment--header']);

    // Remove footer experience fragment (non-authorable site chrome)
    // Source: .cmp-experiencefragment--footer (line 4111 in cleaned.html)
    WebImporter.DOMUtils.remove(element, ['.cmp-experiencefragment--footer']);

    // Remove skip-to-content link (non-authorable)
    // Source: a.skip-link (line 17 in cleaned.html)
    WebImporter.DOMUtils.remove(element, ['a.skip-link']);

    // Remove search input overlay (non-authorable)
    // Source: .search-input (line 3646 in cleaned.html)
    WebImporter.DOMUtils.remove(element, ['.search-input']);

    // Remove back-to-top button (non-authorable site widget)
    // Source: .button.back-to-top (line 4118 in cleaned.html)
    WebImporter.DOMUtils.remove(element, ['.button.back-to-top']);

    // Remove tracking pixels and iframes (non-authorable)
    // Source: iframe#universal_pixel_qeyyfbt (line 4866), twitter pixels (lines 4868-4873)
    WebImporter.DOMUtils.remove(element, [
      'iframe#universal_pixel_qeyyfbt',
      'img[src*="t.co/i/adsct"]',
      'img[src*="analytics.twitter.com"]',
      'iframe:not([id])',
    ]);

    // Remove YT player div (non-authorable)
    // Source: #yt-player-initiated (line 4599 in cleaned.html)
    WebImporter.DOMUtils.remove(element, ['#yt-player-initiated']);

    // Remove link elements (CSS refs from AEM clientlibs, non-authorable)
    // Source: link[href*="etc.clientlibs"] (lines 10-11 in cleaned.html)
    WebImporter.DOMUtils.remove(element, ['link']);

    // Remove noscript comments and meta tags (non-authorable)
    WebImporter.DOMUtils.remove(element, ['noscript', 'meta']);

    // Remove splide pagination and arrow buttons (carousel UI chrome, not content)
    // Source: .splide__pagination (line 3837), .splide__arrows (lines 3833, 3867)
    WebImporter.DOMUtils.remove(element, [
      '.splide__pagination',
      '.splide__arrows',
      '.carousel-nav',
    ]);

    // Remove empty divs that are layout artifacts
    // Source: empty divs between footer and onetrust (lines 4595-4606)
    element.querySelectorAll(':scope div:empty').forEach((div) => {
      // Only remove if it has no id, no meaningful class, and no content
      if (!div.id && !div.className && !div.children.length && !div.textContent.trim()) {
        div.remove();
      }
    });
  }
}
