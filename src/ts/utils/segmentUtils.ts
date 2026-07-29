import { Segment } from "../types.js";

export const FALLBACK_SEGMENT: Segment = {
  id: "",
  title: "",
  cardImage: "/screenshots/card/card-fallback.jpg",
  status: "public",
};

export const getActiveSegment = (
  segments: Segment[],
  currentIndex: number,
): Segment => {
  if (!segments || !segments[currentIndex]) {
    return FALLBACK_SEGMENT;
  }
  return segments[currentIndex];
};

export const parseSegmentsData = (jsonText: string): Segment[] => {
  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to parse segments JSON:", err);
    return [];
  }
};
