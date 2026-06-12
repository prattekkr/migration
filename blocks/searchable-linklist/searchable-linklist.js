/**
 * Searchable Linklist Block
 * NW-2164 – Corporate Boilerplate | Searchable Linklist Block
 *
 * Renders a filterable list of links supporting:
 *  - Real-time text search
 *  - Category tag filtering
 *  - Child Pages or Custom data sources
 *  - Single / Two-column layouts
 *  - Icon support (font or image), confirmation modals, accessibility
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

// ---------------------------------------------------------------------------
// Placeholder / i18n helpers
// ---------------------------------------------------------------------------

/**
 * Fetches the EDS placeholder sheet for the current locale.
 * Falls back gracefully to an empty map.
 * @returns {Promise<Object>} key→value map of placeholders
 */
async function fetchPlaceholders() {
  try {
    const resp = await fetch('/placeholder.json');
    if (!resp.ok) return {};
    const json = await resp.json();
    return (json.data || []).reduce((acc, { Key, Value }) => {
      acc[Key] = Value;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when an element belongs to a child Link List Item.
 * @param {Element} el property element to inspect
 * @returns {boolean}
 */
function isLinkListItemProp(el) {
  return !!el.closest(
    '[data-aue-component="link-list-item"], [data-aue-model="link-list-item"], [data-aue-resource*="link_list_item"], [data-aue-resource*="link-list-item"]',
  );
}

/**
 * Reads a Universal Editor property element that belongs to the parent block.
 * @param {Element} block block element
 * @param {string} name property name
 * @returns {Element|null}
 */
function getAuePropElement(block, name) {
  return [...block.querySelectorAll(`[data-aue-prop="${name}"]`)]
    .find((el) => !isLinkListItemProp(el)) ?? null;
}

/**
 * Reads a named block property from data attributes or Universal Editor markup.
 */
function getProp(block, name, fallback = '') {
  if (block.dataset[name] != null) return block.dataset[name];

  const propEl = getAuePropElement(block, name);
  if (!propEl) return fallback;

  return propEl.querySelector('a')?.getAttribute('href')
    || propEl.textContent?.trim()
    || fallback;
}

/**
 * Gets field cells from a rendered row, handling both flat and nested row output.
 * @param {Element} row rendered config or item row
 * @returns {Element[]}
 */
function getRowCells(row) {
  const direct = [...row.children];
  const nested = [...row.querySelectorAll(':scope > div > div')];
  return nested.length > direct.length ? nested : direct;
}

/**
 * Reads plain text from a row cell.
 * @param {Element[]} cells row cells
 * @param {number} index cell index
 * @returns {string}
 */
function cellText(cells, index) {
  return cells[index]?.textContent.trim() ?? '';
}

/**
 * Reads a link href from a row cell, falling back to text.
 * @param {Element[]} cells row cells
 * @param {number} index cell index
 * @returns {string}
 */
function cellLink(cells, index) {
  return cells[index]?.querySelector('a')?.getAttribute('href') || cellText(cells, index);
}

/**
 * Removes a known prefix from a string.
 * @param {string} value source value
 * @param {string} prefix prefix to remove
 * @returns {string}
 */
function stripPrefix(value, prefix) {
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

/**
 * Removes a known suffix from a string.
 * @param {string} value source value
 * @param {string} suffix suffix to remove
 * @returns {string}
 */
function stripSuffix(value, suffix) {
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

/**
 * Converts AEM author content paths into EDS site paths for query-index fetches.
 * @param {string} rawPath authored parent page path
 * @returns {string}
 */
function normalizeParentPage(rawPath) {
  if (!rawPath) return '';
  let path = rawPath.trim();
  try {
    if (path.startsWith('http')) path = new URL(path, window.location.origin).pathname;
  } catch {
    path = rawPath.trim();
  }
  path = path.replace(/\.html$/i, '');
  path = path.replace(/^\/content\/[^/]+/, '');
  return path || '/';
}

/**
 * Parses the collapsed source row emitted by UE when all source fields render in one cell.
 * @param {Element[]} source source row cells
 * @returns {Object|null}
 */
function parseCollapsedSourceConfig(source) {
  const text = cellText(source, 0);
  let linkSource = '';
  if (text.startsWith('child-pages')) {
    linkSource = 'child-pages';
  } else if (text.startsWith('custom')) {
    linkSource = 'custom';
  }
  if (!linkSource) return null;

  const parentPage = normalizeParentPage(cellLink(source, 0));
  const parentText = source[0]?.querySelector('a')?.textContent.trim() || parentPage.replace(/\.html$/i, '');
  let remaining = stripPrefix(text, linkSource);
  remaining = stripPrefix(remaining, parentText);

  const maxItemsMatch = remaining.match(/(\d+)$/);
  const maxItems = maxItemsMatch?.[1] ?? '';
  if (maxItems) remaining = stripSuffix(remaining, maxItems);

  const sortOrderMatch = remaining.match(/(asc|desc)$/);
  const sortOrder = sortOrderMatch?.[1] ?? 'asc';
  if (sortOrderMatch) remaining = stripSuffix(remaining, sortOrder);

  const orderBy = ['last-modified', 'content-tree', 'published', 'title']
    .find((value) => remaining.endsWith(value)) ?? 'content-tree';
  remaining = stripSuffix(remaining, orderBy);

  const childDepthMatch = remaining.match(/^(\d+)/);
  const childDepth = childDepthMatch?.[1] ?? '1';

  return {
    linkSource,
    parentPage,
    childDepth,
    excludeCurrentPage: 'false',
    enableDescription: 'false',
    enableTags: 'false',
    enableSubtitle: 'false',
    enableDate: 'false',
    orderBy,
    sortOrder,
    maxItems,
  };
}

/**
 * Logs rendered row candidates used by the row-based config fallback.
 * @param {Element[]} rows block child rows
 */
function logRowConfigCandidates(rows) {
  /* eslint-disable no-console */
  console.log('[searchable-linklist] row config candidates');
  console.table(rows.map((row, rowIndex) => {
    const cells = getRowCells(row);
    return {
      rowIndex,
      className: row.className,
      aueProp: row.dataset?.aueProp ?? '',
      aueModel: row.dataset?.aueModel ?? '',
      cellCount: cells.length,
      rowText: row.textContent.trim(),
      cells: cells.map((cell) => cell.textContent.trim()).join(' | '),
      links: cells
        .map((cell) => cell.querySelector('a')?.getAttribute('href') || '')
        .filter(Boolean)
        .join(' | '),
    };
  }));
  /* eslint-enable no-console */
}

/**
 * Reads parent block config from rendered model rows when UE property attrs are absent.
 * Row order follows the searchable-linklist model: advanced, search, source, layout.
 * @param {Element} block block element
 * @returns {Object|null}
 */
function readRowBlockConfig(block) {
  const rows = [...block.children];
  logRowConfigCandidates(rows);
  const advanced = getRowCells(rows[0] ?? document.createElement('div'));
  const search = getRowCells(rows[1] ?? document.createElement('div'));
  const source = getRowCells(rows[2] ?? document.createElement('div'));
  const layout = getRowCells(rows[3] ?? document.createElement('div'));
  const collapsedSource = parseCollapsedSourceConfig(source);
  const linkSource = collapsedSource?.linkSource ?? cellText(source, 0);

  if (!['child-pages', 'custom'].includes(linkSource)) return null;

  return {
    usesRowConfig: true,
    id: cellText(advanced, 0),
    customClass: cellText(advanced, 1),
    analyticsId: cellText(advanced, 2),
    lang: cellText(advanced, 3) || 'en',
    searchHint: cellText(search, 0),
    searchIcon: cellText(search, 1) || 'none',
    searchIconText: cellText(search, 2),
    searchIconAlt: cellLink(search, 3),
    browseCategories: cellText(search, 4),
    resetCategories: cellText(search, 5),
    linkSource,
    parentPage: collapsedSource?.parentPage ?? normalizeParentPage(cellLink(source, 1)),
    childDepth: (collapsedSource?.childDepth ?? cellText(source, 2)) || '1',
    excludeCurrentPage: (collapsedSource?.excludeCurrentPage ?? cellText(source, 3)) || 'false',
    enableDescription: (collapsedSource?.enableDescription ?? cellText(source, 4)) || 'false',
    enableTags: (collapsedSource?.enableTags ?? cellText(source, 5)) || 'false',
    enableSubtitle: (collapsedSource?.enableSubtitle ?? cellText(source, 6)) || 'false',
    enableDate: (collapsedSource?.enableDate ?? cellText(source, 7)) || 'false',
    orderBy: (collapsedSource?.orderBy ?? cellText(source, 8)) || 'content-tree',
    sortOrder: (collapsedSource?.sortOrder ?? cellText(source, 9)) || 'asc',
    maxItems: collapsedSource?.maxItems ?? cellText(source, 10),
    layout: cellText(layout, 0) || 'single-column',
  };
}

/**
 * Builds the block configuration from authored properties.
 * @param {Element} block block element
 * @returns {Object}
 */
function readBlockConfig(block) {
  const cfg = {
    id: getProp(block, 'id'),
    customClass: getProp(block, 'customClass'),
    browseCategories: getProp(block, 'browseCategories'),
    resetCategories: getProp(block, 'resetCategories'),
    searchHint: getProp(block, 'searchHint'),
    searchIcon: getProp(block, 'searchIcon', 'none'),
    searchIconText: getProp(block, 'searchIconText'),
    searchIconAlt: getProp(block, 'searchIconAlt'),
    linkSource: getProp(block, 'linkSource', 'custom'),
    parentPage: getProp(block, 'parentPage'),
    childDepth: getProp(block, 'childDepth', '1'),
    excludeCurrentPage: getProp(block, 'excludeCurrentPage', 'false'),
    enableDescription: getProp(block, 'enableDescription', 'false'),
    enableTags: getProp(block, 'enableTags', 'false'),
    enableSubtitle: getProp(block, 'enableSubtitle', 'false'),
    enableDate: getProp(block, 'enableDate', 'false'),
    orderBy: getProp(block, 'orderBy', 'content-tree'),
    sortOrder: getProp(block, 'sortOrder', 'asc'),
    maxItems: getProp(block, 'maxItems'),
    layout: getProp(block, 'layout', 'single-column'),
    analyticsId: getProp(block, 'analyticsId'),
    lang: getProp(block, 'lang', 'en'),
  };

  const rowCfg = readRowBlockConfig(block);
  if (cfg.linkSource === 'custom' && !cfg.parentPage && rowCfg) {
    return { ...cfg, ...rowCfg };
  }

  return cfg;
}

/**
 * Returns true when a URL points outside the current origin.
 */
function isExternalUrl(href) {
  try {
    return new URL(href, window.location).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Logs the raw query-index response used by the child-pages data source.
 * This is intentionally verbose while validating searchable-linklist content.
 * @param {string} indexUrl query-index URL fetched by the block
 * @param {Object} json full query-index JSON response
 */
function logQueryIndexResponse(indexUrl, json) {
  /* eslint-disable no-console */
  console.groupCollapsed(`[searchable-linklist] query-index response: ${indexUrl}`);
  console.info('Total records returned:', json.data?.length ?? 0);
  console.log(json);
  if (json.data?.length) console.table(json.data);
  console.groupEnd();
  /* eslint-enable no-console */
}

/**
 * Logs query-index records that remain visible after search/category filtering.
 * @param {string} searchText current search text
 * @param {Set<string>} activeTagSet currently selected category tags
 * @param {number} visibleCount number of visible list items
 * @param {Object[]} matchingRecords matching query-index records
 */
function logQueryIndexSearch(searchText, activeTagSet, visibleCount, matchingRecords) {
  /* eslint-disable no-console */
  console.groupCollapsed('[searchable-linklist] query-index search results');
  console.info('Search text:', searchText);
  console.info('Active tags:', [...activeTagSet]);
  console.info('Visible items:', visibleCount);
  if (matchingRecords.length) {
    console.table(matchingRecords);
  } else {
    console.info('No query-index records matched the current filters.');
  }
  console.groupEnd();
  /* eslint-enable no-console */
}

/**
 * Logs the block config read from authored data attributes.
 * @param {Object} cfg block config
 * @param {DOMStringMap} dataset authored block dataset
 */
function logBlockConfig(cfg, dataset) {
  /* eslint-disable no-console */
  console.groupCollapsed('[searchable-linklist] block config');
  console.info('cfg:', cfg);
  console.info('dataset:', { ...dataset });
  console.groupEnd();
  /* eslint-enable no-console */
}

/**
 * Logs what happened immediately after search input changed.
 * @param {string} searchText current search text
 * @param {Object} summary filter summary from applyFilters
 */
function logSearchInputChange(searchText, summary) {
  /* eslint-disable no-console */
  console.log('[searchable-linklist] search input changed', {
    searchText,
    normalizedQuery: summary.query,
    activeTags: summary.activeTags,
    totalItems: summary.totalItems,
    visibleCount: summary.visibleCount,
    hiddenCount: summary.hiddenCount,
  });
  console.table(summary.results);
  if (summary.matchingQueryIndexItems.length) {
    console.log('[searchable-linklist] matching query-index records');
    console.table(summary.matchingQueryIndexItems);
  }
  /* eslint-enable no-console */
}

/**
 * Logs how source records become rendered list items.
 * @param {Object} summary source processing summary
 */
function logItemSourceSummary(summary) {
  /* eslint-disable no-console */
  console.log('[searchable-linklist] item source summary', summary);
  if (summary.queryIndexItems?.length) {
    console.log('[searchable-linklist] query-index source records');
    console.table(summary.queryIndexItems);
  }
  if (summary.renderedItems?.length) {
    console.log('[searchable-linklist] rendered list items');
    console.table(summary.renderedItems);
  }
  /* eslint-enable no-console */
}

// ---------------------------------------------------------------------------
// Icon rendering
// ---------------------------------------------------------------------------

/**
 * Builds an icon element (font-icon span or img) from block/item config.
 * @param {'icon-font'|'image'|'none'} type
 * @param {string} fontIconName  - glyph class name when type = 'icon-font'
 * @param {string} imageSrc      - asset path when type = 'image'
 * @param {string} altText
 * @returns {HTMLElement|null}
 */
function buildIcon(type, fontIconName, imageSrc, altText = '') {
  if (type === 'icon-font' && fontIconName) {
    const span = document.createElement('span');
    span.className = `icon icon-${fontIconName}`;
    span.setAttribute('aria-hidden', 'true');
    return span;
  }
  if (type === 'image' && imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = altText;
    img.className = 'sll-item-icon-img';
    img.loading = 'lazy';
    return img;
  }
  return null;
}

/**
 * Builds the upper-right open-link control for a result item.
 * @param {string} href destination URL
 * @param {string} label accessible link label
 * @param {boolean} openNewTab whether to open in a new tab
 * @returns {HTMLAnchorElement|null}
 */
function buildOpenLink(href, label, openNewTab = false) {
  if (!href) return null;

  const anchor = document.createElement('a');
  anchor.className = 'sll-item-open-link';
  anchor.href = href;
  anchor.setAttribute('aria-label', `Open ${label}`);
  if (openNewTab) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  return anchor;
}

// ---------------------------------------------------------------------------
// Item rendering
// ---------------------------------------------------------------------------

/**
 * Builds a single <li> list item from an authored row element.
 *
 * In EDS the block renders each Link List Item child as a row of divs.
 * Row layout (by div index):
 *  0: id | customClass
 *  1: link href | openInNewTab | linkText | ariaLabel | lang | analyticsInteractionId
 *  2: subtitle
 *  3: description (rich text)
 *  4: categoryTags (comma-separated tag IDs/titles)
 *  5: iconType | fontIcon | imageIconSrc | iconPosition | iconLink
 *  6: enableConfirmationModal | confirmationModalType | modalId
 */
function buildListItem(row) {
  const cells = [...row.children];
  const get = (i) => cells[i]?.textContent.trim() ?? '';

  // — Advanced / identity
  const itemId = get(0).split('|')[0]?.trim();
  const customClass = get(0).split('|')[1]?.trim();

  // — Link fields
  const linkParts = get(1).split('|');
  const href = linkParts[0]?.trim();
  const openNewTab = linkParts[1]?.trim() === 'true';
  const linkText = linkParts[2]?.trim() || get(1);
  const ariaLabel = linkParts[3]?.trim();
  const itemLang = linkParts[4]?.trim();
  const analyticsId = linkParts[5]?.trim();

  // — Optional metadata
  const subtitle = get(2);
  const descriptionEl = cells[3];
  const descriptionText = descriptionEl?.textContent.trim() ?? '';
  const categoryTagsRaw = get(4);

  if (!href && !linkText && !subtitle && !descriptionText && !categoryTagsRaw) {
    return null;
  }

  // — Icon config
  const iconParts = get(5).split('|');
  const iconType = iconParts[0]?.trim() || 'none';
  const fontIconName = iconParts[1]?.trim();
  const imageIconSrc = iconParts[2]?.trim();
  const iconPosition = iconParts[3]?.trim() || 'before';
  const iconHref = iconParts[4]?.trim();

  // — Modal config
  const modalParts = get(6).split('|');
  const enableModal = modalParts[0]?.trim() === 'true';
  const modalType = modalParts[1]?.trim();
  const modalId = modalParts[2]?.trim();

  // Build <li>
  const li = document.createElement('li');
  li.className = 'sll-item';
  if (customClass) li.classList.add(...customClass.split(' ').filter(Boolean));
  if (itemId) li.id = itemId;
  if (itemLang) li.lang = itemLang;

  // Parse category tags into data attribute for filtering
  const tags = categoryTagsRaw
    ? categoryTagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  if (tags.length) li.dataset.tags = JSON.stringify(tags);

  moveInstrumentation(row, li);

  // Build icon element
  const iconEl = buildIcon(iconType, fontIconName, imageIconSrc);

  // Build primary anchor
  const anchor = document.createElement('a');
  anchor.className = 'sll-item-link';
  if (href) anchor.href = href;
  if (ariaLabel) anchor.setAttribute('aria-label', ariaLabel);
  if (analyticsId) anchor.dataset.analyticsInteractionId = analyticsId;

  if (openNewTab) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }

  if (isExternalUrl(href)) {
    anchor.classList.add('sll-item-link-external');
    const extIndicator = document.createElement('span');
    extIndicator.className = 'sll-external-indicator';
    extIndicator.setAttribute('aria-label', '(opens external site)');
    anchor.append(extIndicator);
  }

  if (enableModal) {
    anchor.dataset.modalType = modalType || 'standard';
    if (modalId) anchor.dataset.modalId = modalId;
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = document.getElementById(modalId);
      if (modal) modal.dispatchEvent(new CustomEvent('open', { detail: { href, modalType } }));
    });
  }

  const textSpan = document.createElement('span');
  textSpan.className = 'sll-item-text';
  textSpan.textContent = linkText;

  // Icon wrapping the anchor text
  if (iconEl && iconPosition === 'before') {
    if (iconHref) {
      const iconAnchor = document.createElement('a');
      iconAnchor.href = iconHref;
      iconAnchor.className = 'sll-item-icon-link';
      iconAnchor.setAttribute('aria-hidden', 'true');
      iconAnchor.tabIndex = -1;
      iconAnchor.append(iconEl);
      anchor.prepend(iconAnchor);
    } else {
      anchor.prepend(iconEl);
    }
  }
  anchor.append(textSpan);
  if (iconEl && iconPosition === 'after') {
    if (iconHref) {
      const iconAnchor = document.createElement('a');
      iconAnchor.href = iconHref;
      iconAnchor.className = 'sll-item-icon-link';
      iconAnchor.setAttribute('aria-hidden', 'true');
      iconAnchor.tabIndex = -1;
      iconAnchor.append(iconEl);
      anchor.append(iconAnchor);
    } else {
      anchor.append(iconEl);
    }
  }

  li.append(anchor);
  const openLink = buildOpenLink(href, ariaLabel || linkText, openNewTab);
  if (openLink) li.append(openLink);

  // Subtitle
  if (subtitle) {
    const subtitleEl = document.createElement('p');
    subtitleEl.className = 'sll-item-subtitle';
    subtitleEl.textContent = subtitle;
    li.append(subtitleEl);
  }

  // Description (rich text – move children from authored cell)
  if (descriptionEl?.children.length) {
    const descWrapper = document.createElement('div');
    descWrapper.className = 'sll-item-description';
    while (descriptionEl.firstChild) descWrapper.append(descriptionEl.firstChild);
    li.append(descWrapper);
  }

  // Category tag chips (display)
  if (tags.length) {
    const tagList = document.createElement('ul');
    tagList.className = 'sll-item-tags';
    tagList.setAttribute('aria-label', 'categories');
    tags.forEach((tag) => {
      const tagLi = document.createElement('li');
      tagLi.className = 'sll-item-tag';
      tagLi.textContent = tag;
      tagList.append(tagLi);
    });
    li.append(tagList);
  }

  return li;
}

// ---------------------------------------------------------------------------
// Child Pages data source
// ---------------------------------------------------------------------------

/**
 * Fetches and parses a query-index endpoint.
 * @param {string} indexUrl query-index URL
 * @returns {Promise<Object>} parsed JSON
 */
async function fetchQueryIndex(indexUrl) {
  const resp = await fetch(indexUrl);
  if (!resp.ok) {
    const error = new Error(`query-index request failed: ${resp.status} ${resp.statusText}`);
    error.status = resp.status;
    error.statusText = resp.statusText;
    error.indexUrl = indexUrl;
    throw error;
  }
  return resp.json();
}

/**
 * Fetches child page data from the helix query index and converts each
 * entry into a list item element.
 *
 * @param {Object} cfg - block configuration
 * @param {Object} ph  - placeholder map for i18n
 * @returns {Promise<HTMLLIElement[]>}
 */
async function fetchChildPageItems(cfg, ph) {
  const {
    parentPage: rawParentPage,
    childDepth,
    excludeCurrentPage,
    enableDescription,
    enableSubtitle,
    enableDate,
    enableTags,
    orderBy,
    sortOrder,
    maxItems,
  } = cfg;

  const parentPage = normalizeParentPage(rawParentPage);
  if (!parentPage) {
    /* eslint-disable-next-line no-console */
    console.warn('[searchable-linklist] Link Source is child-pages, but Parent Page is empty.');
    return [];
  }

  const primaryIndexUrl = parentPage === '/'
    ? '/query-index.json'
    : `${parentPage.replace(/\/$/, '')}/query-index.json`;
  const fallbackIndexUrl = '/query-index.json';
  const debug = {
    source: 'child-pages',
    parentPage,
    childDepth,
    excludeCurrentPage,
    orderBy,
    sortOrder,
    maxItems,
    indexUrl: primaryIndexUrl,
    attemptedIndexUrls: [primaryIndexUrl],
    usedFallbackIndex: false,
    rawCount: 0,
    afterDepthFilterCount: 0,
    afterExcludeCurrentCount: 0,
    finalCount: 0,
    queryIndexItems: [],
  };
  let items = [];
  try {
    let indexUrl = primaryIndexUrl;
    let json;
    try {
      json = await fetchQueryIndex(primaryIndexUrl);
    } catch (primaryError) {
      /* eslint-disable-next-line no-console */
      console.warn('[searchable-linklist] primary query-index request failed', {
        indexUrl: primaryIndexUrl,
        status: primaryError.status,
        statusText: primaryError.statusText,
      });
      if (primaryIndexUrl === fallbackIndexUrl) throw primaryError;
      debug.attemptedIndexUrls.push(fallbackIndexUrl);
      debug.usedFallbackIndex = true;
      indexUrl = fallbackIndexUrl;
      json = await fetchQueryIndex(fallbackIndexUrl);
    }

    debug.indexUrl = indexUrl;
    logQueryIndexResponse(indexUrl, json);
    items = json.data || [];
    debug.rawCount = items.length;
    debug.queryIndexItems = items.map((item) => ({
      path: item.path,
      title: item.title,
      tags: item.tags,
      description: item.description,
      lastModified: item.lastModified,
      publishDate: item.publishDate,
    }));
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.warn('[searchable-linklist] query-index request errored', {
      attemptedIndexUrls: debug.attemptedIndexUrls,
      error,
    });
    return [];
  }

  // Depth filtering – compare path segment depth relative to parentPage
  const parentDepth = parentPage.replace(/\/$/, '').split('/').length;
  const maxDepth = childDepth ? parentDepth + parseInt(childDepth, 10) : parentDepth + 1;
  items = items.filter(({ path }) => {
    const d = path.split('/').length;
    return d > parentDepth && d <= maxDepth;
  });
  debug.afterDepthFilterCount = items.length;

  // Exclude current page
  if (excludeCurrentPage === 'true') {
    const currentPath = window.location.pathname.replace(/\/$/, '');
    items = items.filter(({ path }) => path !== currentPath);
  }
  debug.afterExcludeCurrentCount = items.length;

  // Sorting
  const dir = sortOrder === 'desc' ? -1 : 1;
  if (orderBy === 'title') {
    items.sort((a, b) => dir * (a.title || '').localeCompare(b.title || ''));
  } else if (orderBy === 'last-modified') {
    items.sort((a, b) => dir * ((a.lastModified || 0) - (b.lastModified || 0)));
  } else if (orderBy === 'published') {
    items.sort((a, b) => dir * ((a.publishDate || 0) - (b.publishDate || 0)));
  }
  // 'content-tree' keeps the index order (already tree order)

  // Limit
  if (maxItems) items = items.slice(0, parseInt(maxItems, 10));
  debug.finalCount = items.length;

  // Build LI elements
  const listItems = items.map((page) => {
    const li = document.createElement('li');
    li.className = 'sll-item';
    li.sllQueryIndexItem = page;

    const tags = page.tags
      ? page.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    if (tags.length) li.dataset.tags = JSON.stringify(tags);

    const href = page.path;
    const anchor = document.createElement('a');
    anchor.className = 'sll-item-link';
    anchor.href = href;
    if (isExternalUrl(href)) anchor.classList.add('sll-item-link-external');

    const textSpan = document.createElement('span');
    textSpan.className = 'sll-item-text';
    textSpan.textContent = page.title || href;
    anchor.append(textSpan);
    li.append(anchor);
    const openLink = buildOpenLink(href, page.title || href);
    if (openLink) li.append(openLink);

    if (enableSubtitle === 'true' && page.subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'sll-item-subtitle';
      subtitleEl.textContent = page.subtitle;
      li.append(subtitleEl);
    }

    if (enableDescription === 'true' && page.description) {
      const descEl = document.createElement('p');
      descEl.className = 'sll-item-description';
      descEl.textContent = page.description;
      li.append(descEl);
    }

    if (enableDate === 'true') {
      const dateVal = page.publishDate || page.lastModified;
      if (dateVal) {
        const dateEl = document.createElement('time');
        dateEl.className = 'sll-item-date';
        const d = new Date(dateVal * 1000);
        dateEl.dateTime = d.toISOString();
        dateEl.textContent = d.toLocaleDateString();
        li.append(dateEl);
      }
    }

    if (enableTags === 'true' && tags.length) {
      const tagList = document.createElement('ul');
      tagList.className = 'sll-item-tags';
      tagList.setAttribute('aria-label', ph.categories || 'categories');
      tags.forEach((tag) => {
        const tagLi = document.createElement('li');
        tagLi.className = 'sll-item-tag';
        tagLi.textContent = tag;
        tagList.append(tagLi);
      });
      li.append(tagList);
    }

    return li;
  });
  listItems.sllSourceDebug = debug;
  return listItems;
}

// ---------------------------------------------------------------------------
// Search & filter logic
// ---------------------------------------------------------------------------

/**
 * Applies the current search text and active category tags to the item list.
 * Shows/hides items and updates the results count / empty-state message.
 *
 * @param {HTMLUListElement} listEl       - the <ul> containing all items
 * @param {string}           searchText  - current text input value
 * @param {Set<string>}      activeTagSet - currently selected category tags
 * @param {HTMLElement}      emptyMsg    - "no results" element
 * @param {HTMLElement|null} countEl     - "0 Result(s) found" element
 * @param {Object}           ph          - placeholder strings
 */
function applyFilters(listEl, searchText, activeTagSet, emptyMsg, countEl, ph) {
  const query = searchText.toLowerCase().trim();
  let visibleCount = 0;
  let hasQueryIndexItems = false;
  const matchingQueryIndexItems = [];
  const results = [];

  listEl.querySelectorAll(':scope > li.sll-item').forEach((li) => {
    const title = li.querySelector('.sll-item-text')?.textContent ?? '';
    const normalizedTitle = title.toLowerCase();
    const matchesSearch = !query || normalizedTitle.includes(query);
    const itemTags = li.dataset.tags ? JSON.parse(li.dataset.tags) : [];

    let matchesTags = true;
    if (activeTagSet.size > 0) {
      matchesTags = [...activeTagSet].every((tag) => itemTags.includes(tag));
    }

    const visible = matchesSearch && matchesTags;
    li.hidden = !visible;
    if (visible) {
      visibleCount += 1;
      if (li.sllQueryIndexItem) matchingQueryIndexItems.push(li.sllQueryIndexItem);
    }
    if (li.sllQueryIndexItem) hasQueryIndexItems = true;
    results.push({
      title,
      tags: itemTags.join(', '),
      matchesSearch,
      matchesTags,
      visible,
      normalizedTitle,
    });
  });

  const hasActiveFilters = query || activeTagSet.size > 0;
  if (hasActiveFilters && hasQueryIndexItems) {
    logQueryIndexSearch(searchText, activeTagSet, visibleCount, matchingQueryIndexItems);
  }

  if (hasActiveFilters && visibleCount === 0) {
    emptyMsg.hidden = false;
    if (countEl) {
      countEl.hidden = false;
      countEl.textContent = ph['0-results'] || '0 Result(s) found';
    }
  } else {
    emptyMsg.hidden = true;
    if (countEl) {
      countEl.hidden = !hasActiveFilters;
      if (hasActiveFilters) {
        countEl.textContent = `${visibleCount} ${ph['results-found'] || 'Result(s) found'}`;
      }
    }
  }

  return {
    searchText,
    query,
    activeTags: [...activeTagSet],
    totalItems: results.length,
    visibleCount,
    hiddenCount: results.length - visibleCount,
    results,
    matchingQueryIndexItems,
  };
}

// ---------------------------------------------------------------------------
// Search bar builder
// ---------------------------------------------------------------------------

/**
 * Builds the search input wrapper with optional icon.
 *
 * @param {Object} cfg  - block config
 * @param {Object} ph   - placeholders
 * @returns {{ wrapper: HTMLElement, input: HTMLInputElement }}
 */
function buildSearchBar(cfg, ph) {
  const {
    searchHint, searchIcon, searchIconText, searchIconAlt,
  } = cfg;

  const wrapper = document.createElement('div');
  wrapper.className = 'sll-search-wrapper';

  // Icon
  const iconEl = buildIcon(searchIcon, searchIconText, searchIconAlt, '');
  if (iconEl) {
    iconEl.classList.add('sll-search-icon');
    wrapper.append(iconEl);
  }

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'sll-search-input';
  input.placeholder = searchHint || ph.search || 'Search';
  input.setAttribute('aria-label', searchHint || ph.search || 'Search');

  // Clear (×) button
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'sll-search-clear';
  clearBtn.setAttribute('aria-label', ph['clear-search'] || 'Clear search');
  clearBtn.hidden = true;
  clearBtn.innerHTML = '&times;';

  input.addEventListener('input', () => {
    clearBtn.hidden = !input.value;
  });
  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.hidden = true;
    input.dispatchEvent(new Event('input'));
    input.focus();
  });

  wrapper.append(input, clearBtn);
  return { wrapper, input };
}

// ---------------------------------------------------------------------------
// Category filter builder
// ---------------------------------------------------------------------------

/**
 * Builds the Browse Categories dropdown and selected-tag chips area.
 *
 * @param {string[]}  allTags            - all unique tags collected from items
 * @param {Object}    cfg                - block config
 * @param {Object}    ph                 - placeholders
 * @param {Set}       activeTagSet       - shared active-tag state
 * @param {Function}  onTagsChanged      - callback when selection changes
 * @returns {HTMLElement|null}           - the category filter container, or null
 */
function buildCategoryFilter(allTags, cfg, ph, activeTagSet, onTagsChanged) {
  if (!allTags.length) return null;

  const { browseCategories, resetCategories } = cfg;

  const container = document.createElement('div');
  container.className = 'sll-category-filter';

  // Dropdown
  const dropdownWrapper = document.createElement('div');
  dropdownWrapper.className = 'sll-category-dropdown-wrapper';

  const dropdownBtn = document.createElement('button');
  dropdownBtn.type = 'button';
  dropdownBtn.className = 'sll-category-dropdown-btn';
  dropdownBtn.setAttribute('aria-haspopup', 'listbox');
  dropdownBtn.setAttribute('aria-expanded', 'false');
  dropdownBtn.textContent = browseCategories || ph['browse-categories'] || 'Browse Categories';

  const dropdownList = document.createElement('ul');
  dropdownList.className = 'sll-category-dropdown-list';
  dropdownList.setAttribute('role', 'listbox');
  dropdownList.setAttribute('aria-multiselectable', 'true');
  dropdownList.hidden = true;

  allTags.forEach((tag) => {
    const option = document.createElement('li');
    option.className = 'sll-category-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.textContent = tag;
    option.dataset.tag = tag;
    dropdownList.append(option);
  });

  dropdownBtn.addEventListener('click', () => {
    const isOpen = !dropdownList.hidden;
    dropdownList.hidden = isOpen;
    dropdownBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdownWrapper.contains(e.target)) {
      dropdownList.hidden = true;
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
  });

  dropdownWrapper.append(dropdownBtn, dropdownList);

  // Selected tag chips
  const chipsArea = document.createElement('div');
  chipsArea.className = 'sll-selected-tags';
  chipsArea.setAttribute('aria-live', 'polite');

  // Count display
  const countEl = document.createElement('p');
  countEl.className = 'sll-results-count';
  countEl.hidden = true;

  const updateChips = () => {
    chipsArea.innerHTML = '';
    activeTagSet.forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'sll-tag-chip';
      chip.textContent = tag;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'sll-tag-chip-remove';
      removeBtn.setAttribute('aria-label', `${ph['remove-filter'] || 'Remove filter'}: ${tag}`);
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', () => {
        activeTagSet.delete(tag);
        const opt = dropdownList.querySelector(`[data-tag="${CSS.escape(tag)}"]`);
        if (opt) opt.setAttribute('aria-selected', 'false');
        updateChips();
        onTagsChanged();
      });

      chip.append(removeBtn);
      chipsArea.append(chip);
    });
  };

  // Option click handling
  dropdownList.addEventListener('click', (e) => {
    const option = e.target.closest('.sll-category-option');
    if (!option) return;
    const { tag } = option.dataset;
    if (activeTagSet.has(tag)) {
      activeTagSet.delete(tag);
      option.setAttribute('aria-selected', 'false');
    } else {
      activeTagSet.add(tag);
      option.setAttribute('aria-selected', 'true');
    }
    updateChips();
    onTagsChanged();
  });

  container.append(dropdownWrapper, chipsArea, countEl);

  // Reset control
  let resetBtn = null;
  if (resetCategories) {
    resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'sll-reset-btn';
    resetBtn.textContent = resetCategories;
    container.append(resetBtn);
  }

  return { container, countEl, resetBtn };
}

