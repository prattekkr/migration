import { loadFragment } from '../fragment/fragment.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import decorateExternalLinksUtility, {
  applyCommonProps,
  sanitizeLiteralBrTags,
  sanitizeLiteralSpaces,
  extractIconSource,
  createIcon,
  normalizeLang,
} from '../../scripts/utils.js';

/*
 * Accordion V2 Block
 * Net-new version of the accordion block with EDS Fragment support (FR-001),
 * deep-link (FR-002), analytics (FR-003), per-item language (FR-004),
 * override ARIA labels (FR-005), responsive CSS (FR-006), and icon-font
 * DOM construction (FR-007).
 *
 * V2 config rows (0-14, 15 total):
 *   0  blockHeading
 *   1  expandAllText
 *   2  collapseAllText
 *   3  expandAllIcon
 *   4  collapseAllIcon
 *   5  expandIcon
 *   6  collapseIcon
 *   7  expandAllIconImage
 *   8  collapseAllIconImage
 *   9  expandIconImage
 *  10  collapseIconImage
 *  11  ariaExpandAllLabel (base)
 *  12  ariaCollapseAllLabel (base)
 *  13  ariaExpandAllLabelOverride  (V2 — FR-005)
 *  14  ariaCollapseAllLabelOverride (V2 — FR-005)
 *
 * Item rows per item:
 *   0  summary (heading text)
 *   1  text (RTE body, used when richContent is off)
 *   2  item classes (defaultopen, etc.)
 *   3  ariaExpandLabel
 *   4  ariaCollapseLabel
 *   5  richContent flag ("true"/"false")
 *   6  reference (fragment path link, used when richContent is on)
 *   7  blockId  (from _common-properties)
 *   8  language (from _common-properties)
 *   9  analyticsId (from _common-properties)
 */

// Number of block-level config rows consumed before item rows begin.
const BLOCK_CONFIG_ROWS = 15;

// ── Icon helpers ──────────────────────────────────────────────────────────────

function getIconImage(row) {
  if (!row) return null;
  const cell = row.firstElementChild || row;
  const source = extractIconSource(cell);
  return source ? createIcon(source, 'image') : null;
}

// ── Config extraction ─────────────────────────────────────────────────────────

/**
 * Extracts the 15 block-level config rows and removes them from the DOM.
 * Returns a config object consumed by the rest of decorate().
 * @param {Element} block
 */
function extractConfig(block) {
  const children = [...block.children];

  const text = (idx) => children[idx]?.textContent?.trim() || '';
  const icon = (idx) => `icon-abbvie-${text(idx)}`;

  const headingText = text(0);
  const expandAllText = text(1) || 'Expand All';
  const collapseAllText = text(2) || 'Collapse All';
  const expandAllIcon = icon(3);
  const collapseAllIcon = icon(4);
  const expandIcon = icon(5);
  const collapseIcon = icon(6);
  const expandAllIconImage = getIconImage(children[7]);
  const collapseAllIconImage = getIconImage(children[8]);
  const expandIconImage = getIconImage(children[9]);
  const collapseIconImage = getIconImage(children[10]);
  const ariaExpandAllLabel = text(11);
  const ariaCollapseAllLabel = text(12);
  // FR-005: override ARIA labels (V2 only)
  const ariaExpandAllLabelOverride = text(13);
  const ariaCollapseAllLabelOverride = text(14);

  // Remove all 15 config rows
  for (let i = BLOCK_CONFIG_ROWS - 1; i >= 0; i -= 1) {
    children[i]?.remove();
  }

  return {
    headingText,
    expandAllText,
    collapseAllText,
    expandAllIcon,
    collapseAllIcon,
    expandIcon,
    collapseIcon,
    expandAllIconImage,
    collapseAllIconImage,
    expandIconImage,
    collapseIconImage,
    ariaExpandAllLabel,
    ariaCollapseAllLabel,
    ariaExpandAllLabelOverride,
    ariaCollapseAllLabelOverride,
  };
}

