import { dateFromString } from "./formatDates.js";
import { getMediaSource } from "./getMediaSource";
import { formatTime } from "./formatTime.js";
import { escapeHtml } from "../server/escapeHtml";

export const formatSegment = (segment: any, videographers: any) => {
  const media = getMediaSource(segment.id, segment.videographer, videographers);
  const formattedDate = dateFromString(segment.eventDate).formated;
  const formattedArtist = escapeHtml(segment.artistName.replaceAll("_", " "));
  const formattedVenue = escapeHtml(segment.venueName.replaceAll("_", " "));
  const formattedPerformance = escapeHtml(
    `${formattedArtist}-${formattedVenue}-${formattedDate}`,
  );
  const result = {
    ...media,
    artistName: escapeHtml(segment.artistName),
    artistId: escapeHtml(segment.artistId),
    duration: escapeHtml(segment.duration),
    eventDate: escapeHtml(segment.eventDate),
    formatedDuration: formatTime(segment.duration),
    formattedArtist,
    formattedDate,
    formattedTitle: segment.title
      ? escapeHtml(segment.title.replaceAll("_", " "))
      : "",
    formattedVenue,
    id: segment.id,
    performance: segment.performance,
    formattedPerformance,
    title: escapeHtml(segment.title),
    masterSize: escapeHtml(segment.masterSize),
    venueName: escapeHtml(segment.venueName),
    status: segment.status,
  };
  return result;
};

const formatSegments = (rawSegments: any[], videographers: any) => {
  const len = rawSegments.length;
  const formattedSegments = new Array(len);
  let totalDuration = 0;

  for (let i = 0; i < len; i++) {
    const segment = rawSegments[i];
    totalDuration += parseInt(segment.duration);
    formattedSegments[i] = formatSegment(segment, videographers);
  }
  return { totalDuration: formatTime(totalDuration), formattedSegments };
};

export { formatSegments };
