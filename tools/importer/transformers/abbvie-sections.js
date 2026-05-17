/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AbbVie story-article section structure.
 * Reference: can-unlocking-one-million-genomes.plain.html (manually migrated)
 *
 * Section-metadata: variant classes ON the block name, language|none as row content.
 * NOT key-value rows for grid classes.
 *
 * Structure:
 *   Section 1: Hero blocks + Section Metadata (content-wide, medium-radius) [language|none]
 *   --- hr ---
 *   Section 2: Section Metadata (grid-container, content-regular) [language|none]
 *   --- hr ---
 *   Section 3: Section Metadata (grid-cols-2) [empty]
 *   --- hr ---
 *   Section 4: Body blocks + Section Metadata (grid-section, grid-cols-8) [language|none]
 *   --- hr ---
 *   Section 5: Sidebar blocks + Section Metadata (grid-cols-2) [empty]
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

  // Helper: create section-metadata with variant classes on block name
  // and optional language|none row
  function sectionMeta(variantClasses, hasLanguageRow) {
    const name = 'Section Metadata';
    const cells = hasLanguageRow ? { language: 'none' } : {};
    return WebImporter.Blocks.createBlock(document, {
      name,
      variants: variantClasses,
      cells,
    });
  }

  // SECTION 1: Hero
  heroTables.forEach((t) => main.appendChild(t));
  main.appendChild(sectionMeta(['content-wide', 'medium-radius'], true));

  main.appendChild(document.createElement('hr'));

  // SECTION 2: Grid container
  main.appendChild(sectionMeta(['grid-container', 'content-regular'], true));

  main.appendChild(document.createElement('hr'));

  // SECTION 3: Left spacer
  main.appendChild(sectionMeta(['grid-cols-2'], false));

  main.appendChild(document.createElement('hr'));

  // SECTION 4: Body blocks
  bodyTables.forEach((t) => main.appendChild(t));
  main.appendChild(sectionMeta(['grid-section', 'grid-cols-8'], true));

  main.appendChild(document.createElement('hr'));

  // SECTION 5: Right spacer (will have sidebar content added later or be empty)
  main.appendChild(sectionMeta(['grid-cols-2'], false));

  console.log(`[sections] Restructured: ${heroTables.length} hero + ${bodyTables.length} body into 5 sections`);
}
