import { moveInstrumentation, resolveImageReference } from '../../scripts/scripts.js';
import decorateExternalLinksUtility, {
  applyCommonProps,
  sanitizeLiteralBrTags,
  sanitizeLiteralSpaces,
  extractIconSource,
  createIcon,
  isImageHref,
} from '../../scripts/utils.js';
/*
 * Accordion V2 Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

function getIconImage(row) {
  if (!row) return null;
  const cell = row.firstElementChild || row;
  const source = extractIconSource(cell);
  return createIcon(source, 'image');
}

function getFieldElement(source, name) {
  return source.querySelector(`[data-aue-prop="${name}"]`);
}

function getFieldText(source, name) {
  const el = getFieldElement(source, name);
  return el ? (el.getAttribute('data-aue-value') ?? el.textContent ?? '').trim() : '';
}

// Mirrors hero-container.js's extractMediaFromCell: <picture>/<img> already present,
// else resolve a UE reference link, else fall back to a raw image-like <a href>.
function extractMediaFromCell(cell) {
  if (!cell) return null;
  const existing = cell.querySelector('picture, img');
  if (existing) return existing.cloneNode(true);

  const cellClone = cell.cloneNode(true);
  resolveImageReference(cellClone.firstElementChild || cellClone);
  const resolved = cellClone.querySelector('picture, img');
  if (resolved) return resolved;

  const link = cell.querySelector('a[href]');
  if (link?.href && isImageHref(link.getAttribute('href'))) {
    const img = document.createElement('img');
    img.src = link.href;
    img.alt = link.getAttribute('title') || link.textContent?.trim() || '';
    return img;
  }
  return null;
}

// imageEl is either a bare <img> or a <picture> wrapping one — querySelector('img')
// only searches descendants, so it never matches when imageEl is the <img> itself.
function getImgTag(imageEl) {
  return imageEl?.tagName === 'IMG' ? imageEl : imageEl?.querySelector('img');
}

// The explicit "Image Alt Text" field always wins over whatever fallback alt
// extractMediaFromCell/resolveImageReference produced (e.g. a raw link's
// textContent, which is often just placeholder text like "image" or a
// filename, not meaningful alt text) — it's the one value an author
// deliberately curated for this purpose.
function applyImageAlt(imageEl, altText) {
  if (!altText) return;
  const imgTag = getImgTag(imageEl);
  if (imgTag) imgTag.setAttribute('alt', altText);
}

/**
 * Main accordion-v2 properties order:
 * 0: blockHeading
 * 1: expandAllText
 * 2: collapseAllText
 * 3: expandAllIcon
 * 4: collapseAllIcon
 * 5: expandIcon
 * 6: collapseIcon
 * 7: expandAllIconImage
 * 8: collapseAllIconImage
 * 9: expandIconImage
 * 10: collapseIconImage
 * 11: ariaExpandAllLabel
 * 12: ariaCollapseAllLabel
 */
function gteConfigIcons(block) {
  const headingText = block.children[0].textContent.trim();
  const expandAllText = block.children[1].textContent.trim();
  const collapseAllText = block.children[2].textContent.trim();
  const expandAllIcon = `icon-abbvie-${block.children[3].textContent.trim()}`;
  const collapseAllIcon = `icon-abbvie-${block.children[4].textContent.trim()}`;
  const expandIcon = `icon-abbvie-${block.children[5].textContent.trim()}`;
  const collapseIcon = `icon-abbvie-${block.children[6].textContent.trim()}`;
  const expandAllIconImage = getIconImage(block.children[7]);
  const collapseAllIconImage = getIconImage(block.children[8]);
  const expandIconImage = getIconImage(block.children[9]);
  const collapseIconImage = getIconImage(block.children[10]);
  const ariaExpandAllLabel = block.children[11].textContent.trim();
  const ariaCollapseAllLabel = block.children[12].textContent.trim();

  // clean config rows
  [...block.children].forEach((child, index) => {
    if (index <= 12) {
      child.remove();
    }
  });

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
    textSpan.textContent = allOpen ? cfg.collapseAllText : cfg.expandAllText;
    expandAllBtn.setAttribute('aria-label', allOpen ? cfg.ariaCollapseAllLabel : cfg.ariaExpandAllLabel);
    expandAllBtn.classList.toggle('expanded', allOpen);
    if (icon) {
      icon.className = `accordion-v2-expand-all-icon ${allOpen ? cfg.collapseAllIcon : cfg.expandAllIcon}`;
    }
  }

  let showingCollapse = false;

  expandAllBtn.addEventListener('click', () => {
    const allDetails = block.querySelectorAll('details.accordion-v2-item');
    allDetails.forEach((d) => { d.open = !showingCollapse; });
    showingCollapse = !showingCollapse;
    updateButtonState(showingCollapse);
  });

  // Set initial state based on which items are actually open
  const initialDetails = block.querySelectorAll('details.accordion-v2-item');
  const allInitialOpen = [...initialDetails].every((d) => d.open);
  const noneInitialOpen = [...initialDetails].every((d) => !d.open);
  if (allInitialOpen) showingCollapse = true;
  else if (noneInitialOpen) showingCollapse = false;
  updateButtonState(showingCollapse);

  // Update button only when all open or all closed
  block.addEventListener('toggle', () => {
    const allDetails = block.querySelectorAll('details.accordion-v2-item');
    [...allDetails].forEach((e) => {
      e.firstElementChild.classList.toggle('open', e.open);
    });
    const allOpen = [...allDetails].every((d) => d.open);
    const allClosed = [...allDetails].every((d) => !d.open);
    if (allOpen) showingCollapse = true;
    else if (allClosed) showingCollapse = false;
    updateButtonState(showingCollapse);
  }, true);
}

