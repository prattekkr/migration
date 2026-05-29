import {
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateTemplateAndTheme,
  getMetadata,
  loadCSS,
  loadFooter,
  loadHeader,
  loadSection,
  loadSections,
  waitForFirstImage,
} from './aem.js';

import {
  initFooterReturnScrollOnHistoryRestore,
  shouldRunOutsideAuthorEdit,
  isExternalLink,
  isInUniversalEditor,
} from './utils.js';
/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter(
        (attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-'),
      ),
  );
}

/**
 * True when an anchor href should be treated as an image asset (DAM, DM, Franklin media, etc.).
 * Excludes obvious video destinations so mixed cells resolve the correct target.
 * @param {string} href
 * @returns {boolean}
 */
function isResolvableImageReferenceHref(href) {
  if (!href) return false;
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(href)) return false;
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(href)
    || href.includes('scene7.com')
    || href.includes('/is/image/')
    || href.includes('/content/dam/')
    || href.includes('media_');
}

/**
 * Resolve AEM reference links to proper <img> elements.
 * On AEM Author, component "reference" fields render as <a> links instead of
 * <img> tags. This utility detects image-like links and replaces them with
 * <img> elements so that downstream block code can find images normally.
 * @param {Element} container - The container element to scan
 */
export function resolveImageReference(container) {
  if (!container || container.querySelector('picture, img')) return;
  const link = [...container.querySelectorAll('a[href]')].find((a) => isResolvableImageReferenceHref(a.href));
  if (!link?.href) return;
  const { href } = link;
  const img = document.createElement('img');
  img.src = href;
  img.alt = link.title || link.textContent || '';
  img.loading = 'lazy';
  const wrapper = link.closest('.button-container') || link.closest('p') || link;
  wrapper.replaceWith(img);
}

function isUsableImageUrl(value) {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return false;

  return normalized.startsWith('/')
    || normalized.startsWith('http')
    || /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(normalized)
    || normalized.includes('scene7.com')
    || normalized.includes('/is/image/');
}

function resolveSectionBackgroundUrl(section) {
  const datasetBackground = `${section.dataset.background || ''}`.trim();
  if (isUsableImageUrl(datasetBackground)) {
    return datasetBackground;
  }

  const backgroundField = section.querySelector('[data-aue-prop="background"]');
  if (backgroundField) {
    resolveImageReference(backgroundField);
    const fieldImage = backgroundField.querySelector('img');
    if (isUsableImageUrl(fieldImage?.src)) {
      return fieldImage.src;
    }

    const fieldLink = backgroundField.querySelector('a[href]');
    if (isUsableImageUrl(fieldLink?.href)) {
      return fieldLink.href;
    }
  }

  const backgroundImage = section.querySelector('img[data-background]');
  if (isUsableImageUrl(backgroundImage?.src)) {
    return backgroundImage.src;
  }

  const backgroundLink = section.querySelector('a[data-background], [data-background] a[href]');
  if (isUsableImageUrl(backgroundLink?.href)) {
    return backgroundLink.href;
  }

  return '';
}

function extractSectionBackgroundMedia(section) {
  const backgroundField = section.querySelector('[data-aue-prop="background"]');
  if (backgroundField) {
    resolveImageReference(backgroundField);
    const media = backgroundField.querySelector('picture, img');
    if (media) return media.cloneNode(true);
  }

  const existingMedia = section.querySelector('img[data-background], picture[data-background]');
  if (existingMedia) return existingMedia.cloneNode(true);

  return null;
}

function renderSectionBackgroundMedia(section) {
  const existing = section.querySelector(':scope > .section-background-media');
  const media = extractSectionBackgroundMedia(section);

  if (!media) {
    existing?.remove();
    return;
  }

  const wrapper = existing || document.createElement('div');
  wrapper.className = 'section-background-media';
  wrapper.setAttribute('aria-hidden', 'true');

  const image = media.tagName === 'IMG' ? media : media.querySelector('img');
  if (image) {
    image.alt = '';
    image.loading = 'eager';
    image.fetchPriority = 'high';
  }

  wrapper.replaceChildren(media);
  if (!existing) section.prepend(wrapper);
}

