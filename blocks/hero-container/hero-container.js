/**
 * Hero Container Block
 *
 * Rotating hero: picks one hero-container item per page load and renders a
 * full-bleed background image/video with an optional text overlay.
 *
 * The container owns both the child-item authoring model and the rendering
 * logic, following the same single-block pattern used by cards/card.
 *
 * Rotation: sessionStorage key `hero-container-{pathname}` stores the current
 * index (starting at 0). Each page load reads it, shows that item, then writes
 * (current + 1) % n so the next visit advances to the following item.
 *
 * DOM structure produced:
 *   hero-container-item
 *     hero-container-item-authoring-data (hidden)
 *     hero-container-bg
 *       picture/img/video              ← background media (position: absolute)
 *       hero-container-title-row       ← title text, overlaid on image (z-index)
 *       hero-container-cta-row         ← CTA button, overlaid on image (z-index)
 *     hero-container-section-outer     ← max-width: 133rem, centered; 12-col grid at desktop
 *       hero-container-section-overlay ← white card; grid-column: 2/span 10 at desktop
 */

import {
  moveInstrumentation,
  resolveImageReference,
} from '../../scripts/scripts.js';
import { shouldRunOutsideAuthorEdit } from '../../scripts/utils.js';
import { getConfigValue } from '../../scripts/config.js';

function getAuthoringSource(item) {
  return (
    item.querySelector(':scope > .hero-container-item-authoring-data') || item
  );
}

function getFieldElement(source, name) {
  return source.querySelector(`[data-aue-prop="${name}"]`) || null;
}

function getFieldText(source, name) {
  const el = getFieldElement(source, name);
  if (!el) return '';
  return (el.getAttribute('data-aue-value') ?? el.textContent ?? '').trim();
}

function getFieldLink(source, name) {
  const field = getFieldElement(source, name);
  if (!field) return '';

  return (
    field.querySelector('a[href]')?.getAttribute('href')
    || field.getAttribute('data-aue-href')
    || field.getAttribute('data-aue-value')
    || field.textContent
    || ''
  ).trim();
}

function getFieldContent(field) {
  if (!field) return null;
  const directChildren = [...field.children];
  if (directChildren.length === 1 && directChildren[0].tagName === 'DIV') {
    return directChildren[0];
  }
  return field;
}

const BC_PLAYERS_BASE = 'https://players.brightcove.net';

