import { getMetadata } from '../aem.js';

export default async function resolveModalPath(anchor) {
  // ── Tier 1: Block-level override (highest priority) ──
  const blocklevelModalPath = anchor.dataset.warnDepartureModalPath;
  if (blocklevelModalPath) {
    return blocklevelModalPath;
  }

  // ── Tier 2 & 3 : Page-level or Site-level default (lowest priority) ──
  //
  //   Page-level  → set on the specific page in Universal Editor
  //   Site-level  → set on the site root page in Universal Editor,
  //                 EDS propagates it as a <meta> tag across all pages
  const metadataModalPath = getMetadata('warndeparturemodalpath');
  if (metadataModalPath) {
    return metadataModalPath;
  }

  return null;
}
