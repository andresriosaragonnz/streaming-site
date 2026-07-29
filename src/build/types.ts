interface HeroProps {
  image: string;
  title: string;
  count: number;
}

interface CardProps {
  artistName: string;
  link: string;
  image: string;
  venue: string;
  date: string;
}

interface LayoutProps {
  pageTitle: string;
  bodyContent: string;
}

interface Performance {
  id: string;
  performance: string;
  imageURL?: string;
  venueName: string;
  eventDate: string;
  artistName: string;
  segments: PerformanceSegment[];
}

interface ArtistData {
  artistName: string;
  performances: Performance[];
}

export interface PerformanceSegment {
  id: string;
  title: string;
  index: string;
  status: "public" | "private";
  startTime: number;
  duration: number;
  hash: number;
  source: string;
}

export interface PerformanceData {
  id: string;
  venueName: string;
  performance: string;
  eventDate: string;
  segments: PerformanceSegment[];
}

export interface ArtistWorkspaceObject {
  artistId: string;
  artistName: string;
  performances: PerformanceData[];
}

interface LayoutProps {
  pageTitle: string;
  bodyContent: string;
}

interface PlayerProps {
  studioTitle: string;
  controls: string;
  menu: string;
}

interface StudioProps {
  jsonSegments: string;
  playerPanel: string;
  sidebarPanel: string;
}

interface RenderSegment {
  id: string;
  title: string;
  cardImage: string;
  index: string;
  duration: string;
  status: "public" | "private";
}

interface PrivateRenderData {
  artistName: string;
  venueName: string;
  eventDate: string;
  performance: string;
  segments: RenderSegment[];
}

interface SegmentCardProps {
  image: string;
  title: string;
  id?: string;
  duration?: string;
  artist?: string;
  venue?: string;
  index?: string;
}
export type {
  HeroProps,
  CardProps,
  LayoutProps,
  Performance,
  ArtistData,
  PlayerProps,
  PrivateRenderData,
  SegmentCardProps,
  StudioProps,
};
