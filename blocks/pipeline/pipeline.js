import { resolveImageReference } from '../../scripts/scripts.js';
import { applyCommonProps } from '../../scripts/utils.js';
import { fetchDashboardCardData } from '../../scripts/cfUtil.js';

const ROW = {
  SHARE_TEXT: 0,
  SHARE_CONFIRM: 1,
  TARGET_HEADER: 2,
  MOLECULE_HEADER: 3,
  PRONUNCIATION_HEADER: 4,
  COL1_HEADER: 5,
  COL2_HEADER: 6,
  PHARMA_COL3: 7,
  PHARMA_COL4: 8,
  PHARMA_COL5: 9,
  PHARMA_COL6: 10,
  PHARMA_COL6_TIP: 11,
  DEVICE_COL3: 12,
  DEVICE_COL4: 13,
  DEVICE_COL5: 14,
  DEVICE_COL6: 15,
  DEVICE_COL6_TIP: 16,
  SHARE_FONT_ICON: 17,
  SHARE_IMAGE_ICON: 18,
  SPEAKER_FONT_ICON: 19,
  SPEAKER_IMAGE_ICON: 20,
  NO_RESULTS_HEADLINE: 21,
  NO_RESULTS_SUBHEADING: 22,
};

function getCellText(row) {
  return row?.firstElementChild?.textContent?.trim() ?? '';
}

function getCellImage(row) {
  if (!row) return null;
  resolveImageReference(row.firstElementChild || row);
  const img = row.querySelector('img');
  return img ? img.getAttribute('src') : null;
}

function buildIcon(type, fontName, imageSrc, cls) {
  if ((type.includes('image')) && imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.className = cls;
    return img;
  }
  if ((type.includes('icon-font')) && fontName) {
    const span = document.createElement('span');
    span.className = `${cls} ${fontName}`;
    span.setAttribute('aria-hidden', 'true');
    return span;
  }
  return null;
}

export function buildPhaseBar(phase) {
  const bar = document.createElement('div');
  bar.className = `pipeline-phase-bar ${phase}`;
  for (let i = 0; i < 3; i += 1) {
    const seg = document.createElement('div');
    seg.className = 'pipeline-phase-segment';
    bar.append(seg);
  }
  return bar;
}

function buildTooltip(text) {
  const container = document.createElement('button');
  container.type = 'button';
  container.className = 'pipeline-tooltip-container';
  container.setAttribute('aria-label', text);
  const icon = document.createElement('span');
  icon.className = 'pipeline-tooltip-btn';
  icon.textContent = 'i';
  const tip = document.createElement('span');
  tip.className = 'pipeline-tooltip';
  tip.textContent = text;
  container.append(icon, tip);
  return container;
}

function buildNoResults(config) {
  const container = document.createElement('div');
  container.className = 'pipeline-no-results';
  container.hidden = true;
  const headline = document.createElement('span');
  headline.className = 'pipeline-no-results-title';
  headline.textContent = config.noResultsHeadline || 'No Results Found';
  const sub = document.createElement('span');
  sub.className = 'pipeline-no-results-sub';
  sub.textContent = config.noResultsSubheading || 'Change your filter or search criteria.';
  container.append(headline, document.createElement('br'), sub);
  return container;
}

function buildIndicationRow(indication, region, phase, status) {
  const row = document.createElement('div');
  row.className = 'pipeline-card-indication-row';

  const indicationEl = document.createElement('span');
  indicationEl.className = 'pipeline-card-indication';
  indicationEl.textContent = indication;

  // Desktop: region column (hidden on mobile)
  const regionEl = document.createElement('span');
  regionEl.className = 'pipeline-card-region desktop-element';
  regionEl.textContent = region;

  // Mobile: region + phase status inline (hidden on desktop)
  const mobileRegion = document.createElement('div');
  mobileRegion.className = 'pipeline-card-region-mobile mobile-element';
  const regionItem = document.createElement('div');
  regionItem.className = 'pipeline-region-item';
  const mobileRegionLabel = document.createElement('span');
  mobileRegionLabel.className = 'pipeline-region-label';
  mobileRegionLabel.textContent = region;
  const mobileStatus = document.createElement('span');
  mobileStatus.className = `pipeline-card-status ${phase}`;
  mobileStatus.textContent = status;
  regionItem.append(mobileRegionLabel, mobileStatus);
  const mobileBar = buildPhaseBar(phase);
  mobileRegion.append(regionItem, mobileBar);

  // Desktop: phase bar + status (hidden on mobile)
  const desktopPhase = document.createElement('div');
  desktopPhase.className = 'pipeline-card-phase-desktop desktop-element';
  const barEl = buildPhaseBar(phase);
  const statusEl = document.createElement('span');
  statusEl.className = `pipeline-card-status ${phase} desktop-element`;
  statusEl.textContent = status;
  desktopPhase.append(barEl, statusEl);

  row.append(indicationEl, regionEl, mobileRegion, desktopPhase);
  return row;
}

