#!/usr/bin/env node
/* eslint-disable */

/**
 * Single-page import runner.
 * Fetches a page via Playwright, runs the import script's transformDOM,
 * and saves the resulting HTML to the content/ directory.
 *
 * Usage:
 *   node tools/importer/run-import.js --url <source-url> --script <import-script.js>
 *
 * Example:
 *   node tools/importer/run-import.js \
 *     --url https://www.abbvie.com/patients/patient-support.html \
 *     --script import-section-landing.js
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url') opts.url = args[++i];
    if (args[i] === '--script') opts.script = args[++i];
    if (args[i] === '--output') opts.output = args[++i];
  }
  if (!opts.url || !opts.script) {
    console.error('Usage: node run-import.js --url <url> --script <script.js>');
    process.exit(1);
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const bundlePath = join(__dirname, opts.script.replace('.js', '.bundle.js'));

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  AbbVie EDS Import Runner`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  URL:    ${opts.url}`);
  console.log(`  Script: ${opts.script}`);
  console.log(`  Bundle: ${bundlePath}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Read the bundle
  const bundleCode = readFileSync(bundlePath, 'utf8');

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-http2'],
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    console.log('▸ Loading page...');
    await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    console.log('  ✓ Page loaded');

    // Inject WebImporter stub and run the transform
    console.log('▸ Running import transform...');
    const result = await page.evaluate((code) => {
      // WebImporter stub
      window.WebImporter = {
        DOMUtils: {
          remove: (el, selectors) => {
            selectors.forEach(sel => {
              try { el.querySelectorAll(sel).forEach(e => e.remove()); } catch {}
            });
          },
        },
        Blocks: {
          createBlock: (doc, { name, cells }) => {
            const table = doc.createElement('table');
            const thead = doc.createElement('thead');
            const tr = doc.createElement('tr');
            const th = doc.createElement('th');
            th.colSpan = cells[0]?.length || 1;
            th.textContent = name;
            tr.appendChild(th);
            thead.appendChild(tr);
            table.appendChild(thead);
            const tbody = doc.createElement('tbody');
            cells.forEach(row => {
              const rowEl = doc.createElement('tr');
              (Array.isArray(row) ? row : [row]).forEach(cell => {
                const td = doc.createElement('td');
                if (cell instanceof Node) {
                  if (cell.nodeType === 11) { // DocumentFragment
                    td.appendChild(cell);
                  } else {
                    td.appendChild(cell.cloneNode(true));
                  }
                } else {
                  td.textContent = cell != null ? String(cell) : '';
                }
                rowEl.appendChild(td);
              });
              tbody.appendChild(rowEl);
            });
            table.appendChild(tbody);
            return table;
          },
        },
        FileUtils: {
          sanitizePath: (p) => p.replace(/[^a-zA-Z0-9/._-]/g, '-').toLowerCase(),
        },
        rules: {
          createMetadata: () => {},
          transformBackgroundImages: () => {},
          adjustImageUrls: () => {},
        },
      };

      // Execute the bundle (use indirect eval to ensure global scope)
      (0, eval)(code);

      // Get the transform function
      const importScript = window.CustomImportScript?.default || window.CustomImportScript;
      if (!importScript?.transformDOM) {
        return { error: 'No transformDOM found in script' };
      }

      // Run transform
      const url = window.location.href;
      const html = document.documentElement.outerHTML;
      const output = importScript.transformDOM({ document, url, html, params: { originalURL: url } });

      // Generate path
      let path = '/content/unknown';
      if (importScript.generateDocumentPath) {
        path = importScript.generateDocumentPath({ document, url });
      }

      // Serialize output
      const wrapper = document.createElement('div');
      if (output === document.body) {
        wrapper.innerHTML = document.body.innerHTML;
      } else if (output) {
        wrapper.appendChild(output);
      }

      return {
        html: wrapper.innerHTML,
        path: path,
        title: document.title,
      };
    }, bundleCode);

    if (result.error) {
      console.error(`  ✗ Error: ${result.error}`);
      process.exit(1);
    }

    console.log(`  ✓ Transform complete`);
    console.log(`  Path: ${result.path}`);

    // Convert to plain.html (section-based format)
    const plainHtml = convertToPlainHtml(result.html);

    // Write output to both .html (preview) and .plain.html (md2jcr reads this)
    const outputBase = opts.output || join(__dirname, '../../content');
    const outputPath = join(outputBase, result.path + '.html');
    const plainPath = join(outputBase, result.path + '.plain.html');
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, plainHtml);
    writeFileSync(plainPath, plainHtml);
    console.log(`\n  ✓ Written to: ${outputPath}`);
    console.log(`  ✓ Written to: ${plainPath}`);
    console.log(`  Size: ${(plainHtml.length / 1024).toFixed(1)} KB`);

  } finally {
    await browser.close();
  }
}

/**
 * Convert raw import output HTML into EDS plain.html format.
 * 1. Converts <table> block structures to <div class="block-name"> format
 *    that html2md expects for block detection.
 * 2. Splits on <hr> elements to create section <div>s.
 */
function convertToPlainHtml(html) {
  // Convert block tables to div-based format
  // <table><thead><tr><th>Block Name</th></tr></thead><tbody><tr><td>...</td></tr>...</tbody></table>
  // → <div class="block-name"><div><div>...</div></div>...</div>
  const converted = html.replace(
    /<table><thead><tr><th(?:\s+colspan="\d+")?>(.*?)<\/th><\/tr><\/thead><tbody>(.*?)<\/tbody><\/table>/gs,
    (match, blockName, tbody) => {
      // Convert block name to class: "Hero Container (variant)" → "hero-container variant"
      // "Section Metadata" → "section-metadata"
      let className = blockName.trim();
      let variants = '';
      const parenMatch = className.match(/^([^(]+)\(([^)]+)\)$/);
      if (parenMatch) {
        className = parenMatch[1].trim();
        variants = parenMatch[2].trim().split(',').map(v => v.trim().replace(/\s+/g, '-')).join(' ');
      }
      className = className.toLowerCase().replace(/\s+/g, '-');
      const fullClass = variants ? `${className} ${variants}` : className;

      // Convert rows: <tr><td>cell1</td><td>cell2</td></tr> → <div><div>cell1</div><div>cell2</div></div>
      const rows = tbody.replace(/<tr>(.*?)<\/tr>/gs, (_, rowContent) => {
        const cells = [];
        rowContent.replace(/<td(?:\s+colspan="\d+")?>(.*?)<\/td>/gs, (__, cellContent) => {
          cells.push(cellContent);
        });
        return '<div>' + cells.map(c => `<div>${c}</div>`).join('') + '</div>';
      });

      return `<div class="${fullClass}">${rows}</div>`;
    }
  );

  // The transform output is wrapped in a <div>...<hr>...<hr>...</div>.
  // Strip the outer wrapper div first, then split by <hr> to get sections.
  let inner = converted.trim();
  if (inner.startsWith('<div>') && inner.endsWith('</div>')) {
    inner = inner.slice(5, -6);
  }

  // Split by <hr> to get sections
  const sections = inner.split(/<hr\s*\/?>/i);
  const parts = sections.map(section => {
    const trimmed = section.trim();
    if (!trimmed) return '';
    return `<div>${trimmed}</div>`;
  }).filter(Boolean);

  return parts.join('\n');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
