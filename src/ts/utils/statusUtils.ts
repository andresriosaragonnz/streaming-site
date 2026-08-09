import { Segment } from "../types.js";

export interface StatusSnapshot {
  [key: string]: "public" | "private";
}

/**
 * Creates an initial snapshot map of segment statuses keyed by ID (or index fallback).
 */
export function createStatusSnapshot(segments: Segment[]): StatusSnapshot {
  return segments.reduce((acc, seg, idx) => {
    const key = seg.id ?? idx.toString();
    acc[key] = seg.status || "private";
    return acc;
  }, {} as StatusSnapshot);
}

/**
 * Checks if any segment status differs from the initial snapshot.
 */
export function hasStatusChanged(
  segments: Segment[],
  initialStatuses: StatusSnapshot,
): boolean {
  return segments.some((seg, idx) => {
    const key = seg.id ?? idx.toString();
    return seg.status !== initialStatuses[key];
  });
}

/**
 * Returns all segments whose statuses have changed compared to the snapshot.
 */
export function getChangedSegments(segments: Segment[]): {
  privateIds: string[];
  publicIds: string[];
  artist: string[];
} {
  const privateSeg = segments
    .filter((seg) => seg.status === "private")
    .map((seg) => seg.id);
  const publicSeg = segments
    .filter((seg) => seg.status === "public")
    .map((seg) => seg.id);
  return {
    privateIds: privateSeg,
    publicIds: publicSeg,
    artist: segments[0].artistId,
  };
}

/**
 * Filters segments by status type.
 */
export function filterSegmentsByStatus(
  segments: Segment[],
  status: "public" | "private",
): Segment[] {
  return segments.filter((seg) => seg.status === status);
}
