/* eslint-disable */
/* global WebImporter */

/**
 * Creates the 2-8-2 grid layout for story article pages.
 *
 * Section Metadata rules:
 * - Block name MUST be plain "Section Metadata" (never put classes in name)
 * - Grid classes go as key-value rows: classes_gridCols | grid-cols-N
 * - Every grid section MUST have blockModelId | grid-section (or grid-container)
 * - Without blockModelId, md2jcr defaults to section model and grid classes disappear
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'afterTransform') return;
  const { document } = payload;
  const main = document.body;

  // Remove stray "Related Content" headings and other junk default content
  main.querySelectorAll('h5').forEach(h => {
    const text = h.textContent.trim().toLowerCase();
    if (text === 'related content' || text === 'related contents') h.remove();
  });
  main.querySelectorAll('p').forEach(p => {
    const text = p.textContent.trim();
    if (text === 'Related content' || text === 'CLOSE' || text === 'No, I disagree' || text === 'Yes, I agree') p.remove();
  });

  // After parsing, blocks are <table> elements. Hero blocks can be identified
  // by their header text (th content). We need to find them regardless of DOM position
  // because on AEM source pages, .overlap-predecessor (containing hero blocks)
  // appears AFTER .grid in DOM order.

  // Identify hero blocks by their table header (block name)
  function getBlockName(el) {
    if (!el || !el.querySelector) return '';
    const th = el.querySelector('th');
    return th ? th.textContent.trim().toLowerCase().replace(/\s+/g, '-') : '';
  }

  // Hero block pattern: hero-container, cta, story-card(storyCardInfo), custom-title(h1), text-container(hero subtitle)
  // We identify them by block name + checking first cell content
  function isHeroBlock(el) {
    const name = getBlockName(el);
    if (name === 'hero-container') return true;
    if (name.startsWith('cta')) return true;
    if (name === 'story-card') {
      // Only storyCardInfo variant (not relatedContent)
      const firstTd = el.querySelector('td');
      return firstTd && firstTd.textContent.trim() === 'storyCardInfo';
    }
    if (name.startsWith('custom-title') && name.includes('h1')) return true;
    if (name.startsWith('text-container') && name.includes('body-unica-32-reg')) return true;
    return false;
  }

  // Collect all elements from body and categorize
  const allElements = Array.from(main.querySelectorAll(':scope > *, :scope > * > table, :scope > * table'));
  // Actually just get all direct children and recurse into containers
  const allTables = Array.from(main.querySelectorAll('table'));

  const relatedCards = [];
  const heroContent = [];
  const bodyContent = [];

  // Find related content cards container
  const relatedContainer = main.querySelector('#related-content-cards');
  if (relatedContainer) {
    Array.from(relatedContainer.children).forEach(el => relatedCards.push(el));
    relatedContainer.remove();
  }

  // Find main content column
  const mainCol = main.querySelector('.grid-row__col-with-8');

  // Gather ALL block tables from main body and main content column
  const allChildren = Array.from(main.children);
  let bodyElements = mainCol ? Array.from(mainCol.children) : [];

  // Hero = exactly these blocks (one of each, in order):
  // 1. hero-container, 2. cta, 3. story-card(storyCardInfo), 4. custom-title(h1), 5. text-container(hero subtitle)
  // Find ONE of each from allTables, then everything else is body content.
  let foundHero = null, foundCta = null, foundStoryCard = null, foundTitle = null, foundSubtitle = null;

  allTables.forEach(table => {
    const name = getBlockName(table);
    if (!foundHero && name.startsWith('hero-container')) { foundHero = table; return; }
    if (!foundCta && name.startsWith('cta')) { foundCta = table; return; }
    if (!foundStoryCard && name === 'story-card') {
      const firstTd = table.querySelector('td');
      if (firstTd && firstTd.textContent.trim() === 'storyCardInfo') { foundStoryCard = table; return; }
    }
    if (!foundTitle && name.startsWith('custom-title') && name.includes('h1')) { foundTitle = table; return; }
    if (!foundSubtitle && name.startsWith('text-container') && name.includes('body-unica-32-reg')) { foundSubtitle = table; return; }
  });

  // Build hero content array (in correct order)
  if (foundHero) heroContent.push(foundHero);
  if (foundCta) heroContent.push(foundCta);
  if (foundStoryCard) heroContent.push(foundStoryCard);
  if (foundTitle) heroContent.push(foundTitle);
  if (foundSubtitle) heroContent.push(foundSubtitle);

  const heroSet = new Set(heroContent);

  // Body = everything in mainCol that isn't a hero block
  if (mainCol) {
    Array.from(mainCol.children).forEach(el => {
      if (!heroSet.has(el)) bodyContent.push(el);
    });
  }

  // Clear main and rebuild with proper section structure
  while (main.firstChild) main.removeChild(main.firstChild);

  // Section 1: Hero content (overlap-predecessor was flattened in cleanup)
  heroContent.forEach(el => main.appendChild(el));
  main.appendChild(WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: [
      ['classes_customClass', 'content-wide medium-radius'],
      ['language', 'none'],
    ],
  }));

  // <hr> section break
  main.appendChild(document.createElement('hr'));

  // grid_container node — model fields: name, classes_container, classes_customDynamicClass, blockId, language
  main.appendChild(WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: [
      ['name', 'Grid Container'],
      ['identifier', 'Grid Container'],
      ['classes_container', 'grid-container'],
      ['classes_customDynamicClass', 'content-regular'],
      ['blockModelId', 'grid-container'],
      ['language', 'none'],
    ],
  }));

  // <hr>
  main.appendChild(document.createElement('hr'));

  // grid_section (left spacer - cols 2)
  main.appendChild(WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: [
      ['name', 'Grid Section'],
      ['identifier', 'Grid Section'],
      ['classes_container', 'grid-section'],
      ['classes_customDynamicClass', 'grid-cols-2'],
      ['blockModelId', 'grid-section'],
      ['language', 'none'],
    ],
  }));

  // <hr>
  main.appendChild(document.createElement('hr'));

  // grid_section (main content - cols 8)
  bodyContent.forEach(el => main.appendChild(el));
  main.appendChild(WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: [
      ['name', 'Grid Section'],
      ['identifier', 'Grid Section'],
      ['classes_container', 'grid-section'],
      ['classes_customDynamicClass', 'grid-cols-8'],
      ['blockModelId', 'grid-section'],
      ['language', 'none'],
    ],
  }));

  // <hr>
  main.appendChild(document.createElement('hr'));

  // grid_section (right gutter - cols 2)
  // First related content card goes IN this section (not a separate section)
  if (relatedCards.length > 0) {
    main.appendChild(relatedCards[0]);
  }
  main.appendChild(WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: [
      ['name', 'Grid Section'],
      ['identifier', 'Grid Section'],
      ['classes_container', 'grid-section'],
      ['classes_customDynamicClass', 'grid-cols-2'],
      ['blockModelId', 'grid-section'],
      ['language', 'none'],
    ],
  }));

  // Remaining related content cards (2nd onward) go in a new bg-f4f4f4 grid
  if (relatedCards.length > 1) {
    // <hr>
    main.appendChild(document.createElement('hr'));

    // grid_container for remaining related content
    main.appendChild(WebImporter.Blocks.createBlock(document, {
      name: 'Section Metadata',
      cells: [
        ['name', 'Grid Container'],
        ['identifier', 'Grid Container'],
        ['classes_container', 'grid-container'],
        ['classes_customDynamicClass', 'bg-f4f4f4 regular-padding no-top-padding no-bottom-margin'],
        ['blockModelId', 'grid-container'],
        ['language', 'none'],
      ],
    }));

    // Each remaining story-card in its own grid_section (cols 6)
    for (let i = 1; i < relatedCards.length; i++) {
      // <hr>
      main.appendChild(document.createElement('hr'));

      main.appendChild(relatedCards[i]);
      main.appendChild(WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: [
          ['name', 'Grid Section'],
          ['identifier', 'Grid Section'],
          ['classes_container', 'grid-section'],
          ['classes_customDynamicClass', 'grid-cols-6'],
          ['blockModelId', 'grid-section'],
          ['language', 'none'],
        ],
      }));
    }
  }
}
