/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AbbVie site cleanup.
 * Selectors from captured DOM of https://www.abbvie.com/science.html
 *
 * Removes non-authorable content: header/nav experience fragment, footer experience fragment,
 * accordion navigation panels (not FAQ accordion), cookie/consent overlays, sticky nav,
 * noscript, link, and iframe elements.
 *
 */
const H = { before: 'beforeTransform', after: 'afterTransform' };

// Alt-text → Scene7 URL mapping for images that the browser converts to blob: URLs.
// AbbVie's JS loads Scene7 images via createObjectURL, stripping data-cmp-src before
// the transformer runs. This lookup resolves blob URLs by matching the img alt attribute.
// Derived from migration-work/cleaned.html (source-of-truth for original URLs).
const SCENE7_ALT_MAP = {
  'Microscope image of cells': 'https://abbvie.scene7.com/is/image/abbviecorp/science-oncology',
  'the persistence lab story image': 'https://abbvie.scene7.com/is/image/abbviecorp/the-persistence-lab-story-image',
  'One Minute Thesis logo -  video': 'https://abbvie.scene7.com/is/image/abbviecorp/one-minute-thesis-thumbnail-1',
  'One Minute Thesis logo - video': 'https://abbvie.scene7.com/is/image/abbviecorp/one-minute-thesis-thumbnail-1',
  'lab of the future thumbnail': 'https://abbvie.scene7.com/is/image/abbviecorp/lab-of-the-future-thumbnail-1',
  'discovery files thumbnail': 'https://abbvie.scene7.com/is/image/abbviecorp/discovery-files-thumbnail-1',
  'Cambridge Scientists': 'https://abbvie.scene7.com/is/image/abbviecorp/Cambridge%20Scientists',
  'AbbVie logo': 'https://abbvie.scene7.com/is/content/abbviecorp/abbvie-logo-header',
  'none': 'https://abbvie.scene7.com/is/image/abbviecorp/Cambridge%20Scientists',
};

