/* eslint-disable */
/* global WebImporter */

/**
 * Parser: custom-image
 * Reference: can-unlocking-one-million-genomes.plain.html (manually migrated)
 * Structure: 16 rows, 1 col each. No field hints.
 *
 *   Row 0:  image → <picture><img></picture> or empty
 *   Row 1:  getAltFromDAM → "false"
 *   Row 2:  imageIsDecorative → "false"
 *   Row 3:  caption → empty
 *   Row 4:  getCaptionFromDAM → "false"
 *   Row 5:  displayCaptionBelowImage → "false"
 *   Row 6:  enableLink → "false"
 *   Row 7:  target → empty
 *   Row 8:  clickBehavior → "_self"
 *   Row 9:  modalPanelId → empty
 *   Row 10: enableWarnOnLeave → "false"
 *   Row 11: warnOnLeavePath → empty
 *   Row 12: linkAriaLabel → empty
 *   Row 13: classes group → empty
 *   Row 14: language → "none"
 *   Row 15: blockId → empty (NOT in order — reference shows language before blockId area)
 *
 * Actually from reference the order is:
 *   Row 0: image, Row 1: false, Row 2: false, Row 3: empty, Row 4: false,
 *   Row 5: false, Row 6: false, Row 7: empty, Row 8: _self, Row 9: empty,
 *   Row 10: false, Row 11: empty, Row 12: empty, Row 13: empty, Row 14: none, Row 15: empty
 */
export default function parse(element, { document }) {
  const img = element.querySelector('img.cmp-image__image')
    || element.querySelector('img[class*="cmp-image"]')
    || element.querySelector('img');

  const imageCell = document.createElement('div');
  if (img) {
    const pic = document.createElement('picture');
    const imgEl = document.createElement('img');
    imgEl.src = img.getAttribute('src') || img.getAttribute('data-cmp-src') || '';
    imgEl.alt = img.getAttribute('alt') || '';
    pic.appendChild(imgEl);
    imageCell.appendChild(pic);
  }

  const val = (v) => {
    const d = document.createElement('div');
    if (v) d.textContent = v;
    return d;
  };

  const cells = [
    [imageCell],         // Row 0: image
    [val('false')],      // Row 1: getAltFromDAM
    [val('false')],      // Row 2: imageIsDecorative
    [val('')],           // Row 3: caption
    [val('false')],      // Row 4: getCaptionFromDAM
    [val('false')],      // Row 5: displayCaptionBelowImage
    [val('false')],      // Row 6: enableLink
    [val('')],           // Row 7: target
    [val('_self')],      // Row 8: clickBehavior
    [val('')],           // Row 9: modalPanelId
    [val('false')],      // Row 10: enableWarnOnLeave
    [val('')],           // Row 11: warnOnLeavePath
    [val('')],           // Row 12: linkAriaLabel
    [val('')],           // Row 13: classes group
    [val('none')],       // Row 14: language
    [val('')],           // Row 15: blockId
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'custom-image', cells });
  element.replaceWith(block);
}
