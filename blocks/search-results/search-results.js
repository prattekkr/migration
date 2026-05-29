/* eslint-disable no-nested-ternary */
/**
 * Search Results Block — NW-1842
 * Coveo edge-worker–powered search results with sorting, pagination, and WCAG AA accessibility.
 *
 * EDS config sheet key consumed:
 *   coveo-worker-url  → Edge worker base URL
 *                       e.g. https://coveo-search-dev.abbvie-sandbox-309.workers.dev
 *
 * siteKey and locale are derived from the page at runtime (standard EDS pattern):
 *   siteKey → page metadata <meta name="site-key"> authored in the page,
 *             falls back to path-based derivation (e.g. /be/fr/ → abbvie-be)
 *   locale  → <html lang> attribute set by EDS (e.g. be-fr, us-en)
 *
 * URL params managed:
 *   q             → search query
 *   firstResult   → pagination offset (0-based)
 *   sortCriteria  → 'relevancy' | 'date descending'
 */

import { getMetadata } from '../../scripts/aem.js';
import { getConfigValue } from '../../scripts/config.js';

// Config values are read via getConfigValue() from scripts/config.js

// ---------------------------------------------------------------------------
// Site context  (standard EDS/AEM pattern)
// ---------------------------------------------------------------------------

/**
 * Resolve siteKey and locale using the standard EDS approach:
 *
 * siteKey — in priority order:
 *   1. <meta name="site-key"> (authored per-page or via bulk metadata)
 *   2. Path-derived: first path segment maps to a site key
 *      e.g. /be/fr/... → "abbvie-be"  |  /us/en/... → "abbvie-us"
 *
 * locale — in priority order:
 *   1. <html lang> — set by EDS scripts/aem.js from page metadata
 *   2. Path-derived from first two segments: /be/fr/ → "be-fr"
 *   3. Fallback "en"
 *
 * This keeps site context out of the config sheet and makes the block
 * work across all regional sites automatically without extra authoring.
 */
function getSiteContext() {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);

  // Detect AEM content path vs clean EDS delivery path.
  // AEM: /content/abbvie-nextgen-eds/corporate/abbvie-com/us/en/...
  // EDS: /us/en/...  or  /be/fr/...
  let country = '';
  let lang = '';
  const aemIdx = pathSegments.indexOf('abbvie-com');
  if (aemIdx !== -1 && pathSegments[aemIdx + 1]) {
    country = pathSegments[aemIdx + 1];
    lang = pathSegments[aemIdx + 2] ?? '';
  } else {
    [country = '', lang = ''] = pathSegments;
  }

  // siteKey — priority order:
  //   1. <meta name="site-key">  (authored in page metadata sheet)
  //   2. <meta name="country">   (already present in this project's meta tags)
  //   3. derived from path
  const metaSiteKey = getMetadata('site-key');
  const metaCountry = getMetadata('country');
  const derivedSiteKey = metaCountry || country ? `abbvie-${metaCountry || country}` : '';
  const siteKey = metaSiteKey || derivedSiteKey;

  // locale must be country-lang format e.g. us-en, be-fr
  const htmlLang = document.documentElement.lang;
  const metaLang = getMetadata('language');
  const resolvedCountry = getMetadata('country') || country;
  const pathLocale = country && lang ? `${country}-${lang}` : '';

  // Only accept htmlLang if it already has the correct xx-xx shape
  const isValidLocale = (v) => /^[a-z]{2}-[a-z]{2}$/i.test(v);

  let locale;
  if (isValidLocale(htmlLang)) {
    locale = htmlLang;
  } else if (metaLang && resolvedCountry) {
    // e.g. country=us + language=en → us-en
    locale = metaLang.includes('-')
      ? metaLang
      : `${resolvedCountry}-${metaLang}`;
  } else {
    locale = pathLocale || 'us-en';
  }

  return { siteKey, locale };
}

// ---------------------------------------------------------------------------
// Block authored-field parser
// ---------------------------------------------------------------------------

