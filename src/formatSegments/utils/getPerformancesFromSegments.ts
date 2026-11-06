import { getRandomIndex } from "./getRandomIndex.js";
import { formatTime } from "../formatTime.js";

const getPerformancesFromSegmentsStatus = (segments: any) => {
  const performancesIndex = {} as any;
  for (const segment of segments) {
    const {
      artistName,
      eventDate,
      formattedDate,
      heroImage,
      performance,
      venueName,
      status,
      formattedArtist,
      id,
      duration,
      segmentToken,
      cardImage,
    } = segment;
    const currentPerformance = performancesIndex[performance];
    if (currentPerformance) {
      currentPerformance.duration += duration;
      if (duration > 60) {
        currentPerformance.images.push(heroImage);
        currentPerformance.cardImages.push(cardImage);
      }
      currentPerformance.segments.push(segment);
    } else {
      performancesIndex[performance] = {
        artistName: encodeURIComponent(artistName),
        formattedArtist,
        link: `${artistName}/${venueName}-${eventDate}`,
        venueName: venueName,
        formattedVenueName: venueName.replaceAll("_", " "),
        eventDate,
        formattedDate,
        segments: [segment],
        images: duration > 60 ? [heroImage] : [],
        cardImages: duration > 60 ? [cardImage] : [],
        status,
        performance,
        duration: duration,
        segmentToken,
        cardImage,
      };
    }
  }
  const performances = Object.values(performancesIndex).map(
    (performance: any) => {
      const { images, cardImages } = performance;
      const randomIndex = getRandomIndex(cardImages);
      const randomIndex2 = getRandomIndex(images);
      performance.cardImage = `${cardImages[randomIndex]}`;
      performance.altImage = `${images[randomIndex2]}`;
      performance.duration = formatTime(performance.duration);
      return performance;
    },
  );

  return performances;
};

const getPerformancesFromSegments = (segments: any) => {
  const publicSegments = segments.filter((seg: any) => seg.status === "public");
  const publicSeg = getPerformancesFromSegmentsStatus(publicSegments);
  const privateSeg = getPerformancesFromSegmentsStatus(segments);
  return { public: publicSeg, private: privateSeg };
};

export { getPerformancesFromSegments };