function applySectionBackground(section, idx, allSections) {
  const bg = resolveSectionBackgroundUrl(section);
  const isAuthorEdit = !shouldRunOutsideAuthorEdit();
  if (!bg) {
    section.style.removeProperty('background-image');
    delete section.dataset.background;
    if (isAuthorEdit) {
      renderSectionBackgroundMedia(section);
    } else {
      section.querySelector(':scope > .section-background-media')?.remove();
    }
    return '';
  }

  const id = `section-bg-${idx}`;
  section.id = section.id || id;
  section.dataset.background = bg;
  section.style.backgroundImage = `url('${bg}')`;

  const sectionIndex = allSections.indexOf(section);
  const isAboveFold = sectionIndex < 2;
  const bgImg = section.querySelector('img[data-background], [data-aue-prop="background"] img');
  if (bgImg) {
    bgImg.loading = isAboveFold ? 'eager' : 'lazy';
    bgImg.fetchPriority = isAboveFold ? 'high' : 'auto';
  }

  if (isAuthorEdit) {
    renderSectionBackgroundMedia(section);
  } else {
    section.querySelector(':scope > .section-background-media')?.remove();
  }
  return `#${section.id} { background-image: url('${bg}'); }`;
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(
        `${window.hlx.codeBasePath}/blocks/modal/modal.js`
      );
      openModal(origin.href);
    }

    // ── Warn on Departure ──
    // Only trigger for EXTERNAL http/https links
    // Internal links (same origin) navigate normally — no modal
    if (origin && isExternalLink(origin.href)) {
      e.preventDefault();
      try {
        const { default: initWarnOnDeparture } = await import(
          `${window.hlx.codeBasePath}/scripts/warn-on-departure/warn-on-departure.js`
        );
        await initWarnOnDeparture(origin);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[delayed] Warn on Departure failed to initialise:', err);
      }
    }
  });
}

/**
 * Build breadcrumb navigation from the current URL path.
 * Used for pages that don't have a hero block (hero.js builds its own).
 */
// function buildBreadcrumbs() {
//   const path = window.location.pathname.replace(/^\/content/, '').replace(/\.html$/, '');
//   const segments = path.split('/').filter(Boolean);
//   if (segments.length <= 1) return null;

//   const nav = document.createElement('nav');
//   nav.className = 'section-breadcrumbs';
//   nav.setAttribute('aria-label', 'Breadcrumb');

//   const ol = document.createElement('ol');
//   let currentPath = '';

//   segments.forEach((segment, i) => {
//     currentPath += `/${segment}`;
//     const li = document.createElement('li');
//     const title = segment
//       .split('-')
//       .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
//       .join(' ');

//     if (i < segments.length - 1) {
//       const a = document.createElement('a');
//       a.href = currentPath;
//       a.textContent = title;
//       li.append(a);
//     } else {
//       // Use the page's h1 text for the current page label when available
//       const h1 = document.querySelector('h1');
//       li.textContent = h1 ? h1.textContent.trim() : title;
//       li.setAttribute('aria-current', 'page');
//     }
//     ol.append(li);
//   });

//   nav.append(ol);
//   return nav;
// }

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function a11yLinks(main) {
  const links = main.querySelectorAll('a');
  links.forEach((link) => {
    let label = link.textContent;
    if (!label && link.querySelector('span.icon')) {
      const icon = link.querySelector('span.icon');
      label = icon ? icon.classList[1]?.split('-')[1] : label;
    }
    link.setAttribute('aria-label', label);

    // Remove title attribute if any ancestor has button-container class
    if (link.hasAttribute('title') && link.closest('.button-container')) {
      link.removeAttribute('title');
    }
  });
}

