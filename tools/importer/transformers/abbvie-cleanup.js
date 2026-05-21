/* eslint-disable */
export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const { document } = payload;

  // Remove non-content elements
  [
    '#onetrust-consent-sdk',
    '.experiencefragment',
    '.cmp-experiencefragment--header',
    '.cmp-experiencefragment--footer',
    'header.nav-bar',
    '.button.back-to-top',
    'link[href]',
    'noscript',
    'script',
    'style',
    '.sticky-nav',
    // Related content / dashboard cards area (renders as junk text)
    '.dashboardcards',
    '[class*="dashboardcards"]',
    // Warn-on-leave / disclaimer popup
    '[class*="warnonleave"]',
    '[class*="warn-on"]',
    '.popup-container',
    '[data-popup-type]',
    // Tracking pixels and ad iframes
    'iframe',
    'img[src*="adsrvr"]',
    'img[src*="twitter.com"]',
    'img[src*="t.co"]',
    'img[src*="bing.com"]',
    'a[href*="adsrvr"]',
    'a[href*="insight.adsrvr"]',
    // Popup close button and related content header
    '.popup-close',
    '.standard-header-with-divider',
  ].forEach(sel => {
    try { document.querySelectorAll(sel).forEach(el => el.remove()); } catch(e) {}
  });

  // Remove the "warn on third party" / "You are about to leave" popup overlay
  // It sits inside a container with popup-related classes at the page bottom
  const warnContainers = document.querySelectorAll('[class*="warnonthirdparty"], [class*="warn-on-legal"]');
  warnContainers.forEach(el => el.remove());

  // Remove the "You are about to leave" disclaimer section
  // It's a container with cmp-container-medium class (NOT the hero overlay containers)
  document.querySelectorAll('.container.cmp-container-medium.height-short').forEach(el => el.remove());

  // Flatten the overlap-predecessor and all its nested .cmp-container wrappers
  // so that block elements (CTA, story-card, title, text) become direct children
  // of the overlap-predecessor's parent (body or section)
  const overlapContainers = document.querySelectorAll('.container.overlap-predecessor');
  overlapContainers.forEach(overlap => {
    // Recursively unwrap all .cmp-container intermediate wrappers
    const unwrap = (el) => {
      const containers = el.querySelectorAll(':scope > .cmp-container, :scope > .container');
      containers.forEach(c => unwrap(c));
      // Now move this element's children up to its parent
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        el.remove();
      }
    };
    unwrap(overlap);
  });

  // Materialize lazy-loaded images: inject <img> for elements with data-cmp-src but no img child
  document.querySelectorAll('[data-cmp-src]').forEach(el => {
    if (!el.querySelector('img')) {
      const img = document.createElement('img');
      img.setAttribute('src', el.getAttribute('data-cmp-src'));
      img.setAttribute('alt', el.getAttribute('data-alt') || el.getAttribute('alt') || '');
      img.setAttribute('loading', 'lazy');
      el.appendChild(img);
    }
  });

  // Collect .cardpagestory elements (related content) into a dedicated container
  // so the sections transformer can find them later
  const relatedCards = document.querySelectorAll('.cardpagestory');
  if (relatedCards.length > 0) {
    const container = document.createElement('div');
    container.id = 'related-content-cards';
    relatedCards.forEach(card => container.appendChild(card));
    document.body.appendChild(container);
  }
}
