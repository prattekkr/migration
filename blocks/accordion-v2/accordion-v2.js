/**
 * Accordion V2 Block
 *
 * Extends the v1 accordion with:
 *   - FR-001: Per-item EDS fragment lazy-loaded on first expand
 *   - FR-002: URL-hash deep-link auto-expand
 *   - FR-003: Per-item analytics interaction ID (data-analytics-id)
 *   - FR-004: Block-level language attribute via common-props
 *   - FR-005: Improved ARIA (aria-expanded mirrors open state)
 *   - FR-007: Icon rendering — icon-font and image variants carried forward
 *
 * Block-level config rows (indices 0–12 in delivery HTML):
 *   0  blockHeading
 *   1  expandAllLabel
 *   2  collapseAllLabel
 *   3  ariaExpandAllLabel
 *   4  ariaCollapseAllLabel
 *   5  expandAllIcon  (font name, e.g. "plus")
 *   6  collapseAllIcon
 *   7  expandIcon
 *   8  collapseIcon
 *   9  expandAllIconImage  (reference)
 *   10 collapseAllIconImage
 *   11 expandIconImage
 *   12 collapseIconImage
 *
 * Block-level common-props (rows 13–15, consumed by applyCommonProps):
 *   13 blockId  → id attribute
 *   14 language → lang attribute (the "none" sentinel value is skipped; the
 *                 field delivers a bare BCP-47 code such as "en"/"de")
 *   15 analytics_id → data-analytics-id attribute
 *
 * Item row columns (per <details> block):
 *   0  summary  (heading text / rich text)
 *   1  text     (richtext body)
 *   2  fragmentPath  (EDS path string — lazy-loaded on first expand)
 *   3  ariaExpandLabel
 *   4  ariaCollapseLabel
 *   5  analytics_id  (item-level, sets data-analytics-id on <details>)
 *
 * CSS class on item row div:
 *   "defaultopen" → item is open on page load (from classes_defaultOpen boolean)
 */

