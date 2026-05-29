import { decorateIcons } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import {
  applyCommonProps, createIcon, extractIconSource, isEDSPage, isLocal,
} from '../../scripts/utils.js';
import { getConfigValue } from '../../scripts/config.js';

/**
 * Row indices matching the xwalk template field order (tabs excluded).
 *
 *  Row  0  – searchIconType
 *  Row  1  – searchFontIcon
 *  Row  2  – searchImageIcon
 *  Row  3  – shareText
 *  Row  4  – shareConfirmationText
 *  Row  5  – pronunciationHeaderText
 *  Row  6  – shareLinkIcon
 *  Row  7  – speakerIcon
 *  Row  8  – parentPath
 *  Row  9  – orderBy
 *  Row 10  – sortOrder
 *  Row 11  – maxItems
 *  Row 12  – noResultsHeadlineText
 *  Row 13  – noResultsSubheadingText
 *  Row 14  – formEmbedUrl
 *  Row 15  – papEnabled
 *  Row 16+ – common properties (blockId, language, analyticsId — via applyCommonProps)
 */
const ROW = {
  SEARCH_ICON_TYPE: 0,
  SEARCH_FONT_ICON: 1,
  SEARCH_IMAGE_ICON: 2,
  SHARE_TEXT: 3,
  SHARE_CONFIRMATION_TEXT: 4,
  PRONUNCIATION_HEADER_TEXT: 5,
  SHARE_LINK_ICON: 6,
  SPEAKER_ICON: 7,
  PARENT_PATH: 8,
  ORDER_BY: 9,
  SORT_ORDER: 10,
  MAX_ITEMS: 11,
  NO_RESULTS_HEADLINE: 12,
  NO_RESULTS_SUBHEADING: 13,
  FORM_EMBED_URL: 14,
  PAP_ENABLED: 15,
  COMMON_PROPS_START: 16,
};

// ─── config readers ──────────────────────────────────────────────────────────

function parseBoolean(value) {
  return ['true', 'yes', '1'].includes(`${value || ''}`.trim().toLowerCase());
}

function readSequentialConfig(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  const cells = rows.map((row) => row.querySelector(':scope > div') || row);
  const textAt = (i) => cells[i]?.textContent?.trim() || '';
  const linkAt = (i) => cells[i]?.querySelector('a[href]')?.getAttribute('href') || textAt(i);
  const maxItemsRaw = parseInt(textAt(ROW.MAX_ITEMS), 10);

  return {
    searchIconType: textAt(ROW.SEARCH_ICON_TYPE) || 'none',
    searchFontIcon: textAt(ROW.SEARCH_FONT_ICON),
    searchImageIcon: extractIconSource(cells[ROW.SEARCH_IMAGE_ICON]),
    shareText: textAt(ROW.SHARE_TEXT),
    shareConfirmationText: textAt(ROW.SHARE_CONFIRMATION_TEXT),
    pronunciationHeaderText: textAt(ROW.PRONUNCIATION_HEADER_TEXT),
    shareLinkIcon: extractIconSource(cells[ROW.SHARE_LINK_ICON]),
    speakerIcon: extractIconSource(cells[ROW.SPEAKER_ICON]),
    parentPath: linkAt(ROW.PARENT_PATH),
    orderBy: textAt(ROW.ORDER_BY) || 'created',
    sortOrder: textAt(ROW.SORT_ORDER) || 'asc',
    maxItems: Number.isNaN(maxItemsRaw) ? 0 : maxItemsRaw,
    noResultsHeadlineText: textAt(ROW.NO_RESULTS_HEADLINE),
    noResultsSubheadingText: textAt(ROW.NO_RESULTS_SUBHEADING),
    formEmbedUrl: linkAt(ROW.FORM_EMBED_URL),
    papEnabled: parseBoolean(textAt(ROW.PAP_ENABLED)),
  };
}

