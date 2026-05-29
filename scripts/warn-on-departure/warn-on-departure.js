import { loadDomainConfigWithCache, shouldShowModal } from './domain-config.js';
import resolveModalPath from './modal-resolver.js';
import { getMetadata } from '../aem.js';

function navigate(anchor, destination) {
  if (anchor.target === '_blank') {
    window.open(destination, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = destination;
  }
}

async function showDepartureModal(anchor, destination) {
  let fragmentPath;
  try {
    fragmentPath = await resolveModalPath(anchor);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[WarnOnDeparture] resolveModalPath failed — navigating without modal:', err);
    navigate(anchor, destination);
    return;
  }

  if (!fragmentPath) {
    navigate(anchor, destination);
    return;
  }

  try {
    const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
    openModal(fragmentPath, destination, { focusOnClose: anchor, modalType: 'departure', newTab: anchor.target === '_blank' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[WarnOnDeparture] Modal failed to open — navigating anyway:', err);
    navigate(anchor, destination);
  }
}

export default async function initWarnOnDeparture(anchor) {
  const country = getMetadata('country') || 'us';
  const language = getMetadata('language') || 'en';
  let config;
  try {
    config = await loadDomainConfigWithCache(country, language);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[WarnOnDeparture] Failed to load domain config — feature inactive:', err);
    return;
  }

  if (!config.allowedDomains.length && !config.reverseMapping) {
    // eslint-disable-next-line no-console
    console.debug('[WarnOnDeparture] No domains configured and reverseMapping=false — feature inactive.');
    navigate(anchor, anchor.href);
    return;
  }

  if (shouldShowModal(anchor.href, config)) {
    showDepartureModal(anchor, anchor.href);
  } else {
    navigate(anchor, anchor.href);
  }
}
