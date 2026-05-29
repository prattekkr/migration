/* eslint-disable */

/**
 * Page metadata extraction utility.
 * Extracts <meta>, <title>, canonical URL, and structured data from the page head.
 * Produces an EDS "Metadata" block table appended at the end of the output.
 *
 * EDS Metadata block format:
 *   Each row = [key, value]
 *   Keys: Title, Description, Image, og:title, og:description, og:image,
 *         twitter:card, twitter:title, twitter:description, twitter:image,
 *         template, category, date, read-time, canonical, language, country
 */

/**
 * Extract all relevant metadata from the document <head>.
 * Returns a plain object of { key: value } pairs.
 */
export function extractPageMetadata(document) {
  const meta = {};

  // Page title (without site suffix)
  const fullTitle = document.title || '';
  meta.Title = fullTitle.replace(/\s*\|\s*AbbVie\s*$/, '').trim();

  // Meta description
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) meta.Description = descMeta.getAttribute('content') || '';

  // Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) meta['canonical'] = canonical.getAttribute('href') || '';

  // Open Graph
  const ogFields = ['og:title', 'og:description', 'og:image:url', 'og:type', 'og:site_name'];
  ogFields.forEach((field) => {
    const el = document.querySelector(`meta[property="${field}"]`);
    if (el) {
      const key = field === 'og:image:url' ? 'og:image' : field;
      meta[key] = el.getAttribute('content') || '';
    }
  });

  // Twitter Card
  const twFields = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image:src'];
  twFields.forEach((field) => {
    const el = document.querySelector(`meta[name="${field}"]`);
    if (el) {
      const key = field === 'twitter:image:src' ? 'twitter:image' : field;
      meta[key] = el.getAttribute('content') || '';
    }
  });

  // Language and country
  const langMeta = document.querySelector('meta[name="language"]');
  if (langMeta) meta['language'] = langMeta.getAttribute('content') || '';
  const countryMeta = document.querySelector('meta[name="country"]');
  if (countryMeta) meta['country'] = countryMeta.getAttribute('content') || '';

  // HTML lang attribute
  const htmlLang = document.documentElement?.getAttribute('lang');
  if (htmlLang && !meta['language']) meta['language'] = htmlLang;

  // Story article specific: extract date, category, read time from page content
  const bodyText = document.body?.textContent || '';
  const dateMatch = bodyText.match(/(\w+ \d{1,2}, \d{4})/);
  if (dateMatch) meta['date'] = dateMatch[1];

  const readTimeMatch = bodyText.match(/(\d+)\s*Minute\s*Read/i);
  if (readTimeMatch) meta['read-time'] = `${readTimeMatch[1]} min`;

  return meta;
}

/**
 * Create a Metadata block table from extracted metadata.
 * Appends the block to the output element.
 *
 * @param {Document} document - The DOM document
 * @param {Object} meta - Key-value metadata object
 * @param {string} [template] - Optional template name to include
 * @returns {Element} The metadata table element
 */
export function createMetadataBlock(document, meta, template) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const th = document.createElement('th');
  th.colSpan = 2;
  th.textContent = 'Metadata';
  headerRow.appendChild(th);
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  // Add template if provided
  if (template) {
    const row = document.createElement('tr');
    const keyCell = document.createElement('td');
    keyCell.textContent = 'template';
    const valCell = document.createElement('td');
    valCell.textContent = template;
    row.appendChild(keyCell);
    row.appendChild(valCell);
    tbody.appendChild(row);
  }

  // Add all metadata entries
  const orderedKeys = [
    'Title', 'Description', 'date', 'read-time', 'canonical',
    'og:title', 'og:description', 'og:image', 'og:type', 'og:site_name',
    'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image',
    'language', 'country',
  ];

  const addedKeys = new Set();
  if (template) addedKeys.add('template');

  // Add in preferred order
  orderedKeys.forEach((key) => {
    if (meta[key] && !addedKeys.has(key)) {
      const row = document.createElement('tr');
      const keyCell = document.createElement('td');
      keyCell.textContent = key;
      const valCell = document.createElement('td');
      // For image fields, create a picture/img element
      if (key.includes('image') && meta[key].startsWith('http')) {
        const img = document.createElement('img');
        img.src = meta[key];
        img.alt = '';
        valCell.appendChild(img);
      } else {
        valCell.textContent = meta[key];
      }
      row.appendChild(keyCell);
      row.appendChild(valCell);
      tbody.appendChild(row);
      addedKeys.add(key);
    }
  });

  // Add any remaining keys not in the ordered list
  Object.keys(meta).forEach((key) => {
    if (!addedKeys.has(key) && meta[key]) {
      const row = document.createElement('tr');
      const keyCell = document.createElement('td');
      keyCell.textContent = key;
      const valCell = document.createElement('td');
      valCell.textContent = meta[key];
      row.appendChild(keyCell);
      row.appendChild(valCell);
      tbody.appendChild(row);
      addedKeys.add(key);
    }
  });

  table.appendChild(tbody);
  return table;
}

/**
 * Convenience: extract metadata and append the Metadata block to output.
 * Call this at the end of transformDOM after all content blocks.
 *
 * @param {Document} document
 * @param {Element} output - The output container element
 * @param {string} [template] - Template name (e.g., 'story-article')
 */
export function appendMetadataBlock(document, output, template) {
  const meta = extractPageMetadata(document);
  const metaBlock = createMetadataBlock(document, meta, template);
  // Add an HR before metadata to put it in its own section
  output.appendChild(document.createElement('hr'));
  output.appendChild(metaBlock);
}
