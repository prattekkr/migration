// Orchestrator for the Warn on Arrival feature.

import { getMetadata } from '../aem.js';

export default async function initWarnOnArrival() {
  const fragmentPath = getMetadata('warnarrivalmodalpath');

  if (!fragmentPath) {
    return;
  }

  try {
    const { openModal } = await import(
      `${window.hlx.codeBasePath}/blocks/modal/modal.js`
    );
    openModal(fragmentPath, null, { modalType: 'arrival' });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[WarnOnArrival] Modal failed to load — skipping:', err);
  }
}