function buildCard(config, data = {}) {
  const {
    id: cardId = 'asset-1',
    title: cardTitle = 'Asset Name',
    type = '-',
    chips = [],
    target = '—',
    moleculeType = '—',
    pronunciation = '_',
    pronunciationAudio = '',
    description = '',
    indications = [],
  } = data;

  const card = document.createElement('div');
  card.className = 'pipeline-card';
  card.id = cardId;
  card.setAttribute('data-type', type);

  // Metadata container (left column on desktop)
  const metadata = document.createElement('div');
  metadata.className = 'pipeline-card-metadata';

  // Title + mobile collapse button
  const headerRow = document.createElement('div');
  headerRow.className = 'pipeline-card-header-row';

  const titleEl = document.createElement('span');
  titleEl.className = 'pipeline-card-title';
  titleEl.setAttribute('role', 'heading');
  titleEl.setAttribute('aria-level', '3');
  titleEl.textContent = cardTitle;

  // Mobile collapse button (visible on mobile/tablet only)
  const mobileCollapseBtn = document.createElement('button');
  mobileCollapseBtn.type = 'button';
  mobileCollapseBtn.className = 'pipeline-card-collapse mobile-element';
  mobileCollapseBtn.setAttribute('aria-expanded', 'false');
  mobileCollapseBtn.setAttribute('aria-label', 'Product details');
  // mobileCollapseBtn.textContent = '+';

  headerRow.append(titleEl, mobileCollapseBtn);

  // Tags
  const tags = document.createElement('div');
  tags.className = 'pipeline-card-tags';
  chips.forEach((chipText) => {
    const chip = document.createElement('span');
    const isType = chipText.toLowerCase() === 'pharmaceutical' || chipText.toLowerCase() === 'device';
    chip.className = `pipeline-card-chip${chipText.toLowerCase() === 'device' ? ' device-chip' : ''}${!isType ? ' generic-chip' : ''}`;
    chip.textContent = chipText;
    tags.append(chip);
  });

  // Share button (expandable — hidden in collapsed state)
  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'pipeline-card-share pipeline-expandable';
  shareBtn.setAttribute('aria-label', config.shareText || '');
  const shareIcon = buildIcon(
    config.shareIconType,
    config.shareFontIcon,
    config.shareImageIcon,
    'pipeline-card-share-icon',
  );
  if (shareIcon) shareBtn.append(shareIcon);
  const shareLabelText = document.createTextNode(config.shareText || '');
  shareBtn.append(shareLabelText);

  const shareTooltip = document.createElement('span');
  shareTooltip.className = 'pipeline-share-tooltip';
  shareTooltip.id = `pipeline-tooltip-${cardId}`;
  shareTooltip.setAttribute('role', 'status');
  const tooltipBaseText = document.createElement('span');
  tooltipBaseText.id = `pipeline-tooltip-base-text-${cardId}`;
  tooltipBaseText.className = 'tooltip-show';
  tooltipBaseText.textContent = 'click to copy';
  const tooltipResultText = document.createElement('span');
  tooltipResultText.id = `pipeline-tooltip-result-text-${cardId}`;
  tooltipResultText.className = 'tooltip-hide';
  tooltipResultText.textContent = config.shareConfirm || 'Link copied';
  shareTooltip.append(tooltipBaseText, tooltipResultText);
  shareBtn.append(shareTooltip);

  shareBtn.addEventListener('click', () => {
    const url = `${window.location.origin}${window.location.pathname}#${cardId}`;
    navigator.clipboard.writeText(url).then(() => {
      tooltipBaseText.className = 'tooltip-hide';
      tooltipResultText.className = 'tooltip-show';
      setTimeout(() => {
        tooltipBaseText.className = 'tooltip-show';
        tooltipResultText.className = 'tooltip-hide';
      }, 2000);
    });
  });

  // Complementary info (expandable — hidden in collapsed state)
  const compInfo = document.createElement('div');
  compInfo.className = 'pipeline-card-comp-info pipeline-expandable';

  const targetInfo = document.createElement('div');
  targetInfo.className = 'pipeline-card-comp-item';
  targetInfo.innerHTML = `<span class="pipeline-comp-title">${config.targetHeader || ''}</span><span class="pipeline-comp-value">${target}</span>`;

  const moleculeInfo = document.createElement('div');
  moleculeInfo.className = 'pipeline-card-comp-item';
  moleculeInfo.innerHTML = `<span class="pipeline-comp-title">${config.moleculeHeader || ''}</span><span class="pipeline-comp-value">${moleculeType}</span>`;

  const pronunciationInfo = document.createElement('div');
  pronunciationInfo.className = 'pipeline-card-comp-item pipeline-card-pronunciation';
  const pronunciationTitle = document.createElement('span');
  pronunciationTitle.className = 'pipeline-comp-title';
  pronunciationTitle.textContent = config.pronunciationHeader || '';
  const pronunciationBtn = document.createElement('button');
  pronunciationBtn.type = 'button';
  pronunciationBtn.className = 'pipeline-comp-value pipeline-speaker-btn';
  pronunciationBtn.setAttribute('aria-label', 'Play pronunciation');
  if (pronunciationAudio) {
    pronunciationBtn.setAttribute('data-audio', pronunciationAudio);
  }
  pronunciationBtn.textContent = pronunciation;
  const speakerIcon = buildIcon(
    config.speakerIconType,
    config.speakerFontIcon,
    config.speakerImageIcon,
    'pipeline-speaker-icon',
  );
  if (speakerIcon) pronunciationBtn.append(speakerIcon);
  pronunciationBtn.addEventListener('click', () => {
    const audioSrc = pronunciationBtn.getAttribute('data-audio');
    if (!audioSrc) return;
    const audio = new Audio(audioSrc);
    audio.play();
  });
  pronunciationInfo.append(pronunciationTitle, pronunciationBtn);

  compInfo.append(targetInfo, moleculeInfo);

  if (pronunciation) {
    compInfo.append(pronunciationInfo);
  }

  metadata.append(headerRow, tags, shareBtn);

  // Mobile description (visible on mobile/tablet only, expandable)
  if (description) {
    const mobileDesc = document.createElement('div');
    mobileDesc.className = 'pipeline-card-description-mobile mobile-element pipeline-expandable';
    const mobileDescP = document.createElement('p');
    mobileDescP.textContent = description;
    mobileDesc.append(mobileDescP);
    metadata.append(mobileDesc);
  }

  metadata.append(compInfo);

  // Info container (middle column on desktop)
  const infoContainer = document.createElement('div');
  infoContainer.className = 'pipeline-card-info';

  // Description (expandable — hidden in collapsed state)
  if (description) {
    const descEl = document.createElement('p');
    descEl.className = 'pipeline-card-description pipeline-expandable';
    descEl.textContent = description;
    infoContainer.append(descEl);
  }

  // Phases section
  const phasesSection = document.createElement('div');
  phasesSection.className = 'pipeline-card-phases';

  // Phase headers
  const phaseHeaders = document.createElement('div');
  phaseHeaders.className = 'pipeline-card-phase-headers';

  const col1 = document.createElement('span');
  col1.className = 'pipeline-phase-header';
  col1.textContent = config.col1Header || '';

  const col2 = document.createElement('span');
  col2.className = 'pipeline-phase-header region desktop-element';
  col2.textContent = config.col2Header || '';

  // Desktop: Phase 1/2/3 + Status column headers (hidden on mobile)
  const col3Container = document.createElement('div');
  col3Container.className = 'pipeline-phase-header-phases desktop-element';
  const phaseLabels = type === 'device'
    ? [config.deviceCol3 || '', config.deviceCol4 || '', config.deviceCol5 || '']
    : [config.pharmaCol3 || '', config.pharmaCol4 || '', config.pharmaCol5 || ''];
  phaseLabels.forEach((label) => {
    const span = document.createElement('span');
    span.className = 'pipeline-phase-label';
    span.textContent = label;
    col3Container.append(span);
  });

  const col6Desktop = document.createElement('span');
  col6Desktop.className = 'pipeline-phase-header pipeline-status-header';
  const statusText = type === 'devices'
    ? (config.deviceCol6 || '')
    : (config.pharmaCol6 || '');
  col6Desktop.textContent = statusText;
  const tipText = type === 'devices' ? config.deviceCol6Tip : config.pharmaCol6Tip;
  if (tipText) col6Desktop.append(buildTooltip(tipText));
  col3Container.append(col6Desktop);

  // Mobile: Status header only (visible on mobile/tablet)
  const col6Mobile = document.createElement('span');
  col6Mobile.className = 'pipeline-phase-header pipeline-status-header mobile-element';
  col6Mobile.textContent = statusText;
  if (tipText) col6Mobile.append(buildTooltip(tipText));

  phaseHeaders.append(col1, col2, col3Container, col6Mobile);
  phasesSection.append(phaseHeaders);

  // Indication data rows
  indications.forEach((item) => {
    phasesSection.append(buildIndicationRow(item.indication, item.region, item.phase, item.status));
  });

  infoContainer.append(phasesSection);

  // Collapse container (right column on desktop)
  const collapseContainer = document.createElement('div');
  collapseContainer.className = 'pipeline-card-collapse-container desktop-element';
  const collapseBtn = document.createElement('button');
  collapseBtn.type = 'button';
  collapseBtn.className = 'pipeline-card-collapse';
  collapseBtn.setAttribute('aria-expanded', 'false');
  collapseBtn.setAttribute('aria-label', 'Product details');
  // collapseBtn.textContent = '+';
  collapseContainer.append(collapseBtn);

  // Toggle function shared by both desktop and mobile collapse buttons
  function toggleCard() {
    const expanded = card.classList.toggle('expanded');
    collapseBtn.setAttribute('aria-expanded', String(expanded));
    collapseBtn.classList.toggle('expanded', expanded);
    mobileCollapseBtn.setAttribute('aria-expanded', String(expanded));
    mobileCollapseBtn.classList.toggle('expanded', expanded);
  }

  collapseBtn.addEventListener('click', toggleCard);
  mobileCollapseBtn.addEventListener('click', toggleCard);

  card.append(metadata, infoContainer, collapseContainer);
  return card;
}

