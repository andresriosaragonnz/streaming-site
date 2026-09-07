// public/js/utils/playlistUtils.ts
import { getRandomIndex } from "../../formatSegments/utils/getRandomIndex.js";

export const PLAYLIST_STORAGE_KEY = "user_playlists";
export const FOLLOW_STORAGE_KEY = "user_subscriptions";

/**
 * Helper to encode comma-separated arrays into URL-safe base64 strings.
 */
function toBase64UrlSafe(items: (string | number)[]): string {
  if (!items || items.length === 0) return "";
  return btoa(items.join(","))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createShareUrl(
  origin: string,
  segmentIds: string[],
  name: string,
): string {
  if (!segmentIds || segmentIds.length === 0) return "";
  const shareToken = toBase64UrlSafe(segmentIds);
  return `${origin}/playlist?share=${shareToken}&name=${name}`;
}

export const getPlaylistItems = () => {
  const saved = localStorage.getItem(PLAYLIST_STORAGE_KEY);
  const finalList = saved ? JSON.parse(saved) : { Favorites: [] };
  const listNames: string[] = [];
  const ids: string[] = [];
  const l: number[] = [];
  console.log({ listNames });
  for (const key of Object.keys(finalList)) {
    listNames.push(key);
    const localIds = finalList[key] || [];
    const randomIndex = getRandomIndex(localIds);
    ids.push(localIds[randomIndex]);
    l.push(localIds.length);
  }

  return { l, ids, listNames };
};

export function createPortfolioUrl(
  origin: string,
  listNames: string[],
  segmentIds: string[],
  l: (string | number)[],
): string {
  if (!segmentIds || segmentIds.length === 0) return "";

  const segToken = toBase64UrlSafe(segmentIds);
  const namesToken = toBase64UrlSafe(listNames);
  const lengthToken = toBase64UrlSafe(l);

  return `${origin}?seg=${segToken}&names=${namesToken}&l=${lengthToken}`;
}

export const generatePortfolioLink = (): void => {
  const playlistLink = document.getElementById("my-playlists");
  const { l, ids, listNames } = getPlaylistItems();
  const url = createPortfolioUrl(window.location.origin, listNames, ids, l);
  playlistLink?.setAttribute("href", url);
};

export function clearSearchParams(): void {
  if (typeof window === "undefined") return;

  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState(null, "", cleanUrl);
}