function closeAllExceptCurrent(block) {
  if (!block.classList.contains('allowmultipleopen')) {
    const details = block.querySelectorAll('details.accordion-v2-item');
    details.forEach((detail) => {
      detail.addEventListener('toggle', () => {
        if (detail.open) {
          details.forEach((d) => {
            if (d !== detail) d.open = false;
          });
        }
      });
    });
  }
}

export default function decorate(block) {
  applyCommonProps(block, 13);
  const cfg = gteConfigIcons(block);

  // Extract h1-size through h6-size classes from block to apply only to summaries
  const headingSizeClasses = [...block.classList].filter((cls) => /^h[1-6]-size$/.test(cls));
  block.classList.remove(...headingSizeClasses);

  [...block.children].forEach((row) => {
    // decorate accordion-v2 item label
    if (!row.children[0] || !row.children[1]) return;
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-v2-item-label';
    summary.append(...label.childNodes);
    // Apply heading size classes to summary
    summary.classList.add(...headingSizeClasses);
    if (summary.firstElementChild) {
      summary.firstElementChild.classList.add('accordion-v2-item-label-text');
    }
    // decorate accordion-v2 item body
    const body = row.children[1];
    body.className = 'accordion-v2-item-body';
    sanitizeLiteralBrTags(body);
    sanitizeLiteralSpaces(body);
    const ariaExpandLabel = row.children[3].textContent.trim() || '';
    const ariaCollapseLabel = row.children[4].textContent.trim() || '';

    /*
     * New (NW-2683) accordion-v2-item fields: columnOneContent, columnTwoContent,
     * image, imageMimeType, imageAlt, imageAlignment — all optional, appended
     * after ariaCollapseLabel. Existing indices 0-4 are untouched. UE/editor
     * mode still carries data-aue-prop instrumentation on every field even
     * when empty, so those rows are looked up by name; published/delivered
     * mode only has rows for fields that actually have content, so the cell's
     * shape (image vs alignment keyword vs richtext) is detected instead —
     * mirrors inner-grid.js / hero-container.js.
     */
    const hasUEProps = [...row.children].some((cell) => cell.hasAttribute('data-aue-prop'));

    let columnOneContent = null;
    let columnTwoContent = null;
    let imageEl = null;
    let imageAlignment = 'stacked';

    if (hasUEProps) {
      // Always keep the field elements in UE mode, even when currently empty —
      // Universal Editor needs the actual instrumented data-aue-prop node
      // present in the canvas to bind its rich-text editing surface (Enter/new
      // paragraph, formatting, etc). Gating on non-empty textContent here
      // dropped the node entirely for a freshly-added item (row.replaceWith
      // discards whatever wasn't moved out), degrading the RTE for the very
      // first keystroke. Mirrors how the existing "text" field and
      // hero-container.js/text-container.js always keep their field elements
      // regardless of emptiness.
      columnOneContent = getFieldElement(row, 'columnOneContent');
      columnTwoContent = getFieldElement(row, 'columnTwoContent');

      const imageField = getFieldElement(row, 'image');
      if (imageField) imageEl = extractMediaFromCell(imageField);

      applyImageAlt(imageEl, getFieldText(row, 'imageAlt'));
      imageAlignment = getFieldText(row, 'imageAlignment') || 'stacked';
    } else if (row.children.length > 5) {
      // Each extra cell is classified independently by its own shape, not by
      // position — image, columnOneContent, and columnTwoContent are each
      // optional, so any of them can appear first or be omitted entirely.
      //
      // imageAlt cannot be reliably distinguished from a column cell here:
      // aem.js's wrapTextNodes() runs on every block before decorate() and
      // wraps ALL cell text in <p> uniformly (confirmed by inspection), so a
      // plain "text" field (imageAlt) and a richtext field (columnOneContent/
      // columnTwoContent) produce the identical shape — <div><p>...</p></div>
      // — once delivered. Any populated imageAlt cell is therefore currently
      // absorbed as column content instead. This needs verifying against
      // real Universal Editor / AEM-exported markup (not synthetic test
      // HTML) to find an actual distinguishing signal before it can be
      // fixed; until then, alt text authored here only reaches the image in
      // UE/editor mode (see applyImageAlt above), not the published page.
      const richtextCells = [];
      for (let i = 5; i < row.children.length; i += 1) {
        const cell = row.children[i];
        const text = cell.textContent.trim();
        if (cell.querySelector('picture, img')) {
          imageEl = extractMediaFromCell(cell);
        } else if (['stacked', 'left', 'right'].includes(text)) {
          imageAlignment = text;
        } else if (text && !/^image\//i.test(text)) {
          // Try resolving as an image reference first (covers scene7/DAM URLs
          // with no file extension, via resolveImageReference's own broader
          // check) before falling back to treating it as a column cell.
          const resolved = cell.querySelector('a[href]') ? extractMediaFromCell(cell) : null;
          if (resolved) {
            imageEl = resolved;
          } else {
            richtextCells.push(cell);
          }
        }
      }
      [columnOneContent, columnTwoContent] = richtextCells;
    }

    let columnsWrapper = null;
    if (columnOneContent || columnTwoContent) {
      columnsWrapper = document.createElement('div');
      columnsWrapper.className = 'accordion-v2-item-columns';
      [columnOneContent, columnTwoContent].filter(Boolean).forEach((columnContent) => {
        columnContent.className = 'accordion-v2-item-column';
        sanitizeLiteralBrTags(columnContent);
        sanitizeLiteralSpaces(columnContent);
        columnsWrapper.append(columnContent);
      });
    }

    // decorate accordion-v2 item
    const details = document.createElement('details');
    moveInstrumentation(row, details);
    // Use the third column for additional classes on the details element
    details.className = `accordion-v2-item ${row.children[2].textContent.trim().replaceAll(',', '')}`.trim();
    const isImageIcon = block.classList.contains('accordion-v2-icon-image');

    if (details.classList.contains('defaultopen')) {
      if (!isImageIcon) summary.classList.add(cfg.collapseIcon);
      details.setAttribute('open', '');
      details.setAttribute('aria-label', ariaExpandLabel);
    } else {
      if (!isImageIcon) summary.classList.add(cfg.expandIcon);
      summary.setAttribute('aria-label', ariaCollapseLabel);
    }

    if (isImageIcon) {
      if (cfg.expandIconImage) {
        const expandIcon = cfg.expandIconImage.cloneNode(true);
        expandIcon.classList.add('accordion-v2-expand-image-icon');
        summary.appendChild(expandIcon);
      }
      if (cfg.collapseIconImage) {
        const collapseIcon = cfg.collapseIconImage.cloneNode(true);
        collapseIcon.classList.add('accordion-v2-collapse-image-icon');
        summary.appendChild(collapseIcon);
      }
    }

    details.addEventListener('toggle', () => {
      details.setAttribute('aria-label', details.open ? ariaExpandLabel : ariaCollapseLabel);
      summary.classList.toggle('open', details.open);
      if (!isImageIcon) {
        summary.classList.toggle(cfg.collapseIcon, details.open);
        summary.classList.toggle(cfg.expandIcon, !details.open);
      }
    });

    if (imageEl) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = `accordion-v2-item-image accordion-v2-item-image--${imageAlignment}`;
      imageWrapper.append(imageEl);
      body.prepend(imageWrapper);
    }
    if (columnsWrapper) {
      body.append(columnsWrapper);
    }

    details.append(summary, body);
    row.replaceWith(details);
  });

  // decorate accordion-v2 heading
  decorateHeading(block, cfg.headingText);

  // Add Expand All / Collapse All button
  if (block.classList.contains('showexpandcollapseall')) {
    addExpandCollapseAllButton(block, cfg);
  }

  // multiple accordion-v2 items open at the same time if "allowmultipleopen" class is present
  closeAllExceptCurrent(block);

  // Decorate external links across the entire block
  decorateExternalLinksUtility(block);
  block.querySelectorAll('a[title]').forEach((a) => {
    const { title } = a;

    if (title?.trim()) {
      a.setAttribute('aria-label', title);
      a.removeAttribute('title');
    }
  });
}
