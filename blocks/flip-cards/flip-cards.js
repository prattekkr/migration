/**
 * Flip Cards Container Block
 *
 * Arranges child flip-card items in a responsive grid layout.
 * Supports a 'carousel' variant that enables horizontal scrolling with navigation controls.
 *
 * Content model (each row = one card):
 *   Row col 1: Front content (image + text)
 *   Row col 2: Back content (text, links)
 *
 * Variants:
 *   - (default): CSS Grid layout, responsive columns
 *   - carousel: Horizontal scroll with prev/next buttons
 */

/**
 * Updates disabled state of carousel navigation buttons based on scroll position
 * @param {Element} grid The scrollable container
 * @param {Element} prevBtn Previous button
 * @param {Element} nextBtn Next button
 */
function updateNavState(grid, prevBtn, nextBtn) {
  const atStart = grid.scrollLeft <= 0;
  const atEnd = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 1;

  prevBtn.disabled = atStart;
  nextBtn.disabled = atEnd;
}

/**
 * Adds carousel navigation controls and scroll behavior
 * @param {Element} block The block container
 * @param {Element} grid The grid/list element to scroll
 */
function setupCarousel(block, grid) {
  grid.classList.add('flip-cards-carousel');

  const nav = document.createElement('div');
  nav.className = 'flip-cards-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'flip-cards-nav-btn flip-cards-nav-prev';
  prevBtn.setAttribute('aria-label', 'Previous cards');
  prevBtn.setAttribute('type', 'button');
  prevBtn.textContent = '‹';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'flip-cards-nav-btn flip-cards-nav-next';
  nextBtn.setAttribute('aria-label', 'Next cards');
  nextBtn.setAttribute('type', 'button');
  nextBtn.textContent = '›';

  prevBtn.addEventListener('click', () => {
    const scrollAmount = grid.clientWidth * 0.8;
    grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    const scrollAmount = grid.clientWidth * 0.8;
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  nav.append(prevBtn, nextBtn);
  block.append(nav);

  updateNavState(grid, prevBtn, nextBtn);
  grid.addEventListener('scroll', () => {
    updateNavState(grid, prevBtn, nextBtn);
  });
}

export default function decorate(block) {
  const rows = [...block.children];
  const isCarousel = block.classList.contains('carousel');

  const grid = document.createElement('ul');
  grid.className = 'flip-cards-grid';
  grid.setAttribute('role', 'list');

  rows.forEach((row) => {
    const cols = [...row.children];
    const front = cols[0];
    const back = cols[1];

    const card = document.createElement('li');
    card.className = 'flip-card-item';

    const inner = document.createElement('div');
    inner.className = 'flip-card-inner';

    const frontFace = document.createElement('div');
    frontFace.className = 'flip-card-front';
    if (front) frontFace.append(...front.childNodes);

    const backFace = document.createElement('div');
    backFace.className = 'flip-card-back';
    if (back) backFace.append(...back.childNodes);

    inner.append(frontFace, backFace);
    card.append(inner);

    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('flipped');
      }
    });

    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Flip card. Press to reveal back side.');

    grid.append(card);
  });

  block.replaceChildren(grid);

  if (isCarousel) {
    setupCarousel(block, grid);
  }
}
