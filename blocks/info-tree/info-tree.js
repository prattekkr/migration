import { loadFragment } from '../fragment/fragment.js';
import { div, button } from '../../scripts/dom-helpers.js';

const COOKIE_NAME = 'info-tree-selections';
const COOKIE_DAYS = 30;

function getCookieSelections(blockId) {
  try {
    const raw = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!raw) return {};
    const decoded = decodeURIComponent(raw.split('=')[1]);
    const all = JSON.parse(decoded);
    return all[blockId] || {};
  } catch {
    return {};
  }
}

function setCookieSelections(blockId, selections) {
  let all = {};
  try {
    const raw = document.cookie
      .split('; ')
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (raw) {
      all = JSON.parse(decodeURIComponent(raw.split('=')[1]));
    }
  } catch {
    all = {};
  }
  all[blockId] = selections;
  const expires = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(all))}; path=/; expires=${expires}; SameSite=Lax`;
}

function clearCookieSelections(blockId) {
  setCookieSelections(blockId, {});
}

function getBlockId(block) {
  const heading = block.querySelector('h2, h3, h4');
  if (heading) return heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return 'default';
}

function isValidHref(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return /^https?:\/\//.test(trimmed) || trimmed.startsWith('/');
}

/**
 * Parse block rows into question nodes.
 * Expected authored structure:
 *   Row with single cell containing a heading = start of a new question
 *   Row with 2 cells = answer option (col1: label, col2: fragment path)
 */
function parseQuestions(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const questions = [];
  let current = null;

  rows.forEach((row) => {
    const cols = [...row.children];
    const hasHeading = row.querySelector('h2, h3, h4, h5, h6');

    if (hasHeading && cols.length === 1) {
      if (current) questions.push(current);
      current = {
        questionEl: row,
        heading: hasHeading,
        answers: [],
      };
    } else if (current && cols.length >= 2) {
      const labelCol = cols[0];
      const pathCol = cols[1];
      const link = pathCol.querySelector('a');
      const fragmentPath = link ? link.getAttribute('href') : pathCol.textContent.trim();

      current.answers.push({
        label: labelCol.textContent.trim(),
        fragmentPath: isValidHref(fragmentPath) ? fragmentPath : '',
      });
    } else if (current && cols.length === 1 && !hasHeading) {
      const link = cols[0].querySelector('a');
      const text = cols[0].textContent.trim();
      if (link) {
        current.answers.push({
          label: text || link.textContent.trim(),
          fragmentPath: isValidHref(link.getAttribute('href')) ? link.getAttribute('href') : '',
        });
      }
    }
  });

  if (current) questions.push(current);
  return questions;
}

async function loadAnswerFragment(container, fragmentPath) {
  const el = container;
  el.innerHTML = '';
  el.classList.add('loading');
  try {
    const fragment = await loadFragment(fragmentPath);
    if (fragment) {
      el.append(...fragment.childNodes);
    } else {
      el.textContent = '';
    }
  } catch {
    el.textContent = '';
  }
  el.classList.remove('loading');
}

function renderQuestion(question, index, selections, onSelect) {
  const node = div({ class: 'info-tree-question', 'data-index': String(index) });
  const headingClone = question.heading.cloneNode(true);
  node.append(headingClone);

  const answersContainer = div({ class: 'info-tree-answers' });
  question.answers.forEach((answer, ansIdx) => {
    const isSelected = selections[index] === ansIdx;
    const btn = button(
      {
        class: `info-tree-answer${isSelected ? ' selected' : ''}`,
        type: 'button',
        'aria-pressed': String(isSelected),
        'data-answer-index': String(ansIdx),
      },
      answer.label,
    );
    btn.addEventListener('click', () => onSelect(index, ansIdx));
    answersContainer.append(btn);
  });
  node.append(answersContainer);

  const fragmentContainer = div({ class: 'info-tree-fragment' });
  node.append(fragmentContainer);

  return node;
}

/**
 * Decorate the info-tree block.
 * @param {Element} block the block element
 */
export default async function decorate(block) {
  const blockId = getBlockId(block);
  const questions = parseQuestions(block);
  const selections = getCookieSelections(blockId);

  function updateVisibility(questionNodes, resetBtn) {
    questionNodes.forEach((node, idx) => {
      const isVisible = idx === 0 || selections[idx - 1] !== undefined;
      node.classList.toggle('visible', isVisible);
      node.classList.toggle('hidden', !isVisible);
    });
    const hasAnySelection = Object.keys(selections).length > 0;
    resetBtn.classList.toggle('visible', hasAnySelection);
    resetBtn.classList.toggle('hidden', !hasAnySelection);
  }

  async function handleSelect(questionNodes, resetBtn, questionIdx, answerIdx) {
    selections[questionIdx] = answerIdx;

    // Clear downstream selections when a parent answer changes
    Object.keys(selections).forEach((key) => {
      if (Number(key) > questionIdx) delete selections[key];
    });

    setCookieSelections(blockId, selections);

    // Update button states for this question
    const qNode = questionNodes[questionIdx];
    qNode.querySelectorAll('.info-tree-answer').forEach((btn, i) => {
      const isSelected = i === answerIdx;
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });

    // Clear downstream fragment containers and button states
    questionNodes.forEach((node, idx) => {
      if (idx > questionIdx) {
        const frag = node.querySelector('.info-tree-fragment');
        if (frag) { frag.innerHTML = ''; }
        node.querySelectorAll('.info-tree-answer').forEach((btn) => {
          btn.classList.remove('selected');
          btn.setAttribute('aria-pressed', 'false');
        });
      }
    });

    updateVisibility(questionNodes, resetBtn);

    // Load the fragment for this selection
    const answer = questions[questionIdx].answers[answerIdx];
    if (answer?.fragmentPath) {
      const container = qNode.querySelector('.info-tree-fragment');
      await loadAnswerFragment(container, answer.fragmentPath);
    }
  }

  function handleReset(questionNodes, resetBtn) {
    Object.keys(selections).forEach((key) => delete selections[key]);
    clearCookieSelections(blockId);

    questionNodes.forEach((node) => {
      const frag = node.querySelector('.info-tree-fragment');
      if (frag) { frag.innerHTML = ''; }
      node.querySelectorAll('.info-tree-answer').forEach((btn) => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      });
    });

    updateVisibility(questionNodes, resetBtn);
  }

  async function restoreSelections(questionNodes) {
    const sortedKeys = Object.keys(selections)
      .map(Number)
      .sort((a, b) => a - b);

    // Sequential fragment loading using reduce for eslint compatibility
    await sortedKeys.reduce(async (prev, idx) => {
      await prev;
      const answerIdx = selections[idx];
      const answer = questions[idx]?.answers[answerIdx];
      if (answer?.fragmentPath) {
        const container = questionNodes[idx]?.querySelector('.info-tree-fragment');
        if (container) {
          await loadAnswerFragment(container, answer.fragmentPath);
        }
      }
    }, Promise.resolve());
  }

  block.textContent = '';
  block.classList.add('info-tree-initialized');

  const wrapper = div({ class: 'info-tree-wrapper' });

  const resetBtn = button(
    { class: 'info-tree-reset', type: 'button', 'aria-label': 'Reset selections' },
    'Start Over',
  );

  const questionNodes = questions.map((q, idx) => renderQuestion(
    q,
    idx,
    selections,
    (qIdx, aIdx) => handleSelect(questionNodes, resetBtn, qIdx, aIdx),
  ));

  questionNodes.forEach((node) => wrapper.append(node));

  resetBtn.addEventListener('click', () => handleReset(questionNodes, resetBtn));
  wrapper.append(resetBtn);

  block.append(wrapper);

  updateVisibility(questionNodes, resetBtn);
  await restoreSelections(questionNodes);
}