// ─── data fetching ────────────────────────────────────────────────────────────
async function fetchProducts(parentPath) {
  try {
    const CF_GRAPHQL_SUFFIX = '/graphql/execute.json/abbvie-com2/allProducts';
    let origin = '';
    if (isEDSPage() || isLocal()) {
      origin = await getConfigValue('rootPath') || '';
    }
    const path = `${origin}${CF_GRAPHQL_SUFFIX};rootPath=${parentPath || '/content/dam/corporate/abbvie-com2/products'}`;
    const result = await fetch(path);
    const cfData = await result.json();
    return cfData?.data?.productContentFragmentList?.items || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching product data:', error);
    return [];
  }
}

// ─── product links ────────────────────────────────────────────────────────────

// productLinks in the CF response are JSON strings:
// '{"linkPath":"...","openNewTab":"yes","linkText":"...","alternativeText":"..."}'
function parseProductLinks(rawLinks) {
  if (!Array.isArray(rawLinks)) return [];
  return rawLinks.reduce((acc, raw) => {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const {
        linkPath, linkText, openNewTab, alternativeText,
      } = parsed;
      if (linkPath && linkText) {
        acc.push({
          linkPath,
          linkText,
          opensNewTab: openNewTab === 'yes',
          alternativeText,
        });
      }
    } catch { /* skip malformed entries */ }
    return acc;
  }, []);
}

// ─── filtering ────────────────────────────────────────────────────────────────

function applyProductFilters(products, papEnabled) {
  return products.filter((p) => {
    if (p.hideFromProductPage) return false;
    if (papEnabled && !p.papEnable) return false;
    return true;
  });
}

// ─── sorting & grouping ───────────────────────────────────────────────────────

const ORDER_BY_FIELD_MAP = {
  created: 'created',
  lastmodified: 'lastModified',
  title: 'title',
  brandedname: 'brandedName',
  brandednamepronunciation: 'brandedNamePronunciation',
  genericname: 'genericName',
  productdisclaimer: 'productDisclaimer',
  descriptions: 'description',
  productlinks: 'productLinks',
  applyonlinelink: 'applyOnlineLink',
  signinlink: 'signInLink',
  savingscardurl: 'savingsCardUrl',
  bridgeprogramcontactinformation: 'bridgeProgramContactInformation',
  contactnumberformaynotqualify: 'notQualifyContactNumber',
};

function getSortValue(product, field) {
  if (field === 'created' || field === 'lastModified') {
    const jcrName = field === 'created' ? 'jcr:created' : 'cq:lastModified';
    // eslint-disable-next-line no-underscore-dangle
    const entry = product._metadata?.calendarMetadata?.find((m) => m.name === jcrName);
    return entry?.value || '';
  }
  const val = product[field];
  if (val == null) return '';
  if (typeof val === 'object' && val.plaintext) return val.plaintext.toLowerCase();
  return String(val).toLowerCase();
}

function sortProducts(products, orderBy, sortOrder) {
  const key = orderBy.toLowerCase().replace(/[\s-]+/g, '');
  const field = ORDER_BY_FIELD_MAP[key] || 'brandedName';
  const sorted = [...products].sort(
    (a, b) => getSortValue(a, field).localeCompare(getSortValue(b, field)),
  );
  return sortOrder.toLowerCase() === 'desc' ? sorted.reverse() : sorted;
}

function groupByLetter(products) {
  const groups = new Map();
  products.forEach((product) => {
    const name = (product.brandedName || product.title || '').replace(/^[^A-Za-z]+/, '');
    const letter = name[0]?.toUpperCase() || '#';
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(product);
  });
  return groups;
}

// ─── rendering ───────────────────────────────────────────────────────────────

function buildSearchIcon(iconType, fontIcon, imageIcon) {
  if (iconType === 'icon-font' && fontIcon) {
    return createIcon(fontIcon, 'svg', { additionalClasses: 'product-listing-search-icon' });
  }
  if (iconType === 'image' && imageIcon) {
    return createIcon(imageIcon, 'image', { additionalClasses: 'product-listing-search-icon' });
  }
  return null;
}

