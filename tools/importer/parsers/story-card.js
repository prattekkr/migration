/* eslint-disable */
/* global WebImporter */

/**
 * Parser: story-card (simple block)
 * Field groups from model: storyCardVariant, hidePublicationDate, hideReadTime, hideRole,
 *   hideDescription, hideImage, id, customClass, page, openInNewTab, ctaLabel, analyticsInteractionId
 * No classes_ fields → no classes group row. 12 rows total.
 * Field hints on non-empty cells.
 */
export default function parse(element, { document }) {
  const cls = element.className || '';
  const isStoryInfo = cls.includes('storyinfo');

  const hintVal = (fieldName, v) => {
    const d = document.createElement('div');
    const p = document.createElement('p');
    p.appendChild(document.createComment(' field:' + fieldName + ' '));
    p.appendChild(document.createTextNode(v));
    d.appendChild(p);
    return d;
  };
  const empty = () => document.createElement('div');
  const hintLink = (fieldName, href) => {
    const d = document.createElement('div');
    if (href) {
      const p = document.createElement('p');
      p.appendChild(document.createComment(' field:' + fieldName + ' '));
      const a = document.createElement('a');
      a.href = href;
      a.textContent = href;
      p.appendChild(a);
      d.appendChild(p);
    }
    return d;
  };

  const categoryLink = element.querySelector('a[href]');
  const pageHref = categoryLink?.getAttribute('href') || '';

  const cells = isStoryInfo ? [
    [hintVal('storyCardVariant', 'storyCardInfo')],
    [hintVal('hidePublicationDate', 'false')],
    [hintVal('hideReadTime', 'false')],
    [hintVal('hideRole', 'true')],
    [hintVal('hideDescription', 'true')],
    [hintVal('hideImage', 'true')],
    [empty()],                              // id (empty)
    [empty()],                              // customClass (empty)
    [hintLink('page', pageHref)],
    [hintVal('openInNewTab', 'false')],
    [empty()],                              // ctaLabel (empty)
    [empty()],                              // analyticsInteractionId (empty)
  ] : [
    [hintVal('storyCardVariant', 'sidePanel')],
    [hintVal('hidePublicationDate', 'false')],
    [hintVal('hideReadTime', 'false')],
    [hintVal('hideRole', 'false')],
    [hintVal('hideDescription', 'false')],
    [hintVal('hideImage', 'false')],
    [empty()],
    [empty()],
    [hintLink('page', pageHref)],
    [hintVal('openInNewTab', 'false')],
    [empty()],
    [empty()],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'story-card', cells });
  element.replaceWith(block);
}
