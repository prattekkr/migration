/* eslint-disable */
/* global WebImporter */

/**
 * Parser: story-card
 * Reference: can-unlocking-one-million-genomes.plain.html (manually migrated)
 * Structure: 12 rows, 1 col each. No variant classes on block name. No field hints.
 * Hero storyinfo uses "storyCardInfo", sidebar card uses "sidePanel".
 */
export default function parse(element, { document }) {
  const cls = element.className || '';
  const isStoryInfo = cls.includes('storyinfo');

  const val = (v) => {
    const d = document.createElement('div');
    if (v !== undefined && v !== null && v !== '') d.textContent = String(v);
    return d;
  };

  const linkCell = (href) => {
    const d = document.createElement('div');
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = href;
      d.appendChild(a);
    }
    return d;
  };

  const categoryLink = element.querySelector('a[href]');
  const pageHref = categoryLink?.getAttribute('href') || '';

  const cells = isStoryInfo ? [
    [val('storyCardInfo')],
    [val('false')],
    [val('false')],
    [val('true')],
    [val('true')],
    [val('true')],
    [val('')],
    [val('')],
    [linkCell(pageHref)],
    [val('false')],
    [val('')],
    [val('')],
  ] : [
    [val('sidePanel')],
    [val('false')],
    [val('false')],
    [val('false')],
    [val('false')],
    [val('false')],
    [val('')],
    [val('')],
    [linkCell(pageHref)],
    [val('false')],
    [val('')],
    [val('')],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'story-card', cells });
  element.replaceWith(block);
}
