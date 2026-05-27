import { applyCommonProps } from '../../scripts/utils.js';

export default function decorate(block) {
  applyCommonProps(block, 1);

  const contentDiv = block.querySelector(':scope > div > div');

  const span = document.createElement('span');
  span.className = 'eyebrow-text-text';
  span.setAttribute('role', 'heading');
  span.setAttribute('aria-level', '2');

  if (contentDiv) {
    contentDiv.querySelectorAll(':scope > p').forEach((p) => {
      while (p.firstChild) span.appendChild(p.firstChild);
    });
    if (!span.hasChildNodes()) span.innerHTML = contentDiv.innerHTML;
  }

  block.replaceChildren(span);
}