import { moveInstrumentation } from '../../scripts/scripts.js';
import decorateExternalLinksUtility, {
  applyCommonProps,
  sanitizeLiteralBrTags,
  sanitizeLiteralSpaces,
  extractIconSource,
  createIcon,
} from '../../scripts/utils.js';
import { toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Number of block-level config rows consumed before common-props rows
const CONFIG_ROW_COUNT = 13;

const BLOCK_ROW = Object.freeze({
  HEADING: 0,
  EXPAND_ALL_LABEL: 1,
  COLLAPSE_ALL_LABEL: 2,
  ARIA_EXPAND_ALL: 3,
  ARIA_COLLAPSE_ALL: 4,
  EXPAND_ALL_ICON: 5,
  COLLAPSE_ALL_ICON: 6,
  EXPAND_ICON: 7,
  COLLAPSE_ICON: 8,
  EXPAND_ALL_ICON_IMAGE: 9,
  COLLAPSE_ALL_ICON_IMAGE: 10,
  EXPAND_ICON_IMAGE: 11,
  COLLAPSE_ICON_IMAGE: 12,
});

const ITEM_COL = Object.freeze({
  SUMMARY: 0,
  TEXT: 1,
  FRAGMENT_PATH: 2,
  ARIA_EXPAND: 3,
  ARIA_COLLAPSE: 4,
  ANALYTICS_ID: 5,
});

function getIconImage(row) {
  if (!row) return null;
  const cell = row.firstElementChild || row;
  const source = extractIconSource(cell);
  if (!source) return null;
  return createIcon(source, 'image');
}

function getRowText(row) {
  return row?.textContent?.trim() || '';
}

/**
 * Reads and removes the 13 block-level config rows, returning a config object.
 * Must be called after applyCommonProps (which already removed rows 13–15).
 * @param {Element} block
 * @returns {object}
 */
function readAndRemoveConfigRows(block) {
  const rows = [...block.children];

  const headingText = getRowText(rows[BLOCK_ROW.HEADING]);
  const expandAllLabel = getRowText(rows[BLOCK_ROW.EXPAND_ALL_LABEL]) || 'Expand All';
  const collapseAllLabel = getRowText(rows[BLOCK_ROW.COLLAPSE_ALL_LABEL]) || 'Collapse All';
  const ariaExpandAllLabel = getRowText(rows[BLOCK_ROW.ARIA_EXPAND_ALL]);
  const ariaCollapseAllLabel = getRowText(rows[BLOCK_ROW.ARIA_COLLAPSE_ALL]);
  const expandAllIcon = `icon-abbvie-${getRowText(rows[BLOCK_ROW.EXPAND_ALL_ICON]) || 'plus'}`;
  const collapseAllIcon = `icon-abbvie-${getRowText(rows[BLOCK_ROW.COLLAPSE_ALL_ICON]) || 'minus'}`;
  const expandIcon = `icon-abbvie-${getRowText(rows[BLOCK_ROW.EXPAND_ICON]) || 'plus'}`;
  const collapseIcon = `icon-abbvie-${getRowText(rows[BLOCK_ROW.COLLAPSE_ICON]) || 'minus'}`;
  const expandAllIconImage = getIconImage(rows[BLOCK_ROW.EXPAND_ALL_ICON_IMAGE]);
  const collapseAllIconImage = getIconImage(rows[BLOCK_ROW.COLLAPSE_ALL_ICON_IMAGE]);
  const expandIconImage = getIconImage(rows[BLOCK_ROW.EXPAND_ICON_IMAGE]);
  const collapseIconImage = getIconImage(rows[BLOCK_ROW.COLLAPSE_ICON_IMAGE]);

  for (let i = CONFIG_ROW_COUNT - 1; i >= 0; i -= 1) {
    rows[i]?.remove();
  }

  return {
    headingText,
    expandAllLabel,
    collapseAllLabel,
    ariaExpandAllLabel,
    ariaCollapseAllLabel,
    expandAllIcon,
    collapseAllIcon,
    expandIcon,
    collapseIcon,
    expandAllIconImage,
    collapseAllIconImage,
    expandIconImage,
    collapseIconImage,
  };
}

function decorateHeading(block, headingText) {
  const headingWrapper = document.createElement('div');
  headingWrapper.className = 'accordion-v2-block-heading-wrapper';
  if (headingText) {
    const span = document.createElement('span');
    span.className = 'accordion-v2-block-heading';
    span.textContent = headingText;
    headingWrapper.appendChild(span);
  }
  block.prepend(headingWrapper);
}

function addExpandCollapseAllButton(block, cfg) {
  const headingWrapper = block.querySelector('.accordion-v2-block-heading-wrapper');
  const expandAllBtn = document.createElement('button');
  expandAllBtn.className = 'accordion-v2-expand-all';
  expandAllBtn.type = 'button';

  const textSpan = document.createElement('span');
  textSpan.className = 'accordion-v2-expand-all-text';

  const isImageIcon = block.classList.contains('accordion-v2-icon-image');
  let icon = null;

  if (isImageIcon) {
    expandAllBtn.append(textSpan);
    const buttonWrapper = document.createElement('span');
    buttonWrapper.className = 'accordion-v2-expand-all-wrapper';
    buttonWrapper.appendChild(expandAllBtn);
    if (cfg.expandAllIconImage) {
      cfg.expandAllIconImage.classList.add('accordion-v2-expand-all-image-icon');
      buttonWrapper.appendChild(cfg.expandAllIconImage);
    }
    if (cfg.collapseAllIconImage) {
      cfg.collapseAllIconImage.classList.add('accordion-v2-collapse-all-image-icon');
      buttonWrapper.appendChild(cfg.collapseAllIconImage);
    }
    buttonWrapper.addEventListener('click', (e) => {
      if (e.target !== expandAllBtn && !expandAllBtn.contains(e.target)) {
        expandAllBtn.click();
      }
    });
    headingWrapper.append(buttonWrapper);
  } else {
    icon = document.createElement('i');
    icon.className = 'accordion-v2-expand-all-icon';
    icon.setAttribute('aria-hidden', 'true');
    expandAllBtn.append(textSpan, icon);
    headingWrapper.append(expandAllBtn);
  }

  function updateButtonState(allOpen) {
    textSpan.textContent = allOpen ? cfg.collapseAllLabel : cfg.expandAllLabel;
    const ariaLabel = allOpen ? cfg.ariaCollapseAllLabel : cfg.ariaExpandAllLabel;
    // Never set an empty aria-label — that would blank the button's accessible name.
    if (ariaLabel) expandAllBtn.setAttribute('aria-label', ariaLabel);
    else expandAllBtn.removeAttribute('aria-label');
    expandAllBtn.classList.toggle('expanded', allOpen);
    if (icon) {
      icon.className = `accordion-v2-expand-all-icon ${allOpen ? cfg.collapseAllIcon : cfg.expandAllIcon}`;
    }
  }

  let showingCollapse = false;

  expandAllBtn.addEventListener('click', () => {
    const expanding = !showingCollapse;
    // Suspend single-open exclusivity BEFORE the bulk expand so every item can
    // stay open; exclusivity is restored once all items are collapsed again
    // (see the allClosed branch below and closeAllExceptCurrent).
    if (expanding) block.dataset.suspendExclusive = 'true';
    const allDetails = block.querySelectorAll('details.accordion-v2-item');
    allDetails.forEach((d) => { d.open = expanding; });
    if (!expanding) block.dataset.suspendExclusive = 'false';
    showingCollapse = expanding;
    updateButtonState(showingCollapse);
  });

  const initialDetails = [...block.querySelectorAll('details.accordion-v2-item')];
  if (initialDetails.length > 0) {
    const allInitialOpen = initialDetails.every((d) => d.open);
    if (allInitialOpen) showingCollapse = true;
  }
  updateButtonState(showingCollapse);

  block.addEventListener('toggle', () => {
    const allDetails = [...block.querySelectorAll('details.accordion-v2-item')];
    allDetails.forEach((e) => {
      e.firstElementChild.classList.toggle('open', e.open);
    });
    const allOpen = allDetails.every((d) => d.open);
    const allClosed = allDetails.every((d) => !d.open);
    if (allOpen) showingCollapse = true;
    else if (allClosed) {
      showingCollapse = false;
      // Everything is closed → safe to re-enable single-open exclusivity.
      block.dataset.suspendExclusive = 'false';
    }
    updateButtonState(showingCollapse);
  }, true);
}

function closeAllExceptCurrent(block) {
  const details = block.querySelectorAll('details.accordion-v2-item');
  details.forEach((detail) => {
    detail.addEventListener('toggle', () => {
      // Exclusivity is off when the author allows multiple open, and is
      // temporarily suspended during an Expand-All bulk action so "Expand All"
      // can actually open every item (see addExpandCollapseAllButton).
      if (block.classList.contains('allowmultipleopen')) return;
      if (block.dataset.suspendExclusive === 'true') return;
      if (detail.open) {
        details.forEach((d) => {
          if (d !== detail) d.open = false;
        });
      }
    });
  });
}

/**
 * Sets up lazy fragment loading for an accordion item.
 * loadFragment is called only on the first expand — never on page load.
 * @param {HTMLDetailsElement} details
 * @param {string} fragmentPath
 * @param {Element} body
 */
function setupFragmentLazyLoad(details, fragmentPath, body) {
  let loaded = false;

  details.addEventListener('toggle', async () => {
    if (!details.open || loaded) return;
    loaded = true;

    const fragmentContainer = document.createElement('div');
    fragmentContainer.className = 'accordion-v2-fragment-container';
    body.append(fragmentContainer);

    const fragment = await loadFragment(fragmentPath);
    if (fragment) {
      fragmentContainer.append(...fragment.childNodes);
    }
  });
}

/**
 * After all items are rendered, check URL hash and auto-expand a matching item.
 * Matches against: the item's id attribute, or the slugified summary text.
 * @param {Element} block
 */
function handleDeepLink(block) {
  const { hash } = window.location;
  if (!hash) return;

  const target = hash.slice(1);
  const details = [...block.querySelectorAll('details.accordion-v2-item')];

  const match = details.find((d) => {
    if (d.id === target) return true;
    const summary = d.querySelector('.accordion-v2-item-label');
    if (!summary) return false;
    return toClassName(summary.textContent.trim()) === target;
  });

  if (match) {
    match.open = true;
    // Scroll after layout settles
    requestAnimationFrame(() => match.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}

export default function decorate(block) {
  // applyCommonProps reads+removes block-level common rows at indices 13, 14, 15
  // (blockId → id, language → lang, analytics_id → data-analytics-id)
  applyCommonProps(block, CONFIG_ROW_COUNT);

  const cfg = readAndRemoveConfigRows(block);

  // Extract h1-size through h6-size heading-scale classes to apply on summaries
  const headingSizeClasses = [...block.classList].filter((cls) => /^h[1-6]-size$/.test(cls));
  block.classList.remove(...headingSizeClasses);

  const isImageIcon = block.classList.contains('accordion-v2-icon-image');

  [...block.children].forEach((row) => {
    if (!row.children[ITEM_COL.SUMMARY] || !row.children[ITEM_COL.TEXT]) return;

    const labelCell = row.children[ITEM_COL.SUMMARY];
    const bodyCell = row.children[ITEM_COL.TEXT];
    const fragmentPathCell = row.children[ITEM_COL.FRAGMENT_PATH];
    const ariaExpandCell = row.children[ITEM_COL.ARIA_EXPAND];
    const ariaCollapseCell = row.children[ITEM_COL.ARIA_COLLAPSE];
    const analyticsIdCell = row.children[ITEM_COL.ANALYTICS_ID];

    const fragmentPath = fragmentPathCell?.querySelector('a')?.getAttribute('href')
      || fragmentPathCell?.textContent?.trim()
      || '';
    const ariaExpandLabel = ariaExpandCell?.textContent?.trim() || '';
    const ariaCollapseLabel = ariaCollapseCell?.textContent?.trim() || '';
    const itemAnalyticsId = analyticsIdCell?.textContent?.trim() || '';

    // Build <summary>
    const summary = document.createElement('summary');
    summary.className = 'accordion-v2-item-label';
    summary.append(...labelCell.childNodes);
    summary.classList.add(...headingSizeClasses);
    if (summary.firstElementChild) {
      summary.firstElementChild.classList.add('accordion-v2-item-label-text');
    }

    // Build body
    const body = bodyCell;
    body.className = 'accordion-v2-item-body';
    sanitizeLiteralBrTags(body);
    sanitizeLiteralSpaces(body);

    // Build <details>
    const details = document.createElement('details');
    moveInstrumentation(row, details);

    // Carry forward any additional CSS classes on the source row (e.g. "defaultopen")
    const extraClasses = row.className.replace(/\baccordion-v2-item\b/g, '').trim();
    details.className = ['accordion-v2-item', extraClasses].filter(Boolean).join(' ').trim();

    if (itemAnalyticsId) {
      details.setAttribute('data-analytics-id', itemAnalyticsId);
    }

    const isDefaultOpen = row.classList.contains('defaultopen')
      || details.classList.contains('defaultopen');

    if (isDefaultOpen) {
      details.setAttribute('open', '');
      details.setAttribute('aria-label', ariaExpandLabel);
      if (!isImageIcon) summary.classList.add(cfg.collapseIcon);
    } else {
      details.setAttribute('aria-label', ariaCollapseLabel);
      if (!isImageIcon) summary.classList.add(cfg.expandIcon);
    }
    summary.setAttribute('aria-expanded', isDefaultOpen ? 'true' : 'false');

    if (isImageIcon) {
      if (cfg.expandIconImage) {
        const ei = cfg.expandIconImage.cloneNode(true);
        ei.classList.add('accordion-v2-expand-image-icon');
        summary.appendChild(ei);
      }
      if (cfg.collapseIconImage) {
        const ci = cfg.collapseIconImage.cloneNode(true);
        ci.classList.add('accordion-v2-collapse-image-icon');
        summary.appendChild(ci);
      }
    }

    details.addEventListener('toggle', () => {
      const expandedLabel = details.open ? ariaExpandLabel : ariaCollapseLabel;
      details.setAttribute('aria-label', expandedLabel);
      summary.setAttribute('aria-expanded', details.open ? 'true' : 'false');
      summary.classList.toggle('open', details.open);
      if (!isImageIcon) {
        summary.classList.toggle(cfg.collapseIcon, details.open);
        summary.classList.toggle(cfg.expandIcon, !details.open);
      }
    });

    // FR-001: Fragment lazy-load — only triggers on first expand
    if (fragmentPath) {
      setupFragmentLazyLoad(details, fragmentPath, body);
    }

    details.append(summary, body);
    row.replaceWith(details);
  });

  decorateHeading(block, cfg.headingText);

  if (block.classList.contains('showexpandcollapseall')) {
    addExpandCollapseAllButton(block, cfg);
  }

  closeAllExceptCurrent(block);

  // FR-002: Deep-link hash auto-expand
  handleDeepLink(block);

  decorateExternalLinksUtility(block);
  block.querySelectorAll('a[title]').forEach((a) => {
    const { title } = a;
    if (title?.trim()) {
      a.setAttribute('aria-label', title);
      a.removeAttribute('title');
    }
  });
}
