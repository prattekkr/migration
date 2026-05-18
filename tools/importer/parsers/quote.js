/* eslint-disable */
/* global WebImporter */

/**
 * Parser: quote
 * AEM source: .quote.cmp-quote-xx-large > .cmp-quote
 * Extracts: quotation text, author name, author title/role
 *
 * JCR structure (from reference):
 *   quote node with: quoteVariant, quotation (richtext), attributionName, attributionRole,
 *   classes_customDynamicClass, language, blockId, etc.
 */
export default function parse(element, { document }) {
  const quoteText = element.querySelector('.cmp-quote__text')?.textContent?.trim() || '';
  const authorName = element.querySelector('.author-name')?.textContent?.trim() || '';
  const authorRole = element.querySelector('.author-title')?.textContent?.trim() || '';

  const val = (v) => {
    const d = document.createElement('div');
    if (v) d.textContent = v;
    return d;
  };

  // Quote model fields (from _quote.json):
  // quoteVariant, quotation(richtext), attributionName, attributionRole,
  // attributionImage(collapsed: MimeType), quoteFragment, backgroundImage(collapsed: MimeType, Preset, Modifiers, Alt),
  // classes group, blockId, language, analytics
  // Collapsed: attributionImageMimeType, backgroundImageMimeType, backgroundImagePreset, backgroundImageModifiers, backgroundImageAlt
  const quotationCell = document.createElement('div');
  if (quoteText) {
    const p = document.createElement('p');
    p.textContent = quoteText;
    quotationCell.appendChild(p);
  }

  const cells = [
    [val('basic')],          // quoteVariant
    [quotationCell],         // quotation (richtext)
    [val(authorName)],       // attributionName
    [val(authorRole)],       // attributionRole
    [val('')],               // attributionImage
    [val('')],               // quoteFragment
    [val('')],               // backgroundImage
    [val('')],               // classes group
    [val('')],               // blockId
    [val('none')],           // language
    [val('')],               // commonCustomClass/analytics
  ];

  const variants = [];
  const cls = element.className || '';
  if (cls.includes('quote-standard')) variants.push('quote-standard');
  if (cls.includes('quote-h4')) variants.push('quote-h4');

  const block = WebImporter.Blocks.createBlock(document, { name: 'quote', variants, cells });
  element.replaceWith(block);
}
