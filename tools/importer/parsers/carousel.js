/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const slides = element.querySelectorAll('.carousel-item, .cmp-carousel__item, .splide__slide, [role="tabpanel"]');
  const uniqueSlides = new Set(); slides.forEach(s => uniqueSlides.add(s));
  const totalSlides = uniqueSlides.size || 0;
  const variantClasses = [];
  if (element.classList.contains('carousel-show-btn-margin')) variantClasses.push('carousel-show-btn-margin');
  if (element.classList.contains('carousel-minimal')) variantClasses.push('carousel-minimal');
  const blockName = variantClasses.length > 0 ? `carousel (${variantClasses.join(', ')})` : 'carousel';
  const cells = [[String(totalSlides)],['static'],[''],[''],['false'],['3000'],['false'],['1'],['false'],['1'],['false'],['false'],['true'],['true'],[''],[''],[''],[''],[''],[''],['false'],[''],['none'],['']];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  const fragment = document.createDocumentFragment(); fragment.appendChild(block);
  uniqueSlides.forEach(slide => {
    const img = slide.querySelector('img'); if (!img) return;
    const cmpImage = slide.querySelector('.cmp-image, [data-cmp-src]');
    let imgSrc = img.getAttribute('data-cmp-src') || img.getAttribute('data-src') || (cmpImage && cmpImage.getAttribute('data-cmp-src')) || img.getAttribute('src') || '';
    if (!imgSrc || imgSrc.startsWith('blob:') || imgSrc.startsWith('data:')) return;
    const imageCell = document.createElement('div');
    const pic = document.createElement('picture'); const imgEl = document.createElement('img');
    imgEl.setAttribute('src', imgSrc); imgEl.setAttribute('alt', img.getAttribute('alt') || ''); imgEl.setAttribute('loading', 'lazy');
    pic.appendChild(imgEl); imageCell.appendChild(pic);
    const imageCells = [[imageCell],['false'],['false'],[''],['false'],['false'],['false'],[''],['_self'],[''],['false'],[''],[''],[''],['none'],['']];
    fragment.appendChild(WebImporter.Blocks.createBlock(document, { name: 'custom-image', cells: imageCells }));
  });
  element.replaceWith(fragment);
}
