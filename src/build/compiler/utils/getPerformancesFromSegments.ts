import { dateFromString } from "../../../utils/formatDates.js";
import { getCardImage } from "../utils/getCardImage.js";
import { getVideoSource } from "../utils/getVideoSource.js";
import { getRandomIndex } from "../utils/getRandomIndex.js";

const getPerformancesFromSegments = (segments: any) => {
  const performancesIndex = {} as any;
  for (const segment of segments) {
    const { artistName, venueName, eventDate, id, performance, title } =
      segment;
    segment.cardImage = getCardImage(id);
    segment.formattedTitle = title.replaceAll("_", " ");
    segment.source = getVideoSource(id);
    const currentPerformance = performancesIndex[performance];
    if (currentPerformance) {
      currentPerformance.images.push(id);
      currentPerformance.segments.push(segment);
    } else {
      const date = eventDate
        ? dateFromString(eventDate).formated
        : "Undated Tapes";
      performancesIndex[segment.performance] = {
        artistName: encodeURIComponent(artistName),
        link: `${venueName}-${eventDate}`,
        venueName: venueName,
        formattedVenueName: venueName.replaceAll("_", " "),
        date,
        eventDate,
        images: [id],
        segments: [segment],
      };
    }
  }
  const performances = Object.values(performancesIndex).map(
    (performance: any) => {
      const { images } = performance;
      const randomIndex = getRandomIndex(images);
      performance.image = getCardImage(images[randomIndex]);
      return performance;
    },
  );

  return Object.values(performances);
};

export { getPerformancesFromSegments };