function loadBcScript(accountId, playerId) {
  const scriptKey = `${accountId}/${playerId}_default`;
  const scriptSrc = `${BC_PLAYERS_BASE}/${scriptKey}/index.min.js`;
  const existing = document.querySelector(`script[src="${scriptSrc}"]`);
  if (existing) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

function buildBrightcoveVideo(videoId, accountId, playerId) {
  const wrapper = document.createElement('div');
  wrapper.className = 'hero-container-brightcove';
  const videoEl = document.createElement('video-js');
  videoEl.id = `hero-bc-${videoId}`;
  videoEl.setAttribute('data-account', accountId);
  videoEl.setAttribute('data-player', playerId);
  videoEl.setAttribute('data-video-id', videoId);
  videoEl.setAttribute('data-embed', 'default');
  videoEl.setAttribute('autoplay', 'autoplay');
  videoEl.setAttribute('muted', 'true');
  videoEl.setAttribute('loop', 'loop');
  videoEl.setAttribute('playsinline', 'playsinline');
  videoEl.className = 'video-js hero-bc-player';
  wrapper.append(videoEl);

  loadBcScript(accountId, playerId).then(() => {
    if (typeof window.bc === 'function') {
      window.bc(videoEl);
    }
    const initPlayer = () => {
      if (typeof window.videojs === 'undefined') {
        requestAnimationFrame(initPlayer);
        return;
      }
      const player = window.videojs.getPlayer(videoEl.id);
      if (!player) {
        requestAnimationFrame(initPlayer);
        return;
      }
      player.ready(() => {
        player.muted(true);
        player.loop(true);
        player.controls(false);
        player.play();
      });
    };
    initPlayer();
  });

  return wrapper;
}

function extractMediaFromCell(cell) {
  if (!cell) return null;

  const source = getFieldContent(cell) || cell;
  const existing = source.querySelector('picture') || source.querySelector('img');
  if (existing) return existing.cloneNode(true);

  const cellClone = source.cloneNode(true);
  resolveImageReference(cellClone.firstElementChild || cellClone);
  const resolved = cellClone.querySelector('picture') || cellClone.querySelector('img');
  if (resolved) return resolved;

  const link = source.querySelector('a');
  if (link?.href && !link.href.startsWith('#')) {
    const img = document.createElement('img');
    img.src = link.href;
    img.alt = link.getAttribute('title') || link.textContent?.trim() || '';
    return img;
  }

  return null;
}

function getItemFields(item) {
  const source = getAuthoringSource(item);
  const cells = [...source.querySelectorAll(':scope > div')];

  if (cells.some((cell) => cell.hasAttribute('data-aue-prop'))) {
    return {
      backgroundType: getFieldText(source, 'backgroundType') || 'image',
      mediaCell: getFieldElement(source, 'image'),
      altText: getFieldText(source, 'imageAlt'),
      accountId: getFieldText(source, 'accountId'),
      playerId: getFieldText(source, 'playerId'),
      videoId: getFieldText(source, 'videoId'),
      textCell: getFieldElement(source, 'text'),
      ctaLabel: getFieldText(source, 'ctaLabel'),
      ctaUrl: getFieldLink(source, 'ctaUrl'),
      ctaAltText: getFieldText(source, 'ctaAltText'),
      styleClasses: getFieldText(source, 'classes_customDynamicClass'),
    };
  }

  return {
    backgroundType: cells[0]?.textContent?.trim() || 'image',
    mediaCell: cells[1] ?? null,
    accountId: cells[2]?.textContent?.trim() || '',
    playerId: cells[3]?.textContent?.trim() || '',
    videoId: cells[4]?.textContent?.trim() || '',
    textCell: cells[5] ?? null,
    ctaLabel: cells[6]?.textContent?.trim() || '',
    ctaUrl: cells[7]?.querySelector('a')?.getAttribute('href')
      || cells[7]?.textContent?.trim() || '',
    ctaAltText: cells[8]?.textContent?.trim() || '',
    styleClasses: cells[9]?.textContent?.trim() || '',
    altText: '',
  };
}

function createOverlayRow(className) {
  const row = document.createElement('div');
  row.classList.add('homepage-overlap');
  row.classList.add(className);
  return row;
}

function collectSectionOverlayContent(block) {
  const wrapper = block.closest('.hero-container-wrapper');
  if (!wrapper) return null;

  const overlayContent = document.createElement('div');
  overlayContent.classList.add('hero-container-section-overlay');

  let sibling = wrapper.nextElementSibling;
  while (sibling) {
    const nextSibling = sibling.nextElementSibling;
    overlayContent.append(sibling);
    sibling = nextSibling;
  }

  return overlayContent.children.length ? overlayContent : null;
}

function decorateHeroItem(item) {
  const fields = getItemFields(item);

  let authoringData = item.querySelector(
    ':scope > .hero-container-item-authoring-data',
  );
  if (!authoringData) {
    authoringData = document.createElement('div');
    authoringData.className = 'hero-container-item-authoring-data';
    authoringData.hidden = true;
    authoringData.setAttribute('aria-hidden', 'true');
    while (item.firstChild) authoringData.append(item.firstChild);
  }

  const bgLayer = document.createElement('div');
  bgLayer.classList.add('hero-container-bg');

  if (fields.backgroundType === 'video') {
    if (fields.videoId) {
      bgLayer.dataset.videoId = fields.videoId;
      bgLayer.dataset.accountId = fields.accountId || '';
      bgLayer.dataset.playerId = fields.playerId || '';
    }
  } else if (fields.backgroundType === 'color') {
    // Color-only background — styling from picklist
  } else {
    const media = extractMediaFromCell(fields.mediaCell);
    if (media) {
      const img = media.tagName === 'IMG'
        ? media : media.querySelector('img');
      if (img) {
        img.loading = 'eager';
        img.fetchPriority = 'high';
        if (fields.altText && !img.alt) img.alt = fields.altText;
      }
      bgLayer.appendChild(media);
    }
  }

  // Title and CTA sit inside the bg layer, on top of the image via z-index
  if (fields.textCell?.textContent?.trim()) {
    const titleRow = createOverlayRow('hero-container-title-row');
    const textContent = getFieldContent(fields.textCell) || fields.textCell;
    titleRow.append(
      ...[...textContent.childNodes].map((node) => node.cloneNode(true)),
    );
    bgLayer.append(titleRow);
  }

  if (fields.ctaLabel) {
    const ctaRow = createOverlayRow('hero-container-cta-row');
    const ctaLink = document.createElement('a');
    ctaLink.className = 'hero-container-cta-link';
    ctaLink.textContent = fields.ctaLabel;

    if (fields.ctaUrl) {
      ctaLink.href = fields.ctaUrl;
    }
    if (fields.ctaAltText) {
      ctaLink.setAttribute('aria-label', fields.ctaAltText);
    }

    ctaRow.append(ctaLink);
    bgLayer.append(ctaRow);
  }

  // Video play/pause control button
  if (fields.backgroundType === 'video') {
    const controlBtn = document.createElement('button');
    controlBtn.type = 'button';
    controlBtn.className = 'hero-container-video-control playing';
    controlBtn.setAttribute('aria-label', 'Pause/Play button');
    bgLayer.append(controlBtn);
  }

  item.replaceChildren(authoringData, bgLayer);

  return fields.styleClasses || '';
}

export default async function decorate(block) {
  const overlayContent = shouldRunOutsideAuthorEdit()
    ? collectSectionOverlayContent(block)
    : null;

  // ── 1. Collect item rows (filter out block-level config rows) ──────────────
  const allRows = [...block.querySelectorAll(':scope > div')];
  const rows = allRows.filter((row) => {
    const cells = row.querySelectorAll(':scope > div');
    return cells.length > 1;
  });
  // Remove block-level config rows from DOM
  allRows.filter((row) => !rows.includes(row)).forEach((row) => row.remove());
  if (rows.length === 0) return;

  // ── 2. SessionStorage rotation ─────────────────────────────────────────────
  const storageKey = `hero-container-${window.location.pathname}`;
  const storedIndex = Number.parseInt(
    sessionStorage.getItem(storageKey) ?? '0',
    10,
  );
  const currentIndex = Number.isFinite(storedIndex)
    ? storedIndex % rows.length
    : 0;
  sessionStorage.setItem(
    storageKey,
    String((currentIndex + 1) % rows.length),
  );

  let selectedStyleClasses = '';
  let selectedItem = null;

  // ── 3. Build each item ─────────────────────────────────────────────────────
  rows.forEach((row, index) => {
    const container = document.createElement('div');
    container.classList.add('hero-container-item');
    moveInstrumentation(row, container);
    while (row.firstChild) container.append(row.firstChild);
    row.replaceWith(container);

    const styleClasses = decorateHeroItem(container);

    if (index === currentIndex) {
      selectedStyleClasses = styleClasses;
      selectedItem = container;
    } else {
      container.classList.add('hidden');
    }
  });

  // ── 4. Wrap overlay in outer container and append ──────────────────────────
  if (selectedItem && overlayContent) {
    const sectionOuter = document.createElement('div');
    sectionOuter.classList.add('hero-container-section-outer');
    sectionOuter.append(overlayContent);
    selectedItem.append(sectionOuter);
  }

  // ── 5. Apply selected item's style classes to block ───────────────────────
  const excluded = ['hero-container-item', 'none', ''];
  if (selectedStyleClasses) {
    selectedStyleClasses.split(',').forEach((cls) => {
      const trimmed = cls.trim();
      if (trimmed && !excluded.includes(trimmed)) {
        block.classList.add(trimmed);
      }
    });
  }

  // ── 6. Initialize Brightcove video if present ──────────────────────────────
  const bcBg = selectedItem?.querySelector(
    '.hero-container-bg[data-video-id]',
  );
  if (bcBg) {
    const { videoId } = bcBg.dataset;
    const accountId = bcBg.dataset.accountId
      || await getConfigValue('brightcoveAccountId')
      || '2157889328001';
    const playerId = bcBg.dataset.playerId
      || await getConfigValue('brightcovePlayerId')
      || 'default';
    const bcWrapper = buildBrightcoveVideo(videoId, accountId, playerId);
    if (selectedStyleClasses) {
      selectedStyleClasses.split(',').forEach((cls) => {
        const trimmed = cls.trim();
        if (trimmed && !excluded.includes(trimmed)) {
          bcWrapper.classList.add(trimmed);
        }
      });
    }
    bcBg.appendChild(bcWrapper);
  }

  // ── 7. Video play/pause control ───────────────────────────────────────────
  const controlBtn = selectedItem?.querySelector(
    '.hero-container-video-control',
  );
  if (controlBtn) {
    controlBtn.addEventListener('click', () => {
      const isPlaying = controlBtn.classList.contains('playing');
      const video = selectedItem.querySelector('video');
      const bcEl = selectedItem.querySelector('video-js');

      if (video) {
        if (isPlaying) video.pause();
        else video.play();
      } else if (bcEl && typeof window.videojs !== 'undefined') {
        const bcPlayer = window.videojs.getPlayer(bcEl.id);
        if (bcPlayer) {
          if (isPlaying) bcPlayer.pause();
          else bcPlayer.play();
        }
      }

      controlBtn.classList.toggle('playing', !isPlaying);
    });
  }
}