// ── Heading decoration ────────────────────────────────────────────────────────

function decorateHeading(block, headingText) {
  const headingWrapper = document.createElement('div');
  headingWrapper.className = 'accordion-block-heading-wrapper';
  if (headingText) {
    const span = document.createElement('span');
    span.className = 'accordion-block-heading';
    span.textContent = headingText;
    headingWrapper.appendChild(span);
  }
  block.prepend(headingWrapper);
}

// ── Expand/Collapse All button (FR-005 override ARIA labels) ──────────────────

function addExpandCollapseAllButton(block, cfg) {
  const headingWrapper = block.querySelector('.accordion-block-heading-wrapper');
  const expandAllBtn = document.createElement('button');
  expandAllBtn.className = 'accordion-expand-all';
  expandAllBtn.type = 'button';

  const textSpan = document.createElement('span');
  textSpan.className = 'accordion-expand-all-text';

  const isImageIcon = block.classList.contains('accordion-icon-image');
  let fontIcon = null;

  // FR-005: use override ARIA labels when provided, fall back to visible label text
  const effectiveExpandAriaLabel = cfg.ariaExpandAllLabelOverride || cfg.ariaExpandAllLabel;
  const effectiveCollapseAriaLabel = cfg.ariaCollapseAllLabelOverride || cfg.ariaCollapseAllLabel;

  if (isImageIcon) {
    expandAllBtn.append(textSpan);
    const buttonWrapper = document.createElement('span');
    buttonWrapper.className = 'accordion-expand-all-wrapper';
    buttonWrapper.appendChild(expandAllBtn);
    if (cfg.expandAllIconImage) {
      cfg.expandAllIconImage.classList.add('accordion-expand-all-image-icon');
      buttonWrapper.appendChild(cfg.expandAllIconImage);
    }
    if (cfg.collapseAllIconImage) {
      cfg.collapseAllIconImage.classList.add('accordion-collapse-all-image-icon');
      buttonWrapper.appendChild(cfg.collapseAllIconImage);
    }
    buttonWrapper.addEventListener('click', (e) => {
      if (e.target !== expandAllBtn && !expandAllBtn.contains(e.target)) {
        expandAllBtn.click();
      }
    });
    headingWrapper.append(buttonWrapper);
  } else {
    fontIcon = document.createElement('i');
    fontIcon.className = 'accordion-expand-all-icon';
    fontIcon.setAttribute('aria-hidden', 'true');
    expandAllBtn.append(textSpan, fontIcon);
    headingWrapper.append(expandAllBtn);
  }

  function updateButtonState(allOpen) {
    textSpan.textContent = allOpen ? cfg.collapseAllText : cfg.expandAllText;

    // FR-005: use override label when present, fall back to visible text
    const ariaLabel = allOpen
      ? (effectiveCollapseAriaLabel || cfg.collapseAllText)
      : (effectiveExpandAriaLabel || cfg.expandAllText);
    expandAllBtn.setAttribute('aria-label', ariaLabel);
    expandAllBtn.classList.toggle('expanded', allOpen);
    if (fontIcon) {
      fontIcon.className = `accordion-expand-all-icon ${allOpen ? cfg.collapseAllIcon : cfg.expandAllIcon}`;
    }
  }

  let showingCollapse = false;

  expandAllBtn.addEventListener('click', () => {
    const allDetails = block.querySelectorAll('details.accordion-item');
    allDetails.forEach((d) => {
      d.open = !showingCollapse;
    });
    showingCollapse = !showingCollapse;
    updateButtonState(showingCollapse);
  });

  // Set initial state
  const initialDetails = [...block.querySelectorAll('details.accordion-item')];
  const allInitialOpen = initialDetails.length > 0 && initialDetails.every((d) => d.open);
  const noneInitialOpen = initialDetails.every((d) => !d.open);
  if (allInitialOpen) showingCollapse = true;
  else if (noneInitialOpen) showingCollapse = false;
  updateButtonState(showingCollapse);

  // Sync on toggle
  block.addEventListener('toggle', () => {
    const allDetails = block.querySelectorAll('details.accordion-item');
    [...allDetails].forEach((e) => {
      e.firstElementChild?.classList.toggle('open', e.open);
    });
    const allOpen = [...allDetails].every((d) => d.open);
    const allClosed = [...allDetails].every((d) => !d.open);
    if (allOpen) showingCollapse = true;
    else if (allClosed) showingCollapse = false;
    updateButtonState(showingCollapse);
  }, true);
}

