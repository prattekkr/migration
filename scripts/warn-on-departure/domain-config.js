/**
 * domain-config.js
 * ─────────────────
 * Fetches the domain configuration spreadsheet for the current locale
 * from the EDS CDN and exposes shouldShowModal() to evaluate a URL.
 *
 * Cache strategy (sessionStorage + Last-Modified from GET response):
 *
 *   First visit (no cache):
 *     → Full GET fetch
 *     → Store { lastModified, config } in sessionStorage
 *
 *   Subsequent visits (cache exists):
 *     → Full GET fetch with If-Modified-Since header
 *     → 304 Not Modified → return cached config (no parse needed)
 *     → 200 OK           → parse fresh config, update sessionStorage
 *     → Fetch error      → fall back to cached config if available
 *
 * Why not HEAD request:
 *   EDS CDN may not expose Last-Modified via CORS for HEAD requests.
 *   GET with If-Modified-Since is more reliable and widely supported.
 *   Browser also handles 304 caching natively.
 *
 * AEM spreadsheet path:
 *   /content/abbvie-nextgen-eds/abbvie-com/{country}/{language}/modal-config/warn-on-departure
 *
 * CDN JSON endpoint:
 *   Default (us/en): /modal-config/warn-on-departure.json
 *   Other locales:   /{country}/{language}/modal-config/warn-on-departure.json
 *
 * Spreadsheet columns:
 *   allowedDomains → e.g. humira.com (no protocol, no trailing slash)
 *   reverseMapping → true/false (first row only, blank on all other rows)
 *
 * Test matrix:
 *
 * ┌─────────────────────────────────────────┬──────────────────┬──────────────────┐
 * │ Scenario                                │ Standard (false) │ Reverse (true)   │
 * ├─────────────────────────────────────────┼──────────────────┼──────────────────┤
 * │ Internal link                           │ No modal         │ No modal         │
 * │ External: humira.com (IN list)          │ SHOW modal       │ No modal         │
 * │ External: unknown-site.com (NOT in list)│ No modal         │ SHOW modal       │
 * │ Non-http (mailto:, tel:)                │ No modal         │ No modal         │
 * │ data-warn-departure-skip on link        │ No modal         │ No modal         │
 * └─────────────────────────────────────────┴──────────────────┴──────────────────┘
 */

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const DEFAULT_COUNTRY = 'us';
const DEFAULT_LANGUAGE = 'en';
const CACHE_KEY_PREFIX = 'warn-departure-config';

function buildConfigUrl(country, language) {
  const isDefault = country === DEFAULT_COUNTRY && language === DEFAULT_LANGUAGE;
  if (isDefault) {
    return '/modal-config/warn-on-departure.json';
  }
  return `/${country}/${language}/modal-config/warn-on-departure.json`;
}

function getCacheKey(country, language) {
  return `${CACHE_KEY_PREFIX}-${country}-${language}`;
}

function readCache(cacheKey) {
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // sessionStorage unavailable or parse failed
  }
  return null;
}

function writeCache(cacheKey, lastModified, config) {
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ lastModified, config }));
    // eslint-disable-next-line no-console
    console.debug('[domain-config] Domain config cached. lastModified:', lastModified);
  } catch {
    // Quota exceeded — config still usable in memory
  }
}

function parseRows(rows) {
  const allowedDomains = rows
    .map((row) => (row.allowedDomains || '').trim().toLowerCase().replace(/^www\./, ''))
    .filter(Boolean);
  const reverseMapping = (rows[0]?.reverseMapping || '').toLowerCase() === 'true';
  return { allowedDomains, reverseMapping };
}

export async function loadDomainConfigWithCache(country, language) {
  const url = buildConfigUrl(country, language);
  const cacheKey = getCacheKey(country, language);

  // ── Read existing cache ──
  const cached = readCache(cacheKey);

  let resp;
  try {
    resp = await fetch(url, {
      headers: cached?.lastModified
        ? { 'If-Modified-Since': cached.lastModified }
        : {},
    });
  } catch (err) {
    // Network error — use cache if available, else throw
    if (cached?.config) {
      // eslint-disable-next-line no-console
      console.warn('[domain-config] Fetch failed — using cached config:', err.message);
      return cached.config;
    }
    throw new Error(`[domain-config] Network error and no cache available: ${err.message}`);
  }

  // ── 304 Not Modified — cache is still fresh ──
  if (resp.status === 304) {
    // eslint-disable-next-line no-console
    console.debug('[domain-config] Domain config not modified — using sessionStorage cache.');
    return cached.config;
  }

  // ── Non-200 response ──
  if (!resp.ok) {
    // Use cache as fallback if available
    if (cached?.config) {
      // eslint-disable-next-line no-console
      console.warn(`[domain-config] Fetch returned ${resp.status} — using cached config.`);
      return cached.config;
    }
    throw new Error(`[domain-config] Domain config not found at ${url} (HTTP ${resp.status})`);
  }

  // ── 200 OK — parse fresh response ──
  let json;
  try {
    json = await resp.json();
  } catch (err) {
    throw new Error(`[domain-config] Failed to parse domain config JSON: ${err.message}`);
  }

  const rows = json.data || [];
  if (!rows.length) {
    // eslint-disable-next-line no-console
    console.warn(`[domain-config] Spreadsheet at ${url} has no rows.`);
  }

  const config = parseRows(rows);

  // ── Update cache with new Last-Modified ──
  const lastModified = resp.headers.get('last-modified');
  writeCache(cacheKey, lastModified, config);

  // eslint-disable-next-line no-console
  console.debug('[domain-config] Fresh domain config loaded:', config.allowedDomains);

  return config;
}

/**
 * Checks if a destination URL should trigger the departure modal.
 *
 * @param {string} href     full destination URL
 * @param {{ allowedDomains: string[], reverseMapping: boolean }} config
 * @returns {boolean} true = show modal, false = allow navigation
 */
export function shouldShowModal(href, config) {
  if (!config || !Array.isArray(config.allowedDomains)) {
    // eslint-disable-next-line no-console
    console.warn('[domain-config] shouldShowModal called with invalid config.');
    return false;
  }

  let hostname;
  try {
    hostname = new URL(href).hostname.toLowerCase();
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`[domain-config] Could not parse URL: ${href}`);
    return false;
  }

  const normalised = hostname.replace(/^www\./, '');

  // allowedDomains are pre-normalized in parseRows — no per-call replace needed
  const isInList = config.allowedDomains.some(
    (domain) => normalised === domain || normalised.endsWith(`.${domain}`),
  );

  return config.reverseMapping ? !isInList : isInList;
}
