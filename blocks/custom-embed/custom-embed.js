import { applyCommonProps } from '../../scripts/utils.js';

/*
 * Row indices — must match the field order in _custom-embed.json
 * (tabs are skipped; they do not render as rows):
 *
 *  0 embeddable                   select
 *  1 oneTrustId                   text       (conditional: embeddable=oneTrust)
 *  2 oneTrustScriptSettings       text       (conditional: embeddable=oneTrust)
 *  3 oneTrustLoadNotice           text       (conditional: embeddable=oneTrust)
 *  4 jobPixleWidgetCode           text       (conditional: embeddable=jobPixle)
 *  5 toolSelector                 select     (conditional: embeddable=toolSelector)
 *  6 podcastDataAttributes        container  (conditional: embeddable=podcast, multi)
 *  7 wallsioDataAttributes        container  (conditional: embeddable=wallsio, multi)
 *  --- common props (from _common-properties.json) ---
 *  8  blockId                     text
 *  9  language                    select
 *  10 analyticsId                 text
 */
const ROW = {
  EMBEDDABLE: 0,
  ONETRUST_ID: 1,
  ONETRUST_SCRIPT_SETTINGS: 2,
  ONETRUST_LOAD_NOTICE: 3,
  JOB_PIXLE_WIDGET_CODE: 4,
  TOOL_SELECTOR: 5,
  PODCAST_DATA_ATTRIBUTES: 6,
  WALLSIO_DATA_ATTRIBUTES: 7,
};

const COMMON_PROPS_START = 8;

function getCellText(row) {
  return row?.firstElementChild?.textContent?.trim() || '';
}

function getCellLink(row) {
  const a = row?.querySelector('a');
  return a?.href || getCellText(row);
}

function getParaValue(p) {
  const link = p.querySelector('a');
  return link?.href || p.textContent.trim();
}

function parseKeyValuePairs(row) {
  if (!row) return [];
  const cell = row.firstElementChild;
  if (!cell) return [];

  const hrs = cell.querySelectorAll('hr');
  if (hrs.length === 0) return [];

  const allElements = [...cell.querySelectorAll('hr, p')];
  const pairs = [];
  let i = 0;

  while (i < allElements.length) {
    if (allElements[i].tagName === 'HR') {
      const keyEl = allElements[i + 1];
      const valEl = allElements[i + 2];
      if (keyEl?.tagName === 'P' && valEl?.tagName === 'P') {
        pairs.push({ key: keyEl.textContent.trim(), value: getParaValue(valEl) });
        i += 3;
      } else {
        i += 1;
      }
    } else {
      i += 1;
    }
  }

  return pairs;
}

function getConfig(block) {
  const rows = [...block.children];
  return {
    embeddable: getCellText(rows[ROW.EMBEDDABLE]),
    oneTrustId: getCellText(rows[ROW.ONETRUST_ID]),
    oneTrustScriptSettings: getCellText(rows[ROW.ONETRUST_SCRIPT_SETTINGS]),
    oneTrustLoadNotice: getCellLink(rows[ROW.ONETRUST_LOAD_NOTICE]),
    podcastDataAttributes: parseKeyValuePairs(rows[ROW.PODCAST_DATA_ATTRIBUTES]),
    wallsioDataAttributes: parseKeyValuePairs(rows[ROW.WALLSIO_DATA_ATTRIBUTES]),
    jobPixleWidgetCode: getCellText(rows[ROW.JOB_PIXLE_WIDGET_CODE]),
    toolSelector: getCellText(rows[ROW.TOOL_SELECTOR]),
  };
}

function decorateOneTrust(block, config) {
  const noticeId = config.oneTrustId;
  const settings = config.oneTrustScriptSettings;
  const loadNoticeUrl = config.oneTrustLoadNotice;

  if (!noticeId) return;

  block.textContent = '';

  const noticeDiv = document.createElement('div');
  noticeDiv.id = noticeId;
  noticeDiv.className = 'otnotice';
  block.append(noticeDiv);

  const script = document.createElement('script');
  script.src = 'https://privacyportal-cdn.onetrust.com/privacy-notice-scripts/otnotice-1.0.min.js';
  script.type = 'text/javascript';
  script.charset = 'UTF-8';
  script.id = 'otprivacy-notice-script';
  if (settings) script.setAttribute('data-settings', settings);

  script.onload = () => {
    if (window.OneTrust?.NoticeApi?.Initialized) {
      window.OneTrust.NoticeApi.Initialized.then(() => {
        window.OneTrust.NoticeApi.LoadNotices([loadNoticeUrl]);
      });
    }
  };

  block.append(script);
}

