import { PlaylistsMap } from "../types";

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