export default function transform(hookName, element, payload) {
  if (hookName === H.before) {
    // Remove cookie consent / OneTrust overlays (from captured DOM: .ot-pc-footer, #onetrust-*)
    WebImporter.DOMUtils.remove(element, [
      '[id^="onetrust"]',
      '.ot-pc-footer',
      '[class*="cookie"]',
      '[class*="consent"]',
      '[class*="ot-sdk"]',
      '[class*="optanon"]',
      '[aria-label="Cookie banner"]',
      '[aria-label="Privacy Preference Center"]',
    ]);
    // OneTrust banner content detected by text signature — the cookie dialog DOM may
    // not have id/class attributes after JS renders it into the page
    element.querySelectorAll('div, section, aside').forEach((el) => {
      const text = el.textContent || '';
      if ((text.includes('Privacy Preference Center') && text.includes('Manage Cookie Settings')) ||
          (text.includes('Powered by Onetrust') || text.includes('Powered by OneTrust')) ||
          (text.includes('cookielaw.org'))) {
        el.remove();
      }
    });
    // Remove the cookie consent banner paragraph (long privacy text with "Cookie Settings")
    element.querySelectorAll('p').forEach((p) => {
      const text = p.textContent || '';
      if (text.includes('online tracking technologies such as cookies') ||
          text.includes('cookie-based personal data for online targeted advertising')) {
        // Remove the entire parent container (banner wrapper), not just the paragraph
        const parent = p.parentElement;
        if (parent && parent !== element) {
          parent.remove();
        } else {
          p.remove();
        }
      }
    });

    // Remove navigation accordion panels that are NOT the FAQ accordion
    // From captured DOM: accordion-5a41404cb9 and accordion-e3c9cd55f0 are nav accordions
    // accordion-c31e57db88 is the FAQ accordion (keep it)
    const navAccordions = element.querySelectorAll(
      '.accordion.panelcontainer.cmp-accordion-xx-large.show-tabs-desktop',
    );
    navAccordions.forEach((acc) => acc.remove());

    // Extract teaser component as structured paragraphs for the "At a Glance" section.
    // CSS expects: p1=pretitle (uppercase), p2=title with <em> for blue accent, p3=description
    // Styled via main > .section.navy-overlap + .section
    const teaser = element.querySelector('.teaser.light-theme');
    if (teaser) {
      const document = element.ownerDocument;
      const frag = document.createDocumentFragment();

      // Pretitle: "AbbVie Science"
      const pretitleEl = teaser.querySelector('.cmp-teaser__pretitle');
      if (pretitleEl) {
        const p = document.createElement('p');
        p.textContent = pretitleEl.textContent.trim();
        frag.appendChild(p);
      }

      // Title: "At a glance: <em>R&D highlights</em>"
      // Source DOM has <p>At a glance:<br><span>R&D highlights</span></p>
      const titleEl = teaser.querySelector('.cmp-teaser__title');
      if (titleEl) {
        const p = document.createElement('p');
        const sourceP = titleEl.querySelector('p');
        if (sourceP) {
          for (const node of Array.from(sourceP.childNodes)) {
            if (node.nodeType === 3) {
              // Text node — preserve (e.g. "At a glance:")
              const text = node.textContent.replace(/\s+/g, ' ');
              if (text.trim()) p.appendChild(document.createTextNode(text));
            } else if (node.tagName === 'BR') {
              p.appendChild(document.createElement('br'));
            } else if (node.tagName === 'SPAN') {
              // Wrap span content in <em> for blue accent color
              const em = document.createElement('em');
              em.textContent = node.textContent.trim();
              p.appendChild(em);
            }
          }
        }
        frag.appendChild(p);
      }

      // Description paragraph
      const descEl = teaser.querySelector('.cmp-teaser__description');
      if (descEl) {
        const descP = descEl.querySelector('p');
        if (descP) {
          frag.appendChild(descP);
        }
      }

      teaser.replaceWith(frag);
    }

    // Resolve lazy-loaded Scene7 images: copy data-cmp-src → src
    // AbbVie uses data-cmp-src for deferred loading; during headless import
    // these images have no src attribute and would be lost.
    element.querySelectorAll('img[data-cmp-src]').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const lazySrc = img.getAttribute('data-cmp-src') || '';
      if (lazySrc && (!src || src.startsWith('data:'))) {
        img.setAttribute('src', lazySrc);
      }
    });
    // Also resolve data-cmp-src on .cmp-image containers (AbbVie stores
    // Scene7 URL on the wrapper div, not the img itself in some patterns)
    element.querySelectorAll('.cmp-image[data-cmp-src]').forEach((cmpImage) => {
      const lazySrc = cmpImage.getAttribute('data-cmp-src') || '';
      if (!lazySrc) return;
      const document = element.ownerDocument;
      let img = cmpImage.querySelector('img');
      if (img) {
        const src = img.getAttribute('src') || '';
        if (!src || src.startsWith('data:')) {
          img.setAttribute('src', lazySrc);
        }
      } else {
        img = document.createElement('img');
        img.setAttribute('src', lazySrc);
        img.setAttribute('alt', cmpImage.getAttribute('data-asset-name') || cmpImage.getAttribute('title') || '');
        cmpImage.appendChild(img);
      }
    });

    // Strip zero-width characters from all text nodes (U+200B, U+200C, U+200D, U+FEFF)
    // Source CMS content may contain invisible Unicode characters that break rendering
    const treeWalker = element.ownerDocument.createTreeWalker(element, 4 /* NodeFilter.SHOW_TEXT */);
    let textNode;
    while ((textNode = treeWalker.nextNode())) {
      const cleaned = textNode.textContent.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
      if (cleaned !== textNode.textContent) {
        textNode.textContent = cleaned;
      }
    }

    // Strip data-cmp-data-layer attributes early (before parsers can preserve them)
    // These contain unescaped HTML (<p> tags, bare &) that cause XML serialization failures
    element.querySelectorAll('[data-cmp-data-layer]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
    });

    // Brightcove video preservation (Rule 2 + Rule 4):
    //  - Keep data-account / data-video-id / data-player attributes intact on
    //    <video-js> or legacy .cmp-video__player wrappers.
    //  - Stash overlay title, description, "Watch X:XX" CTA label and play
    //    button aria-label on the video wrapper as data-overlay-*
    //    attributes so brightcove-video.js can find them after surrounding
    //    DOM is collapsed by section transforms.
    element.querySelectorAll('.cmp-video, .video.cmp-video-full-width').forEach((wrapper) => {
      const document = element.ownerDocument;

      // Locate the actual player element so the parser can read IDs from it.
      const player = wrapper.matches('video-js, [data-account], [data-account-id]')
        ? wrapper
        : (wrapper.querySelector('video-js, [data-account], [data-account-id], [data-video-id]') || wrapper);

      // Overlay title — adjacent .cmp-title above the player wrapper
      if (!player.getAttribute('data-overlay-title')) {
        const titleEl = wrapper.querySelector('.cmp-video__overlay-title, .cmp-video__title')
          || wrapper.previousElementSibling?.querySelector?.('h1, h2, h3, h4, h5, h6')
          || wrapper.parentElement?.querySelector?.(':scope > .cmp-title h1, :scope > .cmp-title h2, :scope > .cmp-title h3, :scope > .cmp-title h4, :scope > .cmp-title h5');
        const title = (titleEl?.textContent || '').trim();
        if (title) player.setAttribute('data-overlay-title', title);
      }

      // Overlay description — adjacent .cmp-text near the player wrapper
      if (!player.getAttribute('data-overlay-desc')) {
        const descEl = wrapper.querySelector('.cmp-video__overlay-description, .cmp-video__subtitle')
          || wrapper.parentElement?.querySelector?.(':scope > .cmp-text p');
        const desc = (descEl?.textContent || '').trim();
        if (desc) player.setAttribute('data-overlay-desc', desc);
      }

      // "Watch X:XX" CTA label — sibling .cmp-video__cta-text / button
      if (!player.getAttribute('data-watch-label')) {
        const ctaEl = wrapper.querySelector('.cmp-video__cta-text, .cmp-video__watch-label, .cmp-button__text')
          || wrapper.parentElement?.querySelector?.(':scope > .cmp-button .cmp-button__text');
        const label = (ctaEl?.textContent || '').trim();
        if (label && /^watch\b/i.test(label)) player.setAttribute('data-watch-label', label);
      }

      // Strip Brightcove player chrome that would otherwise be cloned into the
      // block table (modal dialogs, control bar, captions overlay).
      wrapper.querySelectorAll('.vjs-modal-dialog, .vjs-control-bar, .vjs-text-track-display, .vjs-poster, .vjs-loading-spinner').forEach((el) => el.remove());
    });

    // Strip query parameters from Scene7 image URLs
    // ts (cache buster) and dpr (device pixel ratio) are rendering hints not needed
    element.querySelectorAll('img[src*="scene7.com"]').forEach((img) => {
      const src = img.getAttribute('src') || '';
      try {
        const u = new URL(src);
        if (u.search) {
          img.setAttribute('src', u.origin + u.pathname);
        }
      } catch (e) { /* ignore invalid URLs */ }
    });

    // Replace blob: URLs — AbbVie's JS converts Scene7 images to blob: via createObjectURL
    // Strategy: 1) check data-cmp-src on img, 2) check ancestor .cmp-image, 3) alt-text lookup,
    // 4) generate Scene7 URL from alt text (kebab-case conversion)
    element.querySelectorAll('img[src^="blob:"]').forEach((img) => {
      let resolved = img.getAttribute('data-cmp-src') || img.getAttribute('data-src') || '';
      // Check ancestor .cmp-image container for data-cmp-src
      if (!resolved) {
        let parent = img.parentElement;
        while (parent && parent !== element) {
          resolved = parent.getAttribute('data-cmp-src') || '';
          if (resolved) break;
          parent = parent.parentElement;
        }
      }
      // Fallback: alt-text → Scene7 URL mapping (known images)
      if (!resolved) {
        const alt = (img.getAttribute('alt') || '').trim();
        resolved = SCENE7_ALT_MAP[alt] || '';
      }
      // Final fallback: generate Scene7 URL from alt text
      // AbbVie stores images at abbvie.scene7.com/is/image/abbviecorp/<slug>
      if (!resolved) {
        const alt = (img.getAttribute('alt') || '').trim();
        if (alt && alt !== 'none' && alt !== 'Alternative Text') {
          const slug = alt.toLowerCase()
            .replace(/['']/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          if (slug.length > 2) {
            resolved = `https://abbvie.scene7.com/is/image/abbviecorp/${slug}`;
          }
        }
      }
      if (resolved) {
        img.setAttribute('src', resolved);
      } else {
        // Remove images we truly can't resolve (decorative/broken)
        img.remove();
      }
    });
    // Also fix blob: URLs in link hrefs (video links)
    element.querySelectorAll('a[href^="blob:"]').forEach((a) => {
      a.removeAttribute('href');
    });

    // Move container background images to END of their container
    // so they appear AFTER the cards table (not between text and cards)
    element.querySelectorAll('img.cmp-container__bg-image').forEach((img) => {
      const container = img.parentElement;
      if (container && container !== element) {
        container.appendChild(img);
      }
    });

    // Preserve "PRIORITIES" label from .cmp-header__text before removing tab headers.
    // The Core Focus Areas section has a .cmp-header__text with "PRIORITIES" that should
    // become a styled paragraph, not be discarded with navigation tab headers.
    element.querySelectorAll('.cmp-header__text').forEach((el) => {
      const text = el.textContent.trim().toUpperCase();
      if (text === 'PRIORITIES') {
        const document = element.ownerDocument;
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = text;
        p.appendChild(strong);
        el.replaceWith(p);
      } else {
        el.remove();
      }
    });

    // Remove "No results found" / "Change your search criteria" search result placeholders.
    // AbbVie uses .list-results-none divs, <span class="empty-results-title">,
    // <span class="empty-results-quote">, and plain <p> elements containing this text
    // (often combined as "No results found<br>Change your search criteria.")
    element.querySelectorAll('.list-results-none').forEach((el) => el.remove());
    // Broad sweep: find ANY element whose textContent matches (regardless of child count)
    element.querySelectorAll('p, span, div').forEach((el) => {
      const txt = el.textContent.trim().replace(/\s+/g, ' ');
      if (/^No results found/.test(txt) || /^Change your search criteria/.test(txt) ||
          txt === 'No results found Change your search criteria.') {
        el.remove();
      }
    });

    // Extract CTA section from footer BEFORE parsers run
    // (parsers replace .footer-overlap with a columns table, making it unfindable later)
    const footerFrag = element.querySelector('.cmp-experiencefragment--footer');
    if (footerFrag) {
      const ctaSection = footerFrag.querySelector('.container.cmp-container-full-width.footer-overlap');
      if (ctaSection) {
        footerFrag.parentNode.insertBefore(ctaSection, footerFrag);
      }
    }
  }

  if (hookName === H.after) {
    // Remove header experience fragment (from captured DOM: .cmp-experiencefragment--header)
    // and sticky nav wrapper
    WebImporter.DOMUtils.remove(element, [
      '.cmp-experiencefragment--header',
      '.experiencefragment.sticky-nav',
      'header.nav-bar',
    ]);

    // Remove footer experience fragment (from captured DOM: .cmp-experiencefragment--footer)
    // CTA section (.footer-overlap) was already extracted in beforeTransform
    const footerFrag = element.querySelector('.cmp-experiencefragment--footer');
    if (footerFrag) {
      footerFrag.remove();
    }

    // Remove remaining non-authorable elements
    WebImporter.DOMUtils.remove(element, [
      'noscript',
      'link',
      'iframe',
      '.list-footer-primary',
      '.list-footer-legal',
    ]);

    // Remove popup/modal dialogs (warn-on-departure, disclaimer modals)
    element.querySelectorAll('.popup-overlay, [class*="popup"], [class*="modal"]').forEach((el) => {
      // Keep actual content modals if present, only remove departure warnings
      const text = el.textContent || '';
      if (text.includes('leave the AbbVie website') || text.includes('You are about to leave')) {
        el.remove();
      }
    });

    // Remove tracking pixels (1x1 images from analytics services)
    element.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      if (src.includes('analytics.twitter.com') ||
          src.includes('t.co/i/adsct') ||
          src.includes('siteimproveanalytics') ||
          src.includes('google.com/pagead') ||
          src.includes('alb.reddit.com') ||
          src.includes('bing.com/c.gif') ||
          src.includes('metrics.brightcove.com')) {
        img.remove();
      }
    });

    // Remove Brightcove video player chrome (captions settings, modal dialogs etc.)
    element.querySelectorAll('.vjs-modal-dialog, .vjs-control-bar, .vjs-text-track-display').forEach((el) => el.remove());

    // Post-parse cleanup: remove "No results found" artifacts that survived into block tables
    // Parsers copy column content wholesale, including AEM search placeholder text
    element.querySelectorAll('p, span, div').forEach((el) => {
      const txt = el.textContent.trim().replace(/\s+/g, ' ');
      if (/^No results found/.test(txt) || /^Change your search criteria/.test(txt) ||
          txt === 'No results found Change your search criteria.') {
        el.remove();
      }
    });

    // Post-parse cleanup: remove cookie consent content that survived into output
    element.querySelectorAll('h2, h3, h4, h5, p, div').forEach((el) => {
      const txt = el.textContent.trim();
      if (txt === 'Privacy Preference Center' || txt === 'Manage Cookie Settings' ||
          txt === 'Required Cookies' || txt === 'Functional Cookies' ||
          txt === 'Advertising Cookies' || txt === 'Cookies Settings' ||
          txt === 'Anonymous Performance Cookies' || txt === 'Vendors List' ||
          txt === 'Confirm My Choices' || txt === 'Allow All' ||
          /^\[x?\]\s*(Functional|Advertising)\s*Cookies/.test(txt) ||
          /^\[.*\]\s*(checkbox|Switch)\s*label/i.test(txt) ||
          txt === 'View Vendor Details‎' || txt === 'View Vendor Details‎' ||
          txt === 'Apply Cancel' || txt === 'Search… Clear' ||
          txt === 'Consent Leg.Interest' || txt === 'Always Active') {
        el.remove();
      }
    });
    // Remove OneTrust logo/link
    element.querySelectorAll('a[href*="onetrust.com"], img[src*="cookielaw.org"], img[alt*="Onetrust"], img[alt*="OneTrust"]').forEach((el) => {
      const parent = el.closest('p') || el.parentElement;
      if (parent && parent !== element) parent.remove();
      else el.remove();
    });
    // Remove cookie privacy paragraph (long text about tracking technologies)
    element.querySelectorAll('p').forEach((p) => {
      const txt = p.textContent || '';
      if (txt.includes('online tracking technologies such as cookies') ||
          txt.includes('cookie-based personal data for online targeted advertising') ||
          (txt.includes('cookies') && txt.includes('Privacy Notice') && txt.length > 500)) {
        p.remove();
      }
    });
    // Remove "No, I disagree" / "Yes, I agree" cookie banner buttons
    element.querySelectorAll('p').forEach((p) => {
      const txt = p.textContent.trim();
      if (txt === 'No, I disagree' || txt === 'Yes, I agree') {
        p.remove();
      }
    });

    // Post-parse cleanup: remove remaining blob: URL images
    element.querySelectorAll('img[src^="blob:"]').forEach((img) => {
      const alt = (img.getAttribute('alt') || '').trim();
      if (alt && alt !== 'none' && alt !== 'Alternative Text') {
        const slug = alt.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (slug.length > 2) {
          img.setAttribute('src', `https://abbvie.scene7.com/is/image/abbviecorp/${slug}`);
        } else {
          img.remove();
        }
      } else {
        img.remove();
      }
    });

    // Clean data attributes (preserving analytics per CLAUDE.md Rule 4)
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('onload');
    });
  }
}
