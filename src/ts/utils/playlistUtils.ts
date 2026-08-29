import { PlaylistsMap } from "../types";
import { getRandomIndex } from "../../compiler/utils/getRandomIndex.js";

export const PLAYLIST_STORAGE_KEY = "user_playlists";

export function createShareUrl(
  origin: string,
  segmentIds: string[],
  name: string,
): string {
  if (!segmentIds || segmentIds.length === 0) {
    return "";
  }
  const base64UrlSafe = btoa(segmentIds.join(","))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${origin}/playlist?share=${base64UrlSafe}&name=${name}`;
}

export const getPlaylistItems = () => {
  const saved = localStorage.getItem(PLAYLIST_STORAGE_KEY);
  const finalList = saved ? JSON.parse(saved) : { favorites: [] };
  const listNames = [];
  const ids = [];
  const l = [];
  const keys = Object.keys(finalList);
  for (const key of keys) {
    listNames.push(key);
    const localIds = finalList[key];
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
  if (!segmentIds || segmentIds.length === 0) {
    return "";
  }
  const base64UrlSafe = btoa(segmentIds.join(","))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const base64UrlSafeNames = btoa(listNames.join(","))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const base64UrlSafeL = btoa(l.join(","))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${origin}/myplaylists?seg=${base64UrlSafe}&names=${base64UrlSafeNames}&l=${base64UrlSafeL}`;
}

export const generatePortfolioLink = () => {
  const playlistLink = document.getElementById("my-playlists");
  const { l, ids, listNames } = getPlaylistItems();
  const url = createPortfolioUrl(window.location.origin, listNames, ids, l);
  playlistLink?.setAttribute("href", url);
};

export function appendToPlaylist(
  playlistsMap: PlaylistsMap,
  playlistName: string,
  segmentId: string,
): PlaylistsMap {
  const currentList = playlistsMap[playlistName] || [];

  // Prevent duplicate track IDs in the same playlist
  if (currentList.includes(segmentId)) {
    return playlistsMap;
  }

  return {
    ...playlistsMap,
    [playlistName]: [...currentList, segmentId],
  };
}

/**
 * Checks if /myplaylists was visited without search params.
 * Assembles the full portfolio URL from localStorage and replaces the location.
 */
export function handleMyPlaylistsRedirect(): boolean {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  const hasParams =
    searchParams.has("seg") &&
    searchParams.has("names") &&
    searchParams.has("l");

  if (hasParams) {
    return false;
  }

  const saved = localStorage.getItem(PLAYLIST_STORAGE_KEY);
  const playlists = saved ? JSON.parse(saved) : {};

  const hasAnyItems = Object.values(playlists).some(
    (arr: any) => Array.isArray(arr) && arr.length > 0,
  );

  if (!hasAnyItems) {
    return false;
  }

  const { l, ids, listNames } = getPlaylistItems();
  const targetUrl = createPortfolioUrl(
    window.location.origin,
    listNames,
    ids,
    l,
  );

  if (targetUrl) {
    window.location.replace(targetUrl);
    return true;
  }

  return false;
}

export function clearSearchParams(): void {
  if (typeof window === "undefined") return;

  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState(null, "", cleanUrl);
}
