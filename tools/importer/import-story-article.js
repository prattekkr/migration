/* eslint-disable */
/* global WebImporter */
import heroContainerParser from './parsers/hero-container.js';
import ctaParser from './parsers/cta.js';
import storyCardParser from './parsers/story-card.js';
import customTitleParser from './parsers/custom-title.js';
import textContainerParser from './parsers/text-container.js';
import separatorParser from './parsers/separator.js';
import carouselParser from './parsers/carousel.js';
import customImageParser from './parsers/custom-image.js';
import accordionParser from './parsers/accordion.js';
import quoteParser from './parsers/quote.js';
import brightcoveVideoParser from './parsers/brightcove-video.js';
import abbvieCleanupTransformer from './transformers/abbvie-cleanup.js';
import abbvieSectionsTransformer from './transformers/abbvie-sections.js';
const parsers = {'hero-container':heroContainerParser,'cta':ctaParser,'story-card':storyCardParser,'custom-title':customTitleParser,'text-container':textContainerParser,'separator':separatorParser,'carousel':carouselParser,'custom-image':customImageParser,'accordion':accordionParser,'quote':quoteParser,'brightcove-video':brightcoveVideoParser};
const transformers = [abbvieCleanupTransformer, abbvieSectionsTransformer];
const PAGE_TEMPLATE = {name:'story-article',blocks:[{name:'hero-container',instances:['.container.cmp-container-full-width.height-default','.container.cmp-container-full-width.no-bottom-margin']},{name:'cta',instances:['.button.back-cta']},{name:'story-card',instances:['.storyinfo','.cardpagestory']},{name:'accordion',instances:['.accordion.panelcontainer']},{name:'custom-image',instances:['.image:not(.cmp-video__image)','div.image[class="image"]:not(.cmp-video__image)']},{name:'custom-title',instances:['.title.cmp-title-xx-large']},{name:'text-container',instances:['.text.cmp-text-xx-large','.text.cmp-text-x-large']},{name:'separator',instances:['.separator.separator-height-24','.separator.separator-height-48','.separator.separator-height-80']},{name:'carousel',instances:['.carousel.panelcontainer.carousel-minimal']},{name:'quote',instances:['.quote.cmp-quote-xx-large']},{name:'brightcove-video',instances:['.video.cmp-video-xx-large']}]};
function executeTransformers(hookName, element, payload) { transformers.forEach(fn => { try { fn.call(null, hookName, element, {...payload, template: PAGE_TEMPLATE}); } catch(e) { console.error(`Transformer failed at ${hookName}:`, e); } }); }
function findBlocksOnPage(document, template) { const pageBlocks = []; template.blocks.forEach(blockDef => { blockDef.instances.forEach(selector => { const elements = document.querySelectorAll(selector); if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`); elements.forEach(el => pageBlocks.push({name: blockDef.name, selector, element: el})); }); }); console.log(`Found ${pageBlocks.length} block instances on page`); return pageBlocks; }
export default { transform: (payload) => { const { document, url, html, params } = payload; const main = document.body; executeTransformers('beforeTransform', main, payload); const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE); pageBlocks.forEach(block => { const parser = parsers[block.name]; if (parser) { try { parser(block.element, { document, url, params }); } catch(e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); } } }); executeTransformers('afterTransform', main, payload); const hr = document.createElement('hr'); main.appendChild(hr); WebImporter.rules.createMetadata(main, document); WebImporter.rules.transformBackgroundImages(main, document); WebImporter.rules.adjustImageUrls(main, url, params.originalURL); const path = WebImporter.FileUtils.sanitizePath(new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '')); return [{ element: main, path, report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map(b => b.name) } }]; } };