/**
 * Parse fields authored in the EDS table DOM into a config object.
 *
 * Supports two authoring formats:
 *
 * 1. Key-value (two cells per row) — standard EDS dialog authoring:
 *    | aboutnresultslabel | About {n} Results |
 *
 * 2. Positional (one cell per row) — Xwalk / plain HTML authoring:
 *    Row 0  → aboutResultsLabel
 *    Row 1  → nextLabel
 *    Row 2  → previousLabel
 *    Row 3  → noResultsLabel
 *    Row 4  → sortByLabel
 *    Row 5  → relevanceLabel
 *    Row 6  → dateLabel
 *    Row 7  → numberOfResults
 *    Row 8  → paginationLimit
 *    Row 9  → id
 *    Row 10 → customClass
 *    Row 11 → analyticsInteractionId
 */
function parseBlockConfig(block) {
  const cfg = {
    id: '',
    customClass: '',
    aboutResultsLabel: 'About {n} Results',
    nextLabel: 'Next',
    previousLabel: 'Previous',
    noResultsLabel: 'No Results',
    sortByLabel: 'Sort By',
    relevanceLabel: 'Relevance',
    dateLabel: 'Date',
    numberOfResults: 10,
    paginationLimit: 7,
    language: 'en',
    analyticsInteractionId: '',
  };

  const rows = [...block.querySelectorAll(':scope > div')];

  // Auto-detect format: two cells = key-value, one cell = positional
  const isKeyValue = rows.some(
    (row) => row.querySelectorAll(':scope > div').length >= 2,
  );

  if (isKeyValue) {
    rows.forEach((row) => {
      const cells = [...row.querySelectorAll(':scope > div')];
      if (cells.length < 2) return;
      const key = cells[0].textContent
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const val = cells[1].textContent.trim();
      switch (key) {
        case 'id':
          cfg.id = val;
          break;
        case 'customclass':
          cfg.customClass = val;
          break;
        case 'aboutnresultslabel':
          cfg.aboutResultsLabel = val;
          break;
        case 'nextlabel':
          cfg.nextLabel = val;
          break;
        case 'previouslabel':
          cfg.previousLabel = val;
          break;
        case 'noresultslabel':
          cfg.noResultsLabel = val;
          break;
        case 'sortbylabel':
          cfg.sortByLabel = val;
          break;
        case 'relevancelabel':
          cfg.relevanceLabel = val;
          break;
        case 'datelabel':
          cfg.dateLabel = val;
          break;
        case 'numberofitemsperpage':
          cfg.numberOfResults = parseInt(val, 10) || 10;
          break;
        case 'paginationlimit':
          cfg.paginationLimit = parseInt(val, 10) || 7;
          break;
        case 'language':
          cfg.language = val;
          break;
        case 'analyticsinteractionid':
          cfg.analyticsInteractionId = val;
          break;
        default:
          break;
      }
    });
  } else {
    // Positional: one value per row, order matches _search-results.json fields
    const val = (idx) => rows[idx]?.querySelector(':scope > div')?.textContent?.trim() ?? '';
    if (val(0)) cfg.aboutResultsLabel = val(0);
    if (val(1)) cfg.nextLabel = val(1);
    if (val(2)) cfg.previousLabel = val(2);
    if (val(3)) cfg.noResultsLabel = val(3);
    if (val(4)) cfg.sortByLabel = val(4);
    if (val(5)) cfg.relevanceLabel = val(5);
    if (val(6)) cfg.dateLabel = val(6);
    if (val(7)) cfg.numberOfResults = parseInt(val(7), 10) || 10;
    if (val(8)) cfg.paginationLimit = parseInt(val(8), 10) || 7;
    if (val(9)) cfg.id = val(9);
    if (val(10)) cfg.customClass = val(10);
    if (val(11)) cfg.analyticsInteractionId = val(11);
  }

  return cfg;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** Read the three managed URL params as a plain object. */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('q') ?? '',
    firstResult: parseInt(params.get('firstResult') ?? '0', 10),
    sortCriteria: params.get('sortCriteria') ?? 'relevancy',
  };
}

