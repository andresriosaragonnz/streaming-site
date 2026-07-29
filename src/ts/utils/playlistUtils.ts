import { PlaylistsMap } from "../types";

export function createShareUrl(origin: string, segmentIds: string[]): string {
  if (!segmentIds || segmentIds.length === 0) {
    return "";
  }

  const base64UrlSafe = btoa(segmentIds.join(","))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${origin}/playlist?share=${base64UrlSafe}`;
}

export function appendToPlaylist(
  currentPlaylists: PlaylistsMap,
  playlistName: string,
  segmentId: string,
): PlaylistsMap {
  const existingList = currentPlaylists[playlistName] || [];
  if (existingList.includes(segmentId)) {
    return currentPlaylists;
  }

  return {
    ...currentPlaylists,
    [playlistName]: [...existingList, segmentId],
  };
}
