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

    // Write output
    const outputBase = opts.output || join(__dirname, '../../content');
    const outputPath = join(outputBase, result.path + '.html');
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, plainHtml);
    console.log(`\n  ✓ Written to: ${outputPath}`);
    console.log(`  Size: ${(plainHtml.length / 1024).toFixed(1)} KB`);

  } finally {
    await browser.close();
  }
}

/**
 * Convert raw import output HTML into EDS plain.html format.
 * Splits on <hr> elements to create section <div>s.
 */
function convertToPlainHtml(html) {
  // Split by <hr> to get sections
  const sections = html.split(/<hr\s*\/?>/i);
  const parts = sections.map(section => {
    const trimmed = section.trim();
    if (!trimmed) return '';
    return `<div>\n  ${trimmed}\n</div>`;
  }).filter(Boolean);

  return parts.join('\n');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
