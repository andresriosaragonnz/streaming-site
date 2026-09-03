// public/js/utils/playlistUtils.ts
import { PlaylistsMap } from "../types.js";
import { getRandomIndex } from "../../compiler/utils/getRandomIndex.js";

export const PLAYLIST_STORAGE_KEY = "user_playlists";
export const FOLLOW_STORAGE_KEY = "user_subscriptions";

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
  const listNames: string[] = [];
  const ids: string[] = [];
  const l: number[] = [];
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

export const getFollowItems = () => {
  const saved = localStorage.getItem(FOLLOW_STORAGE_KEY);
  const finalList = saved ? JSON.parse(saved) : [];
  return finalList;
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

export function createFollowUrl(origin: string, followItems: string[]): string {
  if (!followItems || followItems.length === 0) {
    return "";
  }
  console.log({ followItems });
  const base64UrlSafe = btoa(followItems.join(","))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${origin}/feed?art=${base64UrlSafe}`;
}

export const generateFollowLink = () => {
  const playlistLink = document.getElementById("my-follows");
  const followItems = getFollowItems();
  const url = createFollowUrl(window.location.origin, followItems);
  playlistLink?.setAttribute("href", url);
};

export function appendToPlaylist(
  playlistsMap: PlaylistsMap,
  playlistName: string,
  segmentId: string,
): PlaylistsMap {
  const currentList = playlistsMap[playlistName] || [];

  if (currentList.includes(segmentId)) {
    return playlistsMap;
  }

  return {
    ...playlistsMap,
    [playlistName]: [...currentList, segmentId],
  };
}

export function handleMyFollowsRedirect(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.location.pathname.includes("feed")) return false;
  const performanceGrid = document
    .getElementById("performance-grid")
    ?.getElementsByClassName("card").length as number;

  if (performanceGrid > 0) return false;
  const searchParams = new URLSearchParams(window.location.search);
  const hasParams = searchParams.has("art");

  if (hasParams) {
    return false;
  }
  const followItems = getFollowItems();

  if (followItems.length === 0) {
    return false;
  }
  const targetUrl = createFollowUrl(window.location.origin, followItems);

  if (targetUrl) {
    window.location.replace(targetUrl);
    return true;
  }

  return false;
}

export function handleMyPlaylistsRedirect(): boolean {
  if (typeof window === "undefined") return false;
  if (!window.location.pathname.includes("myplaylists")) return false;
  const performanceGrid = document
    .getElementById("performance-grid")
    ?.getElementsByClassName("card").length as number;

  if (performanceGrid > 0) return false;
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

/**
 * Handles dropdown change to show/hide the custom playlist name input field.
 */
export function handlePlaylistSelectChange(selectEl: HTMLSelectElement): void {
  const customInputGroup = document.getElementById("custom-playlist-group");
  if (customInputGroup) {
    customInputGroup.style.display =
      selectEl.value === "+ New Playlist..." ? "block" : "none";
  }
}

/**
 * Validates inputs, adds the current active segment to the playlist,
 * updates select options dynamically, and triggers notifications.
 */
export function handleAddToPlaylistSubmit(event?: Event): void {
  // Find container relative to button click, falling back to global document
  const btn = event?.currentTarget as HTMLElement | null;
  const container = btn?.closest(".studio-controls-group") || document;

  const selectEl = container.querySelector(
    "#playlist-select",
  ) as HTMLSelectElement | null;
  const customEl = container.querySelector(
    "#custom-playlist-name",
  ) as HTMLInputElement | null;

  if (!selectEl) {
    console.warn("Could not find #playlist-select element in container.");
    return;
  }

  // Ensure select value is properly resolved
  const selectedValue =
    selectEl.value || selectEl.options[selectEl.selectedIndex]?.value || "";
  const customValue = customEl ? customEl.value.trim() : "";

  const targetPlaylist =
    selectedValue === "+ New Playlist..." ? customValue : selectedValue;

  if (targetPlaylist) {
    window.playlistStore?.addActiveToPlaylist(targetPlaylist);

    if (selectedValue === "+ New Playlist...") {
      const existingOptions = Array.from(selectEl.options);
      let existingOpt = existingOptions.find(
        (opt) => opt.value === targetPlaylist,
      );

      if (!existingOpt) {
        const newOpt = document.createElement("option");
        newOpt.value = targetPlaylist;
        newOpt.textContent = targetPlaylist;
        selectEl.insertBefore(
          newOpt,
          selectEl.options[selectEl.options.length - 1],
        );
      }

      selectEl.value = targetPlaylist;

      if (customEl) customEl.value = "";
      const customInputGroup = container.querySelector(
        "#custom-playlist-group",
      ) as HTMLElement | null;
      if (customInputGroup) customInputGroup.style.display = "none";
    }
  } else {
    window.playlistsStore?.showNotification(
      "Please enter a valid playlist name.",
      "error",
    );
  }
}
