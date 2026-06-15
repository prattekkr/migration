/**
 * Searchable Linklist Block
 * NW-2164 – Corporate Boilerplate | Searchable Linklist Block
 *
 * Renders a filterable list of links supporting:
 *  - FR-001 Real-time, case-insensitive title search
 *  - FR-002 Category tag filtering (intersection / OR) driven by parent Category Tags
 *  - FR-003 Reset control + empty / zero-result states
 *  - FR-004 Child Pages / Icons / Custom link sources
 *  - FR-005 Single / Two-column layouts
 *  - FR-006 Per-item link behavior (new tab, icons, confirmation modal, deep-link Id)
 *  - FR-008 Cross-block filtering of a separate region via Search In ID
 *  - NFR-001 WCAG AA semantics; NFR-004 i18n via EDS placeholder sheets
 */

import { moveInstrumentation } from '../../scripts/scripts.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { createIcon } from '../../scripts/utils.js';

// ---------------------------------------------------------------------------
// Small parsing helpers
// ---------------------------------------------------------------------------

function parseBool(val, fallback = false) {
  const v = String(val ?? '').trim().toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

function parseIntSafe(val, fallback) {
  const n = parseInt(String(val ?? '').trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Strips the "lang:" prefix used by the shared language field and normalizes "none". */
function normalizeLang(val) {
  const lang = String(val ?? '').replace(/^lang:/, '').trim();
  return lang && lang.toLowerCase() !== 'none' ? lang : '';
}

/** Splits an authored/UE tag string (CSV, newlines, pipes) into trimmed tokens. */
function splitTags(raw) {
  return String(raw ?? '')
    .split(/\r\n|\n|\r|,|;|\|/g)
    .map((t) => t.trim())
    .filter((t) => t && t.toLowerCase() !== 'none');
}

/** Returns true when a URL points outside the current origin. */
function isExternalUrl(href) {
  try {
    return new URL(href, window.location).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/** Converts AEM author content paths into EDS site paths for query-index fetches. */
function normalizeParentPage(rawPath) {
  if (!rawPath) return '';
  let path = String(rawPath).trim();
  try {
    if (path.startsWith('http')) path = new URL(path, window.location.origin).pathname;
  } catch {
    path = String(rawPath).trim();
  }
  path = path.replace(/\.html$/i, '');
  path = path.replace(/^\/content\/[^/]+/, '');
  return path || '/';
}

// ---------------------------------------------------------------------------
// Taxonomy (tags.json) resolution — FR-002
// ---------------------------------------------------------------------------

const TAGS_CACHE_KEY = 'abbvie-tags-json-lookup-v1';
let tagsLookupPromise = null;

/** Resolves the tags.json URL for both Universal Editor and published EDS. */
function getTagsJsonUrl() {
  const isUE = !!document.querySelector('[data-aue-resource]');
  if (isUE) {
    const current = window.location.pathname.replace(/\.html$/i, '');
    return `${current}.resource/tags.json`;
  }
  const base = window.hlx?.codeBasePath ?? '';
  return `${base}/tags.json`.replace(/\/{2,}/g, '/');
}

/**
 * Loads tags.json once and returns an ordered map of tag id → display title.
 * Rows are shaped { tag, title } (same as /tags.json on aem.page).
 */
async function getTagsLookup() {
  if (tagsLookupPromise) return tagsLookupPromise;
  tagsLookupPromise = (async () => {
    const map = new Map();
    try {
      const cached = sessionStorage.getItem(TAGS_CACHE_KEY);
      if (cached) {
        Object.entries(JSON.parse(cached)).forEach(([id, title]) => map.set(id, title));
        if (map.size) return map;
      }
    } catch {
      /* ignore cache errors */
    }
    try {
      const resp = await fetch(getTagsJsonUrl(), { credentials: 'same-origin' });
      if (resp.ok) {
        const json = await resp.json();
        (json.data || []).forEach((row) => {
          const id = String(row.tag ?? row.id ?? '').trim();
          const title = String(row.title ?? row.name ?? '').trim();
          if (id && title) map.set(id, title);
        });
        try {
          sessionStorage.setItem(TAGS_CACHE_KEY, JSON.stringify(Object.fromEntries(map)));
        } catch {
          /* sessionStorage may be full */
        }
      }
    } catch {
      /* taxonomy unavailable — callers fall back to heuristic labels */
    }
    return map;
  })();
  return tagsLookupPromise;
}

/** Derives a readable label from a tag id when tags.json has no title. */
function tagIdToLabel(id) {
  const seg = String(id || '').split('/').pop() || String(id || '');
  const afterColon = seg.includes(':') ? seg.slice(seg.indexOf(':') + 1) : seg;
  return afterColon.replace(/[-_]+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** True when `id` is a descendant tag of `parentId` (path-prefix relationship). */
function isChildTag(id, parentId) {
  if (!id || !parentId || id === parentId) return false;
  return id.startsWith(`${parentId}/`);
}

// ---------------------------------------------------------------------------
// Universal Editor / published EDS property readers
// ---------------------------------------------------------------------------

/** True when `el` belongs to a nested Link List Item (not the parent block). */
function isItemProp(el) {
  return !!el.closest(
    '[data-aue-model="link-list-item"], [data-aue-resource*="link-list-item"], .link-list-item',
  );
}

/** Reads a parent-block property element by name, skipping nested item props. */
function getBlockPropEl(block, name) {
  return [...block.querySelectorAll(`[data-aue-prop="${name}"]`)]
    .find((el) => !isItemProp(el)) ?? null;
}

/** Reads a block property's text value (UE), with optional fallback. */
function blockText(block, name, fallback = '') {
  const el = getBlockPropEl(block, name);
  return el ? (el.textContent?.trim() || fallback) : fallback;
}

/** Reads a block property's href (UE), falling back to text then default. */
function blockHref(block, name, fallback = '') {
  const el = getBlockPropEl(block, name);
  if (!el) return fallback;
  return el.querySelector('a')?.getAttribute('href') || el.textContent?.trim() || fallback;
}

/** Collects category-tag tokens from a parent-block categoryTags prop. */
function blockTags(block, name) {
  const el = getBlockPropEl(block, name);
  if (!el) return [];
  const chips = [...el.children].map((c) => c.textContent?.trim()).filter(Boolean);
  const tokens = chips.length > 1 ? chips : splitTags(el.textContent);
  return [...new Set(tokens.flatMap((t) => splitTags(t)))];
}

/**
 * Builds block configuration. Prefers UE data-aue-prop markup; falls back to
 * published-EDS rows rendered in model order when no UE props are present.
 */
function readBlockConfig(block) {
  const ueMode = !!block.querySelector('[data-aue-prop]');

  if (ueMode) {
    return {
      searchHint: blockText(block, 'searchHint'),
      searchIcon: blockText(block, 'searchIcon', 'none'),
      searchIconText: blockText(block, 'searchIconText'),
      searchIconAlt: blockHref(block, 'searchIconAlt'),
      categoryTags: blockTags(block, 'categoryTags'),
      browseCategories: blockText(block, 'browseCategories'),
      resetCategories: blockText(block, 'resetCategories'),
      linkSource: blockText(block, 'linkSource', 'custom'),
      parentPage: blockHref(block, 'parentPage'),
      childDepth: parseIntSafe(blockText(block, 'childDepth'), 1),
      excludeCurrentPage: parseBool(blockText(block, 'excludeCurrentPage'), false),
      enableDescription: parseBool(blockText(block, 'enableDescription'), false),
      enableTags: parseBool(blockText(block, 'enableTags'), false),
      enableSubtitle: parseBool(blockText(block, 'enableSubtitle'), false),
      enableDate: parseBool(blockText(block, 'enableDate'), false),
      orderBy: blockText(block, 'orderBy', 'content-tree'),
      sortOrder: blockText(block, 'sortOrder', 'asc'),
      maxItems: parseIntSafe(blockText(block, 'maxItems'), 25),
      layout: blockText(block, 'layout', 'single-column'),
      id: blockText(block, 'id'),
      customClass: blockText(block, 'customClass'),
      searchInId: blockText(block, 'searchInId'),
      analyticsId: blockText(block, 'analyticsId'),
      lang: normalizeLang(blockText(block, 'language')),
    };
  }

  // Published EDS: parent config rows precede the authored item rows, in model order.
  const rows = [...block.children];
  const ct = (i) => rows[i]?.textContent?.trim() || '';
  const cl = (i) => rows[i]?.querySelector('a')?.getAttribute('href') || ct(i);
  const tagRow = (i) => {
    const chips = [...(rows[i]?.children || [])].map((c) => c.textContent?.trim()).filter(Boolean);
    const tokens = chips.length > 1 ? chips : splitTags(ct(i));
    return [...new Set(tokens.flatMap((t) => splitTags(t)))];
  };

  return {
    searchHint: ct(0),
    searchIcon: ct(1) || 'none',
    searchIconText: ct(2),
    searchIconAlt: cl(3),
    categoryTags: tagRow(4),
    browseCategories: ct(5),
    resetCategories: ct(6),
    linkSource: ct(7) || 'custom',
    parentPage: cl(8),
    childDepth: parseIntSafe(ct(9), 1),
    excludeCurrentPage: parseBool(ct(10), false),
    enableDescription: parseBool(ct(11), false),
    enableTags: parseBool(ct(12), false),
    enableSubtitle: parseBool(ct(13), false),
    enableDate: parseBool(ct(14), false),
    orderBy: ct(15) || 'content-tree',
    sortOrder: ct(16) || 'asc',
    maxItems: parseIntSafe(ct(17), 25),
    layout: ct(18) || 'single-column',
    id: ct(19),
    customClass: ct(20),
    searchInId: ct(21),
    analyticsId: ct(22),
    lang: normalizeLang(ct(23)),
    usesRowConfig: true,
    configRowCount: 24,
  };
}

// ---------------------------------------------------------------------------
// Custom item reading
// ---------------------------------------------------------------------------

/** True when an element is a rendered Link List Item. */
function isItemEl(el) {
  if (!el || el.nodeType !== 1) return false;
  return (
    el.classList.contains('link-list-item')
    || el.getAttribute('data-aue-model') === 'link-list-item'
    || (el.getAttribute('data-aue-resource') || '').includes('link-list-item')
  );
}

/** Returns the rendered Link List Item elements for a Custom-source block. */
function collectItemEls(block, cfg) {
  const direct = [...block.children].filter(isItemEl);
  if (direct.length) return direct;

  const nested = [...block.querySelectorAll(
    '.link-list-item, [data-aue-model="link-list-item"], [data-aue-resource*="link-list-item"]',
  )];
  if (nested.length) return nested;

  // Universal Editor: items only ever appear as instrumented link-list-item
  // elements (handled above). Never fall back to raw rows here — the block's own
  // authored config fields render as instrumented rows and must not be mistaken
  // for items (doing so steals their instrumentation and spawns phantom blocks).
  if (block.querySelector('[data-aue-prop], [data-aue-resource]') || !cfg.usesRowConfig) {
    return [];
  }

  // Published EDS: items are the rows that follow the parent config rows.
  return [...block.children]
    .slice(cfg.configRowCount)
    .filter((el) => el.querySelector('a[href]') || el.textContent.trim());
}

/** Reads a single item's config by data-aue-prop (UE) with positional fallback. */
function readItemConfig(itemEl) {
  const ueText = (name) => {
    const el = itemEl.querySelector(`[data-aue-prop="${name}"]`);
    return el ? el.textContent?.trim() ?? null : null;
  };
  const ueHref = (name) => {
    const el = itemEl.querySelector(`[data-aue-prop="${name}"]`);
    if (!el) return null;
    return el.querySelector('a')?.getAttribute('href') || el.textContent?.trim() || null;
  };
  const ueImg = (name) => {
    const el = itemEl.querySelector(`[data-aue-prop="${name}"]`);
    if (!el) return null;
    if (el.tagName?.toLowerCase() === 'img') return el.getAttribute('src');
    return el.querySelector('img')?.getAttribute('src') || ueHref(name);
  };
  const ueTags = (name) => {
    const el = itemEl.querySelector(`[data-aue-prop="${name}"]`);
    if (!el) return null;
    const chips = [...el.children].map((c) => c.textContent?.trim()).filter(Boolean);
    const tokens = chips.length > 1 ? chips : splitTags(el.textContent);
    return [...new Set(tokens.flatMap((t) => splitTags(t)))];
  };

  const hasUe = !!itemEl.querySelector('[data-aue-prop]');

  // Positional fallback in item model order (published EDS).
  const rows = [...itemEl.children];
  const ct = (i) => rows[i]?.textContent?.trim() || '';
  const cl = (i) => rows[i]?.querySelector('a')?.getAttribute('href') || ct(i);
  const cimg = (i) => rows[i]?.querySelector('img')?.getAttribute('src') || '';
  const descCell = () => {
    const el = hasUe
      ? itemEl.querySelector('[data-aue-prop="description"]')
      : rows[4];
    return el && el.children.length ? el : null;
  };

  return {
    link: hasUe ? (ueHref('link') ?? '') : cl(0),
    openInNewTab: parseBool(hasUe ? ueText('openInNewTab') : ct(1), false),
    linkText: (hasUe ? ueText('linkText') : ct(2)) || '',
    subtitle: (hasUe ? ueText('subtitle') : ct(3)) || '',
    descriptionEl: descCell(),
    categoryTags: (hasUe ? ueTags('categoryTags') : null)
      ?? [...new Set(splitTags(ct(5)).flatMap((t) => splitTags(t)))],
    iconType: (hasUe ? ueText('iconType') : ct(6)) || 'none',
    fontIcon: (hasUe ? ueText('fontIcon') : ct(7)) || '',
    imageIcon: (hasUe ? ueImg('imageIcon') : cimg(8)) || '',
    iconPosition: (hasUe ? ueText('iconPosition') : ct(9)) || 'before',
    iconLink: (hasUe ? ueHref('iconLink') : cl(10)) || '',
    enableModal: parseBool(hasUe ? ueText('enableConfirmationModal') : ct(11), false),
    modalType: (hasUe ? ueText('confirmationModalType') : ct(12)) || 'standard',
    modalId: (hasUe ? ueText('modalId') : ct(13)) || '',
    id: (hasUe ? ueText('id') : ct(14)) || '',
    customClass: (hasUe ? ueText('customClass') : ct(15)) || '',
    analyticsId: (hasUe ? ueText('analyticsId') : ct(16)) || '',
    lang: normalizeLang(hasUe ? ueText('language') : ct(17)),
    ariaLabel: (hasUe ? ueText('ariaLabel') : ct(18)) || '',
  };
}

// ---------------------------------------------------------------------------
// Icon + link controls
// ---------------------------------------------------------------------------

/** Builds an icon element from item/block config. Maps model values to createIcon types. */
function buildIcon(type, fontIconName, imageSrc) {
  if ((type === 'icon-font' || type === 'font') && fontIconName) {
    return createIcon(fontIconName, 'icon-font', { additionalClasses: 'sll-item-icon' });
  }
  if (type === 'image' && imageSrc) {
    return createIcon(imageSrc, 'image', { additionalClasses: 'sll-item-icon sll-item-icon-img' });
  }
  return null;
}

/** Builds the upper-right open-link control. */
function buildOpenLink(href, label, openNewTab, ph) {
  if (!href) return null;
  const anchor = document.createElement('a');
  anchor.className = 'sll-item-open-link';
  anchor.href = href;
  anchor.setAttribute('aria-label', `${ph.open || 'Open'} ${label}`);
  if (openNewTab) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  return anchor;
}

/** Wires a confirmation modal so navigation proceeds only on confirm (FR-006). */
function bindConfirmationModal(anchor, item) {
  const href = item.link;
  if (!href) return;
  const navigate = () => {
    if (item.openInNewTab) window.open(href, '_blank', 'noopener,noreferrer');
    else window.location.assign(href);
  };

  anchor.dataset.modalType = item.modalType || 'standard';
  anchor.dataset.modalId = item.modalId;

  anchor.addEventListener('click', async (e) => {
    e.preventDefault();
    // Path-shaped modalId → load a modal fragment; otherwise signal an in-page modal.
    if (item.modalId.startsWith('/')) {
      try {
        const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
        await openModal(item.modalId, href, {
          onConfirm: navigate,
          modalType: item.modalType || 'standard',
        });
        return;
      } catch {
        navigate();
        return;
      }
    }
    const modal = document.getElementById(item.modalId);
    if (modal) {
      modal.dispatchEvent(new CustomEvent('open', {
        detail: { href, modalType: item.modalType, onConfirm: navigate },
      }));
    } else {
      navigate();
    }
  });
}

// ---------------------------------------------------------------------------
// Item rendering
// ---------------------------------------------------------------------------

/** Builds a display tag chip list, resolving tag ids to titles via labelOf. */
function buildTagList(tags, ph, labelOf = (t) => t) {
  const ul = document.createElement('ul');
  ul.className = 'sll-item-tags';
  ul.setAttribute('aria-label', ph.categories || 'categories');
  tags.forEach((tag) => {
    const li = document.createElement('li');
    li.className = 'sll-item-tag';
    li.textContent = labelOf(tag);
    ul.append(li);
  });
  return ul;
}

/** Builds a single <li> from a Custom Link List Item element. */
function buildCustomItem(itemEl, ph, labelOf) {
  const item = readItemConfig(itemEl);
  if (!item.link && !item.linkText && !item.subtitle && !item.categoryTags.length
    && !item.descriptionEl) {
    return null;
  }

  const li = document.createElement('li');
  li.className = 'sll-item';
  if (item.id) li.id = item.id;
  if (item.customClass) li.classList.add(...item.customClass.split(/\s+/).filter(Boolean));
  if (item.lang) li.lang = item.lang;
  if (item.categoryTags.length) li.dataset.tags = JSON.stringify(item.categoryTags);
  moveInstrumentation(itemEl, li);

  const anchor = document.createElement('a');
  anchor.className = 'sll-item-link';
  if (item.link) anchor.href = item.link;
  if (item.ariaLabel) anchor.setAttribute('aria-label', item.ariaLabel);
  if (item.analyticsId) anchor.dataset.analyticsInteractionId = item.analyticsId;
  if (item.openInNewTab) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  if (isExternalUrl(item.link)) {
    anchor.classList.add('sll-item-link-external');
    const ext = document.createElement('span');
    ext.className = 'sll-external-indicator';
    ext.setAttribute('aria-label', ph['external-link'] || '(opens external site)');
    anchor.append(ext);
  }
  if (item.enableModal && item.modalId) bindConfirmationModal(anchor, item);

  const textSpan = document.createElement('span');
  textSpan.className = 'sll-item-text';
  textSpan.textContent = item.linkText;

  const iconEl = buildIcon(item.iconType, item.fontIcon, item.imageIcon);
  const placeIcon = (target, position) => {
    if (!iconEl) return;
    let node = iconEl;
    if (item.iconLink) {
      const iconAnchor = document.createElement('a');
      iconAnchor.href = item.iconLink;
      iconAnchor.className = 'sll-item-icon-link';
      iconAnchor.setAttribute('aria-hidden', 'true');
      iconAnchor.tabIndex = -1;
      iconAnchor.append(iconEl);
      node = iconAnchor;
    }
    if (position === 'before') target.prepend(node);
    else target.append(node);
  };

  if (iconEl && item.iconPosition === 'before') placeIcon(anchor, 'before');
  anchor.append(textSpan);
  if (iconEl && item.iconPosition !== 'before') placeIcon(anchor, 'after');

  li.append(anchor);
  const openLink = buildOpenLink(item.link, item.ariaLabel || item.linkText, item.openInNewTab, ph);
  if (openLink) li.append(openLink);

  if (item.subtitle) {
    const sub = document.createElement('p');
    sub.className = 'sll-item-subtitle';
    sub.textContent = item.subtitle;
    li.append(sub);
  }

  if (item.descriptionEl?.children.length) {
    const desc = document.createElement('div');
    desc.className = 'sll-item-description';
    while (item.descriptionEl.firstChild) desc.append(item.descriptionEl.firstChild);
    li.append(desc);
  }

  if (item.categoryTags.length) {
    li.append(buildTagList(item.categoryTags, ph, labelOf));
  }

  return li;
}

// ---------------------------------------------------------------------------
// Child Pages data source (FR-004)
// ---------------------------------------------------------------------------

async function fetchChildPageItems(cfg, ph, labelOf) {
  const parentPage = normalizeParentPage(cfg.parentPage);
  if (!parentPage) return [];

  const primary = parentPage === '/' ? '/query-index.json' : `${parentPage.replace(/\/$/, '')}/query-index.json`;
  let json;
  try {
    let resp = await fetch(primary);
    if (!resp.ok && primary !== '/query-index.json') resp = await fetch('/query-index.json');
    if (!resp.ok) return [];
    json = await resp.json();
  } catch {
    return [];
  }

  let items = json.data || [];
  const parentDepth = parentPage.replace(/\/$/, '').split('/').length;
  const maxDepth = parentDepth + (cfg.childDepth || 1);
  items = items.filter(({ path }) => {
    const d = String(path).split('/').length;
    return d > parentDepth && d <= maxDepth;
  });

  if (cfg.excludeCurrentPage) {
    const current = window.location.pathname.replace(/\/$/, '');
    items = items.filter(({ path }) => path !== current);
  }

  const dir = cfg.sortOrder === 'desc' ? -1 : 1;
  if (cfg.orderBy === 'title') {
    items.sort((a, b) => dir * (a.title || '').localeCompare(b.title || ''));
  } else if (cfg.orderBy === 'last-modified') {
    items.sort((a, b) => dir * ((a.lastModified || 0) - (b.lastModified || 0)));
  } else if (cfg.orderBy === 'published') {
    items.sort((a, b) => dir * ((a.publishDate || 0) - (b.publishDate || 0)));
  }

  if (cfg.maxItems) items = items.slice(0, cfg.maxItems);

  return items.map((page) => {
    const li = document.createElement('li');
    li.className = 'sll-item';
    const tags = page.tags ? splitTags(page.tags) : [];
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
    const openLink = buildOpenLink(href, page.title || href, false, ph);
    if (openLink) li.append(openLink);

    if (cfg.enableSubtitle && page.subtitle) {
      const sub = document.createElement('p');
      sub.className = 'sll-item-subtitle';
      sub.textContent = page.subtitle;
      li.append(sub);
    }
    if (cfg.enableDescription && page.description) {
      const desc = document.createElement('p');
      desc.className = 'sll-item-description';
      desc.textContent = page.description;
      li.append(desc);
    }
    if (cfg.enableDate) {
      const dateVal = page.publishDate || page.lastModified;
      if (dateVal) {
        const time = document.createElement('time');
        time.className = 'sll-item-date';
        const d = new Date(dateVal * 1000);
        time.dateTime = d.toISOString();
        time.textContent = d.toLocaleDateString();
        li.append(time);
      }
    }
    if (cfg.enableTags && tags.length) li.append(buildTagList(tags, ph, labelOf));
    return li;
  });
}

// ---------------------------------------------------------------------------
// Search & filter (FR-001 / FR-002 / FR-003 / FR-008)
// ---------------------------------------------------------------------------

/**
 * Resolves the filterable unit elements inside a Search-In-ID target region,
 * regardless of which block rendered it. Prefers list items, then any direct
 * child carrying a link or text. Marks each so the filter can hide it.
 */
function collectExternalUnits(target) {
  let units = [...target.querySelectorAll(':scope > ul > li, :scope > ol > li')];
  if (!units.length) units = [...target.querySelectorAll(':scope > li')];
  if (!units.length) {
    units = [...target.children].filter(
      (el) => el.querySelector('a, .sll-item-text') || el.textContent.trim(),
    );
  }
  units.forEach((u) => u.classList.add('sll-item'));
  return units;
}

/**
 * Filters a flat list of unit elements by search text (case-insensitive title
 * contains) AND category tags (item tags intersect the active selection — OR
 * across selected tags). Units may live in this block's list or in a separate
 * Search-In-ID target region (FR-008).
 */
function makeFilterer(units, emptyMsg, getCountEl, ph) {
  return (searchText, activeTagSet) => {
    const query = searchText.toLowerCase().trim();
    let visibleCount = 0;

    units.forEach((el) => {
      const title = (el.querySelector('.sll-item-text')?.textContent ?? el.textContent ?? '')
        .toLowerCase();
      const matchesSearch = !query || title.includes(query);
      const itemTags = el.dataset.tags ? JSON.parse(el.dataset.tags) : [];
      // Intersection: item is kept when it carries ANY of the selected tags.
      const matchesTags = activeTagSet.size === 0
        || [...activeTagSet].some((tag) => itemTags.includes(tag));
      const visible = matchesSearch && matchesTags;
      el.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    const hasActiveFilters = !!query || activeTagSet.size > 0;
    const countEl = getCountEl();
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
    return visibleCount;
  };
}

// ---------------------------------------------------------------------------
// Search bar (FR-001)
// ---------------------------------------------------------------------------

function buildSearchBar(cfg, ph) {
  const wrapper = document.createElement('div');
  wrapper.className = 'sll-search-wrapper';

  const iconEl = buildIcon(cfg.searchIcon, cfg.searchIconText, cfg.searchIconAlt);
  if (iconEl) {
    iconEl.classList.add('sll-search-icon');
    wrapper.append(iconEl);
  }

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'sll-search-input';
  input.placeholder = cfg.searchHint || ph.search || 'Search';
  input.setAttribute('aria-label', cfg.searchHint || ph.search || 'Search');

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'sll-search-clear';
  clearBtn.setAttribute('aria-label', ph['clear-search'] || 'Clear search');
  clearBtn.hidden = true;
  clearBtn.innerHTML = '&times;';

  input.addEventListener('input', () => { clearBtn.hidden = !input.value; });
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
// Category filter (FR-002 / FR-003)
// ---------------------------------------------------------------------------

/**
 * Builds the browse-categories dropdown and selected-tag chips.
 * The '0 Result(s) found' count is rendered ABOVE the selected tags (FR-003).
 */
function buildCategoryFilter(allTags, cfg, ph, activeTagSet, onTagsChanged, labelOf = (t) => t) {
  if (!allTags.length) return null;

  const container = document.createElement('div');
  container.className = 'sll-category-filter';

  const dropdownWrapper = document.createElement('div');
  dropdownWrapper.className = 'sll-category-dropdown-wrapper';

  const dropdownBtn = document.createElement('button');
  dropdownBtn.type = 'button';
  dropdownBtn.className = 'sll-category-dropdown-btn';
  dropdownBtn.setAttribute('aria-haspopup', 'listbox');
  dropdownBtn.setAttribute('aria-expanded', 'false');
  dropdownBtn.textContent = cfg.browseCategories || ph['browse-categories'] || 'Browse Categories';

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
    option.textContent = labelOf(tag);
    option.dataset.tag = tag;
    dropdownList.append(option);
  });

  dropdownBtn.addEventListener('click', () => {
    const isOpen = !dropdownList.hidden;
    dropdownList.hidden = isOpen;
    dropdownBtn.setAttribute('aria-expanded', String(!isOpen));
  });
  document.addEventListener('click', (e) => {
    if (!dropdownWrapper.contains(e.target)) {
      dropdownList.hidden = true;
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
  });

  dropdownWrapper.append(dropdownBtn, dropdownList);

  // Count is placed above the chips per FR-003.
  const countEl = document.createElement('p');
  countEl.className = 'sll-results-count';
  countEl.setAttribute('aria-live', 'polite');
  countEl.hidden = true;

  const chipsArea = document.createElement('div');
  chipsArea.className = 'sll-selected-tags';
  chipsArea.setAttribute('aria-live', 'polite');

  const updateChips = () => {
    chipsArea.innerHTML = '';
    activeTagSet.forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'sll-tag-chip';
      chip.textContent = labelOf(tag);
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'sll-tag-chip-remove';
      removeBtn.setAttribute('aria-label', `${ph['remove-filter'] || 'Remove filter'}: ${labelOf(tag)}`);
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

  container.append(dropdownWrapper, countEl, chipsArea);

  let resetBtn = null;
  if (cfg.resetCategories) {
    resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'sll-reset-btn';
    resetBtn.textContent = cfg.resetCategories;
    container.append(resetBtn);
  }

  return {
    container, countEl, resetBtn, updateChips,
  };
}

// ---------------------------------------------------------------------------
// Main decorate
// ---------------------------------------------------------------------------

export default async function decorate(block) {
  const [ph, tagsLookup] = await Promise.all([fetchPlaceholders(), getTagsLookup()]);
  const labelOf = (id) => tagsLookup.get(id) || tagIdToLabel(id);
  const cfg = readBlockConfig(block);

  if (cfg.id) block.id = cfg.id;
  if (cfg.customClass) block.classList.add(...cfg.customClass.split(/\s+/).filter(Boolean));
  block.classList.add(`layout-${cfg.layout}`);
  if (cfg.lang) block.lang = cfg.lang;
  if (cfg.analyticsId) block.dataset.analyticsId = cfg.analyticsId;

  // Build own list items.
  const listEl = document.createElement('ul');
  listEl.className = 'sll-list';

  let listItems = [];
  if (cfg.linkSource === 'child-pages') {
    listItems = await fetchChildPageItems(cfg, ph, labelOf);
  } else {
    collectItemEls(block, cfg).forEach((itemEl) => {
      const li = buildCustomItem(itemEl, ph, labelOf);
      if (li) listItems.push(li);
    });
  }
  listItems.forEach((li) => listEl.append(li));

  // FR-002: the browse control lists the child tags beneath the configured parent
  // Category Tags (resolved from tags.json). With no parent tags configured the
  // entire category UI stays hidden.
  const itemTags = [...new Set(
    listItems.flatMap((li) => (li.dataset.tags ? JSON.parse(li.dataset.tags) : [])),
  )];
  let allTags = [];
  if (cfg.categoryTags.length) {
    const parents = cfg.categoryTags;
    const childIds = new Set(
      [...tagsLookup.keys()].filter((id) => parents.some((p) => isChildTag(id, p))),
    );
    // Include any item tags under a parent even if tags.json lacked them.
    itemTags
      .filter((id) => parents.some((p) => isChildTag(id, p)))
      .forEach((id) => childIds.add(id));
    // Fallback when taxonomy is unavailable: surface the item tags we do have.
    allTags = childIds.size ? [...childIds] : itemTags;
  }

  const controlsEl = document.createElement('div');
  controlsEl.className = 'sll-controls';

  const activeTagSet = new Set();
  let currentSearch = '';

  const emptyMsg = document.createElement('p');
  emptyMsg.className = 'sll-empty-message';
  emptyMsg.textContent = ph['no-results'] || 'No results found. Change your search criteria.';
  emptyMsg.hidden = true;

  // FR-008: also filter a separate target region resolved by Search-In-ID.
  const units = [...listEl.children];
  if (cfg.searchInId) {
    const target = document.getElementById(cfg.searchInId)
      || document.querySelector(`[data-search-id="${CSS.escape(cfg.searchInId)}"]`);
    if (target) units.push(...collectExternalUnits(target));
  }

  let countEl = null;
  const filter = makeFilterer(units, emptyMsg, () => countEl, ph);
  const refresh = () => filter(currentSearch, activeTagSet);

  // Search bar
  const { wrapper: searchWrapper, input: searchInput } = buildSearchBar(cfg, ph);
  searchInput.addEventListener('input', () => {
    currentSearch = searchInput.value;
    refresh();
  });
  controlsEl.append(searchWrapper);

  // Category filter
  const categoryResult = buildCategoryFilter(allTags, cfg, ph, activeTagSet, refresh, labelOf);
  if (categoryResult) {
    countEl = categoryResult.countEl;
    controlsEl.append(categoryResult.container);

    if (categoryResult.resetBtn) {
      categoryResult.resetBtn.addEventListener('click', () => {
        activeTagSet.clear();
        currentSearch = '';
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        categoryResult.container
          .querySelectorAll('.sll-category-option')
          .forEach((opt) => opt.setAttribute('aria-selected', 'false'));
        categoryResult.updateChips();
        refresh();
      });
    }
  }

  block.innerHTML = '';
  block.append(controlsEl, listEl, emptyMsg);
}
