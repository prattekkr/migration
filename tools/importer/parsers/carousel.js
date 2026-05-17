/* eslint-disable */
/* global WebImporter */

/**
 * Parser: carousel
 * Reference: can-unlocking-one-million-genomes.plain.html (manually migrated)
 *
 * Creates carousel config block (24 rows) PLUS separate custom-image blocks
 * for each slide. The carousel element is replaced with a fragment containing
 * the carousel block followed by N custom-image blocks.
 */
export default function parse(element, { document }) {
  const slides = element.querySelectorAll('[role="tabpanel"], .carousel-item, .splide__slide');
  const slideCount = slides.length || 0;

  const val = (v) => {
    const d = document.createElement('div');
    if (v !== undefined && v !== null && v !== '') d.textContent = String(v);
    return d;
  };

  // Carousel config block (24 rows)
  const configCells = [
    [val(slideCount)], [val('static')], [val('')], [val('')],
    [val('false')], [val('3000')], [val('false')], [val('1')],
    [val('false')], [val('1')], [val('false')], [val('false')],
    [val('true')], [val('true')], [val('')], [val('')],
    [val('')], [val('')], [val('')], [val('')],
    [val('false')], [val('')], [val('none')], [val('')],
  ];

  const carouselBlock = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells: configCells });

  // Create a fragment to hold carousel + custom-image blocks
  const fragment = document.createDocumentFragment();
  fragment.appendChild(carouselBlock);

  // Extract each slide image as a separate custom-image block (16 rows)
  slides.forEach((slide) => {
    const img = slide.querySelector('img');
    if (!img) return;

    const imageCell = document.createElement('div');
    const pic = document.createElement('picture');
    const imgEl = document.createElement('img');
    imgEl.src = img.getAttribute('src') || img.getAttribute('data-cmp-src') || '';
    imgEl.alt = img.getAttribute('alt') || '';
    pic.appendChild(imgEl);
    imageCell.appendChild(pic);

    const imageCells = [
      [imageCell],        // Row 0: image
      [val('false')],     // Row 1: getAltFromDAM
      [val('false')],     // Row 2: imageIsDecorative
      [val('')],          // Row 3: caption
      [val('false')],     // Row 4: getCaptionFromDAM
      [val('false')],     // Row 5: displayCaptionBelowImage
      [val('false')],     // Row 6: enableLink
      [val('')],          // Row 7: target
      [val('_self')],     // Row 8: clickBehavior
      [val('')],          // Row 9: modalPanelId
      [val('false')],     // Row 10: enableWarnOnLeave
      [val('')],          // Row 11: warnOnLeavePath
      [val('')],          // Row 12: linkAriaLabel
      [val('')],          // Row 13: classes group
      [val('none')],      // Row 14: language
      [val('')],          // Row 15: blockId
    ];

    const imageBlock = WebImporter.Blocks.createBlock(document, { name: 'custom-image', cells: imageCells });
    fragment.appendChild(imageBlock);
  });

  element.replaceWith(fragment);
}
