export interface Segment {
  id: string;
  title: string;
  cardImage: string;
  status: "public" | "private";
  [key: string]: unknown;
}

export interface PlaylistsMap {
  [playlistName: string]: string[];
}

declare global {
  interface Window {
    Alpine: any;
    setupMediaPlayback?: (activeSegment: Segment, mode: boolean) => void;
  }
}