// ── Exclusive open mode ───────────────────────────────────────────────────────

function closeAllExceptCurrent(block) {
  if (!block.classList.contains('allowmultipleopen')) {
    const details = block.querySelectorAll('details.accordion-item');
    details.forEach((detail) => {
      detail.addEventListener('toggle', () => {
        if (detail.open) {
          details.forEach((d) => {
            if (d !== detail) {
              d.open = false;
            }
          });
        }
      });
    });
  }
}

// ── Analytics (FR-003) ────────────────────────────────────────────────────────

function emitAnalyticsEvent(analyticsId, isOpen) {
  if (!analyticsId) return;
  try {
    window.adobeDataLayer?.push({
      event: 'accordion:toggle',
      interactionId: analyticsId,
      action: isOpen ? 'expand' : 'collapse',
    });
  } catch {
    // Analytics failures must never break the block.
  }
}

// ── Deep-link (FR-002) ────────────────────────────────────────────────────────

function handleDeepLink(block) {
  const { hash } = window.location;
  if (!hash) return;

  let targetId;
  try {
    targetId = decodeURIComponent(hash.substring(1));
  } catch {
    return;
  }

  if (!targetId) return;

  const target = block.querySelector(`details.accordion-item[id="${CSS.escape(targetId)}"]`);
  if (!target) return;

  target.open = true;
  // Scroll after layout settles
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ── Fragment loading (FR-001) ─────────────────────────────────────────────────

/**
 * Resolves the fragment path from a row cell. The reference field is an
 * aem-content picker that produces an <a href="/path"> link on delivery
 * and a data-aue-prop instrumented element in Universal Editor.
 * @param {Element} row
 * @returns {string} path or empty string
 */
function getFragmentPath(row) {
  if (!row) return '';
  const refCell = row.children[6];
  if (!refCell) return '';

  // UE edit mode: data-aue-prop instrumented element with data-aue-value
  const ueField = refCell.querySelector('[data-aue-prop="reference"]');
  if (ueField) {
    return ueField.getAttribute('data-aue-value') || ueField.getAttribute('href') || '';
  }

  // Delivery mode: <a href="/path/to/fragment">
  const link = refCell.querySelector('a[href]');
  if (link) {
    const href = link.getAttribute('href');
    // Validate — only internal absolute paths allowed (no javascript: etc.)
    if (href && href.startsWith('/')) return href;
  }

  // Plain text fallback
  const txt = refCell.textContent?.trim();
  if (txt && txt.startsWith('/')) return txt;

  return '';
}

/**
 * Loads an EDS fragment and inlines its content into the given panel.
 * Deferred until first expand (NFR-001). Cached to avoid re-fetching.
 * @param {Element} panel - The panel element (.accordion-item-body)
 * @param {string} fragmentPath - Absolute path to the fragment
 */
async function loadAndInlineFragment(panel, fragmentPath) {
  const frag = await loadFragment(fragmentPath);
  if (frag) {
    // Move all sections from the fragment main into the panel.
    // Preserve any instructed EDS sections/blocks already decorated.
    panel.replaceChildren(...frag.childNodes);
  }
  // If frag is null (unresolvable), panel stays empty — item remains operable.
  // (FR-001 exception AC)
}

// ── Row parsing and DOM construction ─────────────────────────────────────────

/**
 * Reads the "richContent" flag from item row index 5.
 * Authored as a boolean — the framework renders as plain text "true"/"false"
 * on delivery, and as a data-aue-prop element in UE edit mode.
 * @param {Element} row
 * @returns {boolean}
 */
function isRichContent(row) {
  const cell = row.children[5];
  if (!cell) return false;

  // UE edit mode: prop name is "richContent" (plain boolean, no classes_ prefix)
  const ueField = cell.querySelector('[data-aue-prop="richContent"]');
  if (ueField) {
    const val = ueField.getAttribute('data-aue-value') || ueField.textContent?.trim() || '';
    return val.toLowerCase() === 'true';
  }

  const txt = cell.textContent?.trim().toLowerCase();
  return txt === 'true';
}

/**
 * Reads per-item common properties (blockId, language, analyticsId).
 * These live at item row indices 7, 8, 9 (not consumed by applyCommonProps
 * which applies at block level).
 * @param {Element} row
 * @returns {{ itemId: string, itemLang: string, itemAnalyticsId: string }}
 */
function getItemCommonProps(row) {
  const cellText = (idx) => row.children[idx]?.textContent?.trim() || '';

  const rawLang = cellText(8);
  return {
    itemId: cellText(7),
    itemLang: normalizeLang(rawLang),
    itemAnalyticsId: cellText(9),
  };
}

/**
 * Builds one accordion item (<details>) from an authored row.
 *
 * Item row layout:
 *   children[0] = summary text
 *   children[1] = body RTE (non-rich mode)
 *   children[2] = item class overrides (e.g. "defaultopen")
 *   children[3] = aria-label when expanded
 *   children[4] = aria-label when collapsed
 *   children[5] = richContent boolean flag
 *   children[6] = fragment reference (rich mode)
 *   children[7] = blockId (common)
 *   children[8] = language (common)
 *   children[9] = analyticsId (common)
 *
 * @param {Element} row - The authored block row
 * @param {object} cfg - Block-level config from extractConfig()
 * @param {string[]} headingSizeClasses - e.g. ['h3-size']
 * @returns {Element} Decorated <details> element
 */
function buildItem(row, cfg, headingSizeClasses) {
  if (!row.children[0] || !row.children[1]) return null;

  const isImageIcon = cfg.blockEl?.classList?.contains('accordion-icon-image') || false;

  // ── Summary (header) ──
  const label = row.children[0];
  const summary = document.createElement('summary');
  summary.className = 'accordion-item-label';
  summary.append(...label.childNodes);
  summary.classList.add(...headingSizeClasses);
  if (summary.firstElementChild) {
    summary.firstElementChild.classList.add('accordion-item-label-text');
  }

  // ── Body ──
  const body = row.children[1];
  body.className = 'accordion-item-body';
  sanitizeLiteralBrTags(body);
  sanitizeLiteralSpaces(body);

  // ── Accessibility labels ──
  const ariaExpandLabel = row.children[3]?.textContent?.trim() || '';
  const ariaCollapseLabel = row.children[4]?.textContent?.trim() || '';

  // ── Common props ──
  const { itemId, itemLang, itemAnalyticsId } = getItemCommonProps(row);

  // ── Item class / defaultOpen ──
  const itemClasses = row.children[2]?.textContent?.trim().replaceAll(',', '') || '';
  const isDefaultOpen = itemClasses.includes('defaultopen');

  // ── Rich content / fragment (FR-001) ──
  const rich = isRichContent(row);
  const fragmentPath = rich ? getFragmentPath(row) : '';

  // ── Build <details> ──
  const details = document.createElement('details');
  moveInstrumentation(row, details);
  details.className = `accordion-item ${itemClasses}`.trim();

  // FR-002: set item id for deep-linking
  if (itemId) {
    details.id = itemId;
  }

  // FR-004: apply language to panel body
  if (itemLang) {
    body.setAttribute('lang', itemLang);
  }

  if (isDefaultOpen) {
    if (!isImageIcon) summary.classList.add(cfg.collapseIcon);
    details.setAttribute('open', '');
    details.setAttribute('aria-label', ariaExpandLabel);
  } else {
    if (!isImageIcon) summary.classList.add(cfg.expandIcon);
    summary.setAttribute('aria-label', ariaCollapseLabel);
  }

  // Image icons for expand/collapse
  if (isImageIcon) {
    if (cfg.expandIconImage) {
      const expandIconEl = cfg.expandIconImage.cloneNode(true);
      expandIconEl.classList.add('accordion-expand-image-icon');
      summary.appendChild(expandIconEl);
    }
    if (cfg.collapseIconImage) {
      const collapseIconEl = cfg.collapseIconImage.cloneNode(true);
      collapseIconEl.classList.add('accordion-collapse-image-icon');
      summary.appendChild(collapseIconEl);
    }
  }

  // Toggle handler: syncs icon classes, ARIA label, language, analytics (FR-003/FR-004)
  details.addEventListener('toggle', () => {
    details.setAttribute('aria-label', details.open ? ariaExpandLabel : ariaCollapseLabel);
    summary.classList.toggle('open', details.open);
    if (!isImageIcon) {
      summary.classList.toggle(cfg.collapseIcon, details.open);
      summary.classList.toggle(cfg.expandIcon, !details.open);
    }
    // FR-003: emit analytics event
    emitAnalyticsEvent(itemAnalyticsId, details.open);
  });

  // FR-001: deferred fragment loading with caching.
  // Reserve panel space unconditionally to prevent CLS (NFR-001) — the minimum
  // height is cleared once content has loaded or once the item is open with
  // no fragment to load.
  if (rich && fragmentPath) {
    let fragmentLoaded = false;
    body.style.minHeight = '2rem';

    const loadOnOpen = async () => {
      if (fragmentLoaded) return;
      fragmentLoaded = true;
      await loadAndInlineFragment(body, fragmentPath);
      body.style.removeProperty('min-height');
    };

    details.addEventListener('toggle', async () => {
      if (!details.open) return;
      await loadOnOpen();
    });

    // Items opened by default (static `open` attribute) never fire a `toggle`
    // event, so trigger the first load via a microtask after the DOM is settled.
    if (isDefaultOpen) {
      Promise.resolve().then(loadOnOpen);
    }
  }

  details.append(summary, body);
  row.replaceWith(details);
  return details;
}

// ── Main decorate function ────────────────────────────────────────────────────

/**
 * Decorates the accordion-v2 block.
 * @param {Element} block
 */
export default function decorate(block) {
  // Apply block-level common properties (blockId, lang, analyticsId) —
  // these live at rows 15, 16, 17 (applyCommonProps uses startIndex).
  applyCommonProps(block, BLOCK_CONFIG_ROWS);

  const cfg = extractConfig(block);
  // Expose block reference so buildItem can check icon type
  cfg.blockEl = block;

  // Extract heading-size classes (h1-size…h6-size) and apply only to summaries
  const headingSizeClasses = [...block.classList].filter((cls) => /^h[1-6]-size$/.test(cls));
  block.classList.remove(...headingSizeClasses);

  // Build items from remaining rows
  [...block.children].forEach((row) => {
    buildItem(row, cfg, headingSizeClasses);
  });

  // Block heading and expand-all button
  decorateHeading(block, cfg.headingText);

  if (block.classList.contains('showexpandcollapseall')) {
    addExpandCollapseAllButton(block, cfg);
  }

  // Exclusive open mode
  closeAllExceptCurrent(block);

  // FR-002: deep-link — expand item matching URL hash
  handleDeepLink(block);

  // External link decoration
  decorateExternalLinksUtility(block);

  // Convert title attributes to aria-label on links (matches V1 behaviour)
  block.querySelectorAll('a[title]').forEach((a) => {
    const { title } = a;
    if (title?.trim()) {
      a.setAttribute('aria-label', title);
      a.removeAttribute('title');
    }
  });
}
