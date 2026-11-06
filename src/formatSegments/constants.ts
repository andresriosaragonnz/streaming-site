/**
 * Source for non-segment static artwork only (for example the empty playlist
 * hero). Segment media must always use the signed videographer Worker URLs
 * produced by `getMediaSource`.
 */
const PUBLIC_ASSET_SOURCE =
  process?.env?.CLOUDFLARE_SOURCE || "https://media.iknowthatband.org";
export { PUBLIC_ASSET_SOURCE };
