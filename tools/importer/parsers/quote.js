/* eslint-disable */
/* global WebImporter */

/**
 * Parser: quote — 12 rows, 1 col each (matching reference)
 *   Row 0: quoteVariant ("basic" or empty)
 *   Row 1: quotation (richtext — bold/strong wrapped)
 *   Row 2: attributionName
 *   Row 3: attributionRole
 *   Row 4: attributionImage (picture or empty)
 *   Row 5: quoteFragment (empty)
 *   Row 6: backgroundImage (empty)
 *   Row 7: backgroundImagePreset (empty)
 *   Row 8: backgroundImageModifiers (empty)
 *   Row 9: classes (empty)
 *   Row 10: language ("none")
 *   Row 11: blockId/analytics (empty)
 */
export default function parse(element, { document }) {
  const variantClasses = [];
  if (element.classList.contains('cmp-quote-xx-large')) variantClasses.push('cmp-quote-xx-large');
  if (element.classList.contains('quote-standard')) variantClasses.push('quote-standard');
  if (element.classList.contains('quote-h4')) variantClasses.push('quote-h4');

  const blockName = variantClasses.length > 0 ? `quote (${variantClasses.join(', ')})` : 'quote';

  // Extract quote text — reference wraps in <strong>
  const quoteTextEl = element.querySelector('.cmp-quote__text');
  const quoteText = quoteTextEl?.textContent?.trim() || '';
  const quotationCell = document.createElement('div');
  if (quoteText) {
    const strong = document.createElement('strong');
    strong.textContent = quoteText;
    quotationCell.appendChild(strong);
  }

  // Extract attribution
  const authorName = element.querySelector('.author-name, .cmp-quote__author-name')?.textContent?.trim() || '';
  const authorRole = element.querySelector('.author-title, .cmp-quote__author-role, .cmp-quote__author-title')?.textContent?.trim() || '';

  // Extract author image
  const authorImg = element.querySelector('.cmp-quote__author-block img, .author-img');
  const authorImageCell = document.createElement('div');
  if (authorImg) {
    const src = authorImg.getAttribute('data-cmp-src') || authorImg.getAttribute('src') || '';
    if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', authorImg.getAttribute('alt') || '');
      img.setAttribute('loading', 'lazy');
      pic.appendChild(img);
      authorImageCell.appendChild(pic);
    }
  }

  const cells = [
    ['basic'],               // Row 0: quoteVariant
    [quotationCell],         // Row 1: quotation (richtext)
    [authorName],            // Row 2: attributionName
    [authorRole],            // Row 3: attributionRole
    [authorImageCell],       // Row 4: attributionImage
    [''],                    // Row 5: quoteFragment
    [''],                    // Row 6: backgroundImage
    [''],                    // Row 7: backgroundImagePreset
    [''],                    // Row 8: backgroundImageModifiers
    [''],                    // Row 9: classes
    ['none'],                // Row 10: language
    [''],                    // Row 11: blockId/analytics
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
