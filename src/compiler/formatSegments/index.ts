import { dateFromString } from "./formatDates.js";
import { getCardImage } from "./getCardImage.js";
import { getVideoSource } from "./getVideoSource.js";
import { getCardVideoSource } from "./getCardVideoSource.js";
import { getAudioSource } from "./getAudioSource.js";
import { getHeroImage } from "./getHeroImage.js";
import { formatTime } from "./formatTime.js";

export const formatSegment = (segment: any) => {
  const formattedDate = dateFromString(segment.eventDate).formated;
  const formattedArtist = segment.artistName.replaceAll("_", " ");
  const formattedVenue = segment.venueName.replaceAll("_", " ");
  const formattedPerformance = `${formattedArtist}-${formattedVenue}-${formattedDate}`;
  const result = {
    artistName: segment.artistName,
    artistId: segment.artistId,
    cardImage: getCardImage(segment.id),
    heroImage: getHeroImage(segment.id),
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
    sourceVideo1080p: getVideoSource(segment.id),
    sourceVideo480p: getCardVideoSource(segment.id),
    sourceMp3: getAudioSource(segment.id),
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
    formattedSegments[i] = formatSegment(segment);
  }
  return { totalDuration: formatTime(totalDuration), formattedSegments };
};

export { formatSegments };
