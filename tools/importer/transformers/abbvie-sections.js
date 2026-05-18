/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AbbVie story-article section structure.
 *
 * JCR/md2jcr rules for Section Metadata:
 * - Block name MUST be plain "Section Metadata" — NO variant classes in name
 * - Grid classes as key-value rows:
 *   Grid sections: classes_gridCols | grid-cols-N + blockModelId | grid-section
 *   Grid container: classes_container | grid-container + blockModelId | grid-container
 *   Regular sections: classes_customClass | content-wide medium-radius
 */

const HERO_BLOCK_COUNT = 5;

export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;

  const document = element.ownerDocument;
  const main = element;

  const allTables = [...main.querySelectorAll('table')];
  if (allTables.length === 0) return;

  const heroTables = allTables.slice(0, HERO_BLOCK_COUNT);
  const bodyTables = allTables.slice(HERO_BLOCK_COUNT);

  if (heroTables.length === 0) return;

  while (main.firstChild) main.removeChild(main.firstChild);

  // Helper: create Section Metadata with key-value rows
  // Block name is ALWAYS plain "Section Metadata" — no variants in name
  function sectionMeta(keyValuePairs) {
    const cells = {};
    keyValuePairs.forEach(([key, value]) => {
      cells[key] = value;
    });
    return WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells,
    });
  }

  // SECTION 1: Hero blocks + Section Metadata
  heroTables.forEach((t) => main.appendChild(t));
  main.appendChild(sectionMeta([
    ['classes_customClass', 'content-wide medium-radius'],
  ]));

  main.appendChild(document.createElement('hr'));

  // SECTION 2: Grid container declaration
  main.appendChild(sectionMeta([
    ['classes_container', 'grid-container'],
    ['blockModelId', 'grid-container'],
  ]));

  main.appendChild(document.createElement('hr'));

  // SECTION 3: Left spacer (grid-cols-2)
  main.appendChild(sectionMeta([
    ['classes_gridCols', 'grid-cols-2'],
    ['blockModelId', 'grid-section'],
  ]));

  main.appendChild(document.createElement('hr'));

  // SECTION 4: Body blocks + Section Metadata
  bodyTables.forEach((t) => main.appendChild(t));
  main.appendChild(sectionMeta([
    ['classes_gridCols', 'grid-cols-8'],
    ['blockModelId', 'grid-section'],
  ]));

  main.appendChild(document.createElement('hr'));

  // SECTION 5: Right spacer (grid-cols-2)
  main.appendChild(sectionMeta([
    ['classes_gridCols', 'grid-cols-2'],
    ['blockModelId', 'grid-section'],
  ]));

  console.log(`[sections] Restructured: ${heroTables.length} hero + ${bodyTables.length} body into 5 sections`);
}
