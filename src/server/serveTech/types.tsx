import "@kitajs/html";

export type NodeState =
  | "default"
  | "active"
  | "processing"
  | "success"
  | "dimmed";

export interface ArchNodeProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  x: number;
  y: number;
  state?: NodeState;
  children?: JSX.Element | JSX.Element[];
}

export interface Mp4CardProps {
  filename: string;
  filesize: string;
  isFragmenting?: boolean;
}

export interface FragmentGridProps {
  segmentCount?: number;
  visibleCount?: number;
}

export interface HeaderProps {
  title?: string;
  version?: string;
  activeScene?: string;
}