/**
 * Moves consecutive grid-section elements into the preceding grid-container
 * section, making them direct children of that container.
 * Only runs in author (UE editor) mode, detected by the presence of an iframe
 * with "author" in its src.
 * @param {Element} main The main element
 */
function addGridSectionsWrapper(main) {
  let group = [];
  let currentContainer = null;

  const flush = () => {
    if (!group.length) return;
    if (currentContainer) {
      group.forEach((s) => currentContainer.append(s));
    }
    group = [];
    currentContainer = null;
  };

  [...main.children].forEach((child) => {
    if (child.matches('.section[class*="grid-container"]')) {
      flush();
      currentContainer = child;
    } else if (child.matches('.section[class*="grid-cols-"]')) {
      group.push(child);
    } else {
      flush();
    }
  });
  flush();
}

/**
 * Apply background images from section-metadata data-background attributes.
 * Uses a <style> tag so backgrounds persist even if UE resets inline styles.
 * Automatically derives fetchPriority and loading from section position:
 * first 2 sections = above fold (eager, high priority), rest = lazy.
 * @param {Element} main The main element
 */
export function decorateSectionBackgrounds(main) {
  const rules = [];
  const allSections = [...main.querySelectorAll('.section')];

  main.querySelectorAll('.section').forEach((section, idx) => {
    const rule = applySectionBackground(section, idx, allSections);
    if (rule) rules.push(rule);
  });
  if (rules.length) {
    const style = document.createElement('style');
    style.textContent = rules.join('\n');
    document.head.appendChild(style);
  }
}

/**
 * Handle fragment visibility in hero sections that contain multiple fragments.
 * - If the section has the "onlyone" class: show only the first fragment.
 * - Otherwise: rotate through fragments in authored order across page loads,
 *   showing one per visit.
 * Only applies to hero sections (data-section-type="hero").
 * @param {Element} main The main element
 */
function decorateFragmentRotation(main) {
  main
    .querySelectorAll('.section[data-section-type="hero"]')
    .forEach((section) => {
      const fragmentWrappers = [
        ...section.querySelectorAll(':scope > .fragment-wrapper'),
      ];
      if (fragmentWrappers.length < 2) return;

      if (section.classList.contains('onlyone')) {
        // Show only the first fragment, remove the rest
        fragmentWrappers.slice(1).forEach((fw) => fw.remove());
      } else {
        // Rotate fragments in authored order across page loads
        const pagePath = window.location.pathname;
        const sectionIndex = [...main.querySelectorAll('.section')].indexOf(
          section,
        );
        const storageKey = `fragment-rotation-${pagePath}-${sectionIndex}`;

        const lastIndex = parseInt(
          sessionStorage.getItem(storageKey) ?? '-1',
          10,
        );
        const nextIndex = (lastIndex + 1) % fragmentWrappers.length;
        sessionStorage.setItem(storageKey, nextIndex.toString());

        fragmentWrappers.forEach((fw, i) => {
          if (i !== nextIndex) fw.remove();
        });
      }
    });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionBackgrounds(main);
  decorateBlocks(main);
  // Run after decorateBlocks (which assigns fragment-wrapper class) but before loadSection
  decorateFragmentRotation(main);
  // add aria-label to links
  a11yLinks(main);
}

// Helper function to create and append meta tag
function createMeta(attributes, doc = document) {
  const meta = doc.createElement('meta');
  Object.entries(attributes).forEach(([key, value]) => {
    if (value) meta.setAttribute(key, value);
  });
  doc.head.appendChild(meta);
}

/**
 * Add client-side metadata to document head
 * - itemprop name and description
 * - twitter:url
 * - og:image properties (type, width, height)
 * @param {Document} doc The document object
 */
