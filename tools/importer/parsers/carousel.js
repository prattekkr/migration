/* eslint-disable */
/* global WebImporter */

import { applyAnalytics } from './utils/analytics.js';

/**
 * Parser: carousel
 * Base block: carousel
 * Source: https://www.abbvie.com/who-we-are/our-stories/the-math-of-migraine.html
 * Generated: 2026-05-26
 *
 * Source DOM patterns (AEM Core Component "carousel"):
 *   <div class="carousel cmp-carousel-... [variant classes]">
 *     <div class="cmp-carousel" data-cmp-autoplay="false" data-cmp-delay="...">
 *       <div class="cmp-carousel__content">
 *         <div class="cmp-carousel__item">  (one per slide)
 *            <div class="cmp-image"> ... </div>     ← typical: image slide
 *            (or .cmp-teaser, .cmp-text, etc.)
 *         </div>
 *       </div>
 *       <ul class="cmp-carousel__indicators">...</ul>
 *       <button class="cmp-carousel__action cmp-carousel__action--previous">
 *       <button class="cmp-carousel__action cmp-carousel__action--next">
 *     </div>
 *   </div>
 *
 * Library structure:
 *   - Block-level rows (field:NAME comments) for carousel configuration.
 *   - One <child> row per slide containing the slide content (typically an
 *     image — handled inline; richer slide types fall through to raw clone).
 *
 * UE Model fields (carousel):
 *   totalSlides (number)              — count of inline slides (== slide rows)
 *   carouselType (select)             — "static" | "dynamic"
 *   autoplay (boolean)                — from data-cmp-autoplay or .cmp-carousel--autoplay
 *   slideTransitionTime (number)      — from data-cmp-delay (ms)
 *   pauseOnHover (boolean)            — from data-cmp-pause-on-hover
 *   numberOfSlidesToShow (number)     — typically 1; derived from variant classes
 *   bypassCarouselOnMobile (boolean)  — defaults false
 *   startingSlideIndex (number)       — defaults 1
 *   centerActiveSlide (boolean)       — defaults false
 *   enableLooping (boolean)           — derived from data-cmp-loop / "loop" variant
 *   enableNextPreviousControls (boolean) — derived from presence of prev/next buttons
 *   enableDotNavigation (boolean)     — derived from presence of indicators
 *   carouselLabel (text)              — aria-label on root
 *   previousButtonLabel (text)        — aria-label of prev button
 *   nextButtonLabel (text)            — aria-label of next button
 *
 * Analytics: applyAnalytics() carries data-cmp-data-layer + data-track to block.
 * Accessibility: preserves carousel aria-label, previous/next button labels,
 *   per-slide alt text via the inline image cells.
 */
export default function parse(element, { document }) {
  if (!element?.parentElement) return;

  const carouselRoot = element.matches('.cmp-carousel') ? element : element.querySelector('.cmp-carousel') || element;

  // ---- Slide extraction --------------------------------------------------
  const slideEls = Array.from(
    carouselRoot.querySelectorAll(':scope > .cmp-carousel__content > .cmp-carousel__item, :scope > .cmp-carousel__item, .cmp-carousel__item'),
  );

  // Fallback: direct .cmp-image children if no explicit __item wrappers
  const slides = slideEls.length
    ? slideEls
    : Array.from(carouselRoot.querySelectorAll(':scope > .cmp-image, :scope > .image, :scope > .teaser'));

  // ---- Block-level configuration -----------------------------------------
  const autoplayAttr = carouselRoot.getAttribute('data-cmp-autoplay');
  const autoplay = autoplayAttr === 'true' || carouselRoot.classList.contains('cmp-carousel--autoplay');

  const transitionTime = parseInt(carouselRoot.getAttribute('data-cmp-delay') || '0', 10) || 3000;
  const pauseOnHover = carouselRoot.getAttribute('data-cmp-pause-on-hover') === 'true';
  const enableLooping = carouselRoot.getAttribute('data-cmp-loop') === 'true'
    || /\bcarousel-loop\b/.test(element.className || '');

  const carouselLabel = (carouselRoot.getAttribute('aria-label') || '').trim();
  const prevBtn = carouselRoot.querySelector('.cmp-carousel__action--previous, [data-cmp-hook-carousel="previous"]');
  const nextBtn = carouselRoot.querySelector('.cmp-carousel__action--next, [data-cmp-hook-carousel="next"]');
  const previousButtonLabel = (prevBtn?.getAttribute('aria-label') || '').trim();
  const nextButtonLabel = (nextBtn?.getAttribute('aria-label') || '').trim();

  const hasIndicators = !!carouselRoot.querySelector('.cmp-carousel__indicators, .swiper-pagination');
  const hasControls = !!(prevBtn || nextBtn);

  // ---- Helpers -----------------------------------------------------------
  const row = (field, value) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (value !== undefined && value !== null && value !== '') {
      const p = document.createElement('p');
      p.textContent = String(value);
      frag.appendChild(p);
    }
    return [frag];
  };

  // Each slide is a single cell containing whatever slide content the source
  // provided. For image slides we emit the <img> directly so the image
  // adjuster / Scene7 picks it up. For other slide types we clone the inner
  // content so the parser is robust against teaser/text variants.
  const buildSlideCell = (slideEl) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:media_image '));

    const img = slideEl.querySelector('img');
    if (img) {
      const cloned = img.cloneNode(true);
      // Preserve alt text per Rule 5 (Accessibility)
      if (!cloned.getAttribute('alt')) cloned.setAttribute('alt', '');
      frag.appendChild(cloned);
    } else {
      // Non-image slide: keep raw inner content for downstream review
      const wrap = document.createElement('div');
      wrap.innerHTML = slideEl.innerHTML;
      frag.appendChild(wrap);
    }

    // Optional caption — common pattern: <figcaption> or .cmp-image__caption
    const caption = slideEl.querySelector('figcaption, .cmp-image__caption, .cmp-teaser__description');
    if (caption && caption.textContent.trim()) {
      frag.appendChild(document.createComment(' field:content_caption '));
      const cap = document.createElement('p');
      cap.textContent = caption.textContent.trim();
      frag.appendChild(cap);
    }

    return [frag];
  };

  // ---- Compose cells -----------------------------------------------------
  const cells = [
    row('totalSlides', slides.length),
    row('carouselType', 'static'),
    row('autoplay', autoplay),
    row('slideTransitionTime', transitionTime),
    row('pauseOnHover', pauseOnHover),
    row('numberOfSlidesToShow', 1),
    row('bypassCarouselOnMobile', false),
    row('startingSlideIndex', 1),
    row('centerActiveSlide', false),
    row('enableLooping', enableLooping),
    row('enableNextPreviousControls', hasControls),
    row('enableDotNavigation', hasIndicators),
    row('carouselLabel', carouselLabel),
    row('previousButtonLabel', previousButtonLabel),
    row('nextButtonLabel', nextButtonLabel),
  ];

  // Append per-slide rows
  slides.forEach((s) => cells.push(buildSlideCell(s)));

  // If we found no slides, leave the block out so we don't generate an empty
  // carousel that breaks rendering.
  if (slides.length === 0) {
    element.replaceWith(document.createTextNode(''));
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });

  applyAnalytics(element, block, document);
  element.replaceWith(block);
}