// ---------------------------------------------------------------------------
// Main decorate function
// ---------------------------------------------------------------------------

/**
 * Loads and decorates the Searchable Linklist block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. Placeholders
  const ph = await fetchPlaceholders();

  // 2. Read block config from data attributes or Universal Editor property markup
  const cfg = readBlockConfig(block);
  logBlockConfig(cfg, block.dataset);

  // 3. Apply block-level attributes
  if (cfg.id) block.id = cfg.id;
  if (cfg.customClass) block.classList.add(...cfg.customClass.split(' ').filter(Boolean));
  block.classList.add(`layout-${cfg.layout}`);
  if (cfg.lang) block.lang = cfg.lang;
  if (cfg.analyticsId) block.dataset.analyticsId = cfg.analyticsId;

  // 4. Build item list
  const listEl = document.createElement('ul');
  listEl.className = 'sll-list';

  let listItems = [];
  let itemSourceDebug = null;
  if (cfg.linkSource === 'child-pages') {
    listItems = await fetchChildPageItems(cfg, ph);
    itemSourceDebug = listItems.sllSourceDebug;
  } else {
    // Custom – authored Link List Item children are already rendered as rows
    const itemRows = cfg.usesRowConfig ? [...block.children].slice(4) : [...block.children];
    itemRows.forEach((row) => {
      const li = buildListItem(row);
      if (li) listItems.push(li);
    });
    itemSourceDebug = {
      source: 'custom',
      authoredRowCount: block.children.length,
      skippedConfigRowCount: cfg.usesRowConfig ? 4 : 0,
      finalCount: listItems.length,
    };
  }

  listItems.forEach((li) => listEl.append(li));
  logItemSourceSummary({
    ...itemSourceDebug,
    renderedItemCount: listItems.length,
    renderedItems: listItems.map((li) => ({
      text: li.querySelector('.sll-item-text')?.textContent ?? '',
      href: li.querySelector('.sll-item-link')?.href ?? '',
      tags: li.dataset.tags ?? '',
    })),
  });

  // 5. Collect all unique tags from rendered items
  const allTags = [...new Set(
    listItems
      .flatMap((li) => (li.dataset.tags ? JSON.parse(li.dataset.tags) : [])),
  )];

  // 6. Build controls container
  const controlsEl = document.createElement('div');
  controlsEl.className = 'sll-controls';

  // Shared state
  const activeTagSet = new Set();
  let currentSearch = '';

  // Empty state message
  const emptyMsg = document.createElement('p');
  emptyMsg.className = 'sll-empty-message';
  emptyMsg.textContent = ph['no-results'] || 'No results found. Change your search criteria.';
  emptyMsg.hidden = true;

  // countEl assigned after category filter is built; declared here for refresh closure
  let countEl = null;
  let resetBtn = null;

  // Trigger filter refresh
  const refresh = () => applyFilters(listEl, currentSearch, activeTagSet, emptyMsg, countEl, ph);

  // 7. Search bar
  const { wrapper: searchWrapper, input: searchInput } = buildSearchBar(cfg, ph);
  searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value;
    const filterSummary = refresh();
    logSearchInputChange(currentSearch, filterSummary);
  });
  controlsEl.append(searchWrapper);

  // 8. Category filter (only if tags exist)

  const categoryResult = buildCategoryFilter(allTags, cfg, ph, activeTagSet, refresh);
  if (categoryResult) {
    countEl = categoryResult.countEl;
    resetBtn = categoryResult.resetBtn;
    controlsEl.append(categoryResult.container);
  }

  // 9. Reset button wiring
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeTagSet.clear();
      currentSearch = '';
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      // reset dropdown options
      categoryResult.container
        .querySelectorAll('.sll-category-option')
        .forEach((opt) => opt.setAttribute('aria-selected', 'false'));
      categoryResult.container.querySelector('.sll-selected-tags').innerHTML = '';
      refresh();
    });
  }

  // 10. Replace block content with structured output
  block.innerHTML = '';
  block.append(controlsEl, listEl, emptyMsg);
}