function decoratePodcast(block, config) {
  const pairs = config.podcastDataAttributes;
  if (!pairs.length) return;

  block.textContent = '';

  let scriptSrc = '';
  const iframe = document.createElement('iframe');

  pairs.forEach(({ key, value }) => {
    if (key === 'script_src') {
      scriptSrc = value;
    } else {
      iframe.setAttribute(key, value);
    }
  });

  if (!iframe.hasAttribute('frameBorder')) iframe.setAttribute('frameBorder', '0');
  if (!iframe.hasAttribute('width')) iframe.setAttribute('width', '100%');

  block.append(iframe);

  if (scriptSrc) {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.type = 'text/javascript';
    block.append(script);
  }
}

function decorateWallsio(block, config) {
  const pairs = config.wallsioDataAttributes;
  if (!pairs.length) return;

  block.textContent = '';

  const script = document.createElement('script');
  script.src = 'https://walls.io/js/wallsio-widget-1.2.js';
  script.async = true;

  pairs.forEach(({ key, value }) => {
    script.setAttribute(key, value);
  });

  block.append(script);
}

function decorateJobPixle(block, config) {
  const widgetCode = config.jobPixleWidgetCode;
  if (!widgetCode) return;

  block.textContent = '';

  const target = document.createElement('div');
  target.id = `jp-widget-inline-${widgetCode}`;
  target.className = 'jp-widget-container';
  block.append(target);

  const swiperStylesCss = document.createElement('link');
  swiperStylesCss.rel = 'stylesheet';
  swiperStylesCss.href = 'https://public-assets.jobpixel.com/app/swiper-styles.css';
  document.head.append(swiperStylesCss);

  const swiper = document.createElement('script');
  swiper.src = 'https://public-assets.jobpixel.com/app/swiper-bundle.min.js';
  swiper.type = 'text/javascript';

  const widget = document.createElement('script');
  widget.src = `https://www.jobpixel.com/widgets/floating-cta-carousel.min.js?widget_code=${encodeURIComponent(widgetCode)}`;
  widget.type = 'text/javascript';

  swiper.onload = () => block.append(widget);
  block.append(swiper);
}

function decorateToolSelector(block, config) {
  const tool = config.toolSelector || 'ibd-disk';

  block.textContent = '';

  const container = document.createElement('div');
  container.id = 'wqt-iframe-container';

  const iframe = document.createElement('iframe');
  iframe.id = 'wqt-iframe';
  iframe.src = `https://www.diseasecheck.com/abbvie-co/${tool}/`;
  iframe.title = tool;
  iframe.style.width = '100%';
  iframe.style.height = '560px';
  iframe.style.border = '0';
  iframe.style.overflow = 'hidden';
  iframe.scrolling = 'no';

  window.addEventListener('message', (e) => {
    if (e.source !== iframe.contentWindow) return;
    let height;
    if (typeof e.data === 'string') {
      try {
        const parsed = JSON.parse(e.data);
        height = parsed.height || parsed.frameHeight;
      } catch { /* not JSON */ }
      if (!height && /^\d+$/.test(e.data)) height = parseInt(e.data, 10);
    } else if (typeof e.data === 'number') {
      height = e.data;
    } else if (e.data?.height) {
      height = e.data.height;
    }
    if (height && height > 0) iframe.style.height = `${height}px`;
  });

  const iframeResizerScript = document.createElement('script');
  iframeResizerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.11/iframeResizer.min.js';
  iframeResizerScript.onload = () => {
    if (window.iFrameResize) window.iFrameResize({ log: false }, `#${iframe.id}`);
  };
  document.head.append(iframeResizerScript);

  container.append(iframe);
  block.append(container);
}

export default function decorate(block) {
  const config = getConfig(block);

  applyCommonProps(block, COMMON_PROPS_START);

  switch (config.embeddable) {
    case 'oneTrust':
      decorateOneTrust(block, config);
      break;
    case 'podcast':
      decoratePodcast(block, config);
      break;
    case 'wallsio':
      decorateWallsio(block, config);
      break;
    case 'jobPixle':
      decorateJobPixle(block, config);
      break;
    case 'toolSelector':
      decorateToolSelector(block, config);
      break;
    default:
      break;
  }
}
