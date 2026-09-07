import { dateFromString } from "./formatDates.js";
import { getMediaSource } from "./getMediaSource";
import { formatTime } from "./formatTime.js";

export const formatSegment = (segment: any, performanceCache: any) => {
  const media = getMediaSource(segment.id);
  const fromCache = performanceCache[segment.performance];
  if (performanceCache[segment.performance]) {
    const result = {
      ...fromCache,
      ...media,
      formattedTitle: segment.title ? segment.title.replaceAll("_", " ") : "",
      formatedDuration: formatTime(segment.duration),
      status: segment.status,
      id: segment.id,
      title: segment.title,
      duration: segment.duration,
    };
    return result;
  }

  const formattedDate = dateFromString(segment.eventDate).formated;
  const formattedArtist = segment.artistName.replaceAll("_", " ");
  const formattedVenue = segment.venueName.replaceAll("_", " ");
  const formattedPerformance = `${formattedArtist}-${formattedVenue}-${formattedDate}`;
  const result = {
    ...media,
    artistName: segment.artistName,
    artistId: segment.artistId,
    duration: segment.duration,
    eventDate: segment.eventDate,
    formatedDuration: formatTime(segment.duration),
    formattedArtist,
    formattedDate,
    formattedTitle: segment.title ? segment.title.replaceAll("_", " ") : "",
    formattedVenue,
    id: segment.id,
    performance: segment.performance,
    formattedPerformance,
    title: segment.title,
    venueName: segment.venueName,
    status: segment.status,
  };
  return result;
};

const formatSegments = (rawSegments: any[]) => {
  const len = rawSegments.length;
  const formattedSegments = new Array(len);
  let totalDuration = 0;

  for (let i = 0; i < len; i++) {
    const segment = rawSegments[i];
    totalDuration += parseInt(segment.duration);
    formattedSegments[i] = formatSegment(segment, {});
  }
  return { totalDuration: formatTime(totalDuration), formattedSegments };
};

export { formatSegments };
