import { div, button, span } from '../../scripts/dom-helpers.js';
import getConfigValue from '../../scripts/configs.js';

const COOKIE_NAME = 'safety-bar-dismissed';
const COOKIE_DAYS = 1;

/**
 * Read a cookie value by name.
 * @param {string} name cookie name
 * @returns {string} cookie value or empty string
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Set a cookie with an expiry in days.
 * @param {string} name cookie name
 * @param {string} value cookie value
 * @param {number} days number of days until expiry
 */
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

/**
 * Check whether the safety bar has been dismissed via cookie.
 * @returns {boolean}
 */
function isDismissed() {
  return getCookie(COOKIE_NAME) === '1';
}

/**
 * Persist dismissal state to cookie.
 */
function setDismissed() {
  setCookie(COOKIE_NAME, '1', COOKIE_DAYS);
}

/**
 * Validate an href value to prevent XSS via javascript: URIs.
 * @param {string} url the URL string to validate
 * @returns {boolean}
 */
function isValidHref(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return /^https?:\/\//.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#');
}

/**
 * Resolve the active indication from authored rows.
 * If the current page path matches a row's path pattern, that indication is active.
 * Falls back to the first indication if none match.
 * @param {Array<{path: string, content: DocumentFragment}>} indications
 * @returns {{path: string, content: DocumentFragment}|null}
 */
function resolveActiveIndication(indications) {
  if (!indications.length) return null;

  const currentPath = window.location.pathname.toLowerCase();

  const matched = indications.find(({ path }) => {
    if (!path) return false;
    const pattern = path.toLowerCase().trim();
    if (pattern === '*' || pattern === '/') return true;
    return currentPath.startsWith(pattern);
  });

  return matched || indications[0];
}

/**
 * Build the expand/collapse toggle button.
 * @param {boolean} expanded initial expanded state
 * @returns {HTMLButtonElement}
 */
function buildToggleButton(expanded) {
  const btn = button(
    {
      class: 'safety-bar-toggle',
      'aria-expanded': String(expanded),
      'aria-label': expanded ? 'Collapse safety information' : 'Expand safety information',
      type: 'button',
    },
    span({ class: 'safety-bar-toggle-icon' }),
  );
  return btn;
}

/**
 * Build the dismiss/close button.
 * @returns {HTMLButtonElement}
 */
function buildDismissButton() {
  return button(
    {
      class: 'safety-bar-dismiss',
      'aria-label': 'Dismiss safety information',
      type: 'button',
    },
    span({ class: 'safety-bar-dismiss-icon' }, '×'),
  );
}

/**
 * Extract indications from authored block rows.
 * Each row represents one indication with columns: [path-pattern, content].
 * Single-column rows are treated as content with a wildcard path.
 * @param {Element} block
 * @returns {Array<{path: string, content: Element}>}
 */
function extractIndications(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const indications = [];

  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length >= 2) {
      const pathCol = cols[0];
      const contentCol = cols[1];
      const path = pathCol.textContent?.trim() || '*';
      indications.push({ path, content: contentCol });
    } else if (cols.length === 1) {
      indications.push({ path: '*', content: cols[0] });
    }
  });

  return indications;
}

/**
 * Apply link validation to all anchors in a container.
 * @param {Element} container
 */
function validateLinks(container) {
  container.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!isValidHref(href)) {
      link.removeAttribute('href');
      link.setAttribute('role', 'link');
      link.setAttribute('aria-disabled', 'true');
    }
  });
}

/**
 * Decorate the safety-bar block.
 * @param {Element} block the block element
 */
export default async function decorate(block) {
  if (block.querySelector('.safety-bar-inner')) return;

  if (isDismissed()) {
    block.classList.add('safety-bar-hidden');
    return;
  }

  const indications = extractIndications(block);
  const active = resolveActiveIndication(indications);

  if (!active) {
    block.classList.add('safety-bar-hidden');
    return;
  }

  const isExpandable = block.classList.contains('expandable');
  const startExpanded = block.classList.contains('expanded');
  const isDismissable = block.classList.contains('dismissable');

  let configExpanded = startExpanded;
  try {
    const configVal = await getConfigValue('safety-bar-expanded');
    if (configVal === 'true') configExpanded = true;
    else if (configVal === 'false') configExpanded = false;
  } catch {
    // config not available — use authored variant
  }

  const expanded = isExpandable ? configExpanded : true;

  // Build content container
  const contentEl = div({ class: 'safety-bar-content' });
  contentEl.append(...active.content.childNodes);
  validateLinks(contentEl);

  // Build inner wrapper
  const inner = div({ class: 'safety-bar-inner' });

  if (isExpandable) {
    const toggleBtn = buildToggleButton(expanded);
    inner.append(toggleBtn);

    if (!expanded) {
      contentEl.setAttribute('aria-hidden', 'true');
      block.classList.add('safety-bar-collapsed');
    }

    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !isExpanded;

      toggleBtn.setAttribute('aria-expanded', String(nextExpanded));
      toggleBtn.setAttribute(
        'aria-label',
        nextExpanded ? 'Collapse safety information' : 'Expand safety information',
      );

      if (nextExpanded) {
        contentEl.removeAttribute('aria-hidden');
        block.classList.remove('safety-bar-collapsed');
      } else {
        contentEl.setAttribute('aria-hidden', 'true');
        block.classList.add('safety-bar-collapsed');
      }
    });
  }

  inner.append(contentEl);

  if (isDismissable) {
    const dismissBtn = buildDismissButton();
    inner.append(dismissBtn);

    dismissBtn.addEventListener('click', () => {
      setDismissed();
      block.classList.add('safety-bar-hidden');
      block.setAttribute('aria-hidden', 'true');
    });
  }

  block.textContent = '';
  block.append(inner);
  block.setAttribute('role', 'complementary');
  block.setAttribute('aria-label', 'Important safety information');
}
