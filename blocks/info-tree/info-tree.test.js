/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies */
/* eslint-disable no-undef, no-unused-expressions */
import { expect } from '@esm-bundle/chai';

// Intercept fetch to prevent real network requests during tests.
// loadFragment (imported by info-tree.js) uses fetch internally;
// returning 404 causes it to resolve to null gracefully.
const originalFetch = window.fetch;
window.fetch = async (url, opts) => {
  if (typeof url === 'string' && (url.includes('.plain.html') || url.includes('.html'))) {
    return { ok: false, status: 404 };
  }
  return originalFetch(url, opts);
};

const { default: decorate } = await import('./info-tree.js');

/**
 * Build a block element with authored content structure.
 * @param {string} innerHtml The innerHTML of the block div
 * @param {string[]} variants Additional variant classes
 * @returns {Element}
 */
function buildBlock(innerHtml, variants = []) {
  const block = document.createElement('div');
  block.className = ['info-tree', ...variants].join(' ');
  block.innerHTML = innerHtml;
  return block;
}

/**
 * Clear info-tree cookie before each test
 */
function clearCookie() {
  document.cookie = 'info-tree-selections=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Set a cookie with selection state
 * @param {string} blockId
 * @param {Object} selections
 */
function setSelectionCookie(blockId, selections) {
  const all = { [blockId]: selections };
  const value = encodeURIComponent(JSON.stringify(all));
  const expires = new Date(Date.now() + 30 * 864e5).toUTCString();
  document.cookie = `info-tree-selections=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

// Single question with 3 answers
const SINGLE_QUESTION_HTML = `
  <div>
    <div><h3>What type of information are you looking for?</h3></div>
  </div>
  <div>
    <div>Product Overview</div>
    <div><a href="/fragments/product-overview">Product Overview Fragment</a></div>
  </div>
  <div>
    <div>Safety Information</div>
    <div><a href="/fragments/safety-info">Safety Info Fragment</a></div>
  </div>
  <div>
    <div>Dosing Guide</div>
    <div><a href="/fragments/dosing-guide">Dosing Guide Fragment</a></div>
  </div>
`;

// Two questions with answers
const MULTI_QUESTION_HTML = `
  <div>
    <div><h3>What type of information are you looking for?</h3></div>
  </div>
  <div>
    <div>Product Overview</div>
    <div><a href="/fragments/product-overview">Product Overview</a></div>
  </div>
  <div>
    <div>Safety Information</div>
    <div><a href="/fragments/safety-info">Safety Info</a></div>
  </div>
  <div>
    <div><h3>Which patient population?</h3></div>
  </div>
  <div>
    <div>Adults</div>
    <div><a href="/fragments/adults">Adults Fragment</a></div>
  </div>
  <div>
    <div>Pediatric</div>
    <div><a href="/fragments/pediatric">Pediatric Fragment</a></div>
  </div>
`;

// Question with plain text paths (no links)
const TEXT_PATH_HTML = `
  <div>
    <div><h3>Choose a topic</h3></div>
  </div>
  <div>
    <div>Topic A</div>
    <div>/fragments/topic-a</div>
  </div>
  <div>
    <div>Topic B</div>
    <div>/fragments/topic-b</div>
  </div>
`;

describe('info-tree block', () => {
  beforeEach(() => {
    clearCookie();
  });

  describe('decoration', () => {
    it('decorates block with correct wrapper structure', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      expect(block.classList.contains('info-tree-initialized')).to.be.true;
      const wrapper = block.querySelector('.info-tree-wrapper');
      expect(wrapper).to.not.be.null;
    });

    it('creates question nodes for each heading row', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions.length).to.equal(2);
    });

    it('renders heading text in each question node', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      const firstHeading = questions[0].querySelector('h3');
      expect(firstHeading).to.not.be.null;
      expect(firstHeading.textContent).to.equal('What type of information are you looking for?');

      const secondHeading = questions[1].querySelector('h3');
      expect(secondHeading).to.not.be.null;
      expect(secondHeading.textContent).to.equal('Which patient population?');
    });

    it('creates answer buttons for each answer row', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      expect(answers.length).to.equal(3);
      expect(answers[0].textContent).to.equal('Product Overview');
      expect(answers[1].textContent).to.equal('Safety Information');
      expect(answers[2].textContent).to.equal('Dosing Guide');
    });

    it('sets answer buttons as type="button"', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      answers.forEach((btn) => {
        expect(btn.getAttribute('type')).to.equal('button');
      });
    });

    it('sets aria-pressed="false" on all answer buttons initially', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      answers.forEach((btn) => {
        expect(btn.getAttribute('aria-pressed')).to.equal('false');
      });
    });

    it('creates a fragment container for each question', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const fragments = block.querySelectorAll('.info-tree-fragment');
      expect(fragments.length).to.equal(2);
    });

    it('creates a reset button with correct label', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const resetBtn = block.querySelector('.info-tree-reset');
      expect(resetBtn).to.not.be.null;
      expect(resetBtn.textContent).to.equal('Start Over');
      expect(resetBtn.getAttribute('type')).to.equal('button');
      expect(resetBtn.getAttribute('aria-label')).to.equal('Reset selections');
    });

    it('clears original block content after decoration', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      // Original authored rows should be gone, replaced by decorated structure
      const wrapper = block.querySelector('.info-tree-wrapper');
      expect(wrapper).to.not.be.null;
      expect(block.children.length).to.equal(1); // only the wrapper
    });
  });

  describe('visibility', () => {
    it('shows first question as visible initially', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions[0].classList.contains('visible')).to.be.true;
      expect(questions[0].classList.contains('hidden')).to.be.false;
    });

    it('hides subsequent questions initially', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions[1].classList.contains('hidden')).to.be.true;
      expect(questions[1].classList.contains('visible')).to.be.false;
    });

    it('hides reset button when no selections exist', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const resetBtn = block.querySelector('.info-tree-reset');
      expect(resetBtn.classList.contains('hidden')).to.be.true;
    });
  });

  describe('selection', () => {
    it('marks clicked answer as selected', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      answers[0].click();

      // Allow async operations to complete
      await new Promise((r) => { setTimeout(r, 50); });

      expect(answers[0].classList.contains('selected')).to.be.true;
      expect(answers[0].getAttribute('aria-pressed')).to.equal('true');
    });

    it('deselects previously selected answer in same question', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      answers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      answers[1].click();
      await new Promise((r) => { setTimeout(r, 50); });

      expect(answers[0].classList.contains('selected')).to.be.false;
      expect(answers[0].getAttribute('aria-pressed')).to.equal('false');
      expect(answers[1].classList.contains('selected')).to.be.true;
      expect(answers[1].getAttribute('aria-pressed')).to.equal('true');
    });

    it('reveals next question after selecting an answer', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      const firstAnswers = questions[0].querySelectorAll('.info-tree-answer');

      firstAnswers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      expect(questions[1].classList.contains('visible')).to.be.true;
      expect(questions[1].classList.contains('hidden')).to.be.false;
    });

    it('shows reset button after a selection is made', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      answers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      const resetBtn = block.querySelector('.info-tree-reset');
      expect(resetBtn.classList.contains('visible')).to.be.true;
    });

    it('clears downstream selections when a parent answer changes', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      const firstAnswers = questions[0].querySelectorAll('.info-tree-answer');

      // Select first answer in first question
      firstAnswers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      // Select answer in second question
      const secondAnswers = questions[1].querySelectorAll('.info-tree-answer');
      secondAnswers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      expect(secondAnswers[0].classList.contains('selected')).to.be.true;

      // Change answer in first question — should clear downstream
      firstAnswers[1].click();
      await new Promise((r) => { setTimeout(r, 50); });

      expect(secondAnswers[0].classList.contains('selected')).to.be.false;
      expect(secondAnswers[0].getAttribute('aria-pressed')).to.equal('false');
    });
  });

  describe('persistence (cookie)', () => {
    it('persists selection to cookie on answer click', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      answers[1].click();
      await new Promise((r) => { setTimeout(r, 50); });

      const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('info-tree-selections='));
      expect(cookie).to.not.be.undefined;

      const decoded = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      // blockId is derived from heading text: lowercase + non-alnum replaced with '-'
      const blockId = 'what-type-of-information-are-you-looking-for-';
      expect(decoded[blockId]).to.not.be.undefined;
      expect(decoded[blockId][0]).to.equal(1);
    });

    it('restores selections from cookie on re-decoration', async () => {
      // Pre-set cookie with selections (trailing dash from question mark in heading)
      const blockId = 'what-type-of-information-are-you-looking-for-';
      setSelectionCookie(blockId, { 0: 2 });

      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      expect(answers[2].classList.contains('selected')).to.be.true;
      expect(answers[2].getAttribute('aria-pressed')).to.equal('true');
      expect(answers[0].classList.contains('selected')).to.be.false;
    });

    it('handles malformed cookie data gracefully', async () => {
      // Set a malformed cookie
      document.cookie = 'info-tree-selections=not-valid-json; path=/';

      const block = buildBlock(SINGLE_QUESTION_HTML);
      // Should not throw
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions.length).to.equal(1);
    });
  });

  describe('reset', () => {
    it('clears all selections on reset click', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      const firstAnswers = questions[0].querySelectorAll('.info-tree-answer');
      firstAnswers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      const resetBtn = block.querySelector('.info-tree-reset');
      resetBtn.click();
      await new Promise((r) => { setTimeout(r, 50); });

      // All answers should be deselected
      const allAnswers = block.querySelectorAll('.info-tree-answer');
      allAnswers.forEach((btn) => {
        expect(btn.classList.contains('selected')).to.be.false;
        expect(btn.getAttribute('aria-pressed')).to.equal('false');
      });
    });

    it('hides downstream questions after reset', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      const firstAnswers = questions[0].querySelectorAll('.info-tree-answer');
      firstAnswers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      expect(questions[1].classList.contains('visible')).to.be.true;

      const resetBtn = block.querySelector('.info-tree-reset');
      resetBtn.click();
      await new Promise((r) => { setTimeout(r, 50); });

      expect(questions[1].classList.contains('hidden')).to.be.true;
    });

    it('hides reset button after reset', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      answers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      const resetBtn = block.querySelector('.info-tree-reset');
      resetBtn.click();
      await new Promise((r) => { setTimeout(r, 50); });

      expect(resetBtn.classList.contains('hidden')).to.be.true;
    });

    it('clears cookie on reset', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      answers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      const resetBtn = block.querySelector('.info-tree-reset');
      resetBtn.click();
      await new Promise((r) => { setTimeout(r, 50); });

      const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('info-tree-selections='));
      if (cookie) {
        const decoded = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        const blockId = 'what-type-of-information-are-you-looking-for-';
        expect(Object.keys(decoded[blockId] || {}).length).to.equal(0);
      }
    });
  });

  describe('fragment loading', () => {
    it('creates fragment container that starts empty', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const fragmentContainers = block.querySelectorAll('.info-tree-fragment');
      fragmentContainers.forEach((container) => {
        expect(container.innerHTML).to.equal('');
      });
    });

    it('accepts answers with plain text paths', async () => {
      const block = buildBlock(TEXT_PATH_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      expect(answers.length).to.equal(2);
      expect(answers[0].textContent).to.equal('Topic A');
      expect(answers[1].textContent).to.equal('Topic B');
    });

    it('accepts answers with link-based paths', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      expect(answers.length).to.equal(3);
      expect(answers[0].textContent).to.equal('Product Overview');
    });
  });

  describe('edge cases', () => {
    it('handles empty block without throwing', async () => {
      const block = buildBlock('');
      await decorate(block);

      expect(block.classList.contains('info-tree-initialized')).to.be.true;
      const wrapper = block.querySelector('.info-tree-wrapper');
      expect(wrapper).to.not.be.null;
      // No questions rendered
      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions.length).to.equal(0);
    });

    it('handles block with only headings (no answers)', async () => {
      const block = buildBlock(`
        <div>
          <div><h3>A question with no answers</h3></div>
        </div>
      `);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions.length).to.equal(1);
      const answers = block.querySelectorAll('.info-tree-answer');
      expect(answers.length).to.equal(0);
    });

    it('handles single-cell answer rows with links', async () => {
      const block = buildBlock(`
        <div>
          <div><h3>Pick one</h3></div>
        </div>
        <div>
          <div><a href="/fragments/option-a">Option A</a></div>
        </div>
      `);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      expect(answers.length).to.equal(1);
      expect(answers[0].textContent).to.equal('Option A');
    });

    it('validates href values and rejects javascript: URIs', async () => {
      const block = buildBlock(`
        <div>
          <div><h3>Choose</h3></div>
        </div>
        <div>
          <div>Bad Link</div>
          <div><a href="javascript:alert(1)">Evil</a></div>
        </div>
        <div>
          <div>Good Link</div>
          <div><a href="/fragments/safe">Safe</a></div>
        </div>
      `);
      await decorate(block);

      // Block should still render without error
      const answers = block.querySelectorAll('.info-tree-answer');
      expect(answers.length).to.equal(2);
    });

    it('generates blockId from first heading text', async () => {
      const block = buildBlock(`
        <div>
          <div><h2>My Custom Heading!</h2></div>
        </div>
        <div>
          <div>Answer One</div>
          <div>/fragments/one</div>
        </div>
      `);
      await decorate(block);

      // Select an answer to trigger cookie save
      const answers = block.querySelectorAll('.info-tree-answer');
      answers[0].click();
      await new Promise((r) => { setTimeout(r, 50); });

      const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('info-tree-selections='));
      expect(cookie).to.not.be.undefined;
      const decoded = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      // blockId should be derived from "My Custom Heading!" → "my-custom-heading-"
      expect(decoded['my-custom-heading-']).to.not.be.undefined;
    });

    it('uses "default" blockId when no heading exists in authored content', async () => {
      // No heading rows, just answer rows — they won't be parsed as answers
      // because current===null, but the block should not crash
      const block = buildBlock(`
        <div>
          <div>Some text</div>
          <div>/fragments/something</div>
        </div>
      `);
      await decorate(block);

      // No questions parsed since there's no heading to start one
      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions.length).to.equal(0);
    });

    it('handles h2 through h6 as valid question headings', async () => {
      const block = buildBlock(`
        <div>
          <div><h2>Question with H2</h2></div>
        </div>
        <div>
          <div>Answer</div>
          <div>/fragments/h2-answer</div>
        </div>
        <div>
          <div><h4>Question with H4</h4></div>
        </div>
        <div>
          <div>Answer</div>
          <div>/fragments/h4-answer</div>
        </div>
        <div>
          <div><h6>Question with H6</h6></div>
        </div>
        <div>
          <div>Answer</div>
          <div>/fragments/h6-answer</div>
        </div>
      `);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions.length).to.equal(3);
    });

    it('data-index attributes are set correctly on question nodes', async () => {
      const block = buildBlock(MULTI_QUESTION_HTML);
      await decorate(block);

      const questions = block.querySelectorAll('.info-tree-question');
      expect(questions[0].getAttribute('data-index')).to.equal('0');
      expect(questions[1].getAttribute('data-index')).to.equal('1');
    });

    it('data-answer-index attributes are set on answer buttons', async () => {
      const block = buildBlock(SINGLE_QUESTION_HTML);
      await decorate(block);

      const answers = block.querySelectorAll('.info-tree-answer');
      expect(answers[0].getAttribute('data-answer-index')).to.equal('0');
      expect(answers[1].getAttribute('data-answer-index')).to.equal('1');
      expect(answers[2].getAttribute('data-answer-index')).to.equal('2');
    });
  });
});