const TAGS_STORAGE_KEY = 'pipeline-tags';

/**
 * Fetch tags.json — uses sessionStorage cache to avoid repeated calls.
 * @returns {Promise<Array>} Array of { tag, title } objects
 */
async function fetchTags() {
  const cached = sessionStorage.getItem(TAGS_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      sessionStorage.removeItem(TAGS_STORAGE_KEY);
    }
  }

  try {
    const resp = await fetch('/tags.json');
    if (!resp.ok) return [];
    const json = await resp.json();
    const tags = json.data || [];
    sessionStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
    return tags;
  } catch (e) {
    return [];
  }
}

function transformPipelineData(pharmaData, deviceData, tagsData) {
  const pharmaItems = pharmaData.data.pipelinePharmaceuticalFragmentList.items;
  const deviceItems = deviceData.data.pipelineDeviceFragmentList.items;

  // Create tag -> title map
  const tagMap = {};
  tagsData.forEach((tag) => {
    tagMap[tag.tag] = tag.title;
  });

  const groupedData = {};

  // Helper function
  const addToGroup = (therapyAreas, card) => {
    therapyAreas?.forEach((area) => {
      const section = tagMap[area] || area.split('/').pop();

      if (!groupedData[section]) {
        groupedData[section] = {
          section,
          cards: [],
        };
      }

      groupedData[section].cards.push(card);
    });
  };

  // Pharmaceutical data
  pharmaItems.forEach((item) => {
    // if (item.moleculeAssetIndicationReference.length > 0) {
    const indications = [];

    (item.moleculeAssetIndicationReference || []).forEach((ref) => {
      const indication = tagMap[ref.moleculeAssetIndicationSingleTag?.[0]] || '';

      (ref.moleculeAssetIndicationMultiTags || []).forEach((tagStr) => {
        const parsed = JSON.parse(tagStr);

        const regionTags = JSON.parse(parsed.moleculeAssetRegionTag || '[]');
        const phaseTag = JSON.parse(parsed.moleculeAssetPhaseTag || '[]')[0];

        const region = regionTags
          .map((tag) => tagMap[tag] || tag)
          .join(', ');

        indications.push({
          indication,
          region: region || 'N/A',
          phase: tagMap[phaseTag].toLowerCase().replace(/\s+/g, '') || '',
          status: tagMap[phaseTag] || '',
        });
      });
    });

    const card = {
      id: item.moleculeAssetId || item.title.toLowerCase().replace(/\s+/g, '-'),
      title: item.brandedName || item.title,
      type: 'molecule',
      chips: (item.moleculeAssetLabels || item.moleculeAssetLabelsDefault || []).map(
        (label) => tagMap[label] || label.split('/').pop(),
      ),
      target: (item.moleculeAssetTargets || [])
        .map((target) => tagMap[target] || target.split('/').pop())
        .join(', '),
      moleculeType: (item.moleculeAssetType || [])
        .map((type) => tagMap[type] || type.split('/').pop())
        .join(', '),
      pronunciation: item.moleculeAssetNamePronunciationName,
      // eslint-disable-next-line no-underscore-dangle
      pronunciationAudio: item.moleculeAssetNamePronunciationAsset?._path || '',
      description: item.description,
      indications,
    };

    addToGroup(item.moleculeAssetTherapyAreas, card);
    // }
  });

  // Device data
  deviceItems.forEach((item) => {
    // if (item.deviceAssetIndicationReference.length > 0) {
    const indications = [];

    (item.deviceAssetIndicationReference || []).forEach((ref) => {
      const indication = tagMap[ref.deviceAssetIndicationSingleTag?.[0]] || '';

      (ref.deviceAssetIndicationMultiTags || []).forEach((tagStr) => {
        const parsed = JSON.parse(tagStr);

        const regionTags = JSON.parse(parsed.deviceAssetRegionTag || '[]');
        const phaseTag = JSON.parse(parsed.deviceAssetPhaseTag || '[]')[0];

        const region = regionTags
          .map((tag) => tagMap[tag] || tag)
          .join(', ');

        indications.push({
          indication,
          region: region || 'N/A',
          phase: tagMap[phaseTag].toLowerCase().replace(/\s+/g, '') || '',
          status: tagMap[phaseTag] || '',
        });
      });
    });

    const card = {
      id: item.deviceAssetId || item.title.toLowerCase().replace(/\s+/g, '-'),
      title: item.brandedName || item.title,
      type: 'device',
      chips: (item.deviceAssetLabels || item.deviceAssetLabelsDefault || []).map(
        (label) => tagMap[label] || label.split('/').pop(),
      ),
      target: (item.deviceAssetTargets || [])
        .map((target) => tagMap[target] || target.split('/').pop())
        .join(', '),
      moleculeType: (item.deviceAssetType || [])
        .map((type) => tagMap[type] || type.split('/').pop())
        .join(', '),
      pronunciation: item.deviceAssetNamePronunciationName,
      // eslint-disable-next-line no-underscore-dangle
      pronunciationAudio: item.deviceAssetNamePronunciationAsset?._path || '',
      description: item.description,
      indications,
    };

    addToGroup(item.deviceAssetTherapyAreas, card);
    // }
  });

  return Object.values(groupedData);
}

