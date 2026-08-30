import { dateFromString } from "./formatDates.js";
import { getCardImage } from "./getCardImage.js";
import { getVideoSource } from "./getVideoSource.js";
import { getAudioSource } from "./getAudioSource.js";
import { getHeroImage } from "./getHeroImage.js";
import { formatTime } from "./formatTime.js";

const formatSegments = (rawSegments: any[]) => {
  const len = rawSegments.length;
  const formattedSegments = new Array(len);
  let totalDuration = 0;

  for (let i = 0; i < len; i++) {
    const segment = rawSegments[i];
    totalDuration += parseInt(segment.duration);
    const formattedDate = dateFromString(segment.eventDate).formated;
    const formattedArtist = segment.artistName.replaceAll("_", " ");
    const formattedVenue = segment.venueName.replaceAll("_", " ");
    const formattedPerformance = `${formattedArtist}-${formattedVenue}-${formattedDate}`;
    formattedSegments[i] = {
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
      source: getVideoSource(segment.id),
      sourceMp3: getAudioSource(segment.id),
      title: segment.title,
      venueName: segment.venueName,
      status: segment.status,
    };
  }
  return { totalDuration: formatTime(totalDuration), formattedSegments };
};

export { formatSegments };
