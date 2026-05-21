/* eslint-disable */
/* global WebImporter */

/**
 * Parser: story-card — 16 rows, 1 col each (matching _story-card.json model)
 *
 * Two variants:
 * - storyCardInfo: used in hero section (metadata display)
 * - sidePanel: used for related content cards (.cardpagestory)
 *
 * Field naming (md2jcr collapse suffix rules):
 * - storyCardVariant (NOT storyCardType — "Type" suffix gets collapsed)
 * - hideTitleFlag (NOT hideTitle — "Title" suffix gets collapsed)
 * - ctaLabel (NOT ctaText — "Text" suffix gets collapsed)
 */
export default function parse(element, { document }) {
  const cls = element.className || '';
  const isStoryInfo = cls.includes('storyinfo');

  const anchor = element.querySelector('a[href]');
  let pageHref = anchor?.getAttribute('href') || '';

  if (isStoryInfo) {
    // Hero metadata variant — link to category page
    if (pageHref.startsWith('/')) pageHref = 'https://www.abbvie.com' + pageHref;

    const linkCell = document.createElement('div');
    if (pageHref) { const a = document.createElement('a'); a.href = pageHref; a.textContent = pageHref; linkCell.appendChild(a); }

    const cells = [
      ['storyCardInfo'],   // Row 0: storyCardVariant
      ['false'],           // Row 1: hidePublicationDate
      ['false'],           // Row 2: hideReadTime
      ['true'],            // Row 3: hideRole
      ['true'],            // Row 4: hideDescription
      ['true'],            // Row 5: hideImage
      [''],                // Row 6: id
      [''],                // Row 7: customClass
      [linkCell],          // Row 8: page
      ['false'],           // Row 9: openInNewTab
      [''],                // Row 10: ctaLabel
      [''],                // Row 11: analyticsInteractionId
    ];

    const block = WebImporter.Blocks.createBlock(document, { name: 'story-card', cells });
    element.replaceWith(block);
  } else {
    // Related content variant — .cardpagestory elements
    // Convert href to AEM content path
    if (pageHref.endsWith('.html')) pageHref = pageHref.replace(/\.html$/, '');
    if (pageHref.startsWith('/')) pageHref = '/content/abbvie-nextgen-eds/abbvie-com/us/en' + pageHref;

    const linkCell = document.createElement('div');
    if (pageHref) { const a = document.createElement('a'); a.href = pageHref; a.textContent = pageHref; linkCell.appendChild(a); }

    const cells = [
      ['relatedContent'], // Row 0: storyCardVariant
      ['false'],           // Row 1: hidePublicationDate
      ['false'],           // Row 2: hideReadTime
      ['false'],           // Row 3: hideRole
      ['false'],           // Row 4: hideDescription
      ['false'],           // Row 5: hideImage
      [''],                // Row 6: id
      [''],                // Row 7: customClass
      [linkCell],          // Row 8: page
      ['true'],            // Row 9: openInNewTab
      [''],                // Row 10: ctaLabel
      [''],                // Row 11: analyticsInteractionId
    ];

    const block = WebImporter.Blocks.createBlock(document, { name: 'story-card', cells });
    block.setAttribute('data-related-content', 'true');
    element.replaceWith(block);
  }
}