export default async function decorate(block) {
  applyCommonProps(block, 23);
  const tags = await fetchTags();
  const rows = [...block.children];

  // Detect icon types from framework classes
  let shareIconType = 'share-no-icon';
  if (block.classList.contains('share-image')) shareIconType = 'share-image';
  else if (block.classList.contains('share-icon-font')) shareIconType = 'share-icon-font';

  let speakerIconType = 'speaker-no-icon';
  if (block.classList.contains('speaker-image')) speakerIconType = 'speaker-image';
  else if (block.classList.contains('speaker-icon-font')) speakerIconType = 'speaker-icon-font';

  const config = {
    shareText: getCellText(rows[ROW.SHARE_TEXT]),
    shareConfirm: getCellText(rows[ROW.SHARE_CONFIRM]),
    targetHeader: getCellText(rows[ROW.TARGET_HEADER]),
    moleculeHeader: getCellText(rows[ROW.MOLECULE_HEADER]),
    pronunciationHeader: getCellText(rows[ROW.PRONUNCIATION_HEADER]),
    col1Header: getCellText(rows[ROW.COL1_HEADER]),
    col2Header: getCellText(rows[ROW.COL2_HEADER]),
    pharmaCol3: getCellText(rows[ROW.PHARMA_COL3]),
    pharmaCol4: getCellText(rows[ROW.PHARMA_COL4]),
    pharmaCol5: getCellText(rows[ROW.PHARMA_COL5]),
    pharmaCol6: getCellText(rows[ROW.PHARMA_COL6]),
    pharmaCol6Tip: getCellText(rows[ROW.PHARMA_COL6_TIP]),
    deviceCol3: getCellText(rows[ROW.DEVICE_COL3]),
    deviceCol4: getCellText(rows[ROW.DEVICE_COL4]),
    deviceCol5: getCellText(rows[ROW.DEVICE_COL5]),
    deviceCol6: getCellText(rows[ROW.DEVICE_COL6]),
    deviceCol6Tip: getCellText(rows[ROW.DEVICE_COL6_TIP]),
    shareFontIcon: getCellText(rows[ROW.SHARE_FONT_ICON]),
    shareImageIcon: getCellImage(rows[ROW.SHARE_IMAGE_ICON]),
    speakerFontIcon: getCellText(rows[ROW.SPEAKER_FONT_ICON]),
    speakerImageIcon: getCellImage(rows[ROW.SPEAKER_IMAGE_ICON]),
    noResultsHeadline: getCellText(rows[ROW.NO_RESULTS_HEADLINE]),
    noResultsSubheading: getCellText(rows[ROW.NO_RESULTS_SUBHEADING]),
    shareIconType,
    speakerIconType,
  };

  block.textContent = '';

  // Build pipeline container
  const container = document.createElement('div');
  container.className = 'pipeline-container';

  const noResults = buildNoResults(config);
  container.append(noResults);
  block.append(container);

  // Store all card data for re-rendering on filter/search/sort
  let allGroupedData = [];

  function matchesCard(cardData, section, query, activeFilters) {
    const searchable = [
      cardData.title,
      cardData.chips.join(' '),
      cardData.target,
      cardData.moleculeType,
      cardData.pronunciation,
      cardData.description,
      cardData.indications.map((ind) => `${ind.indication} ${ind.region} ${ind.status}`).join(' '),
    ].join(' ').toLowerCase();

    const matchesSearch = !query || searchable.includes(query);

    let matchesFilter = true;
    if (activeFilters.length > 0) {
      const cardFilterable = [
        section,
        ...cardData.chips,
        cardData.type === 'molecule' ? 'pharmaceutical' : cardData.type,
        cardData.moleculeType,
        ...cardData.indications.map((ind) => ind.status),
        ...cardData.indications.map((ind) => ind.phase),
        ...cardData.indications.map((ind) => ind.indication),
      ].map((v) => (v || '').toLowerCase());
      matchesFilter = activeFilters.some((f) => cardFilterable.some((v) => v.includes(f)));
    }

    return matchesSearch && matchesFilter;
  }

  function renderCards(query, activeFilters, sortBy) {
    [...container.querySelectorAll('.pipeline-section-header, .pipeline-card')].forEach((el) => el.remove());

    const cardsToRender = [];

    if (sortBy === 'alphabetical') {
      allGroupedData.forEach(({ section, cards }) => {
        cards.forEach((cardData) => {
          if (matchesCard(cardData, section, query, activeFilters)) {
            cardsToRender.push({ ...cardData, section });
          }
        });
      });
      cardsToRender.sort((a, b) => a.title.localeCompare(b.title));
      cardsToRender.forEach((cardData) => {
        container.append(buildCard(config, cardData));
      });
    } else {
      allGroupedData.forEach(({ section, cards }) => {
        const filtered = cards.filter(
          (cardData) => matchesCard(cardData, section, query, activeFilters),
        );
        if (filtered.length > 0) {
          const sectionHeader = document.createElement('h3');
          sectionHeader.className = 'pipeline-section-header';
          sectionHeader.id = `${section.toLowerCase().replace(/\s+/g, '-')}_header`;
          sectionHeader.textContent = section;
          container.append(sectionHeader);
          filtered.forEach((cardData) => {
            container.append(buildCard(config, cardData));
          });
          cardsToRender.push(...filtered);
        }
      });
    }

    noResults.hidden = cardsToRender.length > 0;
  }

  // Fetch CF data
  try {
    const pharmaceutical = await fetchDashboardCardData(
      '/content/dam/corporate/abbvie-com2/pipeline/pharmaceutical',
      'cfPipelinePharmaBaseUrl',
    );

    const devices = await fetchDashboardCardData(
      '',
      'cfPipelineDeviceBaseUrl',
    );
    const result = transformPipelineData(
      pharmaceutical,
      devices,
      tags,
    );
    allGroupedData = result;
    renderCards('', [], 'focus-area');
  } catch (e) {
    // GraphQL fetch failed, try model.json fallback
  }

  // Listen for pipeline-filter events from pipeline-utility-nav
  document.addEventListener('pipeline-filter', (e) => {
    const { searchQuery = '', filters = [], sortBy = 'focus-area' } = e.detail || {};
    const query = searchQuery.toLowerCase().trim();
    const activeFilters = filters.map((f) => f.toLowerCase());
    renderCards(query, activeFilters, sortBy);
  });
}
