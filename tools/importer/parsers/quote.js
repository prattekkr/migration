/* eslint-disable */
/* global WebImporter */
export default function parse(element, { document }) {
  const blockName = 'quote (quote-standard, quote-h4)';
  const quoteTextEl = element.querySelector('.cmp-quote__text');
  const quoteText = quoteTextEl?.textContent?.trim() || '';
  const quotationCell = document.createElement('div');
  if (quoteText) { const strong = document.createElement('strong'); strong.textContent = quoteText; quotationCell.appendChild(strong); }
  const authorName = element.querySelector('.author-name, .cmp-quote__author-name')?.textContent?.trim() || '';
  const authorRole = element.querySelector('.author-title, .cmp-quote__author-role, .cmp-quote__author-title')?.textContent?.trim() || '';
  const authorImg = element.querySelector('.cmp-quote__author-block img, .author-img');
  const authorImageCell = document.createElement('div');
  if (authorImg) {
    const src = authorImg.getAttribute('data-cmp-src') || authorImg.getAttribute('src') || '';
    if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
      const pic = document.createElement('picture'); const img = document.createElement('img');
      img.setAttribute('src', src); img.setAttribute('alt', authorImg.getAttribute('alt') || ''); img.setAttribute('loading', 'lazy');
      pic.appendChild(img); authorImageCell.appendChild(pic);
    }
  }
  const cells = [['basic'],[quotationCell],[authorName],[authorRole],[authorImageCell],[''],[''],[''],[''],[''],['none'],['']];
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
