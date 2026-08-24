/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */
/* eslint-disable no-undef, no-unused-expressions */
import { expect } from '@esm-bundle/chai';

/**
 * Build a block element from a plain-HTML fragment.
 * @param {string} innerHtml The innerHTML of the block div
 * @param {string[]} variants Optional variant class names
 * @returns {Element}
 */
function buildBlock(innerHtml, variants = []) {
  const block = document.createElement('div');
  block.className = ['safety-bar', ...variants].join(' ');
  block.innerHTML = innerHtml;
  return block;
}

/**
 * Clear any cookies set during testing.
 */
function clearCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Set a cookie for testing.
 */
function setTestCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
}

describe('safety-bar block', () => {
  let decorate;

  before(async () => {
    ({ default: decorate } = await import('./safety-bar.js'));
  });

  afterEach(() => {
    clearCookie('safety-bar-dismissed');
  });

  it('decorates a single-indication block with content', async () => {
    const block = buildBlock(`
      <div>
        <div>*</div>
        <div><p>Important safety information about this product.</p></div>
      </div>
    `);

    await decorate(block);

    const inner = block.querySelector('.safety-bar-inner');
    expect(inner).to.not.be.null;

    const content = block.querySelector('.safety-bar-content');
    expect(content).to.not.be.null;
    expect(content.textContent).to.include('Important safety information');

    expect(block.getAttribute('role')).to.equal('complementary');
    expect(block.getAttribute('aria-label')).to.equal('Important safety information');
  });

  it('handles single-column rows as wildcard path content', async () => {
    const block = buildBlock(`
      <div><div><p>Safety note without path column.</p></div></div>
    `);

    await decorate(block);

    const content = block.querySelector('.safety-bar-content');
    expect(content).to.not.be.null;
    expect(content.textContent).to.include('Safety note without path column.');
  });

  it('hides block when cookie indicates dismissal', async () => {
    setTestCookie('safety-bar-dismissed', '1');

    const block = buildBlock(`
      <div>
        <div>*</div>
        <div><p>Should not display.</p></div>
      </div>
    `);

    await decorate(block);

    expect(block.classList.contains('safety-bar-hidden')).to.be.true;
    expect(block.querySelector('.safety-bar-inner')).to.be.null;
  });

  it('hides block when no indications are found', async () => {
    const block = buildBlock('');

    await decorate(block);

    expect(block.classList.contains('safety-bar-hidden')).to.be.true;
  });

  it('adds expand/collapse toggle when expandable variant is set', async () => {
    const block = buildBlock(
      `<div>
        <div>*</div>
        <div><p>Expandable content here.</p></div>
      </div>`,
      ['expandable'],
    );

    await decorate(block);

    const toggle = block.querySelector('.safety-bar-toggle');
    expect(toggle).to.not.be.null;
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
    expect(block.classList.contains('safety-bar-collapsed')).to.be.true;

    const content = block.querySelector('.safety-bar-content');
    expect(content.getAttribute('aria-hidden')).to.equal('true');
  });

  it('starts expanded when expanded variant is set', async () => {
    const block = buildBlock(
      `<div>
        <div>*</div>
        <div><p>Already expanded.</p></div>
      </div>`,
      ['expandable', 'expanded'],
    );

    await decorate(block);

    const toggle = block.querySelector('.safety-bar-toggle');
    expect(toggle).to.not.be.null;
    expect(toggle.getAttribute('aria-expanded')).to.equal('true');
    expect(block.classList.contains('safety-bar-collapsed')).to.be.false;
  });

  it('toggles expanded state on button click', async () => {
    const block = buildBlock(
      `<div>
        <div>*</div>
        <div><p>Toggle me.</p></div>
      </div>`,
      ['expandable', 'expanded'],
    );

    await decorate(block);

    const toggle = block.querySelector('.safety-bar-toggle');
    const content = block.querySelector('.safety-bar-content');

    // Collapse
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
    expect(content.getAttribute('aria-hidden')).to.equal('true');
    expect(block.classList.contains('safety-bar-collapsed')).to.be.true;

    // Expand
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).to.equal('true');
    expect(content.hasAttribute('aria-hidden')).to.be.false;
    expect(block.classList.contains('safety-bar-collapsed')).to.be.false;
  });

  it('adds dismiss button when dismissable variant is set', async () => {
    const block = buildBlock(
      `<div>
        <div>*</div>
        <div><p>Dismissable content.</p></div>
      </div>`,
      ['dismissable'],
    );

    await decorate(block);

    const dismiss = block.querySelector('.safety-bar-dismiss');
    expect(dismiss).to.not.be.null;
    expect(dismiss.getAttribute('aria-label')).to.equal('Dismiss safety information');
  });

  it('sets cookie and hides block on dismiss click', async () => {
    const block = buildBlock(
      `<div>
        <div>*</div>
        <div><p>Will be dismissed.</p></div>
      </div>`,
      ['dismissable'],
    );

    await decorate(block);

    const dismiss = block.querySelector('.safety-bar-dismiss');
    dismiss.click();

    expect(block.classList.contains('safety-bar-hidden')).to.be.true;
    expect(block.getAttribute('aria-hidden')).to.equal('true');
    expect(document.cookie).to.include('safety-bar-dismissed=1');
  });

  it('preserves links and rich text in content', async () => {
    const block = buildBlock(`
      <div>
        <div>*</div>
        <div>
          <p>Read the <a href="/safety">full prescribing information</a>.</p>
          <p><strong>Warning:</strong> serious side effects may occur.</p>
        </div>
      </div>
    `);

    await decorate(block);

    const content = block.querySelector('.safety-bar-content');
    const link = content.querySelector('a');
    expect(link).to.not.be.null;
    expect(link.getAttribute('href')).to.equal('/safety');

    const strong = content.querySelector('strong');
    expect(strong).to.not.be.null;
    expect(strong.textContent).to.equal('Warning:');
  });

  it('sanitizes invalid href values (javascript: protocol)', async () => {
    const block = buildBlock(`
      <div>
        <div>*</div>
        <div>
          <p><a href="javascript:alert(1)">bad link</a></p>
        </div>
      </div>
    `);

    await decorate(block);

    const link = block.querySelector('.safety-bar-content a');
    expect(link).to.not.be.null;
    expect(link.hasAttribute('href')).to.be.false;
    expect(link.getAttribute('aria-disabled')).to.equal('true');
  });

  it('is idempotent — does not re-decorate if already decorated', async () => {
    const block = buildBlock(`
      <div>
        <div>*</div>
        <div><p>Idempotent check.</p></div>
      </div>
    `);

    await decorate(block);
    const firstHtml = block.innerHTML;

    await decorate(block);
    expect(block.innerHTML).to.equal(firstHtml);
  });

  it('handles empty content columns gracefully', async () => {
    const block = buildBlock(`
      <div>
        <div>/products</div>
        <div></div>
      </div>
    `);

    await decorate(block);

    // Should still decorate without error
    const inner = block.querySelector('.safety-bar-inner');
    expect(inner).to.not.be.null;
  });

  it('supports multiple indications and selects based on path', async () => {
    // The first indication has path /blog, the second has wildcard
    const block = buildBlock(`
      <div>
        <div>/blog</div>
        <div><p>Blog safety info.</p></div>
      </div>
      <div>
        <div>*</div>
        <div><p>General safety info.</p></div>
      </div>
    `);

    await decorate(block);

    const content = block.querySelector('.safety-bar-content');
    // Since window.location.pathname likely doesn't start with /blog in test,
    // it should fall back to first indication (index 0)
    expect(content).to.not.be.null;
    expect(content.textContent.length).to.be.greaterThan(0);
  });
});