function addClientSideMetadata(doc) {
  // 1. Add itemprop="name" - derive from og:title or page title
  const ogTitle = getMetadata('og:title');
  const title = ogTitle || doc.title;
  if (title) {
    createMeta({ itemprop: 'name', content: title }, doc);
  }

  // 2. Add itemprop="description" - derive from description or og:description
  const description = getMetadata('description');
  const ogDescription = getMetadata('og:description');
  const content = description || ogDescription;
  if (content) {
    createMeta({ itemprop: 'description', content }, doc);
  }

  // 3. Add twitter:url - derive from og:url
  const ogUrl = getMetadata('og:url');
  if (ogUrl) {
    createMeta({ name: 'twitter:url', content: ogUrl }, doc);
  }

  // 4-6. Add og:image properties (type, width, height)
  const ogImage = getMetadata('og:image');
  if (ogImage) {
    try {
      // Convert relative URL to absolute URL
      const imageUrl = new URL(ogImage, window.location.href).href;
      const urlObj = new URL(imageUrl);
      const urlParams = new URLSearchParams(urlObj.search);

      // Resolve image type from URL params or extension — no fetch needed
      let imageType = 'image/jpeg'; // default
      const format = urlParams.get('format');
      if (format) {
        const formatMap = {
          pjpg: 'image/jpeg',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
        };
        imageType = formatMap[format.toLowerCase()] || imageType;
      } else {
        const extension = imageUrl.split('.').pop().split('?')[0].toLowerCase();
        const typeMap = {
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          webp: 'image/webp',
          svg: 'image/svg+xml',
        };
        imageType = typeMap[extension] || imageType;
      }
      createMeta({ property: 'og:image:type', content: imageType }, doc);

      const imageWidth = urlParams.get('width');
      const imageHeight = urlParams.get('height');
      if (imageWidth) createMeta({ property: 'og:image:width', content: imageWidth }, doc);
      if (imageHeight) createMeta({ property: 'og:image:height', content: imageHeight }, doc);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to process og:image metadata:', error);
    }
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  loadCSS(`${window.hlx.codeBasePath}/styles/section.css`);
  decorateTemplateAndTheme();
  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    doc.body.dataset.breadcrumbs = true;
  }
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);

    // Inject breadcrumbs for pages without a hero block
    if (
      !main.querySelector('.hero')
      && getMetadata('breadcrumbs').toLowerCase() !== 'false'
    ) {
      // const breadcrumbs = buildBreadcrumbs();
      // if (breadcrumbs) {
      //   const firstWrapper = main.querySelector('.section > .default-content-wrapper');
      //   if (firstWrapper) {
      //     firstWrapper.prepend(breadcrumbs);
      //   }
      // }
    }

    document.body.classList.add('appear');
    await Promise.all([
      loadSection(main.querySelector('.section'), waitForFirstImage),
      addClientSideMetadata(doc),
    ]);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */

async function loadLazy(doc) {
  autolinkModals(doc);

  // ── Warn on Arrival ──
  // Only import module if warnarrivalmodalpath is set on this page.
  // getMetadata() reads <meta name="warnarrivalmodalpath"> from page <head>.
  // EDS lowercases all metadata keys — key is 'warnarrivalmodalpath'.
  // Avoids unnecessary JS download on pages with no arrival modal configured.
  // .then() — non-blocking, does not delay loadSections/loadHeader/loadFooter.
  const warnArrivalModalPath = getMetadata('warnarrivalmodalpath');
  if (warnArrivalModalPath && !isInUniversalEditor()) {
    import(`${window.hlx.codeBasePath}/scripts/warn-on-arrival/warn-on-arrival.js`)
      .then(({ default: initWarnOnArrival }) => initWarnOnArrival())
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[scripts] Warn on Arrival failed to initialise:', err);
      });
  }

  const main = doc.querySelector('main');
  await loadSections(main);

  if (shouldRunOutsideAuthorEdit()) {
    addGridSectionsWrapper(main);
  }

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  initFooterReturnScrollOnHistoryRestore();
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
