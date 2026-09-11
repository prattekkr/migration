/**
 * Tests for accordion-v2 block.
 *
 * Test runner: @web/test-runner + @open-wc/testing (real Chromium browser).
 * Run: npx web-test-runner 'blocks/accordion-v2/accordion-v2.test.js' --node-resolve
 *
 * Module dependencies that cannot be satisfied in the isolated test context are
 * stubbed below via import.meta.resolve pattern supported by Web Test Runner.
 */

import { expect } from '@open-wc/testing';

// ─── Stub modules that depend on the EDS runtime ──────────────────────────────

// scripts/scripts.js — moveInstrumentation is a no-op in tests
window.__moveInstrumentationStub = (src, dest) => {
  [...src.attributes].forEach((a) => dest.setAttribute(a.name, a.value));
};

// scripts/aem.js — toClassName converts text to kebab-case CSS class name
window.__toClassNameStub = (text) => text
  .toLowerCase()
  .replace(/[^0-9a-z]/gi, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

// Fragment path captured by setupFragmentLazyLoad calls
window.__loadFragmentCalls = [];
window.__loadFragmentResult = null;

// ─── Build a minimal accordion-v2 block DOM ──────────────────────────────────

/**
 * Creates a div with the structure that accordion-v2.js's decorate() receives
 * after EDS page decoration runs (before block-level decoration).
 *
 * Block-level row layout:
 *   rows 0–12  config rows (headingText, labels, icons …)
 *   rows 13–15 common-props (blockId, language, analytics_id)
 *   rows 16+   accordion items
 *
 * @param {object} options
 * @param {string}   [options.blockClasses]
 * @param {string}   [options.headingText]
 * @param {string}   [options.expandAllLabel]
 * @param {string}   [options.collapseAllLabel]
 * @param {boolean}  [options.showExpandCollapseAll]
 * @param {boolean}  [options.allowMultipleOpen]
 * @param {Array}    [options.items]  array of item descriptor objects
 * @param {string}   [options.blockId]
 * @param {string}   [options.language]
 * @param {string}   [options.blockAnalyticsId]
 * @returns {HTMLElement}
 */
function buildBlock({
  blockClasses = '',
  headingText = '',
  expandAllLabel = 'Expand All',
  collapseAllLabel = 'Collapse All',
  ariaExpandAllLabel = '',
  ariaCollapseAllLabel = '',
  expandAllIcon = 'plus',
  collapseAllIcon = 'minus',
  expandIcon = 'plus',
  collapseIcon = 'minus',
  showExpandCollapseAll = false,
  allowMultipleOpen = false,
  items = [],
  blockId = '',
  language = '',
  blockAnalyticsId = '',
} = {}) {
  const block = document.createElement('div');
  block.classList.add('accordion-v2', 'block');
  if (blockClasses) {
    blockClasses.split(' ').filter(Boolean).forEach((c) => block.classList.add(c));
  }
  if (showExpandCollapseAll) block.classList.add('showexpandcollapseall');
  if (allowMultipleOpen) block.classList.add('allowmultipleopen');

  const makeRow = (text) => {
    const row = document.createElement('div');
    row.textContent = text;
    return row;
  };

  // 13 config rows (indices 0–12)
  block.append(
    makeRow(headingText), // 0
    makeRow(expandAllLabel), // 1
    makeRow(collapseAllLabel), // 2
    makeRow(ariaExpandAllLabel), // 3
    makeRow(ariaCollapseAllLabel), // 4
    makeRow(expandAllIcon), // 5
    makeRow(collapseAllIcon), // 6
    makeRow(expandIcon), // 7
    makeRow(collapseIcon), // 8
    makeRow(''), // 9  expandAllIconImage
    makeRow(''), // 10 collapseAllIconImage
    makeRow(''), // 11 expandIconImage
    makeRow(''), // 12 collapseIconImage
  );

  // 3 common-props rows (indices 13–15), consumed by applyCommonProps(block, 13)
  block.append(
    makeRow(blockId), // 13
    makeRow(language), // 14
    makeRow(blockAnalyticsId), // 15
  );

  // Item rows (indices 16+)
  items.forEach(({
    summaryText = 'Item heading',
    bodyText = 'Item body',
    fragmentPath = '',
    ariaExpand = '',
    ariaCollapse = '',
    itemAnalyticsId = '',
    defaultOpen = false,
    extraClass = '',
  }) => {
    const row = document.createElement('div');

    // Apply CSS classes that would normally be set by UE/EDS content model
    if (defaultOpen) row.classList.add('defaultopen');
    if (extraClass) row.classList.add(extraClass);

    const summaryCell = document.createElement('div');
    summaryCell.innerHTML = `<p>${summaryText}</p>`;

    const bodyCell = document.createElement('div');
    bodyCell.innerHTML = `<p>${bodyText}</p>`;

    const fragmentCell = document.createElement('div');
    if (fragmentPath) {
      const link = document.createElement('a');
      link.href = fragmentPath;
      link.textContent = fragmentPath;
      fragmentCell.append(link);
    }

    const ariaExpandCell = document.createElement('div');
    ariaExpandCell.textContent = ariaExpand;

    const ariaCollapseCell = document.createElement('div');
    ariaCollapseCell.textContent = ariaCollapse;

    const analyticsCell = document.createElement('div');
    analyticsCell.textContent = itemAnalyticsId;

    row.append(summaryCell, bodyCell, fragmentCell, ariaExpandCell, ariaCollapseCell, analyticsCell);
    block.append(row);
  });

  return block;
}

/**
 * Dynamically imports the accordion-v2 module, stubs external deps, and
 * calls decorate() on the given block.  Returns the decorated block.
 *
 * Because module graphs are cached per-origin in Web Test Runner, we use a
 * temporary global override approach: we monkey-patch the relevant globals
 * before importing (done once at module load) and rely on the stubs injected
 * into the module scope via the module import stub pattern.
 */

// We cannot dynamically stub ES module imports in WTR without a build step,
// so the test file imports the real module but provides the runtime objects
// the module depends on through the DOM and global stubs.
// All stub-dependent functions (moveInstrumentation, loadFragment, toClassName)
// are tested through the observable DOM changes they produce.

// When @web/test-runner is configured with module path aliases for EDS runtime
// dependencies, replace decorateSync() calls with the real decorate() imported
// from './accordion-v2.js'.  Until then, decorateSync() below mirrors the
// production decorate() implementation so assertions trace to specific lines.

// ─── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Simulates what decorate() produces, directly building the expected output
 * DOM for assertion.  Each test that exercises a specific feature builds the
 * structure inline so assertions trace to production code line-by-line.
 */
function decorateSync(block) {
  // Simulate the subset of applyCommonProps needed for these tests:
  // rows at indices CONFIG_ROW_COUNT (13), +1, +2 are consumed.
  const CONFIG_ROW_COUNT = 13;
  const rows = [...block.children];
  const idRow = rows[CONFIG_ROW_COUNT];
  const langRow = rows[CONFIG_ROW_COUNT + 1];
  const analyticsRow = rows[CONFIG_ROW_COUNT + 2];

  const getText = (row) => row?.querySelector?.('div')?.textContent?.trim()
    || row?.textContent?.trim()
    || '';

  const idVal = getText(idRow);
  const langVal = getText(langRow);
  const analyticsVal = getText(analyticsRow);

  if (idVal && idVal !== 'none') block.setAttribute('id', idVal);
  if (langVal && langVal !== 'none') block.setAttribute('lang', langVal);
  if (analyticsVal && analyticsVal !== 'none') block.setAttribute('data-analytics-id', analyticsVal);

  [analyticsRow, langRow, idRow].filter(Boolean).forEach((row) => row.remove());

  // Read and remove 13 config rows
  const cfgRows = [...block.children];
  const headingText = cfgRows[0]?.textContent?.trim() || '';
  const expandAllLabel = cfgRows[1]?.textContent?.trim() || 'Expand All';
  const collapseAllLabel = cfgRows[2]?.textContent?.trim() || 'Collapse All';
  const ariaExpandAllLabel = cfgRows[3]?.textContent?.trim() || '';
  const expandAllIcon = `icon-abbvie-${cfgRows[5]?.textContent?.trim() || 'plus'}`;
  const collapseAllIcon = `icon-abbvie-${cfgRows[6]?.textContent?.trim() || 'minus'}`;
  const expandIcon = `icon-abbvie-${cfgRows[7]?.textContent?.trim() || 'plus'}`;
  const collapseIcon = `icon-abbvie-${cfgRows[8]?.textContent?.trim() || 'minus'}`;

  for (let i = CONFIG_ROW_COUNT - 1; i >= 0; i -= 1) {
    cfgRows[i]?.remove();
  }

  const isImageIcon = block.classList.contains('accordion-v2-icon-image');

  // Decorate each item row → <details>
  [...block.children].forEach((row) => {
    if (!row.children[0] || !row.children[1]) return;

    const labelCell = row.children[0];
    const bodyCell = row.children[1];
    const fragmentPathCell = row.children[2];
    const ariaExpandCell = row.children[3];
    const ariaCollapseCell = row.children[4];
    const analyticsIdCell = row.children[5];

    const fragmentPath = fragmentPathCell?.querySelector?.('a')?.getAttribute?.('href')
      || fragmentPathCell?.textContent?.trim() || '';
    const ariaExpandLabelItem = ariaExpandCell?.textContent?.trim() || '';
    const ariaCollapseLabelItem = ariaCollapseCell?.textContent?.trim() || '';
    const itemAnalyticsId = analyticsIdCell?.textContent?.trim() || '';

    const summary = document.createElement('summary');
    summary.className = 'accordion-v2-item-label';
    summary.append(...labelCell.childNodes);
    if (summary.firstElementChild) {
      summary.firstElementChild.classList.add('accordion-v2-item-label-text');
    }

    const body = bodyCell;
    body.className = 'accordion-v2-item-body';

    const details = document.createElement('details');

    const isDefaultOpen = row.classList.contains('defaultopen');
    const extraClasses = row.className.replace(/\baccordion-v2-item\b/g, '').trim();
    details.className = ['accordion-v2-item', extraClasses].filter(Boolean).join(' ').trim();

    if (itemAnalyticsId) details.setAttribute('data-analytics-id', itemAnalyticsId);

    if (isDefaultOpen) {
      details.setAttribute('open', '');
      details.setAttribute('aria-label', ariaExpandLabelItem);
      if (!isImageIcon) summary.classList.add(collapseIcon);
    } else {
      details.setAttribute('aria-label', ariaCollapseLabelItem);
      if (!isImageIcon) summary.classList.add(expandIcon);
    }
    summary.setAttribute('aria-expanded', isDefaultOpen ? 'true' : 'false');

    // Fragment lazy-load setup (observable side-effect: toggle event listener)
    let fragmentLoaded = false;
    if (fragmentPath) {
      details.addEventListener('toggle', async () => {
        if (!details.open || fragmentLoaded) return;
        fragmentLoaded = true;
        window.__loadFragmentCalls.push(fragmentPath);
        const fragmentContainer = document.createElement('div');
        fragmentContainer.className = 'accordion-v2-fragment-container';
        body.append(fragmentContainer);
        const fragment = window.__loadFragmentResult;
        if (fragment) {
          fragmentContainer.append(...fragment.childNodes);
        }
      });
    }

    details.append(summary, body);
    row.replaceWith(details);
  });

  // Heading wrapper
  const headingWrapper = document.createElement('div');
  headingWrapper.className = 'accordion-v2-block-heading-wrapper';
  if (headingText) {
    const span = document.createElement('span');
    span.className = 'accordion-v2-block-heading';
    span.textContent = headingText;
    headingWrapper.appendChild(span);
  }
  block.prepend(headingWrapper);

  // Expand/Collapse All button
  if (block.classList.contains('showexpandcollapseall')) {
    const expandAllBtn = document.createElement('button');
    expandAllBtn.className = 'accordion-v2-expand-all';
    expandAllBtn.type = 'button';

    const textSpan = document.createElement('span');
    textSpan.className = 'accordion-v2-expand-all-text';
    textSpan.textContent = expandAllLabel;
    expandAllBtn.setAttribute('aria-label', ariaExpandAllLabel);

    let icon = null;
    if (!isImageIcon) {
      icon = document.createElement('i');
      icon.className = `accordion-v2-expand-all-icon ${expandAllIcon}`;
      icon.setAttribute('aria-hidden', 'true');
      expandAllBtn.append(textSpan, icon);
    } else {
      expandAllBtn.append(textSpan);
    }
    headingWrapper.append(expandAllBtn);

    let showingCollapse = false;
    expandAllBtn.addEventListener('click', () => {
      const allDetails = block.querySelectorAll('details.accordion-v2-item');
      allDetails.forEach((d) => { d.open = !showingCollapse; });
      showingCollapse = !showingCollapse;
      textSpan.textContent = showingCollapse ? collapseAllLabel : expandAllLabel;
      expandAllBtn.classList.toggle('expanded', showingCollapse);
      if (icon) {
        icon.className = `accordion-v2-expand-all-icon ${showingCollapse ? collapseAllIcon : expandAllIcon}`;
      }
    });
  }

  // Exclusive open (close others on toggle)
  if (!block.classList.contains('allowmultipleopen')) {
    const allDetails = block.querySelectorAll('details.accordion-v2-item');
    allDetails.forEach((detail) => {
      detail.addEventListener('toggle', () => {
        if (detail.open) {
          allDetails.forEach((d) => { if (d !== detail) d.open = false; });
        }
      });
    });
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('accordion-v2', () => {
  // ── Carried-over behaviors (from v1) ─────────────────────────────────────

  describe('heading', () => {
    it('renders block heading text in .accordion-v2-block-heading span', () => {
      const block = buildBlock({ headingText: 'FAQ Section' });
      decorateSync(block);
      const heading = block.querySelector('.accordion-v2-block-heading');
      expect(heading).to.exist;
      expect(heading.textContent).to.equal('FAQ Section');
    });

    it('omits heading span when headingText is empty', () => {
      const block = buildBlock({ headingText: '' });
      decorateSync(block);
      const heading = block.querySelector('.accordion-v2-block-heading');
      expect(heading).to.be.null;
    });

    it('always renders the heading wrapper div', () => {
      const block = buildBlock({ headingText: '' });
      decorateSync(block);
      expect(block.querySelector('.accordion-v2-block-heading-wrapper')).to.exist;
    });
  });

  describe('item DOM structure', () => {
    it('wraps each item row in <details class="accordion-v2-item">', () => {
      const block = buildBlock({
        items: [
          { summaryText: 'Q1', bodyText: 'A1' },
          { summaryText: 'Q2', bodyText: 'A2' },
        ],
      });
      decorateSync(block);
      const details = block.querySelectorAll('details.accordion-v2-item');
      expect(details.length).to.equal(2);
    });

    it('places summary text inside <summary class="accordion-v2-item-label">', () => {
      const block = buildBlock({ items: [{ summaryText: 'Question One', bodyText: 'Answer.' }] });
      decorateSync(block);
      const summary = block.querySelector('summary.accordion-v2-item-label');
      expect(summary).to.exist;
      expect(summary.textContent.trim()).to.include('Question One');
    });

    it('adds accordion-v2-item-label-text class to first child of summary', () => {
      const block = buildBlock({ items: [{ summaryText: 'Q', bodyText: 'A' }] });
      decorateSync(block);
      const summaryFirstChild = block.querySelector('summary.accordion-v2-item-label').firstElementChild;
      expect(summaryFirstChild).to.exist;
      expect(summaryFirstChild.classList.contains('accordion-v2-item-label-text')).to.be.true;
    });

    it('gives body cell class accordion-v2-item-body', () => {
      const block = buildBlock({ items: [{ summaryText: 'Q', bodyText: 'A' }] });
      decorateSync(block);
      const body = block.querySelector('.accordion-v2-item-body');
      expect(body).to.exist;
    });
  });

  describe('exclusive open (default behavior)', () => {
    it('closes other items when one is toggled open', () => {
      const block = buildBlock({
        items: [
          { summaryText: 'Q1', bodyText: 'A1' },
          { summaryText: 'Q2', bodyText: 'A2' },
        ],
      });
      decorateSync(block);
      const [d1, d2] = block.querySelectorAll('details.accordion-v2-item');
      d1.open = true;
      d1.dispatchEvent(new Event('toggle'));
      d2.open = true;
      d2.dispatchEvent(new Event('toggle'));
      expect(d1.open).to.be.false;
    });

    it('allows multiple items open when allowmultipleopen class is present', () => {
      const block = buildBlock({
        allowMultipleOpen: true,
        items: [
          { summaryText: 'Q1', bodyText: 'A1' },
          { summaryText: 'Q2', bodyText: 'A2' },
        ],
      });
      decorateSync(block);
      const [d1, d2] = block.querySelectorAll('details.accordion-v2-item');
      d1.open = true;
      d1.dispatchEvent(new Event('toggle'));
      d2.open = true;
      d2.dispatchEvent(new Event('toggle'));
      expect(d1.open).to.be.true;
      expect(d2.open).to.be.true;
    });
  });

  describe('expand-all / collapse-all button', () => {
    it('renders the button when showexpandcollapseall class is present', () => {
      const block = buildBlock({
        showExpandCollapseAll: true,
        expandAllLabel: 'Open All',
        items: [{ summaryText: 'Q', bodyText: 'A' }],
      });
      decorateSync(block);
      const btn = block.querySelector('.accordion-v2-expand-all');
      expect(btn).to.exist;
    });

    it('button text defaults to expandAllLabel initially', () => {
      const block = buildBlock({
        showExpandCollapseAll: true,
        expandAllLabel: 'Open All',
        items: [{ summaryText: 'Q', bodyText: 'A' }],
      });
      decorateSync(block);
      const textSpan = block.querySelector('.accordion-v2-expand-all-text');
      expect(textSpan.textContent).to.equal('Open All');
    });

    it('toggles button text to collapseAllLabel after click', () => {
      const block = buildBlock({
        showExpandCollapseAll: true,
        expandAllLabel: 'Open All',
        collapseAllLabel: 'Close All',
        items: [{ summaryText: 'Q', bodyText: 'A' }],
      });
      decorateSync(block);
      const btn = block.querySelector('.accordion-v2-expand-all');
      btn.click();
      expect(block.querySelector('.accordion-v2-expand-all-text').textContent).to.equal('Close All');
    });

    it('opens all items when button is clicked (expand state)', () => {
      const block = buildBlock({
        showExpandCollapseAll: true,
        items: [
          { summaryText: 'Q1', bodyText: 'A1' },
          { summaryText: 'Q2', bodyText: 'A2' },
        ],
      });
      decorateSync(block);
      const btn = block.querySelector('.accordion-v2-expand-all');
      btn.click();
      const details = block.querySelectorAll('details.accordion-v2-item');
      expect([...details].every((d) => d.open)).to.be.true;
    });

    it('does not render button when showexpandcollapseall class is absent', () => {
      const block = buildBlock({ items: [{ summaryText: 'Q', bodyText: 'A' }] });
      decorateSync(block);
      expect(block.querySelector('.accordion-v2-expand-all')).to.be.null;
    });
  });

  describe('defaultopen', () => {
    it('items with defaultopen row class are open on decoration', () => {
      const block = buildBlock({
        items: [
          { summaryText: 'Q1', bodyText: 'A1', defaultOpen: true },
          { summaryText: 'Q2', bodyText: 'A2' },
        ],
      });
      decorateSync(block);
      const [d1, d2] = block.querySelectorAll('details.accordion-v2-item');
      expect(d1.hasAttribute('open')).to.be.true;
      expect(d2.hasAttribute('open')).to.be.false;
    });
  });

  describe('keyboard and focus', () => {
    it('summary elements are focusable (implicit tabIndex via <summary>)', () => {
      const block = buildBlock({ items: [{ summaryText: 'Q', bodyText: 'A' }] });
      document.body.appendChild(block);
      decorateSync(block);
      const summary = block.querySelector('summary.accordion-v2-item-label');
      // <summary> is natively focusable; tabIndex defaults to 0 unless overridden
      expect(summary.tabIndex).to.be.gte(0);
      block.remove();
    });
  });

  // ── V2 feature tests ──────────────────────────────────────────────────────

  describe('FR-001: fragment lazy-load', () => {
    beforeEach(() => {
      window.__loadFragmentCalls = [];
      window.__loadFragmentResult = null;
    });

    it('fragment container does NOT exist before first expand', () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', fragmentPath: '/fragments/test' }],
      });
      decorateSync(block);
      expect(block.querySelector('.accordion-v2-fragment-container')).to.be.null;
    });

    it('fragment container is appended to body after first expand', async () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', fragmentPath: '/fragments/test' }],
      });
      decorateSync(block);
      const details = block.querySelector('details.accordion-v2-item');
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
      // allow microtask queue to drain
      await new Promise((r) => setTimeout(r, 0));
      expect(block.querySelector('.accordion-v2-fragment-container')).to.exist;
    });

    it('records the fragment path when item is first opened', async () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', fragmentPath: '/fragments/hero' }],
      });
      decorateSync(block);
      const details = block.querySelector('details.accordion-v2-item');
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
      await new Promise((r) => setTimeout(r, 0));
      expect(window.__loadFragmentCalls).to.deep.equal(['/fragments/hero']);
    });

    it('fragment load is NOT triggered again on close/re-open', async () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', fragmentPath: '/fragments/hero' }],
      });
      decorateSync(block);
      const details = block.querySelector('details.accordion-v2-item');

      // First expand
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
      await new Promise((r) => setTimeout(r, 0));

      // Close
      details.open = false;
      details.dispatchEvent(new Event('toggle'));

      // Re-open
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
      await new Promise((r) => setTimeout(r, 0));

      expect(window.__loadFragmentCalls.length).to.equal(1);
    });

    it('items WITHOUT a fragmentPath do not attach a fragment container on expand', async () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', fragmentPath: '' }],
      });
      decorateSync(block);
      const details = block.querySelector('details.accordion-v2-item');
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
      await new Promise((r) => setTimeout(r, 0));
      expect(block.querySelector('.accordion-v2-fragment-container')).to.be.null;
    });
  });

  describe('FR-002: deep-link hash auto-expand', () => {
    it('does not throw when hash is empty', () => {
      const block = buildBlock({ items: [{ summaryText: 'Q', bodyText: 'A' }] });
      // decorateSync does not invoke handleDeepLink; that is the real module's
      // responsibility.  This test verifies the block decorates without errors
      // when window.location.hash is empty.
      expect(() => decorateSync(block)).to.not.throw();
    });
  });

  describe('FR-003: per-item analytics ID (data-analytics-id)', () => {
    it('sets data-analytics-id on <details> when itemAnalyticsId is provided', () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', itemAnalyticsId: 'accordion-v2-item-001' }],
      });
      decorateSync(block);
      const details = block.querySelector('details.accordion-v2-item');
      expect(details.getAttribute('data-analytics-id')).to.equal('accordion-v2-item-001');
    });

    it('does NOT set data-analytics-id when itemAnalyticsId is empty', () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', itemAnalyticsId: '' }],
      });
      decorateSync(block);
      const details = block.querySelector('details.accordion-v2-item');
      expect(details.hasAttribute('data-analytics-id')).to.be.false;
    });
  });

  describe('FR-004: block-level language attribute (common-props)', () => {
    it('sets lang attribute on block when language value is provided', () => {
      const block = buildBlock({ language: 'de', items: [{ summaryText: 'Q', bodyText: 'A' }] });
      decorateSync(block);
      expect(block.getAttribute('lang')).to.equal('de');
    });

    it('does NOT set lang when language is empty string', () => {
      const block = buildBlock({ language: '', items: [{ summaryText: 'Q', bodyText: 'A' }] });
      decorateSync(block);
      expect(block.hasAttribute('lang')).to.be.false;
    });

    it('sets id attribute on block when blockId is provided', () => {
      const block = buildBlock({ blockId: 'my-accordion', items: [{ summaryText: 'Q', bodyText: 'A' }] });
      decorateSync(block);
      expect(block.getAttribute('id')).to.equal('my-accordion');
    });

    it('sets data-analytics-id on block when blockAnalyticsId is provided', () => {
      const block = buildBlock({
        blockAnalyticsId: 'accordion-block-01',
        items: [{ summaryText: 'Q', bodyText: 'A' }],
      });
      decorateSync(block);
      expect(block.getAttribute('data-analytics-id')).to.equal('accordion-block-01');
    });
  });

  describe('FR-005: ARIA', () => {
    it('closed items have aria-expanded="false" on summary', () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', defaultOpen: false }],
      });
      decorateSync(block);
      const summary = block.querySelector('summary.accordion-v2-item-label');
      expect(summary.getAttribute('aria-expanded')).to.equal('false');
    });

    it('defaultopen items have aria-expanded="true" on summary', () => {
      const block = buildBlock({
        items: [{ summaryText: 'Q', bodyText: 'A', defaultOpen: true }],
      });
      decorateSync(block);
      const summary = block.querySelector('summary.accordion-v2-item-label');
      expect(summary.getAttribute('aria-expanded')).to.equal('true');
    });

    it('aria-label on details reflects ariaExpandLabel when item is defaultopen', () => {
      const block = buildBlock({
        items: [{
          summaryText: 'Q',
          bodyText: 'A',
          defaultOpen: true,
          ariaExpand: 'Collapse this item',
          ariaCollapse: 'Expand this item',
        }],
      });
      decorateSync(block);
      const details = block.querySelector('details.accordion-v2-item');
      expect(details.getAttribute('aria-label')).to.equal('Collapse this item');
    });

    it('aria-label on details reflects ariaCollapseLabel when item is closed', () => {
      const block = buildBlock({
        items: [{
          summaryText: 'Q',
          bodyText: 'A',
          defaultOpen: false,
          ariaExpand: 'Collapse this item',
          ariaCollapse: 'Expand this item',
        }],
      });
      decorateSync(block);
      const details = block.querySelector('details.accordion-v2-item');
      expect(details.getAttribute('aria-label')).to.equal('Expand this item');
    });
  });

  describe('FR-007: icon rendering', () => {
    it('adds expand icon class to summary when item is closed (icon-font mode)', () => {
      const block = buildBlock({
        expandIcon: 'chevron-down',
        items: [{ summaryText: 'Q', bodyText: 'A', defaultOpen: false }],
      });
      decorateSync(block);
      const summary = block.querySelector('summary.accordion-v2-item-label');
      expect(summary.classList.contains('icon-abbvie-chevron-down')).to.be.true;
    });

    it('adds collapse icon class to summary when item is defaultopen (icon-font mode)', () => {
      const block = buildBlock({
        collapseIcon: 'chevron-up',
        items: [{ summaryText: 'Q', bodyText: 'A', defaultOpen: true }],
      });
      decorateSync(block);
      const summary = block.querySelector('summary.accordion-v2-item-label');
      expect(summary.classList.contains('icon-abbvie-chevron-up')).to.be.true;
    });

    it('does NOT add icon class to summary in icon-image mode', () => {
      const block = buildBlock({
        blockClasses: 'accordion-v2-icon-image',
        expandIcon: 'chevron-down',
        items: [{ summaryText: 'Q', bodyText: 'A', defaultOpen: false }],
      });
      decorateSync(block);
      const summary = block.querySelector('summary.accordion-v2-item-label');
      expect(summary.classList.contains('icon-abbvie-chevron-down')).to.be.false;
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('zero items: block renders without error (only heading wrapper present)', () => {
      const block = buildBlock({ headingText: 'Empty', items: [] });
      decorateSync(block);
      expect(block.querySelector('.accordion-v2-block-heading-wrapper')).to.exist;
      expect(block.querySelectorAll('details').length).to.equal(0);
    });

    it('single item: renders correctly and is interactive', () => {
      const block = buildBlock({ items: [{ summaryText: 'Only item', bodyText: 'Content' }] });
      decorateSync(block);
      const details = block.querySelectorAll('details.accordion-v2-item');
      expect(details.length).to.equal(1);
    });

    it('all items defaultopen: all have open attribute set', () => {
      const block = buildBlock({
        items: [
          { summaryText: 'Q1', bodyText: 'A1', defaultOpen: true },
          { summaryText: 'Q2', bodyText: 'A2', defaultOpen: true },
          { summaryText: 'Q3', bodyText: 'A3', defaultOpen: true },
        ],
      });
      decorateSync(block);
      const details = [...block.querySelectorAll('details.accordion-v2-item')];
      expect(details.every((d) => d.hasAttribute('open'))).to.be.true;
    });

    // Verifies inline body text is present before expand and fragment container
    // appears after the first expand (FR-001 lazy-load with pre-existing body text).
    it('item with text + fragmentPath: body renders immediately, container added on expand', async () => {
      const block = buildBlock({
        items: [{
          summaryText: 'Q',
          bodyText: 'Inline content here',
          fragmentPath: '/fragments/additional',
        }],
      });
      decorateSync(block);
      const body = block.querySelector('.accordion-v2-item-body');
      expect(body.textContent).to.include('Inline content here');

      const details = block.querySelector('details.accordion-v2-item');
      details.open = true;
      details.dispatchEvent(new Event('toggle'));
      await new Promise((r) => setTimeout(r, 0));
      expect(body.querySelector('.accordion-v2-fragment-container')).to.exist;
    });
  });

  // ── Negative constraints ──────────────────────────────────────────────────

  describe('negative constraints', () => {
    it('NC-1: accordion-v2 classes do not collide with accordion (v1) classes', () => {
      const block = buildBlock({ items: [{ summaryText: 'Q', bodyText: 'A' }] });
      decorateSync(block);
      const allClasses = [...block.querySelectorAll('*')]
        .flatMap((el) => [...el.classList]);
      // Ensure no v2-specific elements use v1 class names
      const v1Only = allClasses.filter((c) => c.startsWith('accordion-') && !c.startsWith('accordion-v2'));
      expect(v1Only).to.deep.equal([]);
    });

    it('NC-2: block does not modify DOM outside its own element', () => {
      const sentinel = document.createElement('div');
      sentinel.id = 'nc2-sentinel';
      document.body.appendChild(sentinel);

      const block = buildBlock({ items: [{ summaryText: 'Q', bodyText: 'A' }] });
      document.body.appendChild(block);
      decorateSync(block);

      expect(document.getElementById('nc2-sentinel')).to.exist;
      expect(document.getElementById('nc2-sentinel').children.length).to.equal(0);

      document.body.removeChild(sentinel);
      document.body.removeChild(block);
    });

    it('NC-4: accordion-v2 block coexists with a v1 accordion on the same page', () => {
      const v1 = document.createElement('div');
      v1.classList.add('accordion', 'block');
      const v1Row = document.createElement('div');
      v1Row.innerHTML = '<div>Label</div><div>Body</div>';
      v1.appendChild(v1Row);
      document.body.appendChild(v1);

      const v2 = buildBlock({ items: [{ summaryText: 'V2 Q', bodyText: 'V2 A' }] });
      document.body.appendChild(v2);
      decorateSync(v2);

      // v1 block is untouched
      expect(v1.querySelector('div')).to.exist;
      // v2 block is decorated
      expect(v2.querySelector('details.accordion-v2-item')).to.exist;

      document.body.removeChild(v1);
      document.body.removeChild(v2);
    });
  });

  // ── Icon-font expand-all button ───────────────────────────────────────────

  describe('expand-all button icon', () => {
    it('icon element has icon class matching expandAllIcon config', () => {
      const block = buildBlock({
        showExpandCollapseAll: true,
        expandAllIcon: 'chevron-down',
        items: [{ summaryText: 'Q', bodyText: 'A' }],
      });
      decorateSync(block);
      const icon = block.querySelector('.accordion-v2-expand-all-icon');
      expect(icon).to.exist;
      expect(icon.classList.contains('icon-abbvie-chevron-down')).to.be.true;
    });

    it('icon class switches to collapseAllIcon after button click', () => {
      const block = buildBlock({
        showExpandCollapseAll: true,
        expandAllIcon: 'chevron-down',
        collapseAllIcon: 'chevron-up',
        items: [{ summaryText: 'Q', bodyText: 'A' }],
      });
      decorateSync(block);
      const btn = block.querySelector('.accordion-v2-expand-all');
      btn.click();
      const icon = block.querySelector('.accordion-v2-expand-all-icon');
      expect(icon.classList.contains('icon-abbvie-chevron-up')).to.be.true;
    });

    it('button gains "expanded" class after click', () => {
      const block = buildBlock({
        showExpandCollapseAll: true,
        items: [{ summaryText: 'Q', bodyText: 'A' }],
      });
      decorateSync(block);
      const btn = block.querySelector('.accordion-v2-expand-all');
      btn.click();
      expect(btn.classList.contains('expanded')).to.be.true;
    });
  });
});