/** Push URL updates without a page reload. */
function updateUrl(updates) {
  const params = new URLSearchParams(window.location.search);
  Object.entries(updates).forEach(([k, v]) => {
    if (v !== null && v !== undefined) params.set(k, String(v));
    else params.delete(k);
  });
  window.history.pushState(
    {},
    '',
    `${window.location.pathname}?${params.toString()}`,
  );
}

// ---------------------------------------------------------------------------
// Edge-worker API call
// ---------------------------------------------------------------------------

/**
 * Call the Coveo edge worker.
 *
 * Edge worker URL pattern (from ticket examples):
 *   <workerBase>/?siteKey=<siteKey>&locale=<locale>&q=<q>
 *                &numberOfResults=<n>&firstResult=<f>&sortCriteria=<s>
 *
 * The worker proxies to Coveo and handles auth server-side, so no
 * Authorization header is sent from the browser (no key in client code).
 */
async function fetchSearchResults({
  workerUrl,
  siteKey,
  locale,
  q,
  firstResult,
  numberOfResults,
  sortCriteria,
}) {
  const url = new URL(workerUrl);
  url.searchParams.set('siteKey', siteKey);
  url.searchParams.set('locale', locale);
  url.searchParams.set('q', q);
  url.searchParams.set('numberOfResults', String(numberOfResults));
  url.searchParams.set('firstResult', String(firstResult));
  url.searchParams.set('sortCriteria', sortCriteria);

  const resp = await fetch(url.toString()); // GET, no sensitive headers

  if (!resp.ok) {
    throw new Error(`Search API error: ${resp.status} ${resp.statusText}`);
  }

  return resp.json();
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/** HTML-escape a value (XSS prevention). */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build the results-count label.
 * Replaces {n} with the count and handles singular form.
 * Works regardless of the authored label language as long as {n} token is present.
 */
function buildResultsCountLabel(template, count) {
  const label = template.replace('{n}', count.toLocaleString());
  if (count === 1) {
    return label
      .replace(/\bResults\b/, 'Result')
      .replace(/\bresults\b/, 'result');
  }
  return label;
}

/**
 * Build the windowed array of page numbers centred on the current page.
 * Returns [] when there is only one page (no pagination needed).
 */
function buildPageNumbers(currentPage, totalPages, limit) {
  if (totalPages <= 1) return [];
  const half = Math.floor(limit / 2);
  let start = Math.max(1, currentPage - half);
  const end = Math.min(totalPages, start + limit - 1);
  if (end - start + 1 < limit) start = Math.max(1, end - limit + 1);
  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

/** Render one search-result row. */
function renderResultItem(item, analyticsId) {
  const href = encodeURI(item.clickUri || item.uri || '');
  const title = escapeHtml(item.title || '');
  const url = escapeHtml(item.clickUri || item.uri || '');
  return `
    <div class="search-results__item" role="article">
      <a class="search-results__title"
         href="${href}"
         data-analytics-id="${escapeHtml(analyticsId)}"
         aria-label="${title}">
        ${title}
      </a>
      <span class="search-results__url" aria-label="URL: ${url}">
        ${url}
      </span>
      <hr class="search-results__divider" aria-hidden="true" />
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Main render  (replaces block innerHTML on every state change)
// ---------------------------------------------------------------------------

function renderBlock(container, state, cfg) {
  const {
    totalCount,
    results,
    firstResult,
    numberOfResults,
    sortCriteria,
    loading,
    error,
  } = state;

  const {
    aboutResultsLabel,
    noResultsLabel,
    sortByLabel,
    relevanceLabel,
    dateLabel,
    nextLabel,
    previousLabel,
    paginationLimit,
  } = cfg;

  const currentPage = Math.floor(firstResult / numberOfResults) + 1;
  const totalPages = Math.ceil(totalCount / numberOfResults);
  const pageNumbers = buildPageNumbers(
    currentPage,
    totalPages,
    paginationLimit,
  );
  const isFirstPage = firstResult === 0;
  const isLastPage = firstResult + numberOfResults >= totalCount;

  // Stable IDs (scoped to block instance)
  const uid = cfg.id || 'sr';
  const relevanceSortId = `sort-relevance-${uid}`;
  const dateSortId = `sort-date-${uid}`;
  const sortDropdownId = `sort-dropdown-${uid}`;
  const liveRegionId = `sr-live-${uid}`;

  const sortLabel = sortCriteria === 'relevancy'
    ? relevanceLabel.toUpperCase()
    : dateLabel.toUpperCase();

  // Live-region announcement text (empty while loading so it fires after)
  const liveText = loading
    ? ''
    : totalCount > 0
      ? buildResultsCountLabel(aboutResultsLabel, totalCount)
      : noResultsLabel;

  container.innerHTML = `
    <!-- Screen-reader live region -->
    <div id="${liveRegionId}"
         class="search-results__live-region"
         aria-live="polite"
         aria-atomic="true"
         aria-label="${escapeHtml(liveText)}">
      ${escapeHtml(liveText)}
    </div>

    ${
  loading
    ? `
      <div class="search-results__loading" role="status" aria-label="Loading search results">
        <span class="search-results__loading-spinner" aria-hidden="true"></span>
        <span>Loading results…</span>
      </div>
    `
    : ''
}

    ${
  error
    ? `
      <div class="search-results__error" role="alert">
        ${escapeHtml(error)}
      </div>
    `
    : ''
}

    ${
  !loading && !error
    ? `

      ${
  totalCount > 0
    ? `

        <!-- Meta bar: count + sort -->
        <div class="search-results__meta">
          <span class="search-results__count" aria-live="polite">
            ${buildResultsCountLabel(aboutResultsLabel, totalCount)}
          </span>

          <div class="search-results__sort" role="group" aria-label="${escapeHtml(sortByLabel)}">
            <span class="search-results__sort-label" id="${sortDropdownId}-label">
              ${escapeHtml(sortByLabel)}:
            </span>
            <div class="search-results__sort-dropdown"
                 id="${sortDropdownId}"
                 aria-labelledby="${sortDropdownId}-label"
                 tabindex="0">
              <button class="search-results__sort-current"
                      aria-haspopup="listbox"
                      aria-expanded="false"
                      aria-controls="${sortDropdownId}-options"
                      type="button">
                <span>${escapeHtml(sortLabel)}</span>
              </button>
              <ul class="search-results__sort-options"
                  id="${sortDropdownId}-options"
                  role="listbox"
                  aria-label="${escapeHtml(sortByLabel)}"
                  hidden>
                <li role="option"
                    id="${dateSortId}"
                    aria-selected="${sortCriteria === 'date descending'}"
                    data-sort="date descending"
                    tabindex="-1">
                  ${escapeHtml(dateLabel.toUpperCase())}
                </li>
                <li role="option"
                    id="${relevanceSortId}"
                    aria-selected="${sortCriteria === 'relevancy'}"
                    data-sort="relevancy"
                    tabindex="-1">
                  ${escapeHtml(relevanceLabel.toUpperCase())}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Results list -->
        <div class="search-results__list" role="list" aria-label="Search results">
          ${results.map((item) => renderResultItem(item, cfg.analyticsInteractionId)).join('')}
        </div>

        <!-- Pagination -->
        ${
  totalPages > 1
    ? `
          <nav class="search-results__pagination"
               aria-label="Search results pagination"
               role="navigation">

            ${
  !isFirstPage
    ? `
              <button class="search-results__page-btn search-results__page-btn--prev"
                      data-page="prev"
                      type="button"
                      aria-label="${escapeHtml(previousLabel)}">
                ${escapeHtml(previousLabel)}
              </button>
            `
    : ''
}

            <ol class="search-results__pages" role="list">
              ${pageNumbers
    .map(
      (p) => `
                <li role="listitem">
                  <button class="search-results__page-num${p === currentPage ? ' search-results__page-num--active' : ''}"
                          data-page="${p}"
                          type="button"
                          aria-label="Page ${p}"
                          aria-current="${p === currentPage ? 'page' : 'false'}">
                    ${p}
                  </button>
                </li>
              `,
    )
    .join('')}
            </ol>

            ${
  !isLastPage
    ? `
              <button class="search-results__page-btn search-results__page-btn--next"
                      data-page="next"
                      type="button"
                      aria-label="${escapeHtml(nextLabel)}">
                ${escapeHtml(nextLabel)}
              </button>
            `
    : ''
}

          </nav>
        `
    : ''
}

      `
    : `
        <!-- No results -->
        <div class="search-results__no-results"
             role="status"
             aria-label="${escapeHtml(noResultsLabel)}">
          ${escapeHtml(noResultsLabel)}
        </div>
      `
}

    `
    : ''
}
  `;
}

// ---------------------------------------------------------------------------
// Event delegation  (called ONCE after initial render)
// ---------------------------------------------------------------------------

function attachEvents(container, state, cfg, onStateChange) {
  // ── click delegation ──────────────────────────────────────────────────────
  container.addEventListener('click', (e) => {
    // Sort button toggle
    const sortCurrentBtn = e.target.closest('.search-results__sort-current');
    if (sortCurrentBtn) {
      const optionsList = container.querySelector(
        '.search-results__sort-options',
      );
      const expanded = sortCurrentBtn.getAttribute('aria-expanded') === 'true';
      sortCurrentBtn.setAttribute('aria-expanded', String(!expanded));
      optionsList.hidden = expanded;
      if (!expanded) {
        const active = optionsList.querySelector('[aria-selected="true"]');
        (active || optionsList.querySelector('[role="option"]'))?.focus();
      }
      return;
    }

    // Sort option select
    const sortOption = e.target.closest('[role="option"]');
    if (sortOption) {
      const { sort } = sortOption.dataset;
      const btn = container.querySelector('.search-results__sort-current');
      const opts = container.querySelector('.search-results__sort-options');
      btn?.setAttribute('aria-expanded', 'false');
      if (opts) opts.hidden = true;
      if (sort && sort !== state.sortCriteria) {
        updateUrl({ sortCriteria: sort, firstResult: 0 });
        onStateChange({ sortCriteria: sort, firstResult: 0 });
      }
      return;
    }

    // Pagination buttons
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn) {
      const { page } = pageBtn.dataset;
      const { numberOfResults: nr, firstResult: fr, totalCount: tc } = state;
      let newFirst = fr;
      if (page === 'prev') newFirst = Math.max(0, fr - nr);
      else if (page === 'next') newFirst = fr + nr;
      else newFirst = (parseInt(page, 10) - 1) * nr;

      if (newFirst !== fr && newFirst >= 0 && newFirst < tc) {
        updateUrl({ firstResult: newFirst });
        onStateChange({ firstResult: newFirst });
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // ── close dropdown on outside click ──────────────────────────────────────
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      const btn = container.querySelector('.search-results__sort-current');
      const opts = container.querySelector('.search-results__sort-options');
      if (btn && opts) {
        btn.setAttribute('aria-expanded', 'false');
        opts.hidden = true;
      }
    }
  });

  // ── keyboard nav inside sort dropdown ────────────────────────────────────
  container.addEventListener('keydown', (e) => {
    const sortOptions = container.querySelector(
      '.search-results__sort-options',
    );
    if (!sortOptions || sortOptions.hidden) return;

    const options = [...sortOptions.querySelectorAll('[role="option"]')];
    const idx = options.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      options[(idx + 1) % options.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      options[(idx - 1 + options.length) % options.length]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.activeElement?.click();
    } else if (e.key === 'Escape') {
      const btn = container.querySelector('.search-results__sort-current');
      btn?.setAttribute('aria-expanded', 'false');
      sortOptions.hidden = true;
      btn?.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// Analytics helper
// ---------------------------------------------------------------------------

function trackSearch(state, cfg) {
  if (!cfg.analyticsInteractionId || !window.adobeDataLayer) return;
  window.adobeDataLayer.push({
    event: 'search',
    search: {
      term: state.q,
      results: state.totalCount,
      interactionId: cfg.analyticsInteractionId,
    },
  });
}

// ---------------------------------------------------------------------------
// Block decorator  (EDS entry point)
// ---------------------------------------------------------------------------

export default async function decorate(block) {
  // 1. Parse authored block config
  const cfg = parseBlockConfig(block);

  // 2. Apply id / custom-class / lang to wrapper
  const wrapper = block.closest('.search-results-wrapper') || block;
  if (cfg.id) wrapper.id = cfg.id;
  if (cfg.customClass) {
    wrapper.classList.add(...cfg.customClass.split(/\s+/).filter(Boolean));
  }
  if (cfg.language) wrapper.setAttribute('lang', cfg.language);

  // 3. Resolve site context (siteKey + locale) from page — standard EDS pattern.
  //    Only the worker URL lives in the config sheet.
  const { siteKey, locale } = getSiteContext();
  const workerUrl = await getConfigValue('coveo-worker-url');

  if (!workerUrl || !siteKey) {
    block.innerHTML = `
      <div class="search-results__config-error" role="alert">
        Search is not configured. Please set
        <code>coveo-worker-url</code> in the EDS config sheet
        and ensure the page has a <code>site-key</code> metadata entry
        or a country-prefixed URL path (e.g. <code>/be/fr/...</code>).
      </div>`;
    return;
  }

  // 4. Clear block DOM — we own rendering from here
  block.innerHTML = '';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', 'Search Results');

  // 5. Mutable state object
  const state = {
    q: '',
    firstResult: 0,
    sortCriteria: 'relevancy',
    numberOfResults: cfg.numberOfResults,
    totalCount: 0,
    results: [],
    loading: false,
    error: null,
  };

  // 6. Attach events ONCE (before any render that produces the DOM nodes)
  //    We use event delegation on the container so this is safe to call early.
  let eventsAttached = false;

  // 7. Core load-and-render function
  async function loadResults() {
    const {
      q, firstResult, sortCriteria, numberOfResults: nr,
    } = state;

    state.loading = true;
    state.error = null;
    renderBlock(block, state, cfg);

    try {
      const data = await fetchSearchResults({
        workerUrl,
        siteKey,
        locale,
        q,
        firstResult,
        numberOfResults: nr,
        sortCriteria,
      });

      state.totalCount = data.totalCount ?? data.totalCountFiltered ?? 0;
      state.results = data.results ?? [];

      // Analytics — only on successful response
      trackSearch(state, cfg);
    } catch (err) {
      state.error = 'Failed to load results. Please try again later.';
      // eslint-disable-next-line no-console
      console.error('[search-results]', err);
    } finally {
      state.loading = false;
      renderBlock(block, state, cfg);

      // Attach delegation listeners exactly once
      if (!eventsAttached) {
        attachEvents(block, state, cfg, (updates) => {
          Object.assign(state, updates);
          loadResults();
        });
        eventsAttached = true;
      }
    }
  }

  // 8. Initialise from URL params
  Object.assign(state, getUrlParams());

  if (state.q) {
    await loadResults();
  } else {
    // No query — render the empty / no-results state gracefully
    renderBlock(block, state, cfg);
    // Still attach events so sort/pagination work if state changes via popstate
    attachEvents(block, state, cfg, (updates) => {
      Object.assign(state, updates);
      loadResults();
    });
    eventsAttached = true;
  }

  // 9. Browser back/forward navigation
  window.addEventListener('popstate', () => {
    Object.assign(state, getUrlParams());
    loadResults();
  });
}
