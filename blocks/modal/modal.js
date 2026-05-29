import {
  buildBlock,
  decorateBlock,
  loadBlock,
  loadCSS,
} from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getConfigValue } from '../../scripts/config.js';
import { addGridSectionsWrapper } from '../../scripts/utils.js';

/*
  This is not a traditional block, so there is no decorate function.
  Instead, links to a /modals/ path are automatically transformed into a modal.
  Other blocks can also use the createModal() and openModal() functions.
  Modal fragments may use data-modal-action="confirm" on a control to finish
  gated flows (e.g. link list: confirm, then navigate).
*/

function bindCloseButton(dialogContent, onClick) {
  const btn = dialogContent.querySelector('.cta.popup-close');
  if (!btn) return null;
  btn.setAttribute('aria-label', 'Close');
  btn.setAttribute('tabindex', '0');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    onClick();
  });
  return btn;
}

/**
 * @param {Node[]} contentNodes
 * @param {string} destination
 * @param {{ onConfirm?: () => void, modalType?: string, focusOnClose?: HTMLElement }} [opts]
 */
export async function createModal(contentNodes, destination, opts = {}) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);

  const {
    onConfirm, modalType, focusOnClose, newTab,
  } = opts;

  const dialog = document.createElement('dialog');
  if (modalType) dialog.dataset.modalType = modalType;
  dialog.setAttribute('aria-modal', 'true');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(...contentNodes);
  dialog.append(dialogContent);

  const headingId = dialogContent.querySelector('h1, h2, h3, h4, h5')?.id;
  if (headingId) dialog.setAttribute('aria-labelledby', headingId);

  if (typeof onConfirm === 'function') {
    dialogContent.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal-action="confirm"]');
      if (!trigger) return;
      e.preventDefault();
      onConfirm();
      dialog.close();
    });
  }

  let closeButtonRef = null;

  if (modalType === 'departure') {
    closeButtonRef = bindCloseButton(dialogContent, () => dialog.close());

    dialogContent.querySelector('.cta.popup-agree')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (newTab) {
        window.open(destination, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = destination;
      }
    });

    dialogContent.querySelector('.cta.popup-disagree')?.addEventListener('click', (e) => {
      e.preventDefault();
      dialog.close();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  } else if (modalType === 'arrival') {
    const dismissToHome = () => { dialog.close(); window.location.assign('/'); };

    bindCloseButton(dialogContent, dismissToHome);

    dialogContent.querySelector('.cta.popup-agree')?.addEventListener('click', (e) => {
      e.preventDefault();
      dialog.close();
    });

    dialogContent.querySelector('.cta.popup-disagree')?.addEventListener('click', (e) => {
      e.preventDefault();
      dismissToHome();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dismissToHome();
    });
  }

  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  block.innerHTML = '';
  block.append(dialog);

  let savedScrollY = 0;

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
    window.scrollTo({ top: savedScrollY, behavior: 'smooth' });
    focusOnClose?.focus({ preventScroll: true });
  });

  return {
    block,
    showModal: () => {
      savedScrollY = window.scrollY;
      window.scrollTo({ top: 0, behavior: 'instant' });
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('modal-open');
      closeButtonRef?.focus();
    },
  };
}

/**
 * @param {string} fragmentUrl
 * @param {string} destination
 * @param {{ onConfirm?: () => void, modalType?: string, focusOnClose?: HTMLElement }} [options]
 */
export async function openModal(fragmentUrl, destination, options = {}) {
  let path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl).pathname
    : fragmentUrl;

  try {
    const rootPath = await getConfigValue('contentBasePath');
    if (rootPath && path.startsWith(rootPath)) {
      path = path.substring(rootPath.length);
    }
  } catch {
    // config not available, skip normalization
  }

  const fragment = await loadFragment(path);
  if (!fragment) throw new Error(`Modal: fragment not found at ${path}`);

  const firstSection = fragment.querySelector(':scope .section');
  if (firstSection?.classList.contains('grid-container')) {
    addGridSectionsWrapper(fragment);
  }

  const { showModal } = await createModal([...fragment.childNodes], destination, options);
  showModal();
}