function buildHeader(config) {
  const header = document.createElement('div');
  header.className = 'product-listing-header';

  const headerLeft = document.createElement('div');
  headerLeft.className = 'product-listing-header-left';

  const title = document.createElement('h1');
  title.className = 'product-listing-title';
  title.textContent = 'View:';
  headerLeft.appendChild(title);

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'product-listing-search-wrapper';

  const searchIcon = buildSearchIcon(
    config.searchIconType,
    config.searchFontIcon,
    config.searchImageIcon,
  );
  if (searchIcon) searchWrapper.appendChild(searchIcon);

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'product-listing-search-input';
  searchInput.placeholder = 'Search Products';
  searchInput.setAttribute('aria-label', 'Search products');
  searchInput.autocomplete = 'off';
  searchWrapper.appendChild(searchInput);

  header.appendChild(headerLeft);
  header.appendChild(searchWrapper);
  return header;
}

function buildBrowseDropdown(activeLetters) {
  const activeSet = new Set(activeLetters.map((l) => l.toUpperCase()));
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const wrapper = document.createElement('div');
  wrapper.className = 'product-listing-browse-wrapper';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'product-listing-browse-btn';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-haspopup', 'true');

  const btnLabel = document.createElement('span');
  btnLabel.className = 'product-listing-browse-label';
  btnLabel.textContent = 'BROWSE BY ALPHABET';
  btn.appendChild(btnLabel);

  const chevron = document.createElement('span');
  chevron.className = 'product-listing-browse-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  btn.appendChild(chevron);

  const panel = document.createElement('div');
  panel.className = 'product-listing-browse-panel';
  panel.hidden = true;

  allLetters.forEach((letter) => {
    const isActive = activeSet.has(letter);
    const el = isActive ? document.createElement('button') : document.createElement('span');
    el.className = 'product-listing-browse-letter';
    if (!isActive) el.classList.add('product-listing-browse-letter--inactive');
    el.textContent = letter;

    if (isActive) {
      el.type = 'button';
      el.setAttribute('aria-label', `Browse products starting with ${letter}`);
      el.addEventListener('click', () => {
        const target = document.getElementById(`product-group-${letter.toLowerCase()}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        panel.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        wrapper.classList.remove('is-open');
      });
    }

    panel.appendChild(el);
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    btn.setAttribute('aria-expanded', String(!isOpen));
    wrapper.classList.toggle('is-open', !isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      wrapper.classList.remove('is-open');
    }
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(panel);
  return wrapper;
}

/**
 * Share button: copies page URL with product anchor on click.
 * Uses a body-appended fixed tooltip to escape any ancestor overflow clipping.
 * Hover shows the i18n "Click to copy" text; click briefly shows the authored confirmation.
 */
function buildShareSection(product, productId, config, placeholders) {
  const clickToCopyText = placeholders?.['productListing.clickToCopy'] || 'Click to copy';
  const shareUrl = `${window.location.href.split('#')[0]}#${productId}`;

  const container = document.createElement('div');
  container.className = 'product-listing-share';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'product-listing-share-btn';
  btn.setAttribute('aria-label', `Share ${product.brandedName}`);

  if (config.shareLinkIcon) {
    btn.appendChild(createIcon(config.shareLinkIcon, 'image', {
      additionalClasses: 'product-listing-share-icon',
    }));
  }

  const label = document.createElement('span');
  label.className = 'product-listing-share-label';
  label.textContent = config.shareText || 'SHARE LINK';
  btn.appendChild(label);

  // Tooltip appended to body so it escapes any ancestor overflow/stacking context.
  const tooltip = document.createElement('span');
  tooltip.className = 'product-listing-share-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');
  tooltip.textContent = clickToCopyText;
  document.body.appendChild(tooltip);

  let copyTimeout;

  function showTooltip(text) {
    const rect = btn.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.classList.add('product-listing-share-tooltip--visible');
  }

  function hideTooltip() {
    tooltip.classList.remove('product-listing-share-tooltip--visible');
  }

  btn.addEventListener('mouseenter', () => showTooltip(clickToCopyText));
  btn.addEventListener('mouseleave', () => {
    if (!copyTimeout) hideTooltip();
  });
  btn.addEventListener('focusin', () => showTooltip(clickToCopyText));
  btn.addEventListener('focusout', () => {
    if (!copyTimeout) hideTooltip();
  });

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showTooltip(config.shareConfirmationText || 'Copied!');
      copyTimeout = setTimeout(() => {
        copyTimeout = null;
        hideTooltip();
      }, 2000);
    } catch { /* noop — clipboard not available */ }
  });

  container.appendChild(btn);
  return container;
}

function buildPronunciationSection(product, config) {
  const hasText = !!product.brandedNamePronunciation;
  // eslint-disable-next-line no-underscore-dangle
  const audioPath = product.audioPronunciationAsset?._path;
  if (!hasText && !audioPath) return null;

  const section = document.createElement('div');
  section.className = 'product-listing-pronunciation';

  const labelEl = document.createElement('p');
  labelEl.className = 'product-listing-pronunciation-label';
  labelEl.textContent = config.pronunciationHeaderText || 'PRONUNCIATION';
  section.appendChild(labelEl);

  const row = document.createElement('div');
  row.className = 'product-listing-pronunciation-row';

  if (hasText) {
    const text = document.createElement('span');
    text.className = 'product-listing-pronunciation-text';
    text.textContent = product.brandedNamePronunciation;
    row.appendChild(text);
  }

  if (audioPath) {
    const speakerBtn = document.createElement('button');
    speakerBtn.type = 'button';
    speakerBtn.className = 'product-listing-speaker-btn';
    speakerBtn.setAttribute('aria-label', `Hear pronunciation of ${product.brandedName}`);

    if (config.speakerIcon) {
      speakerBtn.appendChild(createIcon(config.speakerIcon, 'image', {
        additionalClasses: 'product-listing-speaker-icon',
      }));
    }

    speakerBtn.addEventListener('click', async () => {
      const cfBaseUrl = await getConfigValue('authorDomain') || '';
      const audio = new Audio(`${cfBaseUrl}${audioPath}`);
      audio.play().catch(() => { /* audio play blocked by browser */ });
    });

    row.appendChild(speakerBtn);
  }

  section.appendChild(row);
  return section;
}

/**
 * Builds the INFORMATION section with all product links.
 * Only the first link is visible by default; additional links are hidden
 * (class: product-listing-info-link-extra) and revealed on panel expand.
 * The "INFORMATION" label text is i18n from placeholders.
 */
function buildInfoSection(links, infoLabelText) {
  if (links.length === 0) return null;

  const section = document.createElement('div');
  section.className = 'product-listing-info';

  const labelEl = document.createElement('p');
  labelEl.className = 'product-listing-info-label';
  labelEl.textContent = infoLabelText;
  section.appendChild(labelEl);

  const linkList = document.createElement('ul');
  linkList.className = 'product-listing-info-links';

  links.forEach(({
    linkPath, linkText, opensNewTab, alternativeText,
  }, index) => {
    const li = document.createElement('li');
    li.className = 'product-listing-info-link-item';
    if (index > 0) {
      // Additional links are hidden until the accordion panel is expanded
      li.classList.add('product-listing-info-link-extra');
      li.hidden = true;
    }

    const a = document.createElement('a');
    a.href = linkPath;
    a.className = 'product-listing-info-link';
    if (opensNewTab) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    if (alternativeText) {
      a.setAttribute('aria-label', alternativeText);
      a.setAttribute('title', alternativeText);
    }

    const linkTextSpan = document.createElement('span');
    linkTextSpan.textContent = linkText;
    a.appendChild(linkTextSpan);

    a.appendChild(createIcon('arrow-right', 'icon-font', {
      additionalClasses: 'product-listing-link-arrow',
    }));

    li.appendChild(a);
    linkList.appendChild(li);
  });

  section.appendChild(linkList);
  return section;
}

function buildProductItem(product, config, placeholders) {
  const productId = (product.title || product.brandedName || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const infoLabelText = placeholders?.['productListing.information'] || 'INFORMATION';
  const allLinks = parseProductLinks(product.productLinks);
  const disclaimerText = product.productDisclaimer?.plaintext;

  const item = document.createElement('li');
  item.className = 'product-listing-item';
  // eslint-disable-next-line no-underscore-dangle
  item.id = productId || product._id;
  item.dataset.brandedName = (product.brandedName || '').toLowerCase();
  item.dataset.genericName = (product.genericName || '').toLowerCase();
  item.dataset.linkText = allLinks.map((l) => l.linkText).join(' ').toLowerCase();
  item.dataset.disclaimerText = (disclaimerText || '').toLowerCase();

  const inner = document.createElement('div');
  inner.className = 'product-listing-item-inner';

  // ── LEFT PANEL ──────────────────────────────────────────────
  const leftPanel = document.createElement('div');
  leftPanel.className = 'product-listing-item-left';

  const brandEl = document.createElement('h3');
  brandEl.className = 'product-listing-brand-name';
  brandEl.textContent = product.brandedName || '';
  leftPanel.appendChild(brandEl);

  if (product.genericName) {
    const genericEl = document.createElement('p');
    genericEl.className = 'product-listing-generic-name';
    genericEl.textContent = product.genericName;
    leftPanel.appendChild(genericEl);
  }

  // Left — expanded: share link then pronunciation
  const expandedLeft = document.createElement('div');
  expandedLeft.className = 'product-listing-expanded-left';
  expandedLeft.hidden = true;

  expandedLeft.appendChild(buildShareSection(product, productId, config, placeholders));
  const pronunciationEl = buildPronunciationSection(product, config);
  if (pronunciationEl) expandedLeft.appendChild(pronunciationEl);
  leftPanel.appendChild(expandedLeft);

  // eslint-disable-next-line no-underscore-dangle
  const imagePath = product.image?._path;
  const productImageEl = imagePath ? (() => {
    const img = document.createElement('img');
    img.className = 'product-listing-product-image';
    img.src = `${config.publishDomain}${imagePath}`;
    img.alt = product.brandedName || '';
    img.hidden = true;
    return img;
  })() : null;

  // ── RIGHT PANEL ─────────────────────────────────────────────
  const rightPanel = document.createElement('div');
  rightPanel.className = 'product-listing-item-right';

  // INFORMATION label + all links (first always visible, extra hidden until expand)
  const infoEl = buildInfoSection(allLinks, infoLabelText);
  if (infoEl) rightPanel.appendChild(infoEl);

  // Right — expanded: disclaimer only
  if (disclaimerText) {
    const expandedRight = document.createElement('div');
    expandedRight.className = 'product-listing-expanded-right';
    expandedRight.hidden = true;

    const disclaimer = document.createElement('p');
    disclaimer.className = 'product-listing-disclaimer';
    disclaimer.textContent = disclaimerText;
    expandedRight.appendChild(disclaimer);
    rightPanel.appendChild(expandedRight);
  }

  // ── TOGGLE ──────────────────────────────────────────────────
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'product-listing-toggle';
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-label', `Toggle details for ${product.brandedName}`);

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'product-listing-toggle-icon';
  toggleIcon.setAttribute('aria-hidden', 'true');
  toggleBtn.appendChild(toggleIcon);

  toggleBtn.addEventListener('click', () => {
    const isExpanded = item.classList.toggle('is-expanded');
    toggleBtn.setAttribute('aria-expanded', String(isExpanded));

    expandedLeft.hidden = !isExpanded;

    // Reveal / hide additional info links beyond the first
    item.querySelectorAll('.product-listing-info-link-extra').forEach((extraLi) => {
      extraLi.hidden = !isExpanded;
    });

    const expandedRight = rightPanel.querySelector('.product-listing-expanded-right');
    if (expandedRight) expandedRight.hidden = !isExpanded;

    if (productImageEl) productImageEl.hidden = !isExpanded;
  });

  inner.appendChild(leftPanel);
  inner.appendChild(rightPanel);
  if (productImageEl) inner.appendChild(productImageEl);
  inner.appendChild(toggleBtn);
  item.appendChild(inner);
  return item;
}

function buildLetterGroup(letter, products, config, placeholders) {
  const group = document.createElement('div');
  group.className = 'product-listing-letter-group';
  group.id = `product-group-${letter.toLowerCase()}`;

  const heading = document.createElement('h2');
  heading.className = 'product-listing-letter-heading';
  heading.textContent = letter;
  group.appendChild(heading);

  const list = document.createElement('ul');
  list.className = 'product-listing-items';
  products.forEach((p) => list.appendChild(buildProductItem(p, config, placeholders)));
  group.appendChild(list);

  return group;
}

function buildEmptyState(config) {
  const div = document.createElement('div');
  div.className = 'product-listing-empty-state';

  const headline = document.createElement('p');
  headline.className = 'product-listing-empty-headline';
  headline.textContent = config.noResultsHeadlineText || 'No products found';
  div.appendChild(headline);

  if (config.noResultsSubheadingText) {
    const subheading = document.createElement('p');
    subheading.className = 'product-listing-empty-subheading';
    subheading.textContent = config.noResultsSubheadingText;
    div.appendChild(subheading);
  }

  return div;
}

function applySearch(container, searchInput, config, sectionEl) {
  let searchTimeout;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = searchInput.value.trim().toLowerCase();
      const allItems = container.querySelectorAll('.product-listing-item');
      let visibleCount = 0;

      allItems.forEach((item) => {
        const matches = !query
          || query.length < 2
          || item.dataset.brandedName.includes(query)
          || item.dataset.genericName.includes(query)
          || item.dataset.linkText.includes(query)
          || item.dataset.disclaimerText.includes(query);
        item.style.display = matches ? '' : 'none';
        if (matches) visibleCount += 1;
      });

      container.querySelectorAll('.product-listing-letter-group').forEach((group) => {
        const hasVisible = [...group.querySelectorAll('.product-listing-item')]
          .some((item) => item.style.display !== 'none');
        group.style.display = hasVisible ? '' : 'none';
      });

      let emptyState = container.querySelector('.product-listing-empty-state.search-empty');
      if (visibleCount === 0 && query.length >= 2) {
        if (!emptyState) {
          emptyState = buildEmptyState(config);
          emptyState.classList.add('search-empty');
          container.appendChild(emptyState);
        }
        const sectionWidth = sectionEl?.offsetWidth;
        if (sectionWidth) emptyState.style.minWidth = `${sectionWidth}px`;
        emptyState.style.display = '';
      } else if (emptyState) {
        emptyState.style.display = 'none';
      }
    }, 300);
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default async function decorate(block) {
  const config = readSequentialConfig(block);
  applyCommonProps(block, ROW.COMMON_PROPS_START);
  const sectionEl = block.closest('.section');

  block.innerHTML = '';
  block.appendChild(buildHeader(config));

  const container = document.createElement('div');
  container.className = 'product-listing-container';

  const loadingEl = document.createElement('p');
  loadingEl.className = 'product-listing-loading';
  loadingEl.textContent = 'Loading products…';
  container.appendChild(loadingEl);
  block.appendChild(container);

  const [products, placeholders, publishDomain] = await Promise.all([
    fetchProducts(config.parentPath),
    fetchPlaceholders(),
    getConfigValue('publishDomain'),
  ]);
  config.publishDomain = publishDomain || '';
  container.innerHTML = '';

  const filtered = applyProductFilters(products, config.papEnabled);
  const headerLeft = block.querySelector('.product-listing-header-left');

  if (filtered.length === 0) {
    const emptyStateEl = buildEmptyState(config);
    const sectionWidth = sectionEl?.offsetWidth;
    if (sectionWidth) emptyStateEl.style.minWidth = `${sectionWidth}px`;
    container.appendChild(emptyStateEl);
    if (headerLeft) headerLeft.appendChild(buildBrowseDropdown([]));
  } else {
    let sorted = sortProducts(filtered, config.orderBy, config.sortOrder);
    if (config.maxItems > 0) sorted = sorted.slice(0, config.maxItems);

    const groups = groupByLetter(sorted);
    const sortedLetters = [...groups.keys()].sort();
    sortedLetters.forEach((letter) => {
      container.appendChild(buildLetterGroup(letter, groups.get(letter), config, placeholders));
    });
    if (headerLeft) headerLeft.appendChild(buildBrowseDropdown(sortedLetters));
  }

  const searchInput = block.querySelector('.product-listing-search-input');
  if (searchInput) applySearch(container, searchInput, config, sectionEl);

  decorateIcons(block);
}
