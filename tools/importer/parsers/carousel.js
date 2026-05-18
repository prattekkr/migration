/* eslint-disable */
/* global WebImporter */

/**
 * Parser: carousel (container block with filter)
 * Config fields form field groups. Slides are separate custom-image blocks.
 * Field hints on non-empty cells. Skip blob: URLs for images.
 */
export default function parse(element, { document }) {
  const slides = element.querySelectorAll('[role="tabpanel"], .carousel-item, .splide__slide');
  const slideCount = slides.length || 0;

  const hintVal = (fieldName, v) => {
    const d = document.createElement('div');
    if (v !== undefined && v !== null && v !== '') {
      const p = document.createElement('p');
      p.appendChild(document.createComment(' field:' + fieldName + ' '));
      p.appendChild(document.createTextNode(String(v)));
      d.appendChild(p);
    }
    return d;
  };
  const empty = () => document.createElement('div');

  const cells = [
    [hintVal('totalSlides', slideCount)],
    [hintVal('carouselType', 'static')],
    [empty()],                                        // rssFeedUrl
    [empty()],                                        // numberOfItems
    [hintVal('autoplay', 'false')],
    [hintVal('slideTransitionTime', '3000')],
    [hintVal('pauseOnHover', 'false')],
    [hintVal('numberOfSlidesToShow', '1')],
    [hintVal('bypassCarouselOnMobile', 'false')],
    [hintVal('startingSlideIndex', '1')],
    [hintVal('centerActiveSlide', 'false')],
    [hintVal('enableLooping', 'false')],
    [hintVal('enableNextPreviousControls', 'true')],
    [hintVal('enableDotNavigation', 'true')],
    [empty()],                                        // carouselLabel
    [empty()],                                        // previousButtonLabel
    [empty()],                                        // nextButtonLabel
    [empty()],                                        // playButtonLabel
    [empty()],                                        // pauseButtonLabel
    [empty()],                                        // tablistLabel
    [hintVal('itemLabel', 'false')],
    [empty()],                                        // classes group
    [empty()],                                        // blockId
    [hintVal('language', 'none')],
  ];

  const carouselBlock = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });

  // Create fragment: carousel block + custom-image blocks for each slide
  const fragment = document.createDocumentFragment();
  fragment.appendChild(carouselBlock);

  // Extract slide images as separate custom-image blocks
  slides.forEach((slide) => {
    const img = slide.querySelector('img');
    if (!img) return;

    let imgSrc = img.getAttribute('data-cmp-src') || img.getAttribute('src') || '';
    if (imgSrc.startsWith('blob:') || imgSrc.startsWith('data:')) return;
    if (!imgSrc) return;

    const imageCell = document.createElement('div');
    imageCell.appendChild(document.createComment(' field:image '));
    const pic = document.createElement('picture');
    const imgEl = document.createElement('img');
    imgEl.src = imgSrc;
    imgEl.alt = img.getAttribute('alt') || '';
    pic.appendChild(imgEl);
    imageCell.appendChild(pic);

    const imageCells = [
      [imageCell],
      [hintVal('getAltFromDAM', 'false')],
      [hintVal('imageIsDecorative', 'false')],
      [empty()],                                      // caption
      [hintVal('getCaptionFromDAM', 'false')],
      [hintVal('displayCaptionBelowImage', 'false')],
      [hintVal('enableLink', 'false')],
      [empty()],                                      // target
      [hintVal('clickBehavior', '_self')],
      [empty()],                                      // modalPanelId
      [hintVal('enableWarnOnLeave', 'false')],
      [empty()],                                      // warnOnLeavePath
      [empty()],                                      // linkAriaLabel
      [empty()],                                      // classes group
      [empty()],                                      // blockId
      [hintVal('language', 'none')],
    ];

    const imageBlock = WebImporter.Blocks.createBlock(document, { name: 'custom-image', cells: imageCells });
    fragment.appendChild(imageBlock);
  });

  element.replaceWith(fragment);
}
