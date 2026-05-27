#!/usr/bin/env node

/**
 * Post-processing script: Apply correct EDS variant classes to imported .plain.html files.
 *
 * Usage:
 *   node tools/importer/post-process-variants.js content/who-we-are/our-stories/page.plain.html
 *   node tools/importer/post-process-variants.js content/   (processes all .plain.html files)
 *
 * Reads class-mapping.json and patches block class attributes in the output HTML.
 * Run AFTER import to fix variant classes without re-running the import.
 *
 * To add new mappings for new pages:
 *   1. Import the page (structure will be correct)
 *   2. Check which blocks have wrong/missing variants
 *   3. Add rules to class-mapping.json
 *   4. Re-run this script
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

const MAPPING_PATH = resolve('tools/importer/class-mapping.json');

// Load mapping
const classMapping = JSON.parse(readFileSync(MAPPING_PATH, 'utf-8'));

// Blocks that need variant correction (from mapping)
const VARIANT_CORRECTIONS = {
  // hero-container: always add overlay-height-short if not present
  'hero-container': (currentVariants) => {
    if (!currentVariants.includes('overlay-height-short')) {
      return [...currentVariants, 'overlay-height-short'];
    }
    return currentVariants;
  },

  // carousel: always include carousel-show-btn-margin
  'carousel': (currentVariants) => {
    if (!currentVariants.includes('carousel-show-btn-margin')) {
      return ['carousel-show-btn-margin', ...currentVariants];
    }
    return currentVariants;
  },

  // quote: always use quote-standard quote-h4
  'quote': (currentVariants) => {
    return ['quote-standard', 'quote-h4'];
  },

  // accordion: always use accordion-icon-font h5-size width-large
  'accordion': (currentVariants) => {
    if (!currentVariants.includes('accordion-icon-font')) {
      return ['accordion-icon-font', 'h5-size', 'width-large'];
    }
    return currentVariants;
  },

  // brightcove-video: remove cmp-video-xx-large (AEM class, not EDS variant)
  'brightcove-video': (currentVariants) => {
    return currentVariants.filter(v => !v.startsWith('cmp-'));
  },
};

function processFile(filePath) {
  let html = readFileSync(filePath, 'utf-8');
  let changes = 0;

  // Process each block that has variant corrections
  for (const [blockName, corrector] of Object.entries(VARIANT_CORRECTIONS)) {
    const regex = new RegExp(`class="${blockName}([^"]*)"`, 'g');
    html = html.replace(regex, (match, variantStr) => {
      const currentVariants = variantStr.trim() ? variantStr.trim().split(/\s+/) : [];
      const correctedVariants = corrector(currentVariants);

      if (JSON.stringify(currentVariants) !== JSON.stringify(correctedVariants)) {
        changes++;
        const newClass = correctedVariants.length > 0
          ? `${blockName} ${correctedVariants.join(' ')}`
          : blockName;
        return `class="${newClass}"`;
      }
      return match;
    });
  }

  if (changes > 0) {
    writeFileSync(filePath, html, 'utf-8');
    console.log(`  ✅ ${filePath} — ${changes} variant(s) corrected`);
  } else {
    console.log(`  ○  ${filePath} — no changes needed`);
  }

  return changes;
}

function findPlainHtmlFiles(dir) {
  const files = [];
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findPlainHtmlFiles(fullPath));
    } else if (item.endsWith('.plain.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node tools/importer/post-process-variants.js <file-or-directory>');
  process.exit(1);
}

const target = resolve(args[0]);
const stat = statSync(target);
let files = [];

if (stat.isDirectory()) {
  files = findPlainHtmlFiles(target);
} else {
  files = [target];
}

console.log(`[Post-Process Variants] Processing ${files.length} file(s)...\n`);

let totalChanges = 0;
for (const file of files) {
  totalChanges += processFile(file);
}

console.log(`\nDone. ${totalChanges} total variant correction(s) applied.`);
