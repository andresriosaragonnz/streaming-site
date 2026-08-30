export interface Segment {
  id: string;
  title: string;
  cardImage: string;
  status: "public" | "private";
  sourceMp3: string;
  formattedTitle: string;
  formattedArtist: string;
  artistLink: string;
  artistId: string;
  heroImage: string;
  formattedPerformance: string;
  [key: string]: unknown;
}

export interface PlaylistsMap {
  [playlistName: string]: string[];
}

export interface PerformanceData {
  segments: Segment[];
  images: string[];

  artistName: string;
  formattedArtist: string;
  link: string;
  venueName: string;
  formattedVenueName: string;
  eventDate: string;
  formattedDate: string;
  status: string;
  performance: string;
  duration: string;
  cardImage: string;
  altImage: string;
}
